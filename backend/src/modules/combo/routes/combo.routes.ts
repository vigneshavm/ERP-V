import { Router } from "express";
import { container } from "tsyringe";
import { ComboOfferController } from "../controllers/ComboOfferController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";

const router = Router();
const comboOfferController = container.resolve(ComboOfferController);

router.post("/", protect, comboOfferController.createComboOffer);
router.get("/", protect, comboOfferController.getAllComboOffers);
router.get("/:id", protect, comboOfferController.getComboOfferById);
router.put("/:id", protect, comboOfferController.updateComboOffer);
router.delete("/:id", protect, requirePermission("delete:item"), comboOfferController.deleteComboOffer);

export default router;
