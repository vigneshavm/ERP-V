import express from "express";
import { createDeliveryChallan, getAllDeliveryChallans, getDeliveryChallanById, updateDeliveryChallan, convertToInvoice, deleteDeliveryChallan, } from "../controllers/DeliveryChallanController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.post("/", protect, createDeliveryChallan);
router.get("/", protect, getAllDeliveryChallans);
router.get("/:id", protect, getDeliveryChallanById);
router.put("/:id", protect, updateDeliveryChallan);
router.delete("/:id", protect, deleteDeliveryChallan);
// POST /:id/invoices replaces POST /:id/convert-to-invoice.
// Creating an invoice from a delivery challan is a sub-resource creation — POST + noun.
router.post("/:id/invoices", protect, convertToInvoice);
export default router;
