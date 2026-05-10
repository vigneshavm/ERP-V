import { Router } from "express";
import { container } from "tsyringe";
import { InventoryController } from "../controllers/InventoryController.js";
import { CategoryController } from "../controllers/CategoryController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";
import { importLimiter } from "../../../middlewares/rateLimiter.js";
import { auditUpdate, auditDelete } from "../../../middlewares/auditMiddleware.js";

const router = Router();
const inventoryController = container.resolve(InventoryController);
const categoryController = new CategoryController();

router.get("/categories", protect, categoryController.getAllCategories);
router.post("/", protect, inventoryController.addItem);
router.post("/import", protect, importLimiter, inventoryController.importItems);
router.get("/", protect, inventoryController.getAllItems);
router.get("/inventory-stats", protect, inventoryController.getInventoryStats);
router.get("/low-stock", protect, inventoryController.getLowStockItems);
router.get("/aging-report", protect, inventoryController.getStockAgingReport);
router.post("/aging-action", protect, inventoryController.performAgingAction);
router.post("/batch-price-update", protect, inventoryController.batchPriceUpdate);
router.get("/reprint-queue", protect, inventoryController.getReprintQueue);
router.delete("/reprint-queue", protect, inventoryController.clearReprintQueue);
router.put("/bulk/category", protect, inventoryController.bulkUpdateCategory);
router.put("/bulk/stock", protect, inventoryController.bulkAdjustStock);
router.get("/barcode/:barcode", protect, inventoryController.getItemByBarcode);
router.get("/:id", protect, inventoryController.getSingleItem);
router.put(
    "/:id",
    protect,
    auditUpdate("Item", "UPDATE_ITEM"),
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
    auditDelete("Item", "DELETE_ITEM"),
    inventoryController.deleteItem
);

router.post("/:id/duplicate", protect, inventoryController.duplicateItem);
router.patch("/:id/toggle-status", protect, inventoryController.toggleItemStatus);
router.get("/:id/history", protect, inventoryController.getItemStockHistory);

export default router;
