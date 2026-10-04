import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import express from "express";
import http from "http";

// Textilesoft (SQL) purchase-order routes: who may change / delete a PO, and PUT only changing status.
type Row = Record<string, unknown>;
let role = "staff";
const calls: string[] = [];

jest.unstable_mockModule("../../../middlewares/authMiddleware.js", () => ({
  protect: (req: any, _res: any, next: any) => {
    req.user = { role };
    next();
  },
  authorize:
    (...roles: string[]) =>
    (req: any, _res: any, next: any) =>
      roles.includes(req.user.role) ? next() : next(Object.assign(new Error("Forbidden"), { statusCode: 403 })),
}));
jest.unstable_mockModule("../../../config/itemDataSource.js", () => ({ isSqlItemSource: () => true }));
jest.unstable_mockModule("../controllers/PurchaseController.js", () => ({ PurchaseController: class {} }));
jest.unstable_mockModule("../controllers/SupplierLedgerController.js", () => ({ getSupplierLedger: () => undefined }));
jest.unstable_mockModule("../../../middlewares/validate.js", () => ({ validate: () => undefined }));
jest.unstable_mockModule("../validators/purchaseValidators.js", () => ({ createPurchaseValidators: [] }));
// Every MongoDB-controller handler is a stub; these tests only exercise the SQL branch.
const stub = (_req: unknown, res: any) => res.status(418).end();
jest.unstable_mockModule("tsyringe", () => ({
  container: { resolve: () => new Proxy({}, { get: () => stub }) },
}));
jest.unstable_mockModule("../../../integrations/textilesoft/sqlPurchaseOrder.js", () => ({
  createSqlPurchaseOrder: async () => (calls.push("create"), {}),
  listSqlPurchaseOrders: async () => [],
  getSqlPurchaseOrder: async () => ({}),
  updateSqlPurchaseOrderStatus: async (_id: string, st: unknown) => (calls.push(`status ${st}`), {}),
  deleteSqlPurchaseOrder: async () => void calls.push("delete"),
  updateSqlPurchaseOrderReceipt: async () => (calls.push("receipt"), {}),
}));

const router = (await import("../routes/purchaseOrder.routes.js")).default;
const app = express();
app.use(express.json());
app.use("/po", router);
app.use((err: any, _req: any, res: any, _next: any) =>
  res.status(err.statusCode || 500).json({ message: err.message, code: err.code }),
);

function send(method: string, path: string, body?: Row): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as { port: number };
      const data = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        { port, path, method, headers: data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {} },
        (res) => {
          let out = "";
          res.on("data", (c) => (out += c));
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode ?? 0, body: out ? JSON.parse(out) : null });
          });
        },
      );
      req.on("error", reject);
      if (data) req.write(data);
      req.end();
    });
  });
}

beforeEach(() => {
  calls.length = 0;
  role = "staff";
});

describe("SQL purchase-order routes", () => {
  it("staff can't cancel, change status or delete a PO (#6)", async () => {
    expect((await send("PATCH", "/po/sql:po:PO1/status", { status: "CANCELLED" })).status).toBe(403);
    expect((await send("PUT", "/po/sql:po:PO1", { status: "CANCELLED" })).status).toBe(403);
    expect((await send("DELETE", "/po/sql:po:PO1")).status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("staff can still create a PO and record receipts", async () => {
    expect((await send("POST", "/po", { supplier: "X" })).status).toBe(201);
    expect((await send("PATCH", "/po/sql:po:PO1/receipt/1", { receivedQty: 5 })).status).toBe(200);
    expect(calls).toEqual(["create", "receipt"]);
  });

  it("owners / managers can cancel and delete", async () => {
    role = "manager";
    expect((await send("PATCH", "/po/sql:po:PO1/status", { status: "CANCELLED" })).status).toBe(200);
    role = "owner";
    expect((await send("DELETE", "/po/sql:po:PO1")).status).toBe(200);
    expect(calls).toEqual(["status CANCELLED", "delete"]);
  });

  it("PUT with lines is refused, not saved as 'ACTIVE' (#2)", async () => {
    role = "owner";
    const r = await send("PUT", "/po/sql:po:PO1", { status: "ACTIVE", items: [{ code: "1", qty: 2 }] });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("PO_EDIT_NOT_SUPPORTED");
    expect(calls).toEqual([]);
  });

  it("status is passed through as sent -- no ACTIVE default when it's missing (#2)", async () => {
    role = "owner";
    await send("PATCH", "/po/sql:po:PO1/status", {});
    expect(calls).toEqual(["status undefined"]);
  });
});
