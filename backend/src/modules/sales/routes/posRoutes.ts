import express from "express";
import {
    getPosProducts,
    processCheckout
} from "../controllers/PosController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/products", protect, getPosProducts);
router.post("/checkout", protect, processCheckout);

export default router;
