import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SupplierSchema = new mongoose.Schema({
    businessName: String,
    contactNo: String
}, { strict: false });

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const updateSupplierContact = async () => {
    await connectDB();
    const name = "A. Arumuga Mudaliar & Sons";
    const contactNo = "33918649";

    const supplier = await Supplier.findOne({ businessName: name });
    if (!supplier) {
        console.log('Supplier not found');
        process.exit(1);
    }

    supplier.contactNo = contactNo;
    await supplier.save();
    console.log(`Updated supplier contact to ${contactNo}`);
    process.exit(0);
};

updateSupplierContact();
