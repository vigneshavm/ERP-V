import express from "express";
import {
    createSalaryComponent,
    getSalaryComponents,
    updateSalaryComponent,
    deleteSalaryComponent,
    upsertSalaryStructure,
    getSalaryStructure,
    getAllSalaryStructures,
    bulkUpdateSalaryStructure,
    logAttendance,
    getAttendanceSummary,
    generatePayroll,
    getPayrollRuns,
    getRunDetails,
    approvePayroll,
    payPayroll,
    updatePayslip,
    deleteRun,
    sendPayslip,
    processIndividualPayout
} from "../controllers/PayrollController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

// Salary components
router.post("/components", protect, createSalaryComponent);
router.get("/components", protect, getSalaryComponents);
router.put("/components/:id", protect, updateSalaryComponent);
router.delete("/components/:id", protect, deleteSalaryComponent);

// Salary structures
router.post("/structures", protect, upsertSalaryStructure);
router.get("/structures", protect, getAllSalaryStructures);
router.post("/structures/bulk", protect, bulkUpdateSalaryStructure);
router.get("/structures/:employeeId", protect, getSalaryStructure);

// Attendance
router.post("/attendance", protect, logAttendance);
router.get("/attendance", protect, getAttendanceSummary);

// Payroll runs
router.post("/runs", protect, generatePayroll);
router.get("/runs", protect, getPayrollRuns);
router.get("/runs/:id", protect, getRunDetails);
router.delete("/runs/:id", protect, deleteRun);

// PATCH /runs/:id replaces PUT /runs/:id/approve — approval is a partial status change.
// Request body: { status: "approved" }
router.patch("/runs/:id", protect, approvePayroll);

router.post("/runs/:id/pay", protect, payPayroll);
router.post("/payout", protect, processIndividualPayout);

// Payslips
// PATCH /payslips/:id replaces PUT /payslips/:id — correction is a partial update.
router.patch("/payslips/:id", protect, updatePayslip);
router.post("/payslips/:id/send", protect, sendPayslip);

export default router;
