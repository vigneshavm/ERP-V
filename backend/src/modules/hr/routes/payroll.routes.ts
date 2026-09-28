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
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Components
router.post("/components", protect, createSalaryComponent);
router.get("/components", protect, getSalaryComponents);
router.put("/components/:id", protect, updateSalaryComponent);
router.delete("/components/:id", protect, deleteSalaryComponent);

// Structure
router.post("/structures", protect, upsertSalaryStructure);
router.get("/structures", protect, getAllSalaryStructures);
router.post("/structures/bulk", protect, bulkUpdateSalaryStructure);
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
router.post("/payout", protect, processIndividualPayout); // Individual Payout
router.delete("/runs/:id", protect, deleteRun); // Rollback

// Payslips
router.put("/payslips/:id", protect, updatePayslip); // Review/Correct
router.post("/payslips/:id/send", protect, sendPayslip); // Delivery

export default router;
