import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    try {
        const mongoUri = process.env.MONGO_URI;
        console.log('Connecting to:', mongoUri?.substring(0, 20) + '...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully!');
        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Connection Error:', error);
    }
}

runTest();
