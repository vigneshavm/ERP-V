import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './setup.js';

let DailyAttendance;
let getAttendance;
let markAttendance;
let bulkMarkAttendance;
let mapStatusToBackend;
let mapStatusToFrontend;

beforeAll(async () => {
    await connect();
    DailyAttendance = (await import('../dist/modules/hr/models/DailyAttendance.js')).default;
    ({ getAttendance, markAttendance, bulkMarkAttendance, mapStatusToBackend, mapStatusToFrontend } = await import('../dist/modules/hr/controllers/AttendanceController.js'));
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

describe('Attendance Tab Module & MongoDB Persistence (ATT-TAB-001 to ATT-TAB-015)', () => {
    test('ATT-TAB-009: Empty attendance from DB returns empty array with success true', async () => {
        const tenantId = new mongoose.Types.ObjectId().toString();
        const employeeId = new mongoose.Types.ObjectId().toString();
        const req = { user: { tenantId }, query: { month: '0', year: '2026', employeeId } };
        const res = makeRes();

        await getAttendance(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    test('ATT-TAB-010: Save attendance (PUT/POST) persists record into MongoDB', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();
        const req = {
            user: { tenantId: tenantId.toString() },
            body: {
                employeeId: employeeId.toString(),
                date: '2026-08-15',
                status: 'HALF',
                inTime: '09:00',
                outTime: '13:00'
            }
        };
        const res = makeRes();

        await markAttendance(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('HALF');

        // Verify MongoDB directly
        const dbDoc = await DailyAttendance.findOne({ tenantId, employeeId });
        expect(dbDoc).not.toBeNull();
        expect(dbDoc.status).toBe('HALF_DAY'); // Backend mapped status
        expect(dbDoc.checkInTime).toBe('09:00');
        expect(dbDoc.checkOutTime).toBe('13:00');
    });

    test('ATT-TAB-011: Edit attendance updates existing record in MongoDB without duplicating', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();
        const req1 = {
            user: { tenantId: tenantId.toString() },
            body: { employeeId: employeeId.toString(), date: '2026-08-15', status: 'PRESENT' }
        };
        const res1 = makeRes();
        await markAttendance(req1, res1);

        const req2 = {
            user: { tenantId: tenantId.toString() },
            body: { employeeId: employeeId.toString(), date: '2026-08-15', status: 'ABSENT' }
        };
        const res2 = makeRes();
        await markAttendance(req2, res2);

        expect(res2.statusCode).toBe(200);
        expect(res2.body.data.status).toBe('ABSENT');

        const docs = await DailyAttendance.find({ tenantId, employeeId });
        expect(docs.length).toBe(1);
        expect(docs[0].status).toBe('ABSENT');
    });

    test('ATT-TAB-012: Bulk attendance upserts across multiple dates in MongoDB', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();
        const dates = ['2026-08-01', '2026-08-02', '2026-08-03'];

        const req = {
            user: { tenantId: tenantId.toString() },
            body: { employeeId: employeeId.toString(), dates, status: 'QUARTER' }
        };
        const res = makeRes();

        await bulkMarkAttendance(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(3);

        const count = await DailyAttendance.countDocuments({ tenantId, employeeId, status: 'QUARTER' });
        expect(count).toBe(3);
    });

    test('ATT-TAB-013: Unique constraint (tenantId + employeeId + date) prevents duplicates on rapid inserts', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();
        const date = new Date('2026-08-10T00:00:00.000Z');

        await DailyAttendance.create({ tenantId, employeeId, date, status: 'PRESENT' });

        await expect(DailyAttendance.create({ tenantId, employeeId, date, status: 'ABSENT' }))
            .rejects.toThrow();
    });

    test('ATT-TAB-014: Tenant isolation prevents cross-tenant attendance access or updates', async () => {
        const tenantA = new mongoose.Types.ObjectId();
        const tenantB = new mongoose.Types.ObjectId();
        const employeeA = new mongoose.Types.ObjectId();

        const reqA = {
            user: { tenantId: tenantA.toString() },
            body: { employeeId: employeeA.toString(), date: '2026-08-20', status: 'PRESENT' }
        };
        await markAttendance(reqA, makeRes());

        // Tenant B queries for tenant A's attendance
        const reqB = { user: { tenantId: tenantB.toString() }, query: { month: '7', year: '2026', employeeId: employeeA.toString() } };
        const resB = makeRes();
        await getAttendance(reqB, resB);

        expect(resB.statusCode).toBe(200);
        expect(resB.body.data).toEqual([]);
    });

    test('ATT-TAB-015: Querying attendance for Employee B does not leak Employee A attendance', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const empA = new mongoose.Types.ObjectId();
        const empB = new mongoose.Types.ObjectId();

        await markAttendance({
            user: { tenantId: tenantId.toString() },
            body: { employeeId: empA.toString(), date: '2026-08-22', status: 'PRESENT' }
        }, makeRes());

        const reqB = { user: { tenantId: tenantId.toString() }, query: { month: '7', year: '2026', employeeId: empB.toString() } };
        const resB = makeRes();
        await getAttendance(reqB, resB);

        expect(resB.statusCode).toBe(200);
        expect(resB.body.data).toEqual([]);
    });
});
