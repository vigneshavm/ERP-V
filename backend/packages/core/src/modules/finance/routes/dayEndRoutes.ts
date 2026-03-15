import { Router } from "express";
import { getDayEndSummary, saveDayEndReconciliation } from "../controllers/DayEndController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = Router();

router.get("/summary", protect, getDayEndSummary);
router.post("/save", protect, saveDayEndReconciliation);

export default router;
