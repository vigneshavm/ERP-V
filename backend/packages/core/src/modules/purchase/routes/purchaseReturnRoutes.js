import express from "express";
import { createPurchaseReturn, getAllPurchaseReturns, getPurchaseReturnById, deletePurchaseReturn } from "../controllers/PurchaseReturnController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.post("/", protect, createPurchaseReturn);
router.get("/", protect, getAllPurchaseReturns);
router.get("/:id", protect, getPurchaseReturnById);
router.delete("/:id", protect, deletePurchaseReturn);
export default router;
