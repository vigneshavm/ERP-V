/**
 * Supplier payments (erp.payment_out). Single-shop: no tenantId. supplier_name/bank_name snapshotted
 * at write time. This adapter is SQL-only; supplier and bank identifiers are stored as supplied
 * because this table has no proven relation to the legacy Textilesoft master keys.
 */
import { query } from "./erpDb.js";

export interface PaymentAllocation {
  billId: string;
  amount: number;
  discount?: number;
}

export type PaymentOutMode = "Cash" | "Cheque" | "UPI" | "Bank Transfer" | "Discount Received";
export type PaymentOutStatus = "pending" | "cleared" | "bounced" | "cancelled";

export interface PaymentOutEntry {
  _id: string;
  id: string;
  paymentNo: string;
  supplierId: { _id: string; businessName: string };
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNo?: string;
  bankAccountId?: { _id: string; bankName: string; accountNumber?: string } | null;
  chequeDate?: Date;
  status: PaymentOutStatus;
  allocations: PaymentAllocation[];
  unallocatedAmount: number;
  notes?: string;
  createdBy?: { _id: string; name: string } | null;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): PaymentOutEntry {
  let allocations: PaymentAllocation[] = [];
  try {
    allocations = JSON.parse(String(row.allocations ?? "[]"));
  } catch {
    allocations = [];
  }
  return {
    _id: String(row.id),
    id: String(row.id),
    paymentNo: String(row.payment_no),
    supplierId: { _id: String(row.supplier_id), businessName: String(row.supplier_name ?? "") },
    paymentDate: row.payment_date ? new Date(String(row.payment_date)) : new Date(),
    amount: Number(row.amount),
    paymentMode: row.payment_mode as PaymentOutMode,
    referenceNo: row.reference_no == null ? undefined : String(row.reference_no),
    bankAccountId:
      row.bank_account_id == null
        ? null
        : {
            _id: String(row.bank_account_id),
            bankName: String(row.bank_name ?? ""),
            accountNumber: row.bank_account_number == null ? undefined : String(row.bank_account_number),
          },
    chequeDate: row.cheque_date ? new Date(String(row.cheque_date)) : undefined,
    status: row.status as PaymentOutStatus,
    allocations,
    unallocatedAmount: Number(row.unallocated_amount ?? 0),
    notes: row.notes == null ? undefined : String(row.notes),
    createdBy: row.created_by == null ? null : { _id: String(row.created_by), name: String(row.created_by_name ?? "") },
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function createPaymentOut(data: {
  paymentNo: string;
  supplierId: string;
  paymentDate?: Date;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNo?: string;
  bankAccountId?: string;
  chequeDate?: Date;
  status?: PaymentOutStatus;
  allocations?: PaymentAllocation[];
  unallocatedAmount?: number;
  notes?: string;
  createdBy?: string;
}): Promise<PaymentOutEntry> {
  const rows = await query(
    `INSERT INTO erp.payment_out
       (payment_no, supplier_id, supplier_name, payment_date, amount, payment_mode, reference_no,
        bank_account_id, bank_name, bank_account_number, cheque_date, status, allocations,
        unallocated_amount, notes, created_by, created_by_name)
     OUTPUT INSERTED.*
     VALUES (@paymentNo, @supplierId, @supplierName, @paymentDate, @amount, @paymentMode, @referenceNo,
             @bankAccountId, @bankName, @bankAccountNumber, @chequeDate, @status, @allocations,
             @unallocatedAmount, @notes, @createdBy, @createdByName)`,
    {
      paymentNo: data.paymentNo,
      supplierId: data.supplierId,
      supplierName: data.supplierId,
      paymentDate: data.paymentDate ?? new Date(),
      amount: data.amount,
      paymentMode: data.paymentMode,
      referenceNo: data.referenceNo ?? null,
      bankAccountId: data.bankAccountId ?? null,
      bankName: null,
      bankAccountNumber: null,
      chequeDate: data.chequeDate ?? null,
      status: data.status ?? "cleared",
      allocations: JSON.stringify(data.allocations ?? []),
      unallocatedAmount: data.unallocatedAmount ?? 0,
      notes: data.notes ?? null,
      createdBy: data.createdBy ?? null,
      createdByName: null,
    },
  );
  return toEntry(rows[0]);
}

export async function findPaymentOutById(id: string): Promise<PaymentOutEntry | null> {
  const rows = await query("SELECT * FROM erp.payment_out WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function findPaymentOutByPaymentNo(paymentNo: string): Promise<PaymentOutEntry | null> {
  const rows = await query("SELECT * FROM erp.payment_out WHERE payment_no = @paymentNo", { paymentNo });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function listPaymentOuts(): Promise<PaymentOutEntry[]> {
  const rows = await query("SELECT * FROM erp.payment_out ORDER BY created_at DESC");
  return rows.map(toEntry);
}

export async function listPaymentOutsBySupplier(supplierId: string): Promise<PaymentOutEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.payment_out WHERE supplier_id = @supplierId ORDER BY created_at DESC",
    { supplierId },
  );
  return rows.map(toEntry);
}

export async function listPaymentOutsByStatus(status: string): Promise<PaymentOutEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.payment_out WHERE status = @status ORDER BY created_at DESC",
    { status },
  );
  return rows.map(toEntry);
}

/** Batch read across many suppliers at once -- for cross-supplier analytics/dashboards (replaces a Mongo $lookup). */
export async function listPaymentOutsBySuppliers(
  supplierIds: string[],
  statusIn: PaymentOutStatus[],
  range?: { before?: Date; from?: Date; to?: Date },
): Promise<PaymentOutEntry[]> {
  if (!supplierIds.length) return [];
  const params: Record<string, unknown> = {};
  const supplierPlaceholders = supplierIds.map((id, i) => {
    params[`sup${i}`] = id;
    return `@sup${i}`;
  });
  const statusPlaceholders = statusIn.map((s, i) => {
    params[`s${i}`] = s;
    return `@s${i}`;
  });
  const conditions = [`supplier_id IN (${supplierPlaceholders.join(", ")})`, `status IN (${statusPlaceholders.join(", ")})`];
  if (range?.before) {
    conditions.push("payment_date < @before");
    params.before = range.before;
  }
  if (range?.from) {
    conditions.push("payment_date >= @from");
    params.from = range.from;
  }
  if (range?.to) {
    conditions.push("payment_date <= @to");
    params.to = range.to;
  }
  const rows = await query(
    `SELECT * FROM erp.payment_out WHERE ${conditions.join(" AND ")} ORDER BY payment_date`,
    params,
  );
  return rows.map(toEntry);
}

export async function findLatestPaymentOut(): Promise<PaymentOutEntry | null> {
  const rows = await query("SELECT TOP 1 * FROM erp.payment_out ORDER BY created_at DESC");
  return rows.length ? toEntry(rows[0]) : null;
}

export async function updatePaymentOut(
  id: string,
  data: Partial<{ status: PaymentOutStatus }>,
): Promise<PaymentOutEntry | null> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(id) };
  if (data.status !== undefined) {
    sets.push("status = @status");
    params.status = data.status;
  }
  if (!sets.length) return findPaymentOutById(id);
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.payment_out SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function deletePaymentOut(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.payment_out OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}

/** Total of cleared/pending payments for a supplier, optionally bounded by date -- supplier ledger/ageing math. */
export async function sumPaymentOuts(
  supplierId: string,
  statusIn: PaymentOutStatus[],
  range?: { before?: Date; from?: Date; to?: Date },
): Promise<number> {
  const params: Record<string, unknown> = { supplierId };
  const statusPlaceholders = statusIn.map((s, i) => {
    params[`s${i}`] = s;
    return `@s${i}`;
  });
  const conditions = ["supplier_id = @supplierId", `status IN (${statusPlaceholders.join(", ")})`];
  if (range?.before) {
    conditions.push("payment_date < @before");
    params.before = range.before;
  }
  if (range?.from) {
    conditions.push("payment_date >= @from");
    params.from = range.from;
  }
  if (range?.to) {
    conditions.push("payment_date <= @to");
    params.to = range.to;
  }
  const rows = await query(
    `SELECT SUM(amount) AS total FROM erp.payment_out WHERE ${conditions.join(" AND ")}`,
    params,
  );
  return Number(rows[0]?.total ?? 0);
}

export async function listPaymentOutsInRange(
  supplierId: string,
  statusIn: PaymentOutStatus[],
  from: Date,
  to: Date,
): Promise<PaymentOutEntry[]> {
  const params: Record<string, unknown> = { supplierId, from, to };
  const statusPlaceholders = statusIn.map((s, i) => {
    params[`s${i}`] = s;
    return `@s${i}`;
  });
  const rows = await query(
    `SELECT * FROM erp.payment_out
     WHERE supplier_id = @supplierId AND status IN (${statusPlaceholders.join(", ")})
       AND payment_date >= @from AND payment_date <= @to
     ORDER BY payment_date`,
    params,
  );
  return rows.map(toEntry);
}

/** All payments (any supplier) in a date range (to exclusive), excluding given statuses -- for cash-flow reports. */
export async function listPaymentOutsInDateRangeExcluding(
  excludeStatuses: PaymentOutStatus[],
  from: Date,
  to: Date,
): Promise<PaymentOutEntry[]> {
  const params: Record<string, unknown> = { from, to };
  const statusPlaceholders = excludeStatuses.map((s, i) => {
    params[`s${i}`] = s;
    return `@s${i}`;
  });
  const rows = await query(
    `SELECT * FROM erp.payment_out
     WHERE status NOT IN (${statusPlaceholders.join(", ")})
       AND payment_date >= @from AND payment_date < @to
     ORDER BY payment_date`,
    params,
  );
  return rows.map(toEntry);
}

/** Sum of allocation amounts against each bill id, across all non-excluded payments -- for cash-flow reports. */
export async function sumPaymentOutAllocationsByBill(
  billIds: string[],
  excludeStatuses: PaymentOutStatus[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!billIds.length) return result;
  const params: Record<string, unknown> = {};
  const statusPlaceholders = excludeStatuses.map((s, i) => {
    params[`s${i}`] = s;
    return `@s${i}`;
  });
  const rows = await query(
    `SELECT allocations FROM erp.payment_out WHERE status NOT IN (${statusPlaceholders.join(", ")})`,
    params,
  );
  const billIdSet = new Set(billIds);
  for (const row of rows) {
    let allocations: PaymentAllocation[] = [];
    try {
      allocations = JSON.parse(String(row.allocations ?? "[]"));
    } catch {
      continue;
    }
    for (const a of allocations) {
      if (!billIdSet.has(a.billId)) continue;
      result.set(a.billId, (result.get(a.billId) ?? 0) + (a.amount || 0));
    }
  }
  return result;
}
