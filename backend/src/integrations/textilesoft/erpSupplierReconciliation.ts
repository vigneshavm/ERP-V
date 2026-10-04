/**
 * Supplier ledger reconciliation flags (erp.supplier_reconciliation). Single-shop: no tenantId.
 */
import { query, tx } from "./erpDb.js";

export interface SupplierReconciliationEntry {
  _id: string;
  id: string;
  supplierId: string;
  transactionType: "BILL" | "PAYMENT" | "DEBIT_NOTE";
  transactionId: string;
  reconciledAt: Date;
  status: "RECONCILED" | "DISPUTED";
  notes?: string;
  createdBy?: string;
}

function toEntry(row: Record<string, unknown>): SupplierReconciliationEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    supplierId: String(row.supplier_id),
    transactionType: row.transaction_type as SupplierReconciliationEntry["transactionType"],
    transactionId: String(row.transaction_id),
    reconciledAt: row.reconciled_at ? new Date(String(row.reconciled_at)) : new Date(),
    status: (row.status as SupplierReconciliationEntry["status"]) ?? "RECONCILED",
    notes: row.notes == null ? undefined : String(row.notes),
    createdBy: row.created_by == null ? undefined : String(row.created_by),
  };
}

export async function createSupplierReconciliation(data: {
  supplierId: string;
  transactionType: SupplierReconciliationEntry["transactionType"];
  transactionId: string;
  status?: SupplierReconciliationEntry["status"];
  notes?: string;
  createdBy?: string;
}): Promise<SupplierReconciliationEntry> {
  const rows = await query(
    `INSERT INTO erp.supplier_reconciliation (supplier_id, transaction_type, transaction_id, status, notes, created_by)
     OUTPUT INSERTED.*
     VALUES (@supplierId, @transactionType, @transactionId, @status, @notes, @createdBy)`,
    {
      supplierId: data.supplierId,
      transactionType: data.transactionType,
      transactionId: data.transactionId,
      status: data.status ?? "RECONCILED",
      notes: data.notes ?? null,
      createdBy: data.createdBy ?? null,
    },
  );
  return toEntry(rows[0]);
}

export async function findSupplierReconciliationById(id: string): Promise<SupplierReconciliationEntry | null> {
  const rows = await query("SELECT * FROM erp.supplier_reconciliation WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function findSupplierReconciliationByTransactionId(
  transactionId: string,
): Promise<SupplierReconciliationEntry | null> {
  const rows = await query(
    "SELECT * FROM erp.supplier_reconciliation WHERE transaction_id = @transactionId",
    { transactionId },
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function listSupplierReconciliationsBySupplier(
  supplierId: string,
): Promise<SupplierReconciliationEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.supplier_reconciliation WHERE supplier_id = @supplierId ORDER BY reconciled_at DESC",
    { supplierId },
  );
  return rows.map(toEntry);
}

export async function listSupplierReconciliationsByStatus(
  status: string,
): Promise<SupplierReconciliationEntry[]> {
  const rows = await query(
    "SELECT * FROM erp.supplier_reconciliation WHERE status = @status ORDER BY reconciled_at DESC",
    { status },
  );
  return rows.map(toEntry);
}

/** Upserts by transaction_id -- matches the unique constraint the old Mongo model enforced. */
export async function upsertSupplierReconciliation(
  transactionId: string,
  data: {
    supplierId: string;
    transactionType: SupplierReconciliationEntry["transactionType"];
    status?: SupplierReconciliationEntry["status"];
    notes?: string;
    createdBy?: string;
  },
): Promise<SupplierReconciliationEntry> {
  return tx("upsert supplier reconciliation", async (t) => {
    const rows = await t.query(
      `MERGE erp.supplier_reconciliation AS target
       USING (SELECT @transactionId AS transaction_id) AS src
       ON target.transaction_id = src.transaction_id
       WHEN MATCHED THEN UPDATE SET supplier_id = @supplierId, transaction_type = @transactionType,
         status = @status, notes = @notes, created_by = @createdBy, updated_at = SYSUTCDATETIME(),
         reconciled_at = SYSUTCDATETIME()
       WHEN NOT MATCHED THEN INSERT (supplier_id, transaction_type, transaction_id, status, notes, created_by)
         VALUES (@supplierId, @transactionType, @transactionId, @status, @notes, @createdBy)
       OUTPUT INSERTED.*;`,
      {
        transactionId,
        supplierId: data.supplierId,
        transactionType: data.transactionType,
        status: data.status ?? "RECONCILED",
        notes: data.notes ?? null,
        createdBy: data.createdBy ?? null,
      },
    );
    return toEntry(rows[0]);
  });
}

export async function updateSupplierReconciliation(
  id: string,
  data: Partial<{ status: SupplierReconciliationEntry["status"]; notes: string }>,
): Promise<SupplierReconciliationEntry | null> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(id) };
  if (data.status !== undefined) {
    sets.push("status = @status");
    params.status = data.status;
  }
  if (data.notes !== undefined) {
    sets.push("notes = @notes");
    params.notes = data.notes;
  }
  if (!sets.length) return findSupplierReconciliationById(id);
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.supplier_reconciliation SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function deleteSupplierReconciliation(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.supplier_reconciliation OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}
