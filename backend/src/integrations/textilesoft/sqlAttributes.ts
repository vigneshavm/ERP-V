/**
 * Product attributes (brand, pattern, size, colour, style, design, model, rack, fashion) the way Textilesoft
 * uses them:
 *   - each has a master table (brand, pattern, ... -- managed through sqlMasters.ts), but purchase lines store
 *     the value as free TEXT (purentrydetails.brand, patrn, ...). In this shop most masters are empty and the
 *     real values only exist on purchase lines, so suggestions combine both, most-used first
 *     (Textilesoft's purchase screen suggests from the same purchase history, optionally per supplier);
 *   - rack and fashion can also be mapped to a product (productwiserackno / productwisefashionname).
 */
import {
  sqlRead,
  withSqlTransaction,
  SqlWriteError,
  txt,
  type SqlTx,
} from "./sqlWrite.js";

/** attribute -> [purchase-line column, master table] */
export const ATTRIBUTES: Record<string, [string, string]> = {
  brand: ["brand", "brand"],
  pattern: ["patrn", "pattern"],
  size: ["size", "size"],
  color: ["color", "color"],
  style: ["style", "style"],
  design: ["design", "design"],
  model: ["model", "ModelNo"],
  rack: ["rackno", "RackNo"],
  fashion: ["fashion", "FashionName"],
};

export interface AttributeSuggestion {
  value: string;
  /** Purchase lines using it (0 = only in the master list). */
  uses: number;
  inMaster: boolean;
}

export async function suggestAttribute(
  attribute: string,
  opts: {
    q?: string;
    supplier?: string;
    productCode?: string;
    limit?: number;
  } = {},
): Promise<AttributeSuggestion[]> {
  const def = ATTRIBUTES[attribute];
  if (!def)
    throw new SqlWriteError(
      `Unknown attribute "${attribute}". Use one of: ${Object.keys(ATTRIBUTES).join(", ")}.`,
      400,
    );
  const [col, master] = def;
  const limit = Math.min(Math.max(Number(opts.limit) || 30, 1), 200);
  const params: Record<string, unknown> = { lim: limit };
  const where = [
    `NULLIF(LTRIM(RTRIM(d.[${col}])), '') IS NOT NULL`,
    `LTRIM(RTRIM(d.[${col}])) <> '0'`,
  ];
  let join = "";
  if (opts.q) {
    where.push(`d.[${col}] LIKE @q`);
    params.q = `%${opts.q.trim()}%`;
  }
  if (opts.productCode) {
    where.push("LTRIM(RTRIM(d.code)) = @pc");
    params.pc = opts.productCode.trim();
  }
  if (opts.supplier) {
    join = "JOIN dbo.[purgrnentry] h ON h.grn_no = d.grn_no";
    where.push("LTRIM(RTRIM(h.suplier_name)) = @sup");
    params.sup = opts.supplier.trim();
  }
  const used = await sqlRead(
    `SELECT TOP (@lim) LTRIM(RTRIM(d.[${col}])) AS v, COUNT(*) AS n FROM dbo.[purentrydetails] d ${join}
         WHERE ${where.join(" AND ")} GROUP BY LTRIM(RTRIM(d.[${col}])) ORDER BY COUNT(*) DESC`,
    params,
  );
  const masterRows = await sqlRead(
    `SELECT DISTINCT TOP (@lim) LTRIM(RTRIM(name_eng)) AS v FROM dbo.[${master}] WHERE NULLIF(LTRIM(RTRIM(name_eng)), '') IS NOT NULL${opts.q ? " AND name_eng LIKE @q" : ""} ORDER BY v`,
    { lim: limit, ...(opts.q ? { q: `%${opts.q.trim()}%` } : {}) },
  );
  const byValue = new Map<string, AttributeSuggestion>();
  for (const r of used)
    byValue.set(txt(r.v).toUpperCase(), {
      value: txt(r.v),
      uses: Number(r.n),
      inMaster: false,
    });
  for (const r of masterRows) {
    const key = txt(r.v).toUpperCase();
    const hit = byValue.get(key);
    if (hit) hit.inMaster = true;
    // Supplier/product-filtered lists only show what that supplier/product actually used.
    else if (!opts.supplier && !opts.productCode)
      byValue.set(key, { value: txt(r.v), uses: 0, inMaster: true });
  }
  const q = (opts.q ?? "").trim().toUpperCase();
  return [...byValue.values()]
    .sort(
      (a, b) =>
        Number(b.value.toUpperCase().startsWith(q)) -
          Number(a.value.toUpperCase().startsWith(q)) ||
        b.uses - a.uses ||
        a.value.localeCompare(b.value),
    )
    .slice(0, limit);
}

// ------------------------------------------------------------------------------------------------
// Product-wise rack / fashion mappings
// ------------------------------------------------------------------------------------------------

type MappingKind = "rack" | "fashion";
const MAPPING: Record<
  MappingKind,
  { table: string; column: string; master: string }
> = {
  rack: { table: "productwiserackno", column: "rackname", master: "RackNo" },
  fashion: {
    table: "productwisefashionname",
    column: "fashionname",
    master: "FashionName",
  },
};

/** code -> mapped values, for every product (one query per mapping table). */
export async function productMappings(): Promise<{
  racks: Map<string, string[]>;
  fashions: Map<string, string[]>;
}> {
  const load = async (kind: MappingKind) => {
    const m = MAPPING[kind];
    const rows = await sqlRead(
      `SELECT LTRIM(RTRIM(pcode)) AS code, LTRIM(RTRIM([${m.column}])) AS v FROM dbo.[${m.table}] ORDER BY ID`,
    );
    const out = new Map<string, string[]>();
    for (const r of rows) {
      const list = out.get(txt(r.code)) ?? [];
      if (txt(r.v) && !list.includes(txt(r.v))) list.push(txt(r.v));
      out.set(txt(r.code), list);
    }
    return out;
  };
  const [racks, fashions] = await Promise.all([load("rack"), load("fashion")]);
  return { racks, fashions };
}

/** Replaces a product's rack or fashion mapping inside an open transaction (values must exist in the master). */
export async function setProductMapping(
  tx: SqlTx,
  kind: MappingKind,
  code: string,
  productName: string,
  values: unknown[],
): Promise<void> {
  const m = MAPPING[kind];
  const wanted = Array.from(
    new Set(values.map((v) => txt(v).toUpperCase()).filter(Boolean)),
  );
  for (const v of wanted) {
    const hit = await tx.query(
      `SELECT 1 FROM dbo.[${m.master}] WHERE LTRIM(RTRIM(name_eng)) = @v`,
      { v },
    );
    if (!hit.length)
      throw new SqlWriteError(
        `${kind === "rack" ? "Rack" : "Fashion name"} "${v}" is not in Textilesoft's list. Add it under Master Data first.`,
        400,
      );
  }
  await tx.remove(m.table, { pcode: code });
  for (const v of wanted)
    await tx.insert(m.table, {
      pcode: code,
      pname: productName,
      [m.column]: v,
    });
}

export async function replaceProductMapping(
  kind: MappingKind,
  code: string,
  values: unknown[],
): Promise<string[]> {
  await withSqlTransaction("Saving the product mapping", async (tx) => {
    const [p] = await tx.query(
      "SELECT TOP 1 name FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c",
      { c: code },
    );
    if (!p) throw new SqlWriteError("Product not found.", 404);
    await setProductMapping(tx, kind, code, txt(p.name), values);
  });
  return (
    (await productMappings())[kind === "rack" ? "racks" : "fashions"].get(
      code,
    ) ?? []
  );
}
