import { beforeEach, describe, expect, it, jest } from "@jest/globals";

let connectionError: Error | undefined;
let connects = 0;
let closes = 0;
let rollbacks = 0;
let commits = 0;
const repair = jest.fn(async () => true);
jest.unstable_mockModule("../shopDbReader.js", () => ({ loadDbConfig: () => ({ database: "mock", server: "mock", user: "mock", password: "mock" }), openPool: async () => ({}) }));
jest.unstable_mockModule("../sqlDbAccess.js", () => ({ healDbAccess: repair }));
jest.unstable_mockModule("../../../config/logger.js", () => ({ info: () => undefined }));
jest.unstable_mockModule("mssql", () => ({ default: {
    ConnectionPool: class {
        async connect() { connects++; if (connectionError) throw connectionError; }
        async close() { closes++; }
    },
    Transaction: class {
        async begin() {}
        async rollback() { rollbacks++; }
        async commit() { commits++; }
    },
} }));
const { sqlWriter, withSqlTransaction } = await import("../sqlWrite.js");
beforeEach(() => { repair.mockClear(); connects = closes = rollbacks = commits = 0; connectionError = undefined; });
describe("SQL writers never repair database access", () => {
    it("propagates connection failure, closes the failed pool and never repairs/retries", async () => {
        connectionError = new Error("Login refused");
        await expect(sqlWriter()).rejects.toBe(connectionError);
        expect(repair).not.toHaveBeenCalled();
        expect(connects).toBe(1);
        expect(closes).toBe(1);
    });
    it("rolls back permission failure without a grant/user repair or success response", async () => {
        await expect(withSqlTransaction("test", async () => { throw new Error("Permission denied"); })).rejects.toThrow("refused the change");
        expect(repair).not.toHaveBeenCalled();
        expect(rollbacks).toBe(1);
        expect(commits).toBe(0);
    });
});
