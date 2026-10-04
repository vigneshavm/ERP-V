import { Request, Response } from "express";
import { error } from "../../../config/logger.js";
import { AppError } from "../../../utils/AppError.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { sqlStockAnalysis, type StockAnalysisQuery } from "../../../integrations/textilesoft/sqlStockAnalysis.js";
import * as sqlItems from "../../../integrations/textilesoft/sqlItemSource.js";
import {
  sqlAgingReport, sqlCityWiseStock, sqlDeadStockReport, sqlItemHistory, sqlLowStockReport, sqlRackWiseStock,
  sqlStockAgeBuckets, sqlStockFilterOptions, sqlStockMovements, sqlStockStatusReport, type StockReportQuery,
} from "../../../integrations/textilesoft/sqlStockReports.js";

/**
 * Item reads and stock reports from the shop (Textilesoft) database only - no MongoDB.
 * An item's id is its barcode (the transaction key in the shop database). Items are not edited here.
 */
const str = (req: Request, k: string): string | undefined =>
  typeof req.query[k] === "string" ? (req.query[k] as string) : undefined;

const stockReportQuery = (req: Request): StockReportQuery => ({
  search: str(req, "search"), category: str(req, "category"), brand: str(req, "brand"), supplier: str(req, "supplier"),
  from: str(req, "from"), to: str(req, "to"), page: str(req, "page"), limit: str(req, "limit"),
  threshold: str(req, "threshold"), days: str(req, "days"), neverSold: str(req, "neverSold"), refresh: str(req, "refresh"),
  sort: str(req, "sort"), dir: str(req, "dir"),
});

const DB_DOWN = "The shop database could not be reached. Try again in a moment.";
const tenantOf = (req: AuthenticatedRequest): string => String(req.tenantId ?? "");

function handler(label: string, fn: (req: AuthenticatedRequest) => Promise<unknown>) {
  return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await fn(req));
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message });
        return;
      }
      error(`${label} failed: ${(err as Error).message}`);
      res.status(503).json({ message: DB_DOWN });
    }
  };
}

export const listItems = handler("Items list", (req) => sqlItems.listItems(tenantOf(req), req.query as never));
export const getItemFilters = handler("Item filters", async () => ({ success: true, data: await sqlItems.itemFilterOptions() }));
export const getInventoryStats = handler("Inventory stats", () => sqlItems.inventoryStats());
export const getDistinctCategories = handler("Distinct categories", () => sqlItems.distinctItemCategories());
export const getLowStockItems = handler("Low stock items", (req) => sqlItems.lowStockItems(tenantOf(req)));

async function itemByBarcode(barcode: string) {
  const item = await sqlItems.findByKeyDirect({ barcode: String(barcode ?? "").trim() });
  if (!item) throw new AppError("Item not found", 404);
  return item;
}
export const getItemByBarcode = handler("Item by barcode", (req) => itemByBarcode(String(req.params.barcode)));
export const getSingleItem = handler("Single item", (req) => itemByBarcode(String(req.params.id)));

export const getStockMovements = handler("Stock movements", (req) => sqlStockMovements(req.query as never));
export const getStockAgingReport = handler("Stock aging", (req) => sqlAgingReport(tenantOf(req)));
export const getItemStockHistory = handler("Item stock history", (req) => sqlItemHistory(String(req.params.id), tenantOf(req)));
export const getStockAgeBuckets = handler("Stock age buckets", (req) =>
  sqlStockAgeBuckets(tenantOf(req), {
    bucket: str(req, "bucket"), month: str(req, "month"), sort: str(req, "sort"), dir: str(req, "dir"),
    search: str(req, "search"), page: str(req, "page"), limit: str(req, "limit"), refresh: str(req, "refresh"),
    from: str(req, "from"), to: str(req, "to"),
  }));

export const getStockStatusReport = handler("Stock status report", (req) => sqlStockStatusReport(tenantOf(req), stockReportQuery(req)));
export const getLowStockReport = handler("Low stock report", (req) => sqlLowStockReport(tenantOf(req), stockReportQuery(req)));
export const getDeadStockReport = handler("Dead stock report", (req) => sqlDeadStockReport(tenantOf(req), stockReportQuery(req)));
export const getStockFilterOptions = handler("Stock filter options", (req) => sqlStockFilterOptions(tenantOf(req)));
export const getStockByCity = handler("Stock by city", async (req) => (await sqlCityWiseStock(tenantOf(req), stockReportQuery(req))) ?? []);
export const getStockByRack = handler("Stock by rack", (req) => sqlRackWiseStock(tenantOf(req), stockReportQuery(req)));

export const getStockAnalysis = handler("Stock analysis", (req) => sqlStockAnalysis(Object.fromEntries(Object.entries(req.query).filter(([, v]) => typeof v === "string")) as StockAnalysisQuery));
