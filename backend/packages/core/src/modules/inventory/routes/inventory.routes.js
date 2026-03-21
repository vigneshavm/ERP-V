import { Router } from "express";
import { container } from "tsyringe";
import { InventoryController } from "../controllers/InventoryController.js";
import { CategoryController } from "../controllers/CategoryController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';
import { importLimiter } from '@smarterp/shared/middlewares/rateLimiter.js';
import { cacheMiddleware } from '@smarterp/shared/config/cache.js';
const router = Router();
const inventoryController = container.resolve(InventoryController);
const categoryController = new CategoryController();
// Collections
router.get("/categories", protect, cacheMiddleware(3600), categoryController.getAllCategories);
router.get("/items", protect, cacheMiddleware(300), inventoryController.getAllItems);
router.post("/items", protect, inventoryController.addItem);
router.post("/import", protect, importLimiter, inventoryController.importItems);
// Analytics — /stats replaces /inventory-stats (prefix is redundant under /inventory)
router.get("/stats", protect, cacheMiddleware(300), inventoryController.getInventoryStats);
router.get("/low-stock", protect, cacheMiddleware(300), inventoryController.getLowStockItems);
router.get("/aging-reports", protect, cacheMiddleware(600), inventoryController.getStockAgingReport);
// Bulk mutations
// POST /aging-updates replaces POST /aging-actions — noun resource name
router.post("/aging-updates", protect, inventoryController.performAgingAction);
// POST /price-updates replaces POST /batch-price-update — noun resource name
router.post("/price-updates", protect, inventoryController.batchPriceUpdate);
// Reprint queue
router.get("/reprint-queues", protect, inventoryController.getReprintQueue);
router.delete("/reprint-queues", protect, inventoryController.clearReprintQueue);
// Bulk updates — PATCH replaces PUT (partial update, not full replacement)
router.patch("/bulk/category", protect, inventoryController.bulkUpdateCategory);
router.patch("/bulk/stock", protect, inventoryController.bulkAdjustStock);
// Batch delete
router.delete("/batch", protect, requirePermission("delete:item"), inventoryController.deleteItemsBatch);
// Single item
router.get("/:id", protect, inventoryController.getSingleItem);
router.put("/:id", protect, inventoryController.updateItem);
router.delete("/:id", protect, requirePermission("delete:item"), inventoryController.deleteItem);
router.post("/:id/duplicate", protect, inventoryController.duplicateItem);
router.patch("/:id/toggle-status", protect, inventoryController.toggleItemStatus);
// Stock movements — /movements is the canonical path; /history alias removed
router.get("/:id/movements", protect, inventoryController.getItemStockHistory);
router.post("/:id/movements", protect, inventoryController.recordMovement);
export default router;
