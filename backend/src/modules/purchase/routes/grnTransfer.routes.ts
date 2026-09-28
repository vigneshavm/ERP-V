import { Router } from "express";
import { container } from "tsyringe";
import { protect } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { GRNTransferController } from "../controllers/GRNTransferController.js";
import { createGRNTransferValidators, listGRNTransferValidators, grnTransferIdValidators } from "../validators/grnTransferValidators.js";

/** Mounted at /api/grn-transfers. */
const router = Router();
const controller = container.resolve(GRNTransferController);

router.use(protect);
router.post("/", createGRNTransferValidators, validate, controller.create);
router.get("/", listGRNTransferValidators, validate, controller.list);
router.get("/:id", grnTransferIdValidators, validate, controller.getById);

export default router;
