/**
 * Validates required environment variables
 * Fails fast if critical variables are missing
 */
/**
 * Validates required environment variables
 * Exits process if critical variables are missing
 */
export const validateEnv = () => {
    const required = [
        'MONGO_URI',
        'JWT_SECRET',
        'COOKIE_SECRET'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ FATAL: Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nServer cannot start without these variables.');
        process.exit(1);
    }
    // Validate email configuration (non-fatal)
    validateEmailConfig();
    console.log('✅ Environment validation passed');
};
/**
 * Validates email configuration (non-fatal)
 * Logs warnings if email variables are missing
 */
const validateEmailConfig = () => {
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    const hasCustomSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if (!hasGmailConfig && !hasCustomSMTP) {
        console.warn('⚠️  WARNING: Email configuration incomplete');
        console.warn('   Email features (forgot password, invoices) will be disabled');
        console.warn('   Set either:');
        console.warn('   - EMAIL_USER + EMAIL_PASS (for Gmail)');
        console.warn('   - SMTP_HOST + SMTP_USER + SMTP_PASS (for custom SMTP)');
        global.EMAIL_ENABLED = false;
    }
    else {
        global.EMAIL_ENABLED = true;
        if (hasCustomSMTP) {
            console.log('📧 Email configured: Custom SMTP');
        }
        else {
            console.log('📧 Email configured: Gmail');
        }
    }
};
export default { validateEnv };
