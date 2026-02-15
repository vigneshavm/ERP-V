import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

const supplierSchema = new mongoose.Schema({
    businessName: String,
    supplierId: String,
    tenantId: String,
    owner: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId
}, { collection: 'suppliers' });

const Supplier = mongoose.model('Supplier', supplierSchema);

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        console.log("✅ Connected to MongoDB");
        const suppliers = await Supplier.find({});
        console.log(JSON.stringify(suppliers, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

run();
