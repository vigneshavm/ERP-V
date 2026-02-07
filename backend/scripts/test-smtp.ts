import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from one level up (backend folder)
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
    console.log('--- SMTP TEST START ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('From:', process.env.EMAIL_FROM);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Error: SMTP credentials missing in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying transport...');
        await transporter.verify();
        console.log('✅ Transport verified!');

        console.log('Sending test email...');
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"BizzAI Test" <noreply@bizzai.com>',
            to: process.env.SMTP_USER, // Send to self (the sandbox login email)
            subject: 'BizzAI SMTP Test',
            text: 'This is a test email from your BizzAI backend configuration.',
            html: '<h1>BizzAI SMTP Test</h1><p>This is a test email from your <b>BizzAI backend configuration</b>.</p>',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error: any) {
        console.error('❌ SMTP Error:', error.message);
        if (error.response) {
            console.error('Response details:', error.response);
        }
    }
}

testEmail();
