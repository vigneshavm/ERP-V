import { Router } from "express";
import { MetaController } from "../controllers/MetaController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = Router();
const metaController = new MetaController();
// Auth Routes
router.get("/auth/url", protect, metaController.getAuthUrl);
router.post("/auth/callback", protect, metaController.handleCallback);
// Data Routes
router.get("/status", protect, metaController.getStatus);
router.get("/pages", protect, metaController.getPages);
router.get("/ad-accounts", protect, metaController.getAdAccounts);
router.get("/whatsapp-accounts", protect, metaController.getWhatsAppAccounts);
// Publishing Routes
router.post("/publish/instagram", protect, metaController.publishPost);
// Webhooks (Public)
router.get("/webhook", metaController.verifyWebhook);
router.post("/webhook", metaController.handleWebhook);
export default router;
