import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const BillSchema = new mongoose.Schema({
    supplier: mongoose.Schema.Types.ObjectId,
    amount: Number
}, { strict: false });
const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

const verifyImport = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Bill.countDocuments({});
        console.log('Total Bills in DB:', count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyImport();
