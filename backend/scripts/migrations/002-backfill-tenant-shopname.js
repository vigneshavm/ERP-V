import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('Script running from:', __dirname);
console.log('Current working directory:', process.cwd());

const envPath = path.join(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('MONGO_URI present:', !!process.env.MONGO_URI);

// Define minimal Tenant schema for migration
const TenantSchema = new mongoose.Schema({
    name: String,
    shopName: String,
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        // Update all tenants where shopName is missing
        // We will set shopName to name
        const result = await Tenant.updateMany(
            { shopName: { $exists: false } }, // condition
            [{ $set: { shopName: '$name' } }] // update pipeline to reference existing field
        );

        console.log('Migration Result:', result);
        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB.');
        } catch (e) {
            console.error('Error disconnecting:', e);
        }
    }
};

migrate();
