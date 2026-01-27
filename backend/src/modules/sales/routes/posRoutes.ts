import express from "express";
import {
    getPosProducts,
    createInvoice
} from "../controllers/PosController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/products", protect, getPosProducts);
router.post("/invoice", protect, createInvoice);

export default router;
