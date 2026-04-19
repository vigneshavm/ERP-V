import { connectDB, disconnectDB } from './db.js';
import User from '../../src/modules/core/models/User.js';
import bcrypt from 'bcryptjs';

async function updatePasswords(emails: string[], newPassword: string) {
    await connectDB();
    try {
        console.log('\nHashing new password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        for (const email of emails) {
            console.log(`\nProcessing: ${email}`);

            const user = await User.findOne({ email });

            if (user) {
                user.password = hashedPassword;
                await user.save();
                console.log(`✅ Successfully updated password for: ${email}`);
            } else {
                console.log(`❌ User with email ${email} not found in database!`);
            }
        }
    } catch (err) {
        console.error('Error updating passwords:', err);
    } finally {
        await disconnectDB();
    }
}

// Default target users from legacy script
const defaultEmails = [
    'athimoolam@vijayalaxmi.com',
    'vignesh@vijayalaxmi.com',
    'madhan@vijayalaxmi.com',
    'manikandan@vijayalaxmi.com'
];

const newPassword = process.argv[3] || 'Password@123';
const targetEmail = process.argv[2];

if (targetEmail) {
    updatePasswords([targetEmail], newPassword);
} else {
    console.log('No specific email provided. Updating default user list...');
    updatePasswords(defaultEmails, newPassword);
}
