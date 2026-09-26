import { Router } from "express";
import {
    listDailyFinance,
    createDailyFinance,
    updateDailyFinance,
    deleteDailyFinance
} from "../controllers/DailyFinanceController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, listDailyFinance);
router.post("/", protect, createDailyFinance);
router.put("/:id", protect, updateDailyFinance);
router.delete("/:id", protect, deleteDailyFinance);

export default router;
