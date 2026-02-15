import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

const billSchema = new mongoose.Schema({}, { collection: 'bills', strict: false });
const Bill = mongoose.model('Bill', billSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        const count = await Bill.countDocuments({});
        console.log(`Total Bills: ${count}`);
        const latest = await Bill.find({}).sort({ createdAt: -1 }).limit(5);
        console.log("Latest 5 bills:");
        latest.forEach(b => console.log(`- ${b.billNo} (${b.amount})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
