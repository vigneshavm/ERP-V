import { Router } from "express";
import { createTransfer, getTransfers } from "../controllers/GRNTransferController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.post("/", createTransfer);
router.get("/", getTransfers);

export default router;
