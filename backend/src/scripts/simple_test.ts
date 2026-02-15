import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log("Simple test starting...");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Missing");

const run = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("No Mongo URI");
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");
        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (e) {
        console.error("Error:", e);
    }
};

run();
