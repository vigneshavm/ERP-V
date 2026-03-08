
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        // Using the verified working shard host URI
        const workingUri = 'mongodb://avmvignesh0207_db_user:6oP5NGXiiirUfgSn@ac-xoh2y1d-shard-00-00.kxzqtht.mongodb.net:27017/bizzai?authSource=admin&ssl=true';
        
        await mongoose.connect(workingUri);
        
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        
        const tenants = await mongoose.connection.db.collection('tenants').find({}).toArray();
        const tenantMap = tenants.reduce((acc, t) => {
            acc[t._id.toString()] = t;
            return acc;
        }, {});

        const users = await User.find({}).lean();
        
        console.log(`\nFound ${users.length} Users:\n`);
        
        const tableData = users.map(u => {
            const t = u.tenantId ? tenantMap[u.tenantId.toString()] : null;
            return {
                Name: u.fullName || u.name,
                Email: u.email,
                Role: typeof u.role === 'object' ? u.role.name : u.role,
                Tenant: t ? t.name : 'Unknown/None',
                Status: u.status || 'Active'
            };
        });

        console.table(tableData);
        process.exit(0);
    } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
    }
};

run();
