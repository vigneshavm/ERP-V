import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from './setup.js';

// Validates the Settings persistence fix: Settings.tsx's Save/Load flow now goes through
// GET/PUT /api/settings, which reads and writes the REAL Tenant Mongoose document (keyed
// strictly by req.tenantId), instead of the old behavior where tenantSlice.updateTenantDetails
// only updated an in-memory Redux object and nothing ever reached MongoDB. These tests run
// against the compiled controller with a real mongodb-memory-server instance (via tests/setup.js)
// so persistence is proven by re-reading the DB independently of the controller's own response,
// not just by trusting what the controller echoes back.

let Tenant;
let BusinessSectorModel;
let getSettings;
let updateSettings;
let app;

beforeAll(async () => {
    await connect();
    Tenant = (await import('../dist/modules/core/models/Tenant.js')).default;
    BusinessSectorModel = (await import('../dist/modules/core/models/BusinessSector.js')).default;
    ({ getSettings, updateSettings } = await import('../dist/modules/core/controllers/SettingsController.js'));
    app = (await import('../dist/app.js')).default;
}, 60000);

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

function makeRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

async function createTenant(overrides = {}) {
    return Tenant.create({
        name: 'Acme Textiles',
        shopName: 'Acme Shop',
        slug: `acme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: new mongoose.Types.ObjectId(),
        subscriptionPlan: new mongoose.Types.ObjectId(),
        ...overrides,
    });
}

describe('Settings Persistence API (SET-001 to SET-013)', () => {
    test('SET-001 (P0): GET /api/settings returns the persisted tenant record, including Business Sector fields', async () => {
        const tenant = await createTenant({ businessType: 'Textile & Garments Retail', sector: 'Textile' });
        const req = { tenantId: String(tenant._id) };
        const res = makeRes();

        await getSettings(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.businessType).toBe('Textile & Garments Retail');
        expect(res.body.data.sector).toBe('Textile');
    });

    test('SET-002 (P0): PUT /api/settings persists Business Sector, Business Type and Company Details to MongoDB (not just echoed in the response)', async () => {
        const tenant = await createTenant();
        const req = {
            tenantId: String(tenant._id),
            body: {
                name: 'Acme Textiles Pvt Ltd',
                businessType: 'Textile & Garments Retail',
                sector: 'Textile',
                companyDetails: { addressLine1: '221B Baker Street', city: 'Mumbai', state: 'MH', pincode: '400001' },
            },
        };
        const res = makeRes();

        await updateSettings(req, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        // Re-read directly from the DB, independent of the controller's response,
        // to prove the write actually reached MongoDB.
        const reloaded = await Tenant.findById(tenant._id);
        expect(reloaded.name).toBe('Acme Textiles Pvt Ltd');
        expect(reloaded.businessType).toBe('Textile & Garments Retail');
        expect(reloaded.sector).toBe('Textile');
        expect(reloaded.companyDetails.addressLine1).toBe('221B Baker Street');
        expect(reloaded.companyDetails.city).toBe('Mumbai');
    });

    test('SET-003 (P0): a subsequent GET reflects previously saved values (persists across separate requests/sessions)', async () => {
        const tenant = await createTenant();
        await updateSettings({ tenantId: String(tenant._id), body: { businessType: 'Pharmacy', sector: 'Pharmacy' } }, makeRes());

        const getRes = makeRes();
        await getSettings({ tenantId: String(tenant._id) }, getRes);

        expect(getRes.body.data.businessType).toBe('Pharmacy');
        expect(getRes.body.data.sector).toBe('Pharmacy');
    });

    test('SET-004 (P0): rejects an update with an empty/invalid business name (400) and leaves the DB untouched', async () => {
        const tenant = await createTenant({ name: 'Original Name' });
        const req = { tenantId: String(tenant._id), body: { name: '   ' } };
        const res = makeRes();

        await updateSettings(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        const reloaded = await Tenant.findById(tenant._id);
        expect(reloaded.name).toBe('Original Name');
    });

    test('SET-005 (P0): returns 400 when tenant context is missing (no req.tenantId)', async () => {
        const req = { body: { name: 'X' } };
        const res = makeRes();
        await updateSettings(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('SET-006 (P0): cross-tenant isolation - updating tenant A never affects tenant B, even if the body smuggles tenant B\'s id', async () => {
        const tenantA = await createTenant({ name: 'Tenant A' });
        const tenantB = await createTenant({ name: 'Tenant B' });

        const req = {
            tenantId: String(tenantA._id),
            body: { name: 'Tenant A Updated', tenantId: String(tenantB._id), _id: String(tenantB._id), id: String(tenantB._id) },
        };
        await updateSettings(req, makeRes());

        const reloadedA = await Tenant.findById(tenantA._id);
        const reloadedB = await Tenant.findById(tenantB._id);
        expect(reloadedA.name).toBe('Tenant A Updated');
        expect(reloadedB.name).toBe('Tenant B'); // untouched
    });

    test('SET-007 (P0): returns 404 when req.tenantId does not correspond to any tenant', async () => {
        const req = { tenantId: String(new mongoose.Types.ObjectId()), body: { name: 'X' } };
        const res = makeRes();
        await updateSettings(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test('SET-008 (P0): a partial nested update (e.g. only city) merges instead of replacing companyDetails/taxDetails/bankingDetails', async () => {
        const tenant = await createTenant();
        await updateSettings({
            tenantId: String(tenant._id),
            body: { companyDetails: { addressLine1: 'Line 1', city: 'Pune', state: 'MH' } },
        }, makeRes());

        await updateSettings({
            tenantId: String(tenant._id),
            body: { companyDetails: { city: 'Nagpur' } },
        }, makeRes());

        const reloaded = await Tenant.findById(tenant._id);
        expect(reloaded.companyDetails.city).toBe('Nagpur');
        expect(reloaded.companyDetails.addressLine1).toBe('Line 1'); // preserved, not wiped
        expect(reloaded.companyDetails.state).toBe('MH'); // preserved, not wiped
    });

    test('SET-009 (P0): saving Finance tab data (GSTIN, PAN, banking details) persists to MongoDB', async () => {
        const tenant = await createTenant();
        await updateSettings({
            tenantId: String(tenant._id),
            body: {
                taxDetails: { gstin: '27ABCDE1234F1Z5', pan: 'ABCDE1234F' },
                bankingDetails: { bankName: 'HDFC Bank', accountNumber: '1234567890', ifsc: 'HDFC0000123' },
            },
        }, makeRes());

        const reloaded = await Tenant.findById(tenant._id);
        expect(reloaded.taxDetails.gstin).toBe('27ABCDE1234F1Z5');
        expect(reloaded.taxDetails.pan).toBe('ABCDE1234F');
        expect(reloaded.bankingDetails.bankName).toBe('HDFC Bank');
        expect(reloaded.bankingDetails.accountNumber).toBe('1234567890');
    });

    test('SET-010 (P1): an invalid tenantId format is handled gracefully (no unhandled crash)', async () => {
        const req = { tenantId: 'not-a-valid-object-id', body: { name: 'X' } };
        const res = makeRes();
        await updateSettings(req, res);
        expect([400, 404, 500]).toContain(res.statusCode);
        expect(res.body.success).toBe(false);
    });

    test('SET-011 (P0): a DB-level failure surfaces as a clean 500 response, not an unhandled crash', async () => {
        const tenant = await createTenant();
        const spy = jest.spyOn(Tenant, 'findById').mockImplementationOnce(() => {
            throw new Error('Simulated DB outage');
        });

        const req = { tenantId: String(tenant._id), body: { name: 'X' } };
        const res = makeRes();
        await updateSettings(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
        spy.mockRestore();
    });

    test('SET-012 (P0): the sector short code saved on Tenant stays consistent with BusinessSector.shortCode, so Inventory Categories\' sector-mapped categories keep resolving correctly', async () => {
        const sector = await BusinessSectorModel.create({ name: 'Textile & Garments Retail', shortCode: 'Textile', status: 'ACTIVE' });
        const tenant = await createTenant();

        await updateSettings({
            tenantId: String(tenant._id),
            body: { businessType: sector.name, sector: sector.shortCode },
        }, makeRes());

        const reloaded = await Tenant.findById(tenant._id);
        const matchedSector = await BusinessSectorModel.findOne({ shortCode: reloaded.sector });
        expect(matchedSector).not.toBeNull();
        expect(matchedSector.name).toBe(reloaded.businessType);
    });

    test('SET-013 (P0): GET /api/settings rejects an unauthenticated request (no Bearer token) with 401, over the real HTTP route/middleware stack', async () => {
        const res = await request(app).get('/api/settings');
        expect(res.statusCode).toBe(401);
    });
});
