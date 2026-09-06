import express from "express";
import {
    getCommissionRules,
    createCommissionRule,
    updateCommissionRule,
    deleteCommissionRule,
    getCommissionReport,
} from "../controllers/CommissionController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Static path before the ':id' param route so 'report' isn't swallowed as an id.
router.get("/report", protect, getCommissionReport);
router.get("/", protect, getCommissionRules);
router.post("/", protect, createCommissionRule);
router.patch("/:id", protect, updateCommissionRule);
router.delete("/:id", protect, deleteCommissionRule);

export default router;
