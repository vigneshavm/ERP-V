import { Router } from "express";
import { container } from "tsyringe";
import { InventoryController } from "../controllers/InventoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

// Note: Audit and RBAC middlewares will be ported in separate steps if needed. 
// For now, we replicate function logic. Audit middleware might need porting or import from JS if valid.
// But we want to avoid mixing JS imports.
// Let's create dummy/placeholder or port strict needed middlewares for this module.
// Route: requirePermission("delete:item"), auditDelete("Item", "DELETE_ITEM")
// I should port 'rbacMiddleware.ts' and 'auditMiddleware.ts' or stub them to fix errors.
// Since these are simple utilities, I will create them in this step briefly or simpler versions.

// Let's assume we import the JS ones? No, user wants TS.
// I will create simple TS versions of RBAC and Audit middlewares in src/middlewares now.

import { requirePermission } from "../middlewares/rbacMiddleware.js";
// import { auditDelete, auditUpdate } from "../middlewares/auditMiddleware"; 
// I'll implementation minimal versions if they don't exist, but let's assume I create them next.

const router = Router();
const inventoryController = container.resolve(InventoryController);

router.post("/", protect, inventoryController.addItem);
router.post("/import", protect, inventoryController.importItems);
router.get("/", protect, inventoryController.getAllItems);
router.get("/low-stock", protect, inventoryController.getLowStockItems);
router.get("/:id", protect, inventoryController.getSingleItem);
router.put(
    "/:id",
    protect,
    //   auditUpdate("Item", "UPDATE_ITEM"),
    inventoryController.updateItem
);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:item"),
    //   auditDelete("Item", "DELETE_ITEM"),
    inventoryController.deleteItem
);

export default router;
