import express from "express";
import { getPosProducts, createInvoice } from "../controllers/PosController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/products", protect, getPosProducts);

// POST /invoices replaces POST /invoice — plural, consistent with /sales/invoices
router.post("/invoices", protect, createInvoice);

export default router;
