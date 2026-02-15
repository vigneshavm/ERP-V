import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'staff' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    status: { type: String, default: 'active' }
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const TenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

/**
 * Reusable function to add users to a tenant
 */
export const addUsersToTenant = async (tenantSlug, usersList) => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant with slug "${tenantSlug}" not found`);

        console.log(`Adding users to tenant: ${tenant.name} (${tenant._id})`);

        for (const userData of usersList) {
            const existing = await User.findOne({ email: userData.email, tenantId: tenant._id });
            if (existing) {
                console.log(`User ${userData.email} already exists for this tenant. Skipping.`);
                continue;
            }

            const newUser = new User({
                ...userData,
                tenantId: tenant._id,
                password: userData.password || 'password123' // Default password
            });

            await newUser.save();
            console.log(`✅ Created User: ${userData.name} (${userData.email})`);
        }

    } catch (err) {
        console.error('Error in addUsersToTenant:', err.message);
        throw err;
    }
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const main = async () => {
        const users = [
            { name: 'vignesh', email: 'vignesh@bizzai.com', role: 'staff' },
            { name: 'madhan', email: 'madhan@bizzai.com', role: 'staff' },
            { name: 'mani kandan', email: 'manikandan@bizzai.com', role: 'staff' }
        ];

        try {
            await addUsersToTenant('vijaya-laxmi', users);
            console.log('--- DONE ---');
            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    };
    main();
}
