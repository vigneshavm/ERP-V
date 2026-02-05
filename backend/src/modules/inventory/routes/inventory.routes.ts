import { Router } from "express";
import { container } from "tsyringe";
import { InventoryController } from "../controllers/InventoryController.js";
import { CategoryController } from "../controllers/CategoryController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";
import { importLimiter } from "../../../middlewares/rateLimiter.js";

const router = Router();
const inventoryController = container.resolve(InventoryController);
const categoryController = new CategoryController();

router.get("/categories", protect, categoryController.getAllCategories);
router.post("/", protect, inventoryController.addItem);
router.post("/import", protect, importLimiter, inventoryController.importItems);
router.get("/", protect, inventoryController.getAllItems);
router.get("/low-stock", protect, inventoryController.getLowStockItems);
router.get("/aging-report", protect, inventoryController.getStockAgingReport);
router.post("/aging-action", protect, inventoryController.performAgingAction);
router.post("/batch-price-update", protect, inventoryController.batchPriceUpdate);
router.get("/reprint-queue", protect, inventoryController.getReprintQueue);
router.delete("/reprint-queue", protect, inventoryController.clearReprintQueue);
router.get("/:id", protect, inventoryController.getSingleItem);
router.put(
    "/:id",
    protect,
    //   auditUpdate("Item", "UPDATE_ITEM"),
    inventoryController.updateItem
);
router.delete(
    "/batch",
    protect,
    requirePermission("delete:item"),
    inventoryController.deleteItemsBatch
);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:item"),
    inventoryController.deleteItem
);

export default router;
