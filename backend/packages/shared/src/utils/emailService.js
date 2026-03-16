import FormData from "form-data";
import Mailgun from "mailgun.js";
// Lazy initialization - Mailgun client is only created when first needed
let mgClient = null;
const getMailgunClient = () => {
    if (!mgClient) {
        const mailgun = new Mailgun(FormData);
        mgClient = mailgun.client({
            username: "api",
            key: process.env.MAILGUN_API_KEY || "",
        });
    }
    return mgClient;
};
const MAILGUN_DOMAIN = () => process.env.MAILGUN_DOMAIN || "sandbox4ef2ea71ecce46a5bf391da4b54e0299.mailgun.org";
/**
 * Check if email is configured
 */
export const isEmailConfigured = () => {
    return global.EMAIL_ENABLED === true;
};
/**
 * Verify email transport on server startup
 */
export const verifyEmailTransport = async () => {
    if (process.env.EMAIL_ENABLED !== "true") {
        console.warn('⚠️  Email transport verification skipped (not enabled)');
        global.EMAIL_ENABLED = false;
        return false;
    }
    if (!process.env.MAILGUN_API_KEY) {
        console.error('❌ MAILGUN_API_KEY is not set');
        global.EMAIL_ENABLED = false;
        return false;
    }
    console.log('✅ Mailgun API configured');
    global.EMAIL_ENABLED = true;
    return true;
};
/**
 * Sends an email with optional attachment (plain text)
 */
export const sendEmail = async (to, subject, text) => {
    if (!isEmailConfigured()) {
        console.warn('Email not sent - email service not configured');
        return false;
    }
    try {
        const domain = MAILGUN_DOMAIN();
        const data = await getMailgunClient().messages.create(domain, {
            from: process.env.EMAIL_FROM || `BizzAI <postmaster@${domain}>`,
            to: [to],
            subject,
            text,
        });
        console.log("📨 Email sent:", data.id);
        return true;
    }
    catch (error) {
        console.error("Email Error:", error.message);
        return false;
    }
};
/**
 * Sends an HTML email with optional plain text fallback
 */
export const sendHtmlEmail = async (to, subject, html, text = null) => {
    if (!isEmailConfigured()) {
        console.warn('Email not sent - email service not configured');
        return false;
    }
    try {
        const domain = MAILGUN_DOMAIN();
        const data = await getMailgunClient().messages.create(domain, {
            from: process.env.EMAIL_FROM || `BizzAI <postmaster@${domain}>`,
            to: [to],
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text fallback
        });
        console.log("📨 HTML Email sent:", data.id);
        return true;
    }
    catch (error) {
        console.error("HTML Email Error:", error.message);
        return false;
    }
};
/**
 * Generates a professional password reset email template
 */
export const generatePasswordResetEmail = (resetUrl, userName = "User") => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                BizzAI
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">
                Business Management Made Simple
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1f2937;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                Hi ${userName},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>1 hour</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); transition: all 0.3s ease;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; padding: 15px; font-size: 13px; line-height: 1.5; color: #4f46e5; background-color: #f3f4f6; border-radius: 6px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <!-- Security Notice -->
              <div style="padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #92400e;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Need help? Contact our support team
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} BizzAI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Note -->
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated message from BizzAI. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
    const text = `
Reset Your Password - BizzAI

Hi ${userName},

We received a request to reset your password. Click the link below to create a new password. This link will expire in 1 hour.

Reset your password: ${resetUrl}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} BizzAI. All rights reserved.
  `.trim();
    return { html, text };
};
