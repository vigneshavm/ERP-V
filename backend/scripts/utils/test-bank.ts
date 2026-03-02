import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from './src/app.js';
import User from './src/modules/core/models/User.js';
import Tenant from './src/modules/core/models/Tenant.js';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure process env has secrets
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.COOKIE_SECRET = 'test_cookie_secret';

async function createDummyPDF() {
    const doc = new jsPDF();
    doc.text("Bank Statement", 10, 10);
    doc.text("Account Holder: John Doe", 10, 20);
    doc.text("Bank Name: Test Bank", 10, 30);
    doc.text("Statement Period: Jan 2026", 10, 40);
    doc.text("Date       Description          Amount Type   Balance", 10, 60);
    doc.text("2026-01-01 Opening Balance      0.00   credit 1000.00", 10, 70);
    doc.text("2026-01-05 Salary               500.00 credit 1500.00", 10, 80);
    doc.text("2026-01-10 Groceries             50.00 debit  1450.00", 10, 90);

    const pdfPath = path.join(__dirname, 'dummy_statement.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(doc.output('arraybuffer')));
    return pdfPath;
}

async function runTest() {
    console.log("Starting test...");
    let mongoServer;

    try {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log("Connected to in-memory MongoDB");

        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
            role: 'owner',
            status: 'active'
        });

        // 2. Login to get token and cookie
        console.log("Logging in via API...");
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'Password123!'
        });

        if (loginRes.statusCode !== 200) {
            console.error("Login failed:", loginRes.body);
            return;
        }

        const token = loginRes.body.token;
        const cookies = loginRes.headers['set-cookie']; // Array of cookies

        // 3. Create PDF
        const pdfPath = await createDummyPDF();
        console.log("Dummy PDF created for upload");

        // 4. Upload statement
        console.log("Uploading bank statement...");
        const uploadReq = request(app)
            .post('/api/bank-statement/upload')
            .set('Authorization', `Bearer ${token}`);

        if (cookies) {
            uploadReq.set('Cookie', cookies);
        }

        const uploadRes = await uploadReq.attach('statement', pdfPath);

        console.log("Upload Status:", uploadRes.statusCode);
        console.log("Upload Body:", JSON.stringify(uploadRes.body, null, 2));

        // 5. Fetch transactions
        console.log("Fetching transactions...");
        const getReq = request(app)
            .get('/api/bank-statement/transactions')
            .set('Authorization', `Bearer ${token}`);

        if (cookies) {
            getReq.set('Cookie', cookies);
        }

        const getRes = await getReq;

        console.log("Get Status:", getRes.statusCode);
        console.log("Get Body:", JSON.stringify(getRes.body, null, 2));

    } catch (err) {
        console.error("Test failed with error:", err);
    } finally {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log("Test finished.");
    }
}

runTest();
