import { Router } from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import {
  listCustomers, getCustomer, changeCustomerField, createDifferentCustomer, createNativeAgent, listAgents, listCashiers, listCustomerGroups,
} from "../../../integrations/textilesoft/sqlParties.js";
import {
  sqlSupplierList,
} from "../../../integrations/textilesoft/sqlSuppliers.js";

const manage = authorize("owner", "co-owner", "manager");
const q = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
/** Customer directory reads from dbo.newcustomer; keys are not verified for linked operations. */
export const customerRouter = Router();
customerRouter.use(protect);
customerRouter.post("/", manage, sql(async (req, res) => { res.status(201).json({ success: true, data: await createDifferentCustomer(req.body) }); }));
for (const field of ["mobile", "card", "name"] as const) customerRouter.put("/:id/" + field, manage, sql(async (req, res) => { res.json({ success: true, data: await changeCustomerField(String(req.params.id), field, req.body?.value) }); }));
customerRouter.get("/", sql(async (req, res) => {
  res.json({ success: true, data: await listCustomers(q(req.query.search), Number(req.query.limit) || 200) });
}));
customerRouter.get("/:id", sql(async (req, res) => {
  const c = await getCustomer(String(req.params.id));
  if (!c) throw new SqlWriteError("Customer not found.", 404);
  res.json({ success: true, data: c });
}));
customerRouter.use((_req, res) => res.status(503).json({
  success: false, code: "SQL_CUSTOMER_MUTATION_UNAVAILABLE", message: "Customer-linked operations are unavailable until a stable SQL customer key is verified.",
}));

export const agentRouter = Router();
agentRouter.use(protect);
agentRouter.post("/", manage, sql(async (req, res) => { res.status(201).json({ success: true, data: await createNativeAgent(req.body) }); }));
agentRouter.get("/", sql(async (_req, res) => { res.json({ success: true, data: await listAgents() }); }));

export const cashierRouter = Router();
cashierRouter.use(protect);
cashierRouter.get("/", sql(async (_req, res) => { res.json({ success: true, data: await listCashiers() }); }));

export const customerGroupRouter = Router();
customerGroupRouter.use(protect);
customerGroupRouter.get("/", sql(async (_req, res) => { res.json({ success: true, data: await listCustomerGroups() }); }));

/** Supplier directory reads only; current supplier IDs can be synthesized from mutable names. */
export const supplierRouter = Router();
supplierRouter.use(protect);
supplierRouter.get("/", sql(async (_req, res) => { res.json({ success: true, data: await sqlSupplierList() }); }));
supplierRouter.use((_req, res) => res.status(503).json({
  success: false, code: "SQL_SUPPLIER_OPERATION_UNAVAILABLE", message: "Supplier-linked operations are unavailable until stable SQL supplier keys are verified.",
}));
