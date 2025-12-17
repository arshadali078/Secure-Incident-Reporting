import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const { combine, timestamp, printf, colorize, align } = winston.format;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
        }),
    ],
    exitOnError: false,
});

export default logger;
