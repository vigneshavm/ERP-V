import { connectDB, disconnectDB } from './db.js';
import User from '../../src/modules/core/models/User.js';

/**
 * Gives an existing account the platform-administrator role (the only way to create one: no API can set it).
 *   npm run admin:promote -- someone@example.com
 * Use a dedicated account: a user has one role, so promoting a shop owner removes their owner role in that shop.
 */
async function promoteToSuperAdmin(email: string) {
    if (!email) {
        console.error('Usage: npm run admin:promote -- <email of an existing account>');
        process.exitCode = 1;
        return;
    }

    await connectDB();
    try {
        // Emails are unique per shop, not globally: refuse to guess between accounts.
        const matches = await User.find({ email }).select('_id tenantId role');
        if (matches.length > 1) {
            console.error(`${matches.length} accounts use ${email} (tenants: ${matches.map((m) => String(m.tenantId ?? 'none')).join(', ')}). Use a unique email for the administrator account.`);
            process.exitCode = 1;
            return;
        }
        const user = matches.length === 1 ? await User.findById(matches[0]._id) : null;
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exitCode = 1;
            return;
        }

        console.log(`Current role for ${email}: ${user.role}`);
        if (user.role === 'superadmin') {
            console.log('Already a platform administrator. Nothing changed.');
            return;
        }
        user.role = 'superadmin';
        await user.save();
        console.log(`Successfully promoted ${email} to superadmin.`);
    } catch (err) {
        console.error('Error promoting user:', err);
    } finally {
        await disconnectDB();
    }
}

// Email from the command line. There is deliberately no default: promoting the wrong account is not recoverable by a typo check.
promoteToSuperAdmin((process.argv[2] ?? '').trim());
