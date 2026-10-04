/**
 * The ERP's generic "master data" types that Textilesoft keeps in its own tables, read and written there
 * directly (no MongoDB). Most share Textilesoft's simple-master layout:
 *   group_cd (code, MAX+1) | name_eng | name_tam | date (dd/MM/yyyy) | prin_name_eng | prin_name_tam
 * plus a few extra columns (brand: commission/discount, progroup: mode, prosubgroup: parent group).
 *
 * Textilesoft's products and purchase lines hold these values as TEXT (newproduct.unit_de,
 * purentrydetails.brand ...), so renaming or deleting a value that is already used would orphan those rows:
 * both are refused while the value is in use.
 *
 * Entry ids are "sql.<TYPE>.<code>.<name>" (base64url name) -- a few Textilesoft tables (design) repeat codes.
 */
import {
  withSqlTransaction,
  sqlRead,
  SqlWriteError,
  tsDate,
  txt,
  type Row,
  type SqlTx,
} from "./sqlWrite.js";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "./sqlOrg.js";
import {
  findReferences,
  describeReferences,
  type RefKind,
} from "./sqlReferences.js";

interface SimpleMaster {
  table: string;
  codeColumn?: string;
  /** Where Textilesoft uses the value (table.column), checked before rename/delete. */
  usedIn: [string, string][];
  /** Find every table naming the value from the schema (sqlReferences.ts); usedIn is checked as well. */
  refKind?: RefKind;
  /** meta fields that must be numbers: [label, max or null]. */
  numeric?: Record<string, [string, number | null]>;
  /** meta field -> extra column. */
  extra?: Record<string, string>;
  /** Parent link column (name of the parent master row). */
  parentColumn?: string;
  parentType?: string;
}

const SIMPLE: Record<string, SimpleMaster> = {
  EXPENSE_GROUP: {
    table: "expensegroup", codeColumn: "catagary_cd",
    usedIn: [["expensename", "group_name"]],
  },
  EXPENSE_NAME: {
    table: "expensename", codeColumn: "catagary_cd",
    usedIn: [["expenseentry", "exname"]],
    parentColumn: "group_name", parentType: "EXPENSE_GROUP",
  },
  UNIT: {
    table: "prounit",
    usedIn: [],
    refKind: "unit", // newproduct.unit_de, purchase/PO/return lines .unit_details ...
  },
  PRODUCT_GROUP: {
    table: "progroup",
    // Sub groups name their parent group; purchase lines keep the group in "silver" (sqlPurchase.ts).
    usedIn: [
      ["prosubgroup", "ProEngName"],
      ["purentrydetails", "silver"],
      ["stockdetails", "silver"],
    ],
    refKind: "group",
    extra: { mode: "ProGroupMode" },
  },
  PRODUCT_SUBGROUP: {
    table: "prosubgroup",
    usedIn: [],
    refKind: "subgroup", // newproduct, salbill, salsntry, wholesalbill ...
    parentColumn: "ProEngName",
    parentType: "PRODUCT_GROUP",
  },
  PRODUCT_FLOOR: {
    table: "foolerdetail",
    usedIn: [],
    refKind: "floor", // newproduct.floor_name + Gift/Grocery/Bakery product tables
  },
  PRODUCT_BRAND: {
    table: "brand",
    usedIn: [],
    refKind: "brand",
    extra: {
      commissionPercent: "com_per",
      commissionAmount: "amt",
      discountPercent: "discount",
      commissionType: "com_pic",
    },
    numeric: {
      commissionPercent: ["Commission %", 100],
      commissionAmount: ["Commission amount", null],
      discountPercent: ["Discount %", 100],
    },
  },
  // Attributes are free text on purchase, stock, sales, PO, return and transfer lines (not only
  // purentrydetails), so every table naming the value is checked.
  PRODUCT_PATTERN: { table: "pattern", usedIn: [], refKind: "pattern" },
  PRODUCT_SIZE: { table: "size", usedIn: [], refKind: "size" },
  PRODUCT_COLOR: { table: "color", usedIn: [], refKind: "color" },
  PRODUCT_STYLE: { table: "style", usedIn: [], refKind: "style" },
  PRODUCT_DESIGN: { table: "design", usedIn: [], refKind: "design" },
  PRODUCT_RACK: {
    table: "RackNo",
    usedIn: [],
    refKind: "rack", // purentrydetails, stockdetails, salsntry, productwiserackno ...
  },
  PRODUCT_FASHION_NAME: {
    table: "FashionName",
    usedIn: [],
    refKind: "fashion", // purchase/stock lines .fashion + productwisefashionname.fashionname
  },
  PRODUCT_MODEL_NO: {
    table: "ModelNo",
    usedIn: [],
    refKind: "model",
  },
};

/** Types served from Textilesoft SQL (the rest of the ERP's master types stay where they are). */
// SALES_COUNTER is not here: in the ERP it maps floor counters to product categories for a report (an ERP-only
// concept); Textilesoft's billing counters are served by /api/counters (sqlOrg.ts).
export const SQL_MASTER_TYPES = new Set<string>([
  ...Object.keys(SIMPLE),
  "GST_GROUP",
  "WAREHOUSE",
]);

export const isSqlMasterId = (id: string): boolean => id.startsWith("sql.");

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const makeId = (type: string, code: string, name: string) =>
  `sql.${type}.${code}.${b64(name)}`;

function parseId(id: string): { type: string; code: string; name: string } {
  const [, type, code, name] = id.split(".");
  if (
    !type ||
    code === undefined ||
    name === undefined ||
    !SQL_MASTER_TYPES.has(type)
  )
    throw new SqlWriteError("Unknown master entry.", 404);
  return { type, code, name: unb64(name) };
}

export interface SqlMasterEntry {
  _id: string;
  id: string;
  type: string;
  name: string;
  description?: string;
  parentId?: string;
  meta: Row;
  isActive: boolean;
  source: "sql";
}

// ------------------------------------------------------------------------------------------------
// GST groups (gstgroup): up to four amount slabs, each with its own rate
// ------------------------------------------------------------------------------------------------

const SLAB_SUFFIX = ["", "1", "2", "3"];

function gstEntry(r: Row): SqlMasterEntry {
  const slabs = SLAB_SUFFIX.map((s) => ({
    from: txt(r[`from_amount${s}`]),
    to: txt(r[`to_amount${s}`]),
    gst: txt(r[`gst${s}`]),
    cgst: txt(r[`cgst${s}`]),
    sgst: txt(r[`sgst${s}`]),
    igst: txt(r[`igst${s}`]),
  })).filter((x) => x.gst !== "");
  const name = txt(r.gst_name);
  return {
    _id: makeId("GST_GROUP", txt(r.gst_code), name),
    id: makeId("GST_GROUP", txt(r.gst_code), name),
    type: "GST_GROUP",
    name,
    description: slabs.map((x) => `${x.gst}% (${x.from}-${x.to})`).join(", "),
    // percentage = what the Master Data screen edits; gstRate = what pickers read.
    meta: {
      code: txt(r.gst_code),
      gstRate: Number(slabs[0]?.gst ?? 0),
      percentage: txt(slabs[0]?.gst),
      slabs,
    },
    isActive: true,
    source: "sql",
  };
}

function gstColumns(meta: Row): Row {
  const slabs: Row[] =
    Array.isArray(meta?.slabs) && meta.slabs.length
      ? meta.slabs
      : [
          {
            from: "1",
            to: "10000000",
            gst: meta?.percentage ?? meta?.gstRate ?? "",
          },
        ];
  if (slabs.length > 4)
    throw new SqlWriteError(
      "Textilesoft allows at most 4 GST slabs per group.",
      400,
    );
  const out: Row = {};
  SLAB_SUFFIX.forEach((s, i) => {
    const x = slabs[i] ?? {};
    const gst = txt(x.gst);
    if (i === 0 && (gst === "" || Number.isNaN(Number(gst))))
      throw new SqlWriteError("Enter the GST rate.", 400);
    const half = gst === "" ? "" : String(Number(gst) / 2);
    out[`from_amount${s}`] = txt(x.from);
    out[`to_amount${s}`] = txt(x.to);
    out[`gst${s}`] = gst;
    out[`cgst${s}`] = txt(x.cgst) || half;
    out[`sgst${s}`] = txt(x.sgst) || half;
    out[`igst${s}`] = txt(x.igst) || gst;
  });
  // Sales slabs mirror the purchase slabs (Textilesoft keeps them in separate columns).
  out.sales_from_amount = out.from_amount;
  out.sales_to_amount = out.to_amount;
  for (const s of ["1", "2", "3"]) {
    out[`sales_from_amount${s}`] = out[`from_amount${s}`];
    out[`sales_to_amount${s}`] = out[`to_amount${s}`];
  }
  return out;
}

// ------------------------------------------------------------------------------------------------
// Simple masters
// ------------------------------------------------------------------------------------------------

function simpleEntry(
  type: string,
  cfg: SimpleMaster,
  r: Row,
  parents: Map<string, string>,
): SqlMasterEntry {
  const name = txt(r.name_eng);
  const meta: Row = {
    code: txt(r[cfg.codeColumn ?? "group_cd"]),
    printName: txt(r.prin_name_eng),
    nameTamil: txt(r.name_tam),
    printNameTamil: txt(r.prin_name_tam),
  };
  for (const [field, col] of Object.entries(cfg.extra ?? {}))
    meta[field] = txt(r[col]);
  const parentName = cfg.parentColumn ? txt(r[cfg.parentColumn]) : "";
  return {
    _id: makeId(type, meta.code, name),
    id: makeId(type, meta.code, name),
    type,
    name,
    description:
      meta.printName && meta.printName !== name ? meta.printName : undefined,
    parentId: parentName ? parents.get(parentName.toUpperCase()) : undefined,
    meta: { ...meta, ...(parentName ? { parentName } : {}) },
    isActive: true,
    source: "sql",
  };
}

async function inUse(
  tx: SqlTx,
  cfg: SimpleMaster,
  value: string,
): Promise<string | null> {
  if (cfg.refKind) {
    const tables = await findReferences(tx, cfg.refKind, value);
    if (tables.length) return describeReferences(tables);
  }
  for (const [table, col] of cfg.usedIn) {
    const [r] = await tx.query(
      `SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.[${table}] WHERE LTRIM(RTRIM([${col}])) = @v) THEN 1 ELSE 0 END AS used`,
      { v: value },
    );
    if (Number(r?.used))
      return table === "newproduct"
        ? "products"
        : table === "prosubgroup"
          ? "sub groups"
          : table.startsWith("productwise")
            ? "product mappings"
            : "purchases";
  }
  return null;
}

// ------------------------------------------------------------------------------------------------
// Public API (same shapes as the ERP's MasterDataService)
// ------------------------------------------------------------------------------------------------

export async function listSqlMaster(
  type: string,
  parentId?: string,
): Promise<SqlMasterEntry[]> {
  if (type === "GST_GROUP") {
    return (
      await sqlRead(
        "SELECT * FROM dbo.[gstgroup] ORDER BY TRY_CAST(gst_code AS int), gst_code",
      )
    ).map(gstEntry);
  }
  if (type === "WAREHOUSE") {
    return (await listLocations("warehousedetail")).map((w) => ({
      _id: makeId(type, w.code, w.name),
      id: makeId(type, w.code, w.name),
      type,
      name: w.name,
      description: w.city || undefined,
      meta: {
        code: w.code,
        city: w.city,
        address: w.address,
        phone: w.phone || w.mobile,
      },
      isActive: true,
      source: "sql" as const,
    }));
  }
  const cfg = SIMPLE[type];
  if (!cfg) throw new SqlWriteError(`Unknown master type: ${type}`, 400);
  const rows = await sqlRead(
    `SELECT * FROM dbo.[${cfg.table}] WHERE NULLIF(LTRIM(RTRIM(name_eng)), '') IS NOT NULL ORDER BY name_eng`,
  );
  let parents = new Map<string, string>();
  if (cfg.parentType) {
    parents = new Map(
      (await listSqlMaster(cfg.parentType)).map((p) => [
        p.name.toUpperCase(),
        p.id,
      ]),
    );
  }
  // Textilesoft allows exact duplicates (e.g. design); show each value once.
  const seen = new Set<string>();
  const out: SqlMasterEntry[] = [];
  for (const r of rows) {
    const e = simpleEntry(type, cfg, r, parents);
    const key = `${e.meta.code}|${e.name.toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!parentId || e.parentId === parentId) out.push(e);
  }
  return out;
}

/** Checks and normalises cfg.numeric meta fields ("1,250.5" -> "1250.5"); empty is allowed. */
export function checkMasterNumbers(cfg: { numeric?: Record<string, [string, number | null]> }, meta: Row): Row {
  const out: Row = { ...meta };
  for (const [field, [label, max]] of Object.entries(cfg.numeric ?? {})) {
    if (meta[field] === undefined || meta[field] === null) continue;
    const raw = txt(meta[field]).replace(/,/g, "");
    if (!raw) {
      out[field] = "";
      continue;
    }
    if (!/^\d*\.?\d+$|^\d+\.$/.test(raw))
      throw new SqlWriteError(`${label} must be a number (got "${txt(meta[field])}").`, 400);
    const n = Number(raw);
    if (max !== null && n > max)
      throw new SqlWriteError(`${label} can't be more than ${max}.`, 400);
    out[field] = String(n);
  }
  return out;
}

async function parentName(
  cfg: SimpleMaster,
  parentId: unknown,
): Promise<string> {
  if (!cfg.parentType) return "";
  if (!parentId)
    throw new SqlWriteError(
      `Choose the ${cfg.parentType === "PRODUCT_GROUP" ? "product group" : "parent"} first.`,
      400,
    );
  const p = parseId(String(parentId));
  if (p.type !== cfg.parentType)
    throw new SqlWriteError("Wrong parent entry.", 400);
  return p.name;
}

function checkExpenseFields(type: string, data: Row): void {
  if (type !== "EXPENSE_GROUP" && type !== "EXPENSE_NAME") return;
  const allowed = new Set(["code", "printName", "nameTamil", "printNameTamil", "parentName"]);
  if (Object.keys(data.meta ?? {}).some(key => !allowed.has(key)) || data.isActive === false)
    throw new SqlWriteError("Expense budgets, approval policies and deactivation are unavailable in the existing expense masters.", 400);
}

async function expenseParent(tx: SqlTx, parentId: unknown): Promise<Row> {
  if (!parentId) throw new SqlWriteError("Choose the expense group first.", 400);
  const parent = parseId(String(parentId));
  if (parent.type !== "EXPENSE_GROUP") throw new SqlWriteError("Wrong expense group.", 400);
  const rows = await tx.query(
    "SELECT name_eng, name_tam FROM dbo.[expensegroup] WITH (UPDLOCK, HOLDLOCK) WHERE catagary_cd = @code AND name_eng = @name",
    { code: parent.code, name: parent.name },
  );
  if (rows.length !== 1) throw new SqlWriteError("Expense group is missing or ambiguous; no name was saved.", 409);
  return { group_name: txt(rows[0].name_eng), group_name_tam: txt(rows[0].name_tam) };
}

export async function createSqlMaster(
  type: string,
  data: Row,
): Promise<SqlMasterEntry> {
  checkExpenseFields(type, data);
  const name = txt(data?.name).toUpperCase();
  if (!name) throw new SqlWriteError("Name is required", 400);
  const meta: Row = data?.meta ?? {};
  if (type === "WAREHOUSE") {
    await createLocation("warehousedetail", {
      name,
      city: meta.city,
      address: meta.address,
      phone: meta.phone,
    });
  } else if (type === "GST_GROUP") {
    await withSqlTransaction("Saving the GST group", async (tx) => {
      if (
        (
          await tx.query(
            "SELECT 1 FROM dbo.[gstgroup] WHERE LTRIM(RTRIM(gst_name)) = @n",
            { n: name },
          )
        ).length
      )
        throw new SqlWriteError(`"${name}" already exists`, 400);
      await tx.insert("gstgroup", {
        ...gstColumns(meta),
        gst_code: String(await tx.nextNumber("gstgroup", "gst_code")),
        gst_name: name,
        date: tsDate(),
      });
    });
  } else {
    const cfg = SIMPLE[type];
    if (!cfg) throw new SqlWriteError(`Unknown master type: ${type}`, 400);
    const parent = await parentName(cfg, data?.parentId);
    const nums = checkMasterNumbers(cfg, meta);
    await withSqlTransaction("Saving the entry", async (tx) => {
      if (
        (
          await tx.query(
            `SELECT 1 FROM dbo.[${cfg.table}] WHERE LTRIM(RTRIM(name_eng)) = @n`,
            { n: name },
          )
        ).length
      )
        throw new SqlWriteError(`"${name}" already exists`, 400);
      const row: Row = {
        [cfg.codeColumn ?? "group_cd"]: String(await tx.nextNumber(cfg.table, cfg.codeColumn ?? "group_cd")),
        name_eng: name,
        name_tam: txt(meta.nameTamil),
        date: tsDate(),
        prin_name_eng: txt(meta.printName || data?.description) || name,
        prin_name_tam: txt(meta.printNameTamil),
      };
      for (const [field, col] of Object.entries(cfg.extra ?? {}))
        row[col] = txt(nums[field]);
      if (type === "EXPENSE_NAME") Object.assign(row, await expenseParent(tx, data.parentId));
      else if (cfg.parentColumn) row[cfg.parentColumn] = parent;
      await tx.insert(cfg.table, row);
    });
  }
  const created = (await listSqlMaster(type)).find(
    (e) => e.name.toUpperCase() === name,
  );
  if (!created)
    throw new SqlWriteError(
      "Saved, but the entry could not be read back.",
      503,
    );
  return created;
}

export async function updateSqlMaster(
  id: string,
  data: Row,
): Promise<SqlMasterEntry> {
  const { type, code, name: oldName } = parseId(id);
  checkExpenseFields(type, data);
  const newName =
    data?.name !== undefined ? txt(data.name).toUpperCase() : oldName;
  if (!newName) throw new SqlWriteError("Name is required", 400);
  const meta: Row = data?.meta ?? {};
  if (type === "WAREHOUSE") {
    await updateLocation("warehousedetail", code, {
      name: newName,
      ...(meta.city !== undefined ? { city: meta.city } : {}),
      ...(meta.address !== undefined ? { address: meta.address } : {}),
      ...(meta.phone !== undefined ? { phone: meta.phone } : {}),
    });
  } else if (type === "GST_GROUP") {
    await withSqlTransaction("Updating the GST group", async (tx) => {
      if (newName !== oldName) {
        const used = await findReferences(tx, "gstgroup", oldName);
        if (used.length)
          throw new SqlWriteError(
            `"${oldName}" is used in ${describeReferences(used)} and can't be renamed.`,
            409,
          );
      }
      const set: Row = { gst_name: newName };
      if (
        meta.slabs !== undefined ||
        meta.percentage !== undefined ||
        meta.gstRate !== undefined
      )
        Object.assign(set, gstColumns(meta));
      await tx.update("gstgroup", set, { gst_code: code, gst_name: oldName });
    });
  } else {
    const cfg = SIMPLE[type];
    const nums = checkMasterNumbers(cfg, meta);
    await withSqlTransaction("Updating the entry", async (tx) => {
      if (newName !== oldName) {
        const used = await inUse(tx, cfg, oldName);
        if (used)
          throw new SqlWriteError(
            `"${oldName}" is used in ${used} (Textilesoft stores the name) and can't be renamed.`,
            409,
          );
        if (
          (
            await tx.query(
              `SELECT 1 FROM dbo.[${cfg.table}] WHERE LTRIM(RTRIM(name_eng)) = @n`,
              { n: newName },
            )
          ).length
        )
          throw new SqlWriteError(`"${newName}" already exists`, 400);
      }
      if ((type === "EXPENSE_GROUP" && meta.nameTamil !== undefined) || (type === "EXPENSE_NAME" && data.parentId !== undefined)) {
        const current = await tx.query(`SELECT * FROM dbo.[${cfg.table}] WITH (UPDLOCK, HOLDLOCK) WHERE catagary_cd = @code AND name_eng = @name`, { code, name: oldName });
        if (current.length !== 1) throw new SqlWriteError("Expense entry is missing or ambiguous.", 409);
        const proposedParent = type === "EXPENSE_NAME" ? await expenseParent(tx, data.parentId) : null;
        const changed = proposedParent ? txt(current[0].group_name) !== proposedParent.group_name || txt(current[0].group_name_tam) !== proposedParent.group_name_tam : txt(current[0].name_tam) !== txt(meta.nameTamil);
        if (changed && await inUse(tx, cfg, oldName))
          throw new SqlWriteError("Referenced expense hierarchy cannot be changed; historical expense links must remain intact.", 409);
      }
      const set: Row = { name_eng: newName };
      if (meta.printName !== undefined || data?.description !== undefined)
        set.prin_name_eng = txt(meta.printName ?? data.description) || newName;
      if (meta.nameTamil !== undefined) set.name_tam = txt(meta.nameTamil);
      if (meta.printNameTamil !== undefined)
        set.prin_name_tam = txt(meta.printNameTamil);
      for (const [field, col] of Object.entries(cfg.extra ?? {}))
        if (meta[field] !== undefined) set[col] = txt(nums[field]);
      if (type === "EXPENSE_NAME" && data?.parentId !== undefined)
        Object.assign(set, await expenseParent(tx, data.parentId));
      else if (cfg.parentColumn && data?.parentId !== undefined)
        set[cfg.parentColumn] = await parentName(cfg, data.parentId);
      const n = await tx.update(cfg.table, set, {
        [cfg.codeColumn ?? "group_cd"]: code,
        name_eng: oldName,
      });
      if (!n) throw new SqlWriteError("Entry not found", 404);
    });
  }
  const updated = (await listSqlMaster(type)).find(
    (e) => e.name.toUpperCase() === newName,
  );
  if (!updated) throw new SqlWriteError("Entry not found", 404);
  return updated;
}

export async function deleteSqlMaster(id: string): Promise<void> {
  const { type, code, name } = parseId(id);
  if (type === "WAREHOUSE") return deleteLocation("warehousedetail", code);
  await withSqlTransaction("Deleting the entry", async (tx) => {
    if (type === "GST_GROUP") {
      const used = await findReferences(tx, "gstgroup", name);
      if (used.length)
        throw new SqlWriteError(
          `"${name}" is used in ${describeReferences(used)} and can't be deleted.`,
          409,
        );
      if (!(await tx.remove("gstgroup", { gst_code: code, gst_name: name })))
        throw new SqlWriteError("Entry not found", 404);
      return;
    }
    const cfg = SIMPLE[type];
    const used = await inUse(tx, cfg, name);
    if (used)
      throw new SqlWriteError(
        `"${name}" is used in ${used} and can't be deleted.`,
        409,
      );
    if (!(await tx.remove(cfg.table, { [cfg.codeColumn ?? "group_cd"]: code, name_eng: name })))
      throw new SqlWriteError("Entry not found", 404);
  });
}
