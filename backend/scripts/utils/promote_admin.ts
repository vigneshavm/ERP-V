import { connectDB, disconnectDB } from './db.js';
import User from '../../src/modules/core/models/User.js';

async function promoteToSuperAdmin(email: string) {
    if (!email) {
        console.error('Please provide an email address.');
        return;
    }

    await connectDB();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        console.log(`Current role for ${email}: ${user.role}`);
        user.role = 'superadmin';
        await user.save();
        console.log(`Successfully promoted ${email} to superadmin.`);
    } catch (err) {
        console.error('Error promoting user:', err);
    } finally {
        await disconnectDB();
    }
}

// Get email from command line arguments
const emailArg = process.argv[2];
promoteToSuperAdmin(emailArg || 'superadmin@bizzai.com');
