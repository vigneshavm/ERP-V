import mongoose from 'mongoose';
import Supplier from '../src/modules/purchase/models/Supplier.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const findSupplier = async () => {
    await connectDB();
    const name = process.argv[2];
    if (!name) {
        console.log('Please provide supplier name');
        process.exit(1);
    }

    const suppliers = await Supplier.find({ businessName: { $regex: new RegExp(name, 'i') } });
    if (suppliers.length === 0) {
        console.log('No supplier found');
    } else {
        console.log(JSON.stringify(suppliers, null, 2));
    }
    process.exit(0);
};

findSupplier();
