import express from "express";
import {
    getPosProducts,
    createInvoice,
    getMrpPendingInvoices,
    finalizeMrpPricing,
    editInvoice
} from "../controllers/PosController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/products", protect, getPosProducts);
router.post("/invoice", protect, createInvoice);
router.get("/invoice/mrp-pending", protect, getMrpPendingInvoices);
router.patch("/invoice/:id/finalize-mrp", protect, finalizeMrpPricing);
router.patch("/invoice/:id/edit", protect, editInvoice);

export default router;
