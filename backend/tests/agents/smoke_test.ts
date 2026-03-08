import { AgentOrchestrator } from '../../src/modules/agents/services/AgentOrchestrator.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Smoke Test: Multi-Agent Workflow
 * Note: This requires a valid GEMINI_API_KEY and MongoDB connection
 */
async function runSmokeTest() {
    console.log('--- Starting Agent Workflow Smoke Test ---');
    
    try {
        // 1. Connect to DB (Mocking or using test DB)
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smarterp_test');
        }

        const dummyReceipt = Buffer.from('dummy image data');
        const mimeType = 'image/png';
        const tenantId = new mongoose.Types.ObjectId().toString();
        const userId = new mongoose.Types.ObjectId().toString();
        const receiptUrl = 'https://example.com/receipt.png';

        console.log('Action: Triggering Workflow...');
        const result = await AgentOrchestrator.runWorkflow(
            dummyReceipt,
            mimeType,
            tenantId,
            userId,
            receiptUrl
        );

        console.log('Result Success:', result.success);
        console.log('Result Message:', result.message);
        if (result.data) {
            console.log('Extracted Vendor:', result.data.vendor);
        }

    } catch (error) {
        console.error('Smoke Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('--- Smoke Test End ---');
    }
}

runSmokeTest();
