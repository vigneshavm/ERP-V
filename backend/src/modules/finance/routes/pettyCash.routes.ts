import { Router } from "express";
import { getPettyCashSummary, createPettyCashClose, getPettyCashHistory } from "../controllers/PettyCashController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/summary", protect, getPettyCashSummary);
router.post("/close", protect, createPettyCashClose);
router.get("/history", protect, getPettyCashHistory);

export default router;
