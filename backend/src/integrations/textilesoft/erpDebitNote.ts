/**
 * Manual debit notes (erp.debit_note) -- price/quality/shortage/other adjustments against a supplier.
 * Single-shop: no tenantId. vendorName is captured directly at creation (same as the old Mongo
 * schema); no populate() needed. Purchase-return-raised notes are created by PurchaseReturnService
 * (deferred, still Mongo) via this same repository -- see DebitNoteRepository.ts.
 */
import { query, tx } from "./erpDb.js";

export type DebitNoteReason = "RETURN" | "PRICE_DIFF" | "QUALITY" | "SHORTAGE" | "OTHER";
export type DebitNoteStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface DebitNoteItem {
  itemId?: string;
  name: string;
  qty: number;
  amount: number;
}

export interface DebitNoteEntry {
  _id: string;
  id: string;
  noteId: string;
  debitNoteNumber?: string;
  sourceId?: string;
  date: Date;
  vendorId: string;
  vendorName: string;
  poReference?: string;
  reason: DebitNoteReason;
  items: DebitNoteItem[];
  totalAmount: number;
  status: DebitNoteStatus;
  branchId: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): DebitNoteEntry {
  let items: DebitNoteItem[] = [];
  try {
    items = JSON.parse(String(row.items ?? "[]"));
  } catch {
    items = [];
  }
  return {
    _id: String(row.id),
    id: String(row.id),
    noteId: String(row.note_id),
    debitNoteNumber: row.debit_note_number == null ? undefined : String(row.debit_note_number),
    sourceId: row.source_id == null ? undefined : String(row.source_id),
    date: row.note_date ? new Date(String(row.note_date)) : new Date(),
    vendorId: String(row.vendor_id),
    vendorName: String(row.vendor_name),
    poReference: row.po_reference == null ? undefined : String(row.po_reference),
    reason: row.reason as DebitNoteReason,
    items,
    totalAmount: Number(row.total_amount),
    status: row.status as DebitNoteStatus,
    branchId: String(row.branch_id ?? "Main"),
    notes: row.notes == null ? undefined : String(row.notes),
    createdBy: row.created_by == null ? undefined : String(row.created_by),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function createDebitNote(data: {
  noteId: string;
  date?: Date;
  vendorId: string;
  vendorName: string;
  reason: DebitNoteReason;
  items: DebitNoteItem[];
  totalAmount: number;
  status?: DebitNoteStatus;
  poReference?: string;
  branchId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<DebitNoteEntry> {
  const rows = await query(
    `INSERT INTO erp.debit_note
       (note_id, note_date, vendor_id, vendor_name, po_reference, reason, items, total_amount, status, branch_id, notes, created_by)
     OUTPUT INSERTED.*
     VALUES (@noteId, @date, @vendorId, @vendorName, @poReference, @reason, @items, @totalAmount, @status, @branchId, @notes, @createdBy)`,
    {
      noteId: data.noteId,
      date: data.date ?? new Date(),
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      poReference: data.poReference ?? null,
      reason: data.reason,
      items: JSON.stringify(data.items),
      totalAmount: data.totalAmount,
      status: data.status ?? "PENDING",
      branchId: data.branchId || "Main",
      notes: data.notes ?? null,
      createdBy: data.createdBy ?? null,
    },
  );
  return toEntry(rows[0]);
}

export async function findDebitNoteById(id: string): Promise<DebitNoteEntry | null> {
  const rows = await query("SELECT * FROM erp.debit_note WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function findDebitNoteByNoteId(noteId: string): Promise<DebitNoteEntry | null> {
  const rows = await query("SELECT * FROM erp.debit_note WHERE note_id = @noteId", { noteId });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function listDebitNotes(): Promise<DebitNoteEntry[]> {
  const rows = await query("SELECT * FROM erp.debit_note ORDER BY created_at DESC");
  return rows.map(toEntry);
}

export async function listDebitNotesByStatus(status: DebitNoteStatus): Promise<DebitNoteEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.debit_note WHERE status = @status ORDER BY created_at DESC",
    { status },
  );
  return rows.map(toEntry);
}

/** Atomic conditional status change; null if the note's status changed meanwhile (e.g. a double-clicked Approve). */
export async function transitionDebitNoteStatus(
  id: string,
  from: DebitNoteStatus[],
  to: DebitNoteStatus,
): Promise<DebitNoteEntry | null> {
  return tx("debit note status transition", async (t) => {
    const placeholders = from.map((_, i) => `@from${i}`).join(", ");
    const params: Record<string, unknown> = { id: Number(id), to };
    from.forEach((s, i) => (params[`from${i}`] = s));
    const rows = await t.query(
      `UPDATE erp.debit_note SET status = @to, updated_at = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE id = @id AND status IN (${placeholders})`,
      params,
    );
    return rows.length ? toEntry(rows[0]) : null;
  });
}

/** Cancels a debit note (REJECTED no longer counts in the supplier ledger), recording why. */
export async function cancelDebitNote(id: string, reason: string): Promise<DebitNoteEntry | null> {
  const existing = await findDebitNoteById(id);
  if (!existing) return null;
  const notes = [existing.notes, reason].filter(Boolean).join(" | ");
  const rows = await query(
    `UPDATE erp.debit_note SET status = 'REJECTED', notes = @notes, updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.* WHERE id = @id`,
    { id: Number(id), notes },
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function deleteDebitNote(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.debit_note OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}

/** Next `DN-000001`-style number: highest existing number + 1 (a count would re-issue a deleted one). */
export async function nextDebitNoteId(): Promise<string> {
  const rows = await query(
    "SELECT TOP 1 note_id FROM erp.debit_note WHERE note_id LIKE 'DN-%' ORDER BY note_id DESC",
  );
  const latest = rows[0]?.note_id as string | undefined;
  const next = latest ? parseInt(latest.slice(3), 10) + 1 : 1;
  return `DN-${String(next).padStart(6, "0")}`;
}

/** Total of APPROVED notes for a vendor, optionally bounded by date -- for supplier ledger/ageing math. */
export async function sumApprovedDebitNotes(
  vendorId: string,
  range?: { before?: Date; from?: Date; to?: Date },
): Promise<number> {
  const conditions = ["vendor_id = @vendorId", "status = 'APPROVED'"];
  const params: Record<string, unknown> = { vendorId };
  if (range?.before) {
    conditions.push("note_date < @before");
    params.before = range.before;
  }
  if (range?.from) {
    conditions.push("note_date >= @from");
    params.from = range.from;
  }
  if (range?.to) {
    conditions.push("note_date <= @to");
    params.to = range.to;
  }
  const rows = await query(
    `SELECT SUM(total_amount) AS total FROM erp.debit_note WHERE ${conditions.join(" AND ")}`,
    params,
  );
  return Number(rows[0]?.total ?? 0);
}

export async function listApprovedDebitNotesInRange(
  vendorId: string,
  from: Date,
  to: Date,
): Promise<DebitNoteEntry[]> {
  const rows = await query(
    `SELECT * FROM erp.debit_note
     WHERE vendor_id = @vendorId AND status = 'APPROVED' AND note_date >= @from AND note_date <= @to
     ORDER BY note_date`,
    { vendorId, from, to },
  );
  return rows.map(toEntry);
}

export async function listApprovedDebitNotesByVendors(vendorIds: string[]): Promise<DebitNoteEntry[]> {
  if (!vendorIds.length) return [];
  const params: Record<string, unknown> = {};
  const placeholders = vendorIds.map((id, i) => {
    params[`v${i}`] = id;
    return `@v${i}`;
  });
  const rows = await query(
    `SELECT * FROM erp.debit_note WHERE status = 'APPROVED' AND vendor_id IN (${placeholders.join(", ")})`,
    params,
  );
  return rows.map(toEntry);
}

/** Batch read across many vendors, optionally bounded by date -- for cross-supplier analytics/dashboards. */
export async function listApprovedDebitNotesByVendorsInRange(
  vendorIds: string[],
  range?: { before?: Date; from?: Date; to?: Date },
): Promise<DebitNoteEntry[]> {
  if (!vendorIds.length) return [];
  const params: Record<string, unknown> = {};
  const placeholders = vendorIds.map((id, i) => {
    params[`v${i}`] = id;
    return `@v${i}`;
  });
  const conditions = [`vendor_id IN (${placeholders.join(", ")})`, "status = 'APPROVED'"];
  if (range?.before) {
    conditions.push("note_date < @before");
    params.before = range.before;
  }
  if (range?.from) {
    conditions.push("note_date >= @from");
    params.from = range.from;
  }
  if (range?.to) {
    conditions.push("note_date <= @to");
    params.to = range.to;
  }
  const rows = await query(`SELECT * FROM erp.debit_note WHERE ${conditions.join(" AND ")}`, params);
  return rows.map(toEntry);
}
