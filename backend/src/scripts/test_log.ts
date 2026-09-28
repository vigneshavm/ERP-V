import { info } from '../config/logger.js';

info("Hello from test_log.ts");
info("Current working directory:", process.cwd());
import dotenv from 'dotenv';
dotenv.config();
console.log("MONGO_URI present:", !!process.env.MONGO_URI);
