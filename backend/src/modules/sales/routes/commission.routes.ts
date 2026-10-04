import express from "express";
import {
    getCommissionRules,
    createCommissionRuleHandler,
    updateCommissionRuleHandler,
    deleteCommissionRuleHandler,
    getCommissionReport,
} from "../controllers/CommissionController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Static path before the ':id' param route so 'report' isn't swallowed as an id.
router.get("/report", protect, getCommissionReport);
router.get("/", protect, getCommissionRules);
router.post("/", protect, createCommissionRuleHandler);
router.patch("/:id", protect, updateCommissionRuleHandler);
router.delete("/:id", protect, deleteCommissionRuleHandler);

export default router;
