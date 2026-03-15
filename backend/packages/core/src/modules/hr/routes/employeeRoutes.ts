import express from "express";
import { addEmployee, getEmployees, updateEmployee, deleteEmployee } from "../controllers/EmployeeController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.post("/", protect, addEmployee);
router.get("/", protect, getEmployees);
router.put("/:id", protect, updateEmployee);
router.delete("/:id", protect, deleteEmployee);

export default router;
