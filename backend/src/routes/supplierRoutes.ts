import { Router } from "express";
import { container } from "tsyringe";
import { SupplierController } from "../controllers/SupplierController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";

const router = Router();
const supplierController = container.resolve(SupplierController);

router.post("/", protect, supplierController.addSupplier);
router.get("/", protect, supplierController.getAllSuppliers);
router.get("/:id", protect, supplierController.getSupplierById);
router.put(
    "/:id",
    protect,
    //   auditUpdate("Supplier", "UPDATE_SUPPLIER"),
    supplierController.updateSupplier
);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:supplier"),
    //   auditDelete("Supplier", "DELETE_SUPPLIER"),
    supplierController.deleteSupplier
);

export default router;
