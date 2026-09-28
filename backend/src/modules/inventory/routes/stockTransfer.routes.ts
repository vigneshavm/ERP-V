import { Router } from "express";
import { createTransfer, getTransfers } from "../controllers/StockTransferController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.post("/", createTransfer);
router.get("/", getTransfers);

export default router;
