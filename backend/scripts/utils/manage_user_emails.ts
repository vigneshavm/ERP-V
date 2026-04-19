import { connectDB, disconnectDB } from './db.js';
import User from '../../src/modules/core/models/User.js';

interface EmailUpdate {
    old: string;
    new: string;
}

async function updateEmails(updates: EmailUpdate[]) {
    await connectDB();
    try {
        for (const update of updates) {
            console.log(`\nProcessing: ${update.old} -> ${update.new}`);

            const user = await User.findOne({ email: update.old });

            if (user) {
                console.log(`Found user: ${user.name || 'Unknown'}`);
                user.email = update.new;
                await user.save();
                console.log(`✅ Successfully updated email to: ${update.new}`);
            } else {
                // Check if already updated
                const alreadyUpdated = await User.findOne({ email: update.new });
                if (alreadyUpdated) {
                    console.log(`⚠️ User already has the new email: ${update.new}`);
                } else {
                    console.log(`❌ User with email ${update.old} not found in database!`);
                }
            }
        }
    } catch (err) {
        console.error('Error updating emails:', err);
    } finally {
        await disconnectDB();
    }
}

// Default updates from the legacy scripts
const defaultUpdates: EmailUpdate[] = [
    { old: 'vijayalaxmi@bizzai.com', new: 'athimoolam@vijayalaxmi.com' },
    { old: 'vignesh@bizzai.com', new: 'vignesh@vijayalaxmi.com' },
    { old: 'madhan@bizzai.com', new: 'madhan@vijayalaxmi.com' },
    { old: 'manikandan@bizzai.com', new: 'manikandan@vijayalaxmi.com' }
];

// Check for command line arguments
const args = process.argv.slice(2);
if (args.length >= 2) {
    updateEmails([{ old: args[0], new: args[1] }]);
} else {
    console.log('No specific email pair provided via arguments. Running default updates...');
    updateEmails(defaultUpdates);
}
