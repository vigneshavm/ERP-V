import express from "express";
import {
    createSalaryComponent,
    getSalaryComponents,
    upsertSalaryStructure,
    getSalaryStructure,
    logAttendance,
    getAttendanceSummary,
    generatePayroll,
    getPayrollRuns,
    getRunDetails,
    approvePayroll,
    payPayroll,
    updatePayslip,
    deleteRun,
    sendPayslip
} from "../controllers/PayrollController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Components
router.post("/components", protect, createSalaryComponent);
router.get("/components", protect, getSalaryComponents);

// Structure
router.post("/structures", protect, upsertSalaryStructure);
router.get("/structures/:employeeId", protect, getSalaryStructure);

// Attendance
router.post("/attendance", protect, logAttendance);
router.get("/attendance", protect, getAttendanceSummary);

// Payroll Processing
router.post("/runs", protect, generatePayroll); // Generate
router.get("/runs", protect, getPayrollRuns);
router.get("/runs/:id", protect, getRunDetails);
router.put("/runs/:id/approve", protect, approvePayroll);
router.post("/runs/:id/pay", protect, payPayroll);
router.delete("/runs/:id", protect, deleteRun); // Rollback

// Payslips
router.put("/payslips/:id", protect, updatePayslip); // Review/Correct
router.post("/payslips/:id/send", protect, sendPayslip); // Delivery

export default router;
