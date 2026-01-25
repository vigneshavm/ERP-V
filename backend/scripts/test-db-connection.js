import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Testing DB Connection...');
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('No MONGO_URI found');
    process.exit(1);
}

try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Successfully connected to MongoDB!');
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
} catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
}
