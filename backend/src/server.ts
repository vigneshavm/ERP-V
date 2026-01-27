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
    console.warn("⚠️  dotenv config failed to load .env file from CWD. Trying default...");
    dotenv.config(); // fallback
}

// =======================
// Environment Validation
// =======================
logger.info("Validating environment variables...");
validateEnv();

// Log loaded env for debugging (masked)
console.log("🔍 Checking Environment Variables...");
['JWT_SECRET', 'COOKIE_SECRET', 'MONGO_URI'].forEach(key => {
    if (process.env[key]) {
        console.log(`   ✅ ${key} is set`);
    } else {
        console.error(`   ❌ ${key} is MISSING`);
    }
});

const PORT = process.env.PORT || 5000;

// =======================
// Email Transport Verification
// =======================
verifyEmailTransport().catch(err => {
    logger.error("Email transport verification error:", err);
});

// Connect to Database
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

server.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    switch (error.code) {
        case 'EACCES':
            logger.error(`❌ Port ${PORT} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`❌ Port ${PORT} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// =======================
// Graceful Shutdown
// =======================
const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        logger.info("HTTP server closed");

        // Close database connections
        mongoose.connection.close(false).then(() => {
            logger.info("MongoDB connection closed");
            process.exit(0);
        }).catch((err) => {
            logger.error("Error closing MongoDB connection", err);
            process.exit(1);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
    logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`, { error: err.message, stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
    logger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`, { error: err.message, stack: err.stack });
    process.exit(1);
});

// Trigger restart

