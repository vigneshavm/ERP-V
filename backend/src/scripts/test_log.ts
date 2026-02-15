console.log("Hello from test_log.ts");
console.log("Current working directory:", process.cwd());
import dotenv from 'dotenv';
dotenv.config();
console.log("MONGO_URI present:", !!process.env.MONGO_URI);
