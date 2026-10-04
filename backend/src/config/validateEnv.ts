/**
 * Validates required environment variables
 * Fails fast if critical variables are missing
 */

import { error, info } from './logger.js';

// Extend global type for EMAIL_ENABLED flag
declare global {
    var EMAIL_ENABLED: boolean;
}

/**
 * Validates required environment variables
 * Exits process if critical variables are missing
 */
export const validateEnv = (): void => {
    const required: string[] = [
        'JWT_SECRET',
        'COOKIE_SECRET'
    ];

    required.push(
        'TEXTILESOFT_DB_HOST',
        'TEXTILESOFT_DB_USER',
        'TEXTILESOFT_DB_PASSWORD',
        'TEXTILESOFT_DB_WRITE_USER',
        'TEXTILESOFT_DB_WRITE_PASSWORD',
        'SHOP_TENANT_ID',
    );
    if ((process.env.AUTH_SOURCE || 'sql').trim().toLowerCase() === 'mongo') {
        error('❌ This build requires AUTH_SOURCE=sql');
        process.exit(1);
    }
    if ((process.env.ITEM_DATA_SOURCE || '').trim().toLowerCase() !== 'sql') {
        error('❌ This build requires ITEM_DATA_SOURCE=sql');
        process.exit(1);
    }
    if (!/^[a-f\d]{24}$/i.test(process.env.SHOP_TENANT_ID || '')) {
        error('❌ SHOP_TENANT_ID must be a 24-character tenant key');
        process.exit(1);
    }

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        error('❌ FATAL: Missing required environment variables:');
        missing.forEach(key => error(`   - ${key}`));
        error('\nServer cannot start without these variables.');
        process.exit(1);
    }

    // Validate email configuration (non-fatal)
    validateEmailConfig();

    info('✅ Environment validation passed');
};

/**
 * Validates email configuration (non-fatal)
 * Logs warnings if email variables are missing
 */
const validateEmailConfig = (): void => {
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    const hasCustomSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasGmailConfig && !hasCustomSMTP) {
        console.warn('⚠️  WARNING: Email configuration incomplete');
        console.warn('   Email features (forgot password, invoices) will be disabled');
        console.warn('   Set either:');
        console.warn('   - EMAIL_USER + EMAIL_PASS (for Gmail)');
        console.warn('   - SMTP_HOST + SMTP_USER + SMTP_PASS (for custom SMTP)');
        global.EMAIL_ENABLED = false;
    } else {
        global.EMAIL_ENABLED = true;
        if (hasCustomSMTP) {
            console.log('📧 Email configured: Custom SMTP');
        } else {
            console.log('📧 Email configured: Gmail');
        }
    }
};

export default { validateEnv };
