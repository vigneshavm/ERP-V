import { Router } from "express";
import { container } from "tsyringe";
import { LoyaltyController } from "../controllers/LoyaltyController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = Router();
const loyaltyController = container.resolve(LoyaltyController);

// GET /customers/:id   — plural resource name, consistent with CRM module
router.get("/customers/:id", protect, loyaltyController.getCustomerLoyalty);

// GET /customers/:id/transactions — canonical sub-resource path
// replaces /transactions/:id which was ambiguous (what does :id refer to?)
router.get("/customers/:id/transactions", protect, loyaltyController.getLoyaltyHistory);

// POST /adjustments — plural noun replaces /adjustment (singular action-style)
router.post("/adjustments", protect, loyaltyController.adjustPoints);

export default router;
