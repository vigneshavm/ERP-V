import { Router } from "express";
import { container } from "tsyringe";
import { LoyaltyController } from "../controllers/LoyaltyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();
const loyaltyController = container.resolve(LoyaltyController);

router.get("/customer/:id", protect, loyaltyController.getCustomerLoyalty);
router.get("/transactions/:id", protect, loyaltyController.getLoyaltyHistory);
router.post("/adjustment", protect, loyaltyController.adjustPoints);

export default router;
