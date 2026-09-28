import express from "express";
import { markAttendance, bulkMarkAttendance, markAttendanceForDate, getAttendance } from "../controllers/AttendanceController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, markAttendance); // one employee, one date
router.put("/", protect, markAttendance); // one employee, one date (PUT upsert endpoint)
router.post("/bulk", protect, bulkMarkAttendance); // one employee, many dates
router.post("/day", protect, markAttendanceForDate); // one date, many employees (Daily Attendance Board)
router.get("/", protect, getAttendance); // ?date=YYYY-MM-DD  OR  ?month=&year=

export default router;
