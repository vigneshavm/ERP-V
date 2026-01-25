import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TenantSchema = new mongoose.Schema({
    name: String,
    shopName: String,
    slug: String
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const tenants = await Tenant.find({});
        console.log(`Found ${tenants.length} tenants.`);
        tenants.forEach(t => {
            console.log(`Tenant ID: ${t._id}`);
            console.log(`  Name: ${t.name}`);
            console.log(`  ShopName: ${t.shopName} (Type: ${typeof t.shopName})`);
            console.log(`  Raw Doc:`, t.toObject());
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
