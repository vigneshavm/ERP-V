import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import { syncGoogle } from '../dist/modules/core/controllers/BusinessController.js';
import BusinessProfile from '../dist/modules/core/models/BusinessProfile.js';

const mockUserId = new mongoose.Types.ObjectId();

// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.user = { _id: mockUserId };
    next();
};

const app = express();
app.use(express.json());
app.post('/api/business/google/sync', mockAuth, syncGoogle);

describe('Google Business Profile Sync', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Seed BusinessProfile for mockUserId
        await BusinessProfile.create({
            userId: mockUserId,
            businessName: 'Test Business',
            email: 'test@business.com',
            phone: '9988776655'
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should sync google profile and generate insights', async () => {
        const res = await request(app)
            .post('/api/business/google/sync')
            .send();

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isConnected).toBe(true);
        expect(res.body.data.lastSyncAt).toBeDefined();
    });
});
