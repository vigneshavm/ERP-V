import app from "./app.js";
import http from "http";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import logger from "./config/logger.js";
import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "./config/validateEnv.js";
import { verifyEmailTransport } from "./utils/emailService.js";

// robust .env loading
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (result.error) {
    dotenv.config(); // fallback
}

// Environment Validation
validateEnv();

const PORT = process.env.PORT || 5000;

// Email Transport Verification
verifyEmailTransport().catch(err => {
    logger.error("Email transport verification error:", err);
});

// Connect to Database
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
});

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please kill the process using it.`);
        process.exit(1);
    }
});

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        logger.info("HTTP server closed");
        mongoose.connection.close(false).then(() => {
            logger.info("MongoDB connection closed");
            process.exit(0);
        }).catch((err) => {
            logger.error("Error closing MongoDB connection", err);
            process.exit(1);
        });
    });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err: Error) => {
    logger.error(`UNHANDLED REJECTION! 💥`, { error: err.message, stack: err.stack });
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err: Error) => {
    logger.error(`UNCAUGHT EXCEPTION! 💥`, { error: err.message, stack: err.stack });
    process.exit(1);
});
