import express from "express";
import { addEmployee, getEmployees } from "../controllers/EmployeeController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addEmployee);
router.get("/", protect, getEmployees);

export default router;
