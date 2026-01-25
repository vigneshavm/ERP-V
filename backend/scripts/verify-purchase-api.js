
const checkUrl = async (url) => {
    try {
        console.log(`Checking ${url}...`);
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.headers.get('content-type')?.includes('application/json')) {
            const json = await res.json();
            console.log('Body:', typeof json === 'object' ? JSON.stringify(json).substring(0, 100) + '...' : json);
        } else {
            const text = await res.text();
            console.log('Body:', text.substring(0, 100)); // Standard 'Cannot GET /...' is text/html usually
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
    console.log('---');
};

(async () => {
    await checkUrl('http://localhost:5000/api/purchases'); // Expected 401 (since protected) or 200/empty
    await checkUrl('http://localhost:5000/purchases');     // Expected 404
})();
