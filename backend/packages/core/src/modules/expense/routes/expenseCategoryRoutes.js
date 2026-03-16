import express from "express";
import { getAllCategories, createCategory, updateCategory, deleteCategory, } from "../controllers/ExpenseCategoryController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.get("/", protect, getAllCategories);
router.post("/", protect, createCategory);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);
export default router;
