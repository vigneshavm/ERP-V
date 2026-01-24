import app from "./app.js";
import http from "http";
import connectDB from "./config/database.js";
import logger from "./config/logger.js";
import dotenv from "dotenv";

import path from "path";

// robust .env loading
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (result.error) {
    console.warn("⚠️  dotenv config failed to load .env file from CWD. Trying default...");
    dotenv.config(); // fallback
}

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

// Validate Environment Variables
const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'COOKIE_SECRET',
    'MONGO_URI'
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    logger.error(`❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error(`   Please add them to your .env file to prevent runtime errors.`);
    process.exit(1);
}

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
