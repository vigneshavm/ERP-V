/**
 * Legacy purchase-payment audit records (erp.purchase_payment). This model has NO active write path —
 * purchasePayment.routes.ts actually delegates to PaymentOutController (all new supplier payments go
 * through erp.payment_out instead) — so this module only exposes the read used by FinanceReportService's
 * cash-flow report. supplier_id stays a plain Mongo Supplier id (Supplier itself is deferred); supplier
 * display name is fetched live at read time since there's no write path left to denormalize it at.
 */
import { query } from "./erpDb.js";
import Supplier from "../../modules/purchase/models/Supplier.js";

export interface PurchasePaymentEntry {
  _id: string;
  id: string;
  paymentNo: string;
  paymentDate: Date;
  supplierId: string;
  paymentMethod: "cash" | "upi" | "card" | "cheque" | "bank_transfer";
  amount: number;
  notes: string;
  createdBy: string | null;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): PurchasePaymentEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    paymentNo: String(row.payment_no),
    paymentDate: row.payment_date ? new Date(String(row.payment_date)) : new Date(),
    supplierId: String(row.supplier_id),
    paymentMethod: row.payment_method as PurchasePaymentEntry["paymentMethod"],
    amount: Number(row.amount),
    notes: String(row.notes ?? ""),
    createdBy: row.created_by == null ? null : String(row.created_by),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function listPurchasePaymentsInDateRange(gte: Date, lt: Date): Promise<PurchasePaymentEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.purchase_payment WHERE payment_date >= @gte AND payment_date < @lt ORDER BY payment_date DESC",
    { gte, lt },
  );
  return rows.map(toEntry);
}

/** Batch-fetches live supplier display names for the given supplier ids (mirrors PaymentOut's populate('supplierId','name')). */
export async function liveSupplierNamesByIds(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const suppliers = await Supplier.find({ _id: { $in: ids } }).select("businessName").lean();
  for (const sup of suppliers) {
    map.set(String(sup._id), sup.businessName ?? "");
  }
  return map;
}
