import dns from 'dns';
import mongoose from 'mongoose';
import { info, error as logError } from './logger.js';
// Force reliable DNS resolution for MongoDB Atlas SRV records on Windows
dns.setServers(['1.1.1.1', '8.8.8.8']);
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // ms
export let mongoClient = null;
// Register the SIGINT handler once at module load — not inside connectDB,
// which would add a new listener on every retry call.
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    info('MongoDB connection closed due to app termination');
    process.exit(0);
});
const connectDB = async (retryCount = 0) => {
    try {
        // Strip BOM characters and whitespace that can corrupt the URI from .env files
        const mongoUri = (process.env.MONGO_URI ?? '')
            .replace(/^\?o/g, '')
            .replace(/\?\?$/g, '')
            .trim();
        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            throw new Error('Invalid MongoDB connection string format');
        }
        const conn = await mongoose.connect(mongoUri, {
            maxPoolSize: 50,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 30_000,
            socketTimeoutMS: 45_000,
            family: 4,
        });
        mongoClient = conn.connection.getClient();
        info(`MongoDB Connected: ${conn.connection.host}`, {
            database: conn.connection.name,
            maxPoolSize: 50,
        });
        mongoose.connection.on('error', (err) => logError('MongoDB connection error', { error: err.message }));
        mongoose.connection.on('disconnected', () => logError('MongoDB disconnected — attempting reconnect'));
        mongoose.connection.on('reconnected', () => info('MongoDB reconnected'));
    }
    catch (err) {
        logError(`MongoDB Connection Error: ${err.message}`, { retryCount });
        if (err.message?.includes('SSL routines') && err.message?.includes('internal error')) {
            logError('Tip: IP not whitelisted in MongoDB Atlas, or a firewall is blocking the connection.');
        }
        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            info(`Retrying in ${delay / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return connectDB(retryCount + 1);
        }
        logError('Max retry attempts reached. Exiting...');
        process.exit(1);
    }
};
export default connectDB;
