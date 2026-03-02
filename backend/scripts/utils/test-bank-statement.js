import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // jsPDF Output to file
    fs.writeFileSync(pdfPath, Buffer.from(doc.output('arraybuffer')));
    return pdfPath;
}

async function testBankStatement() {
    try {
        console.log('1. Creating dummy PDF...');
        const pdfPath = await createDummyPDF();
        console.log('Dummy PDF created:', pdfPath);

        console.log('\n2. Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo@bizzai.com',
                password: 'Demo@123'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('Login Failed:', loginData);
            return;
        }

        const token = loginData.token;
        if (!token) {
            console.error('No token received!');
            return;
        }
        console.log('Login Successful!');

        console.log('\n3. Uploading Bank Statement...');
        const form = new FormData();
        form.append('statement', fs.createReadStream(pdfPath));

        const uploadRes = await fetch('http://localhost:5000/api/finance/bank-statement/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const uploadData = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Response:', JSON.stringify(uploadData, null, 2));

        console.log('\n4. Fetching Transactions...');
        const fetchRes = await fetch('http://localhost:5000/api/finance/bank-statement/transactions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const fetchData = await fetchRes.json();
        console.log('Transactions Status:', fetchRes.status);
        if (fetchData.data && fetchData.data.length > 0) {
            console.log(`Found ${fetchData.data.length} transactions`);
            console.log('First transaction:', fetchData.data[0]);
        } else {
            console.log('No transactions found or error:', fetchData);
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testBankStatement();
