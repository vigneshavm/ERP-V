
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const BusinessProfile = require('../src/models/BusinessProfile').default;
const businessRoutes = require('../src/routes/businessRoutes').default;
const { syncGoogle } = require('../src/controllers/BusinessController');

// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId() };
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
        expect(res.body.data.insights.views).toBeGreaterThan(0);
        expect(res.body.data.completeness).toBe(85);
        expect(res.body.data.reviews.length).toBeGreaterThan(0);
        expect(res.body.data.posts.length).toBeGreaterThan(0);
        expect(res.body.data.reviews[0].reviewer).toBeDefined();
        expect(res.body.data.posts[0].type).toBeDefined();
    });
});
