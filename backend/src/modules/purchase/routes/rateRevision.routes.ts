import express from "express";
import { container } from "tsyringe";
import { protect } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { RateRevisionController } from "../controllers/RateRevisionController.js";
import { createRateRevisionValidators, rateRevisionIdValidators } from "../validators/rateRevisionValidators.js";

/** Mounted at /api/purchases/rate-revisions (purchase.routes.ts, before the purchase-id routes). */
const router = express.Router();
const controller = container.resolve(RateRevisionController);

router.post("/", protect, createRateRevisionValidators, validate, controller.create);
router.get("/", protect, controller.list);
router.post("/:id/approve", protect, rateRevisionIdValidators, validate, controller.approve);
router.post("/:id/reject", protect, rateRevisionIdValidators, validate, controller.reject);

export default router;
