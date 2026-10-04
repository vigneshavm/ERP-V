import { Router } from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { assertBarcodeUnused } from "../../../integrations/textilesoft/sqlLegacyQueries.js";
import { duplicateBarcodes } from "../../../integrations/textilesoft/sqlParties.js";
import * as c from "../controllers/InventorySqlController.js";

/**
 * Read-only inventory routes backed by the shop (Textilesoft) database -- no MongoDB.
 * Same paths as the old inventory.routes.ts for the reads that have a SQL source; everything else
 * (categories, serial units, reprint queue, writes) is not mounted and stays unavailable.
 * (Rebuilt over InventorySqlController after being overwritten; paths mirror inventory.routes.ts.)
 */
const router = Router();
router.use(protect);

const unavailable = (_req: import("express").Request, res: import("express").Response) => {
  res.status(503).json({
    success: false,
    error: {
      code: "SQL_INVENTORY_OPERATION_UNAVAILABLE",
      message: "This inventory operation is not available in SQL-only mode because its existing SQL lifecycle has not been verified.",
    },
  });
};

router.get("/", c.listItems);
router.get("/filters", c.getItemFilters);
router.get("/inventory-stats", c.getInventoryStats);
router.get("/reports/stock-by-city", c.getStockByCity);
router.get("/reports/stock-by-rack", c.getStockByRack);
router.get("/reports/stock-status", c.getStockStatusReport);
router.get("/reports/low-stock", c.getLowStockReport);
router.get("/reports/dead-stock", c.getDeadStockReport);
router.get("/reports/stock-filters", c.getStockFilterOptions);
router.get("/distinct-categories", c.getDistinctCategories);
router.get("/low-stock", c.getLowStockItems);
router.get("/stock-movements", c.getStockMovements);
router.get("/aging-report", c.getStockAgingReport);
router.get("/stock-age", c.getStockAgeBuckets);
router.get("/stock-analysis", c.getStockAnalysis);
router.get("/barcode-audit", sql(async (_req, res) => { res.json({ success: true, data: await duplicateBarcodes() }); }));
router.get("/barcode/:barcode", c.getItemByBarcode);
router.post("/barcode/:barcode/cancel", authorize("owner", "co-owner", "manager"), sql(async (req, res) => { await assertBarcodeUnused(String(req.params.barcode)); unavailable(req, res); }));
// Keep unsupported static paths ahead of /:id so they cannot look like missing barcode lookups.
router.all([
  "/categories",
  "/filters",
  "/reprint-queue",
  "/batch-price-update",
  "/write-off",
  "/import",
  "/export",
  "/combo-offers",
  "/serial-units",
  "/stock-transfer",
], unavailable);
router.get("/:id", c.getSingleItem);
router.get("/:id/history", c.getItemStockHistory);
router.all("*", unavailable);

export default router;
