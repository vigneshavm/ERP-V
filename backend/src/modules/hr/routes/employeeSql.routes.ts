import express from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import {
  listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, employeeLookups,
} from "../../../integrations/textilesoft/sqlEmployees.js";

/**
 * Staff directory = Textilesoft's dbo.newemployee. Reading is open to any signed-in user; changes need owner/manager.
 * Attendance, payroll, payslips, allowances and advances are NOT part of this: the shop database has no tables for them,
 * so those routes stay unavailable (not mounted in SQL-only mode).
 */
const router = express.Router();
router.use(protect);
const editors = authorize("owner", "co-owner", "manager");

router.get("/lookups", sql(async (_r, out) => out.json({ success: true, data: await employeeLookups() })));
router.get("/", sql(async (_r, out) => out.json({ success: true, data: await listEmployees() })));
router.get("/:code", sql(async (r, out) => out.json({ success: true, data: await getEmployee(String(r.params.code)) })));
router.post("/", editors, sql(async (r, out) => out.status(201).json({ success: true, data: await createEmployee(r.body ?? {}) })));
router.put("/:code", editors, sql(async (r, out) => out.json({ success: true, data: await updateEmployee(String(r.params.code), r.body ?? {}) })));
router.delete("/:code", editors, sql(async (r, out) => { await deleteEmployee(String(r.params.code)); out.json({ success: true }); }));

export default router;
