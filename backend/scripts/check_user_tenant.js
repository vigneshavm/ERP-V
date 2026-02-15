
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    tenantId: mongoose.Schema.Types.ObjectId,
    role: String
});
const TenantSchema = new mongoose.Schema({ slug: String, name: String });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const checkUser = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find user by partial name or email
        const user = await User.findOne({ name: { $regex: 'vigne', $options: 'i' } });

        if (!user) {
            console.log("User 'vigne' not found.");
        } else {
            console.log(`User Found: ${user.name} (${user.email})`);
            console.log(`User TenantID: ${user.tenantId}`);

            if (user.tenantId) {
                const tenant = await Tenant.findById(user.tenantId);
                console.log(`Tenant: ${tenant ? tenant.name : 'Not Found'} (${tenant ? tenant._id : 'N/A'})`);
            } else {
                console.log("User has NO tenantId.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkUser();
