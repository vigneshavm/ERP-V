import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

async function sendSimpleMessage() {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY || 'YOUR_API_KEY',
    });

    console.log('--- Mailgun API Test ---');
    console.log('API Key (first 10 chars):', (process.env.MAILGUN_API_KEY || 'NOT SET').substring(0, 10) + '...');

    try {
        const data = await mg.messages.create('sandbox4ef2ea71ecce46a5bf391da4b54e0299.mailgun.org', {
            from: 'Mailgun Sandbox <postmaster@sandbox4ef2ea71ecce46a5bf391da4b54e0299.mailgun.org>',
            to: ['Vignesh Athimoolam <avmvignesh0207@gmail.com>'],
            subject: 'Hello Vignesh Athimoolam',
            text: 'Congratulations Vignesh Athimoolam, you just sent an email with Mailgun! You are truly awesome!',
        });

        console.log('✅ Email sent successfully!');
        console.log('Response:', data);
    } catch (error: any) {
        console.log('❌ Error sending email:', error.message || error);
    }
}

sendSimpleMessage();
