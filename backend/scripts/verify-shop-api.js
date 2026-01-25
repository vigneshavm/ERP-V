
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
// Use the credentials we know works from previous steps
const EMAIL = 'avmvignesh0207@gmail.com';
const PASSWORD = 'Qw@1234567890';

async function verifyShopApi() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n2. Fetching Shop Settings (GET)...');
        try {
            const getRes = await axios.get(`${BASE_URL}/shop/settings`, config);
            console.log('GET Response:', getRes.data);
        } catch (e) {
            console.error('GET Failed:', e.response?.data || e.message);
        }

        console.log('\n3. Updating Shop Settings (PUT)...');
        try {
            const updateRes = await axios.put(`${BASE_URL}/shop/settings`, {
                plan: 'Professional',
                shopEnabled: true
            }, config);
            console.log('PUT Response:', updateRes.data);
        } catch (e) {
            console.error('PUT Failed:', e.response?.data || e.message);
        }

        console.log('\n4. Verifying Update (GET)...');
        try {
            const verifyRes = await axios.get(`${BASE_URL}/shop/settings`, config);
            console.log('Final GET Response:', verifyRes.data);

            if (verifyRes.data.data.plan === 'Professional' && verifyRes.data.data.shopEnabled === true) {
                console.log('\n✅ VERIFICATION SUCCESSFUL: Shop settings updated correctly.');
            } else {
                console.log('\n❌ VERIFICATION FAILED: Data mismatch.');
            }
        } catch (e) {
            console.error('Final GET Failed:', e.response?.data || e.message);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Test Failed: Connection refused. Is the server running?');
        } else {
            console.error('Test Failed:', error.response?.data || error.message);
        }
    }
}

verifyShopApi();
