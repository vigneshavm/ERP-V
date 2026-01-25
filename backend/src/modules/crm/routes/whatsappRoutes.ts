import express from "express";
import {
    getTemplates,
    createTemplate,
    getCampaigns,
    createCampaign,
    getStats
} from "../controllers/WhatsAppController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/templates", protect, getTemplates);
router.post("/templates", protect, createTemplate);
router.get("/campaigns", protect, getCampaigns);
router.post("/campaigns", protect, createCampaign);
router.get("/stats", protect, getStats);

export default router;
