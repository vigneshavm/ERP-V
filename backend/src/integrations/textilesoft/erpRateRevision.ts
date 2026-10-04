/**
 * Supplier rate revisions (erp.rate_revision) -- a supplier raises the price of goods already
 * received (per batch). Single-shop: no tenantId. item/supplier/created-by display fields are
 * snapshotted at write time (Item/Supplier(Mongo)/User aren't migrating this wave) so reads don't
 * need a cross-database join.
 */
import { query, tx } from "./erpDb.js";

export type RateRevisionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RateRevisionEntry {
  _id: string;
  id: string;
  itemId: { _id: string; name: string; sku?: string };
  supplierId: { _id: string; businessName: string };
  batchNumber: string;
  oldRate: number;
  newRate: number;
  affectedQty: number;
  diffAmount: number;
  reason?: string;
  status: RateRevisionStatus;
  createdBy?: { _id: string; name: string } | null;
  approvedBy?: string;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): RateRevisionEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    itemId: {
      _id: String(row.item_id),
      name: String(row.item_name ?? ""),
      sku: row.item_sku == null ? undefined : String(row.item_sku),
    },
    supplierId: { _id: String(row.supplier_id), businessName: String(row.supplier_name ?? "") },
    batchNumber: String(row.batch_number),
    oldRate: Number(row.old_rate),
    newRate: Number(row.new_rate),
    affectedQty: Number(row.affected_qty),
    diffAmount: Number(row.diff_amount),
    reason: row.reason == null ? undefined : String(row.reason),
    status: row.status as RateRevisionStatus,
    createdBy: row.created_by == null ? null : { _id: String(row.created_by), name: String(row.created_by_name ?? "") },
    approvedBy: row.approved_by == null ? undefined : String(row.approved_by),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

async function snapshotItem(itemId: string): Promise<{ name: string | null; sku: string | null }> {
  try {
    const { default: Item } = await import("../../modules/inventory/models/Item.js");
    const it = await Item.findById(itemId).select("name sku").lean();
    if (!it) return { name: null, sku: null };
    return { name: (it as { name?: string }).name ?? null, sku: (it as { sku?: string }).sku ?? null };
  } catch {
    return { name: null, sku: null };
  }
}

async function snapshotSupplier(supplierId: string): Promise<string | null> {
  try {
    const { default: Supplier } = await import("../../modules/purchase/models/Supplier.js");
    const s = await Supplier.findById(supplierId).select("businessName").lean();
    return (s as { businessName?: string } | null)?.businessName ?? null;
  } catch {
    return null;
  }
}

async function snapshotUserName(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  try {
    const { default: User } = await import("../../modules/core/models/User.js");
    const u = await User.findById(userId).select("name").lean();
    return (u as { name?: string } | null)?.name ?? null;
  } catch {
    return null;
  }
}

export async function createRateRevision(data: {
  itemId: string;
  supplierId: string;
  batchNumber: string;
  oldRate: number;
  newRate: number;
  affectedQty: number;
  diffAmount: number;
  reason?: string;
  status?: RateRevisionStatus;
  createdBy?: string;
}): Promise<RateRevisionEntry> {
  const [item, supplierName, createdByName] = await Promise.all([
    snapshotItem(data.itemId),
    snapshotSupplier(data.supplierId),
    snapshotUserName(data.createdBy),
  ]);
  const rows = await query(
    `INSERT INTO erp.rate_revision
       (item_id, item_name, item_sku, supplier_id, supplier_name, batch_number, old_rate, new_rate,
        affected_qty, diff_amount, reason, status, created_by, created_by_name)
     OUTPUT INSERTED.*
     VALUES (@itemId, @itemName, @itemSku, @supplierId, @supplierName, @batchNumber, @oldRate, @newRate,
             @affectedQty, @diffAmount, @reason, @status, @createdBy, @createdByName)`,
    {
      itemId: data.itemId,
      itemName: item.name,
      itemSku: item.sku,
      supplierId: data.supplierId,
      supplierName,
      batchNumber: data.batchNumber,
      oldRate: data.oldRate,
      newRate: data.newRate,
      affectedQty: data.affectedQty,
      diffAmount: data.diffAmount,
      reason: data.reason ?? null,
      status: data.status ?? "PENDING",
      createdBy: data.createdBy ?? null,
      createdByName,
    },
  );
  return toEntry(rows[0]);
}

export async function findRateRevisionById(id: string): Promise<RateRevisionEntry | null> {
  const rows = await query("SELECT * FROM erp.rate_revision WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function listRateRevisions(): Promise<RateRevisionEntry[]> {
  const rows = await query("SELECT * FROM erp.rate_revision ORDER BY created_at DESC");
  return rows.map(toEntry);
}

/**
 * Atomically moves a PENDING revision to APPROVED/REJECTED. Returns null if it's not PENDING any
 * more (already decided), so it can never be decided twice.
 */
export async function decideRateRevision(
  id: string,
  status: "APPROVED" | "REJECTED",
  decidedBy: string,
): Promise<RateRevisionEntry | null> {
  return tx("decide rate revision", async (t) => {
    const rows = await t.query(
      `UPDATE erp.rate_revision SET status = @status, approved_by = @decidedBy, updated_at = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE id = @id AND status = 'PENDING'`,
      { id: Number(id), status, decidedBy },
    );
    return rows.length ? toEntry(rows[0]) : null;
  });
}
