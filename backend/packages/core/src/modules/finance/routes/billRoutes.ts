import express from "express";
import {
    getAllBills,
    createBill,
    getBillById,
    updateBill,
    deleteBill,
    updateBillPayment
} from "../controllers/BillController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", protect, getAllBills);
router.post("/", protect, createBill);
router.get("/:id", protect, getBillById);
router.put("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);

// PATCH /:id replaces PUT /:id/payment.
// Recording a payment is a partial update on the bill resource.
// The request body carries { paymentAmount, paymentDate, paymentMethod, ... }.
router.patch("/:id", protect, updateBillPayment);

export default router;
