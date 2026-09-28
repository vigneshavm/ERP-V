import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import { info } from '../config/logger.js';

info("Simple test starting...");
info("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Missing");

const run = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("No Mongo URI");
        info("Connecting...");
        await mongoose.connect(process.env.MONGO_URI!);
        info("Connected!");
        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (e) {
        console.error("Error:", e);
    }
};

run();
