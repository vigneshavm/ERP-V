import fetch from 'node-fetch';

async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo@bizzai.com',
                password: 'Demo@123'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        if (response.ok) {
            console.log('✅ Login Successful!');
            // console.log('Token:', data.token); // sensitive
            console.log('User:', data.name);
        } else {
            console.log('❌ Login Failed:', data);
        }
    } catch (error) { // Type as any or unknown implicitly handled in JS/TS catch
        const err = error as Error;
        console.error('❌ Connection Error:', err.message);
    }
}

testLogin();
