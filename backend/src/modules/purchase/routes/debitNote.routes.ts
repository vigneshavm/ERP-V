import express from "express";
import { container } from "tsyringe";
import { protect } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { DebitNoteController } from "../controllers/DebitNoteController.js";
import { createDebitNoteValidators, debitNoteIdValidators, changeDebitNoteStatusValidators } from "../validators/debitNoteValidators.js";

/** Mounted at /api/purchases/debit-notes. */
const router = express.Router();
const controller = container.resolve(DebitNoteController);

router.get("/", protect, controller.list);
router.get("/:id", protect, debitNoteIdValidators, validate, controller.getById);
router.post("/", protect, createDebitNoteValidators, validate, controller.create);
router.put("/:id/status", protect, changeDebitNoteStatusValidators, validate, controller.changeStatus);
router.delete("/:id", protect, debitNoteIdValidators, validate, controller.remove);

export default router;
