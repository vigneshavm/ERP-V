import { beforeEach, describe, expect, it, jest } from "@jest/globals";
const find = jest.fn(async () => ({ barcode: "B1", name: "Fabric", unit: "MTR", sellingPrice: 100 }));
const write = jest.fn(async () => ({ billNo: "A1", sysidandbill: "A1", total: 262.5, datetime: "2026-10-02", preview: { total: 262.5 } }));
const limits = jest.fn(async () => null);
jest.unstable_mockModule("../../../../integrations/textilesoft/sqlItemSource.js", () => ({ findByKeyDirect: find }));
jest.unstable_mockModule("../../../../integrations/textilesoft/sqlAuth.js", () => ({ getSqlUser: jest.fn() }));
jest.unstable_mockModule("../../../../integrations/textilesoft/sqlPosWriter.js", () => ({ writePosBillToSql: write, sqlCounters: jest.fn(), listReturnSources: jest.fn(), SqlPosError: class extends Error { statusCode=503; } }));
jest.unstable_mockModule("../../../../integrations/textilesoft/sqlPosRules.js", () => ({ priceApprovalReason: () => null }));
jest.unstable_mockModule("../../../../integrations/textilesoft/sqlBillingLimits.js", () => ({ getBillingLimits: limits }));
jest.unstable_mockModule("../../../../config/logger.js", () => ({ error: () => undefined }));
const { createInvoice, previewInvoice } = await import("../PosSqlController.js");
type Req = Parameters<typeof createInvoice>[0];
type Res = Parameters<typeof createInvoice>[1];
function request(quantity: unknown): Req { return { body: { items: [{ barcode: "B1", name: "Fabric", quantity, price: 100, tax: 5 }], counterName: "A", paymentMethod: "cash", expectedTotal: 262.5 }, user: { id: "mock", username: "mock" }, get: () => "request-key" } as unknown as Req; }
function response() { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; }
beforeEach(() => { jest.clearAllMocks(); });
const endpoints: [string, typeof createInvoice][] = [["preview", previewInvoice], ["save", createInvoice]];
describe.each(endpoints)("SQL %s quantity precision", (_name, handler) => {
    it.each([1.234, -1.234, 1e-12, Number.MAX_VALUE, 0, NaN, Infinity])("rejects unsupported quantity %s before product lookup or writer", async qty => {
        const res = response();
        await handler(request(qty), res as unknown as Res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(find).not.toHaveBeenCalled();
        expect(limits).not.toHaveBeenCalled();
        expect(write).not.toHaveBeenCalled();
    });
    it.each([2.5, -2.5, 0.1 * 3])("preserves supported signed quantity %s for the writer", async qty => {
        const res = response();
        await handler(request(qty), res as unknown as Res);
        expect(write).toHaveBeenCalledWith(expect.objectContaining({ lines: [expect.objectContaining({ qty })] }));
        expect(res.status).toHaveBeenCalledWith(_name === "preview" ? 200 : 201);
    });
});
