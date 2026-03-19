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
const result = dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
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
console.log("🔍 Checking Environment Variables for Budget Planner API...");
["JWT_SECRET", "COOKIE_SECRET", "MONGO_URI"].forEach(key => {
    if (process.env[key]) {
        console.log(`   ✅ ${key} is set`);
    } else {
        console.error(`   ❌ ${key} is MISSING`);
    }
});

const PORT = process.env.BUDGET_PORT || process.env.PORT || 4000;

// =======================
// Email Transport Verification
// =======================
verifyEmailTransport().catch(err => {
    logger.error("Email transport verification error:", err);
});

// Connect to Database
connectDB();

let server = http.createServer(app);

const startServer = (port: number | string) => {
    server.listen(port, () => {
        logger.info(`🚀 Budget Planner API running on port ${port}`);
    });

    server.on("error", (error: any) => {
        if (error.syscall !== "listen") {
            throw error;
        }

        if (error.code === "EADDRINUSE") {
            logger.warn(`⚠️  Port ${port} is already in use. Trying next available port...`);
            server.close(() => {
                // Create a NEW server instance to ensure clean state
                server = http.createServer(app);
                startServer(Number(port) + 1);
            });
        } else if (error.code === "EACCES") {
            logger.error(`❌ Port ${port} requires elevated privileges`);
            process.exit(1);
        } else {
            throw error;
        }
    });

    return server;
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
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

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
