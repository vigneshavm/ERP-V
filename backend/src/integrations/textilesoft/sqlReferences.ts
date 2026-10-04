/**
 * Where Textilesoft uses a master's NAME. Textilesoft has no foreign keys: companies, warehouses, counters,
 * floors and racks are copied by name into transaction, settings and user rows. Renaming or deleting a
 * master that any of those rows still name would orphan them, so the ERP refuses while references exist.
 *
 * The tables are found from the database's own schema (INFORMATION_SCHEMA), not a hand-written list:
 * a shop database has 100+ tables naming counters and companies, and which ones exist varies by the
 * modules the shop has (Gift, Grocery, Wholesale ...). Checked against SSS_copy, Sep 2026.
 */
import { sqlRead, txt, type Row, type SqlTx } from "./sqlWrite.js";

export type RefKind =
  | "company"
  | "warehouse"
  | "counter"
  | "floor"
  | "rack"
  // product attributes and classification (04_product_attributes.md)
  | "brand"
  | "pattern"
  | "size"
  | "color"
  | "style"
  | "design"
  | "model"
  | "fashion"
  | "unit"
  | "group"
  | "subgroup"
  | "gstgroup"
  // purchase barcodes (a GRN's items): sales, returns, transfers, damage, labels ...
  | "barcode";

/** Column names (any case) that hold the name of each master. */
export const REF_COLUMNS: Record<RefKind, string[]> = {
  company: ["cmy_name", "cmnyname", "companyname"],
  warehouse: ["warehouse"],
  // Bill lines record the counter as systemname (salsntry, sales2 ...).
  counter: ["counter_name", "countername", "systemname"],
  floor: ["floor_name"],
  rack: ["rackno", "rackname"],
  brand: ["brand"],
  pattern: ["patrn", "pattern"],
  size: ["size"],
  color: ["color", "colour"],
  style: ["style"],
  design: ["design"],
  model: ["model"],
  fashion: ["fashion", "fashionname"],
  unit: ["unit_de", "unit_details"],
  group: ["group_name"],
  subgroup: ["sub_group_name"],
  // purentrydetails.pro_group_name holds the GST group (sqlPurchase.ts writes gst_group there).
  gstgroup: ["gst_group", "pro_group_name"],
  barcode: ["barcode", "orgbar"],
};

/**
 * Tables that never hold real data: Textilesoft's report/print scratch tables (TMP_*, *Temp) and
 * leftover test tables. Anything not matched here counts as a reference (when in doubt, refuse).
 */
const SCRATCH = /^tmp|temp$/i;
const SCRATCH_TABLES = new Set(
  [
    "sam",
    "sam3",
    "sam4",
    "samfour",
    "samthree",
    "psam3",
    "psam3_samebarcode",
    "dummy",
    "sri",
    "testingsales",
  ].map((t) => t.toLowerCase()),
);

/** Tables where the column means something else for that kind. */
const NOT_A_REFERENCE: Record<RefKind, string[]> = {
  // CompanyName there is the SUPPLIER's firm name, not the shop's company.
  company: ["supplierdetail", "giftsupplierdetail", "supplidetailsnss"],
  warehouse: [],
  // The counter master itself.
  counter: ["countername"],
  floor: ["foolerdetail"],
  rack: ["rackno"],
  brand: ["brand"],
  pattern: ["pattern"],
  // PrintSizeCompany.Size is a print/label size, not a garment size.
  size: ["size", "printsizecompany"],
  color: ["color"],
  style: ["style"],
  design: ["design"],
  model: ["modelno"],
  fashion: ["fashionname"],
  unit: ["prounit"],
  // group_name there is a cash / expense / courier / transaction account group, not a product group.
  group: ["progroup", "cashnameentry", "courierdetail", "expensename", "transactionname"],
  subgroup: ["prosubgroup"],
  gstgroup: ["gstgroup"],
  // The GRN's own rows (deleted with it), and settings tables where "barcode" is an option, not a barcode.
  barcode: ["purentrydetails", "stockdetails", "grndetail", "bill_option"],
};

export interface RefColumn {
  table: string;
  column: string;
}

/** Filters INFORMATION_SCHEMA rows (TABLE_NAME, COLUMN_NAME) down to the columns that reference `kind`. */
export function referenceColumns(schema: Row[], kind: RefKind): RefColumn[] {
  const cols = new Set(REF_COLUMNS[kind]);
  const skip = new Set(NOT_A_REFERENCE[kind]);
  return schema
    .map((r) => ({ table: txt(r.TABLE_NAME), column: txt(r.COLUMN_NAME) }))
    .filter(
      ({ table, column }) =>
        table &&
        cols.has(column.toLowerCase()) &&
        !SCRATCH.test(table) &&
        !SCRATCH_TABLES.has(table.toLowerCase()) &&
        !skip.has(table.toLowerCase()),
    )
    .sort((a, b) => a.table.localeCompare(b.table) || a.column.localeCompare(b.column));
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SCHEMA_TTL_MS = 3_600_000;
let schemaCache: { rows: Row[]; at: number } | null = null;

async function schemaRows(): Promise<Row[]> {
  if (schemaCache && Date.now() - schemaCache.at < SCHEMA_TTL_MS)
    return schemaCache.rows;
  const all = [...new Set(Object.values(REF_COLUMNS).flat())]
    .map((c) => `'${c}'`)
    .join(", ");
  // Text columns of real tables only: a numeric column compared with a name would fail to convert,
  // and text/ntext can't be compared with "=".
  const rows = await sqlRead(
    `SELECT c.TABLE_NAME, c.COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS c
       JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
      WHERE c.TABLE_SCHEMA = 'dbo' AND t.TABLE_TYPE = 'BASE TABLE'
        AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
        AND LOWER(c.COLUMN_NAME) IN (${all})`,
  );
  schemaCache = { rows, at: Date.now() };
  return rows;
}

/**
 * Tables with at least one row naming `value` for `kind`, e.g. ["newuser", "salbill"]. One round trip.
 * Comparison follows the database collation (case-insensitive) and ignores surrounding spaces.
 */
export async function findReferences(
  tx: SqlTx,
  kind: RefKind,
  value: string,
): Promise<string[]> {
  const v = txt(value);
  if (!v) return [];
  return tablesContaining(tx, referenceColumns(await schemaRows(), kind), v);
}

let listedCache: { key: string; rows: Row[]; at: number }[] = [];

/**
 * Like findReferences, for a hand-picked list of table.column pairs -- used where the column name alone
 * can't tell (e.g. "code" is a product code in salbill but a supplier code in supplierdetail).
 * Pairs that don't exist in this shop's database (module not installed) or aren't text are skipped.
 */
export async function findReferencesIn(
  tx: SqlTx,
  candidates: RefColumn[],
  value: string,
): Promise<string[]> {
  const v = txt(value);
  if (!v || !candidates.length) return [];
  const safe = candidates.filter((c) => IDENT.test(c.table) && IDENT.test(c.column));
  const key = safe.map((c) => `${c.table}.${c.column}`).join(",").toLowerCase();
  let hit = listedCache.find((c) => c.key === key && Date.now() - c.at < SCHEMA_TTL_MS);
  if (!hit) {
    const tables = [...new Set(safe.map((c) => `'${c.table}'`))].join(", ");
    const rows = await sqlRead(
      `SELECT c.TABLE_NAME, c.COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS c
         JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
        WHERE c.TABLE_SCHEMA = 'dbo' AND t.TABLE_TYPE = 'BASE TABLE'
          AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
          AND c.TABLE_NAME IN (${tables})`,
    );
    hit = { key, rows, at: Date.now() };
    listedCache = [...listedCache.filter((c) => c.key !== key), hit];
  }
  const present = new Set(
    hit.rows.map((r) => `${txt(r.TABLE_NAME)}.${txt(r.COLUMN_NAME)}`.toLowerCase()),
  );
  return tablesContaining(
    tx,
    safe.filter((c) => present.has(`${c.table}.${c.column}`.toLowerCase())),
    v,
  );
}

async function tablesContaining(
  tx: SqlTx,
  columns: RefColumn[],
  v: string,
): Promise<string[]> {
  const cols = columns.filter((c) => IDENT.test(c.table) && IDENT.test(c.column));
  if (!cols.length) return [];
  const rows = await tx.query(
    cols
      .map(
        (c) =>
          `SELECT '${c.table}' AS t WHERE EXISTS (SELECT 1 FROM dbo.[${c.table}] WHERE LTRIM(RTRIM([${c.column}])) = @v)`,
      )
      .join("\nUNION\n"),
    { v },
  );
  return [...new Set(rows.map((r) => txt(r.t)))].sort((a, b) => a.localeCompare(b));
}

/**
 * Tables holding any barcode of a purchase (GRN): bills, returns, transfers, damage/missing stock,
 * printed labels ... One round trip. Numeric barcode columns are not checked (text columns only).
 */
export async function findGrnBarcodeReferences(
  tx: SqlTx,
  grnNo: string,
): Promise<string[]> {
  const g = txt(grnNo);
  if (!g) return [];
  const cols = referenceColumns(await schemaRows(), "barcode").filter(
    (c) => IDENT.test(c.table) && IDENT.test(c.column),
  );
  if (!cols.length) return [];
  const rows = await tx.query(
    cols
      .map(
        (c) =>
          `SELECT '${c.table}' AS t WHERE EXISTS (SELECT 1 FROM dbo.[${c.table}] x JOIN dbo.[purentrydetails] d ON x.[${c.column}] = d.barcode WHERE d.grn_no = @g AND NULLIF(LTRIM(RTRIM(d.barcode)), '') IS NOT NULL)`,
      )
      .join("\nUNION\n"),
    { g },
  );
  return [...new Set(rows.map((r) => txt(r.t)))].sort((a, b) => a.localeCompare(b));
}

/** "newuser (user accounts), salbill, salsntry and 4 more" -- for 409 messages. */
export function describeReferences(tables: string[], max = 4): string {
  const label = (t: string) =>
    t.toLowerCase() === "newuser" ? "newuser (user accounts)" : t;
  const shown = tables.slice(0, max).map(label);
  const rest = tables.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} and ${rest} more` : shown.join(", ");
}

/** For tests. */
export function clearReferenceSchemaCache(): void {
  schemaCache = null;
  listedCache = [];
}
