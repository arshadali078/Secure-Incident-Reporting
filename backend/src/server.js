import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

// Import config
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import logger from "./utils/logger.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import logRoutes from "./routes/log.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

// Load env vars
import dotenv from "dotenv";
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    },
});

// Socket.io connection handler
io.on("connection", (socket) => {
    logger.info("New client connected");

    // Join a room for real-time updates
    socket.on("joinRoom", (room) => {
        socket.join(room);
        logger.info(`User joined room: ${room}`);
    });

    // Handle incident updates
    socket.on("incidentUpdated", (data) => {
        io.to(`incident_${data.incidentId}`).emit("incidentUpdate", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        logger.info("Client disconnected");
    });
});

// Make io accessible to routes
app.set("io", io);

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: ["priority", "status", "category"],
    })
);

// Rate limiting
if (process.env.NODE_ENV === "production") {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message:
            "Too many requests from this IP, please try again after 15 minutes",
    });
    app.use("/api", limiter);
}

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files explicitly
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Ignore favicon in dev to reduce noise
if (process.env.NODE_ENV === "development") {
    app.get("/favicon.ico", (req, res) => res.status(204).end());
}

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.get("/api/v1/health", (req, res) => {
    res.json({ ok: true });
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
    // Set static folder
    app.use(express.static(path.join(__dirname, "../frontend/build")));

    app.get("*", (req, res) => {
        res.sendFile(
            path.resolve(__dirname, "../frontend", "build", "index.html")
        );
    });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
const server = httpServer.listen(PORT, () => {
    logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    logger.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
