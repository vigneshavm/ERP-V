import app from "./app.js";
import http from "http";
import mongoose from "mongoose";
import connectDB from "@smarterp/shared/config/database.js";
import logger from "@smarterp/shared/config/logger.js";
import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "@smarterp/shared/config/validateEnv.js";
import { verifyEmailTransport } from "@smarterp/shared/utils/emailService.js";

// robust .env loading
const result = dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
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
console.log("🔍 Checking Environment Variables for Enterprise API...");
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

// Initialize Cron Jobs
import cron from 'node-cron';
import PaymentReminderService from '@smarterp/core/modules/finance/services/PaymentReminderService.js';

// Schedule Payment Reminders (Daily at 9:00 AM)
cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Running Daily Payment Reminder Job');
    await PaymentReminderService.checkAll();
});

const server = http.createServer(app);

const startServer = (port: number | string) => {
    const serverInstance = server.listen(port, () => {
        logger.info(`🚀 Enterprise API running on port ${port}`);
    });

    serverInstance.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        if (error.code === 'EADDRINUSE') {
            logger.warn(`⚠️  Port ${port} is already in use. Trying next available port...`);
            startServer(Number(port) + 1);
        } else if (error.code === 'EACCES') {
            logger.error(`❌ Port ${port} requires elevated privileges`);
            process.exit(1);
        } else {
            throw error;
        }
    });

    return serverInstance;
};

startServer(PORT);

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
