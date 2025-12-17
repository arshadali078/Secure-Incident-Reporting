import logger from "../utils/logger.js";
import AuditLog from "../models/AuditLog.js";

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error(`${err.stack}`);

    // Default error status and message
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        const message = `Resource not found with id of ${err.value}`;
        error = new Error(message);
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = new Error(message);
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new Error(message);
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token";
        error = new Error(message);
        error.statusCode = 401;
    }

    // JWT expired
    if (err.name === "TokenExpiredError") {
        const message = "Token expired";
        error = new Error(message);
        error.statusCode = 401;
    }

    // Set default status code if not set
    const statusCode = error.statusCode || 500;

    // Log the error to audit log if it's a server error
    if (statusCode >= 500 && req.user) {
        AuditLog.log({
            action: "SERVER_ERROR",
            entity: req.originalUrl,
            entityId: req.user._id,
            performedBy: req.user._id,
            req,
            error: err,
        });
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: error.message || "Server Error",
        stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    });
};

// 404 Not Found handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export { errorHandler, notFound };
