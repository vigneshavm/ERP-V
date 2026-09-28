import express from "express";
import { container } from "tsyringe";
import { protect } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { PurchaseReturnController } from "../controllers/PurchaseReturnController.js";
import { createPurchaseReturnValidators, purchaseReturnIdValidators } from "../validators/purchaseReturnValidators.js";

const router = express.Router();
const controller = container.resolve(PurchaseReturnController);

router.post("/", protect, createPurchaseReturnValidators, validate, controller.create);
router.get("/", protect, controller.list);
router.get("/:id", protect, purchaseReturnIdValidators, validate, controller.getById);
router.delete("/:id", protect, purchaseReturnIdValidators, validate, controller.remove);

export default router;
