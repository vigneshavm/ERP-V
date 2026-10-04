/**
 * Lightweight sale/due/payment/purchase/refund/return ledger (erp.transaction). Single-shop: no
 * tenantId. `invoice` fields are snapshotted from MongoDB's Invoice at write time (Invoice itself
 * stays MongoDB this wave) so reads never need a cross-database join -- see
 * LEGACYTOMODERN_SQL_ONLY_STRATEGY.md section 6.1 point 6. The returned shape nests `invoice` back
 * into a sub-object so existing `.populate('invoice', 'invoiceNo totalAmount paymentStatus')`
 * consumers don't need to change how they read the field.
 */
import { query } from "./erpDb.js";

export type TransactionType =
  | "sale"
  | "due"
  | "payment"
  | "purchase"
  | "refund"
  | "return"
  | "due_adjustment";

export interface TransactionEntry {
  _id: string;
  id: string;
  type: TransactionType;
  customer: string | null;
  invoice: { _id: string; invoiceNo: string; totalAmount: number; paymentStatus?: string } | null;
  return: string | null;
  dueAdjustment: string | null;
  amount: number;
  paymentMethod: string;
  description?: string;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): TransactionEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    type: row.txn_type as TransactionType,
    customer: row.customer_id == null ? null : String(row.customer_id),
    invoice:
      row.invoice_id == null
        ? null
        : {
            _id: String(row.invoice_id),
            invoiceNo: String(row.invoice_no ?? ""),
            totalAmount: Number(row.invoice_total_amount ?? 0),
            paymentStatus: row.invoice_payment_status == null ? undefined : String(row.invoice_payment_status),
          },
    return: row.return_id == null ? null : String(row.return_id),
    dueAdjustment: row.due_adjustment_id == null ? null : String(row.due_adjustment_id),
    amount: Number(row.amount),
    paymentMethod: String(row.payment_method ?? "cash"),
    description: row.description == null ? undefined : String(row.description),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

/** Best-effort snapshot of an Invoice's display fields; Invoice may not exist for SQL-written POS bills. */
async function snapshotInvoice(
  invoiceId?: string | null,
): Promise<{ invoiceNo: string | null; totalAmount: number | null; paymentStatus: string | null }> {
  if (!invoiceId) return { invoiceNo: null, totalAmount: null, paymentStatus: null };
  try {
    const { default: Invoice } = await import("../../modules/sales/models/Invoice.js");
    const inv = await Invoice.findById(invoiceId).select("invoiceNo totalAmount paymentStatus").lean();
    if (!inv) return { invoiceNo: null, totalAmount: null, paymentStatus: null };
    return {
      invoiceNo: (inv as { invoiceNo?: string }).invoiceNo ?? null,
      totalAmount: (inv as { totalAmount?: number }).totalAmount ?? null,
      paymentStatus: (inv as { paymentStatus?: string }).paymentStatus ?? null,
    };
  } catch {
    return { invoiceNo: null, totalAmount: null, paymentStatus: null };
  }
}

export async function createTransaction(data: {
  type: TransactionType;
  customer?: string;
  invoice?: string;
  return?: string;
  dueAdjustment?: string;
  amount: number;
  paymentMethod?: string;
  description?: string;
}): Promise<TransactionEntry> {
  const snap = await snapshotInvoice(data.invoice);
  const rows = await query(
    `INSERT INTO erp.[transaction]
       (txn_type, customer_id, invoice_id, invoice_no, invoice_total_amount, invoice_payment_status,
        return_id, due_adjustment_id, amount, payment_method, description)
     OUTPUT INSERTED.*
     VALUES (@type, @customer, @invoice, @invoiceNo, @invoiceTotal, @invoiceStatus,
             @returnId, @dueAdjustment, @amount, @paymentMethod, @description)`,
    {
      type: data.type,
      customer: data.customer ?? null,
      invoice: data.invoice ?? null,
      invoiceNo: snap.invoiceNo,
      invoiceTotal: snap.totalAmount,
      invoiceStatus: snap.paymentStatus,
      returnId: data.return ?? null,
      dueAdjustment: data.dueAdjustment ?? null,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? "cash",
      description: data.description ?? null,
    },
  );
  return toEntry(rows[0]);
}

export async function listTransactionsByCustomer(customerId: string): Promise<TransactionEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.[transaction] WHERE customer_id = @customerId ORDER BY created_at DESC",
    { customerId },
  );
  return rows.map(toEntry);
}

/** Batch read across many customers at once -- for customer-list/detail purchase-summary dashboards (replaces a Mongo $lookup). */
export async function listTransactionsByCustomers(customerIds: string[]): Promise<TransactionEntry[]> {
  if (!customerIds.length) return [];
  const params: Record<string, unknown> = {};
  const placeholders = customerIds.map((id, i) => {
    params[`c${i}`] = id;
    return `@c${i}`;
  });
  const rows = await query(
    `SELECT * FROM erp.[transaction] WHERE customer_id IN (${placeholders.join(", ")}) ORDER BY created_at DESC`,
    params,
  );
  return rows.map(toEntry);
}

export async function deleteTransactionsByReturn(returnId: string): Promise<void> {
  await query("DELETE FROM erp.[transaction] WHERE return_id = @returnId", { returnId });
}
