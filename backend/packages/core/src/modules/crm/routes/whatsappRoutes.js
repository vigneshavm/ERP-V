import express from "express";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, sendTemplateMessage, getCampaigns, createCampaign, getStats } from "../controllers/WhatsAppController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
// Template routes
router.get("/templates", protect, getTemplates);
router.post("/templates", protect, createTemplate);
router.patch("/templates/:id", protect, updateTemplate);
router.delete("/templates/:id", protect, deleteTemplate);
// Messaging routes
router.post("/send-template", protect, sendTemplateMessage);
// Campaign routes
router.get("/campaigns", protect, getCampaigns);
router.post("/campaigns", protect, createCampaign);
// Analytics routes
router.get("/stats", protect, getStats);
export default router;
