import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import express from "express";
import http from "http";

// Textilesoft (SQL) purchase-return routes: only owners / managers may delete a return.
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
jest.unstable_mockModule("../controllers/PurchaseReturnController.js", () => ({ PurchaseReturnController: class {} }));
jest.unstable_mockModule("../../../middlewares/validate.js", () => ({ validate: () => undefined }));
jest.unstable_mockModule("../validators/purchaseReturnValidators.js", () => ({
  createPurchaseReturnValidators: [],
  purchaseReturnIdValidators: [],
}));
// Every MongoDB-controller handler is a stub; these tests only exercise the SQL branch.
const stub = (_req: unknown, res: any) => res.status(418).end();
jest.unstable_mockModule("tsyringe", () => ({
  container: { resolve: () => new Proxy({}, { get: () => stub }) },
}));
jest.unstable_mockModule("../../../integrations/textilesoft/sqlPurchaseReturn.js", () => ({
  createSqlPurchaseReturn: async () => (calls.push("create"), {}),
  listSqlPurchaseReturns: async () => [],
  getSqlPurchaseReturn: async () => ({}),
  deleteSqlPurchaseReturn: async () => void calls.push("delete"),
}));

const router = (await import("../routes/purchaseReturnSql.routes.js")).default;
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

describe("SQL purchase-return routes", () => {
  it("staff can create a return but not delete one (#6)", async () => {
    expect((await send("POST", "/po", { items: [] })).status).toBe(201);
    expect((await send("DELETE", "/po/sql:pr:PR1")).status).toBe(403);
    expect(calls).toEqual(["create"]);
  });

  it("owners and managers can delete", async () => {
    role = "manager";
    expect((await send("DELETE", "/po/sql:pr:PR1")).status).toBe(200);
    role = "co-owner";
    expect((await send("DELETE", "/po/sql:pr:PR2")).status).toBe(200);
    expect(calls).toEqual(["delete", "delete"]);
  });

  it("an id that is not a shop-database return is a 404, never a lookup", async () => {
    role = "manager";
    expect((await send("GET", "/po/65f0c0ffee")).status).toBe(404);
    expect((await send("DELETE", "/po/65f0c0ffee")).status).toBe(404);
    expect(calls).toEqual([]);
  });
});
