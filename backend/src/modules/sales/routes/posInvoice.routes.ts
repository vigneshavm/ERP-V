import express from "express";
import {
    getPosProducts,
    getPosCounters,
    createInvoice,
    getMrpPendingInvoices,
    finalizeMrpPricing,
    editInvoice,
    payInvoice
} from "../controllers/PosController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/products", protect, getPosProducts);
router.get("/counters", protect, getPosCounters);
router.post("/invoice", protect, createInvoice);
router.get("/invoice/mrp-pending", protect, getMrpPendingInvoices);
router.patch("/invoice/:id/finalize-mrp", protect, finalizeMrpPricing);
router.patch("/invoice/:id/edit", protect, editInvoice);
router.put("/invoice/:id/payment", protect, payInvoice);

export default router;
