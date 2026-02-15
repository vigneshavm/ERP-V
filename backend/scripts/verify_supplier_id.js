import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SupplierSchema = new mongoose.Schema({
    businessName: String,
    tenantId: String
}, { strict: false });
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

const verifySupplier = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const id = '6990d2076f693491d48814a5';
        // Note: The user provided ID might be valid or not. 
        // I will search by this ID if it's a valid ObjectId, otherwise I'll list Arumuga.

        // Wait, the user provided ID 6990d2076f693491d48814a5 looks like a valid ObjectId (24 hex chars).
        // Let's check it.
        if (mongoose.Types.ObjectId.isValid(id)) {
            const supplier = await Supplier.findById(id);
            console.log('Supplier by ID:', supplier ? supplier.businessName : 'Not Found');
        } else {
            console.log('Invalid ID format provided by user URL');
        }

        const arumuga = await Supplier.findOne({ businessName: 'A. Arumuga Mudaliar & Sons' });
        console.log('A. Arumuga Mudaliar & Sons ID:', arumuga ? arumuga._id.toString() : 'Not Found');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifySupplier();
