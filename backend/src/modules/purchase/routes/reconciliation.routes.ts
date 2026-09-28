import express from "express";
import { container } from "tsyringe";
import { protect } from "../../../middlewares/authMiddleware.js";
import { SupplierReconciliationController } from "../controllers/SupplierReconciliationController.js";

const router = express.Router();

router.post("/", protect, (req, res) => container.resolve(SupplierReconciliationController).markReconciled(req, res));
router.get("/status", protect, (req, res) => container.resolve(SupplierReconciliationController).getReconciliationStatus(req, res));
router.delete("/:transactionId", protect, (req, res) => container.resolve(SupplierReconciliationController).unreconcile(req, res));

export default router;
