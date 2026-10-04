/**
 * Product master = Textilesoft's dbo.newproduct, read and written directly (no MongoDB).
 *
 * Textilesoft keeps one row PER COMPANY for a product (same code and name, cmy_name differs); its own screen
 * saves a row for every company ticked. Here a product is shown once with the list of its companies, and
 * saving keeps one row per chosen company. Rules copied from newproduct.aspx:
 *   - code: MAX(code)+1 (under lock); a code or name already used is refused
 *   - unit must exist in prounit, GST group in gstgroup; group/sub group/floor must exist in their masters
 *   - update/delete are keyed on code + company
 *   - a product that has been purchased (purentrydetails.code) can't be deleted; a company can't be
 *     removed from it while that company has purchases of it
 * Stricter than Textilesoft (which only checks purentrydetails before a delete):
 *   - delete is refused while ANY bill, stock, PO, return, transfer or product-wise setting uses the code
 *     (PRODUCT_CODE_REFS), or a setting table is keyed on the product name (PRODUCT_NAME_KEYS);
 *   - rename is refused only while a PRODUCT_NAME_KEYS table uses the old name. Transaction lines keep
 *     their own copy of the name (pname) and link by code, as after a rename in Textilesoft.
 *   - prices / percentages must be numbers and the HSN 4, 6 or 8 digits.
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
import { productMappings, setProductMapping } from "./sqlAttributes.js";
import { warn, info } from "../../config/logger.js";
import {
  findReferencesIn,
  describeReferences,
  type RefColumn,
} from "./sqlReferences.js";

export interface SqlProduct {
  code: string;
  name: string;
  printName: string;
  nameTamil: string;
  printNameTamil: string;
  unit: string;
  group: string;
  subGroup: string;
  floor: string;
  gstGroup: string;
  hsnCode: string;
  discountPercent: string;
  commissionPercent: string;
  commissionAmount: string;
  commission: string;
  mrp: string;
  retailRate: string;
  wholesaleRate: string;
  companies: string[];
  /** Product-wise racks / fashion names (productwiserackno / productwisefashionname). */
  racks: string[];
  fashions: string[];
  date: string;
  /** True once any purchase line uses this code (then it can't be deleted). */
  purchased?: boolean;
}

/** ERP field -> newproduct column (company and code are handled separately). */
const COLUMNS: Record<string, string> = {
  name: "name",
  printName: "print_name",
  nameTamil: "PnameTamil",
  printNameTamil: "PrintNameTamil",
  unit: "unit_de",
  group: "group_name",
  subGroup: "sub_group_name",
  floor: "floor_name",
  gstGroup: "gst_group",
  hsnCode: "ProductHSNCode",
  discountPercent: "discount",
  commissionPercent: "com_per",
  commissionAmount: "com_amt",
  commission: "commission",
  mrp: "mrp",
  retailRate: "Retail_Rate",
  wholesaleRate: "WR_Rate",
};

// ------------------------------------------------------------------------------------------------
// Where Textilesoft uses a product (from INFORMATION_SCHEMA of SSS_copy, Sep 2026)
// ------------------------------------------------------------------------------------------------

const pairs = (column: string, tables: string[]): RefColumn[] =>
  tables.map((table) => ({ table, column }));

/**
 * Tables whose column holds a newproduct.code. Hand-picked: "code" also means supplier, bank, employee,
 * customer-group ... codes elsewhere, and the Gift / Grocery / Bakery / Appliance modules have their own
 * product masters (Giftnewproduct ...) and code series. Scratch tables (TMP_*, *Temp) are left out.
 * Tables a shop's database doesn't have are skipped at run time.
 */
export const PRODUCT_CODE_REFS: RefColumn[] = [
  ...pairs("code", [
    // purchase / stock
    "purentrydetails",
    "stockdetails",
    "PurchaseStock",
    "clientpurentrydetails",
    "PODetails",
    "NeedProductDetails",
    "PurchaseReturnDetails",
    "purretrun",
    "InvoiceEntryDetails",
    "InvoiceReturnDetails",
    "InvoiceStockDetails",
    "MRPGrnDetail",
    "SmallPurchaseUpdate",
    "WRPurchaseUpdate",
    "WSREntryUpdate",
    "MobileWSREntryUpdate",
    // sales
    "salbill",
    "salbilledit",
    "salbillOrder",
    "salbillreturn",
    "salbillReturns",
    "SALESORDER_SALBILL",
    "wholesalbill",
    "samplesalbill",
    "gstWSRSalbilledit",
    "stacksales",
    "tacksales",
    // stock movements
    "StockDamage",
    "StockMissing",
    "stocktack",
    "MaterialTransfer",
    "StoreTransfer",
    "StoreReceivedEntry",
    // product-wise prices / offers / commission
    "ratecha",
    "MRPRateEntry",
    "MRPcatStock",
    "MRPwiseCategoryDetail",
    "SSSBPrateDetail",
    "productwisecommission",
    "productwisediscount",
    "ProductBrandPoint",
    "ComboOfferSingleMRP",
    "BarcodewiseComboOffer",
    "SuperComboOfferUpdate",
  ]),
  { table: "purchase2", column: "procode" },
  { table: "PurchaseProduct", column: "Product_code" },
  { table: "SpecialSalesmanCommission", column: "product_code" },
  ...pairs("ProductCode", [
    "BarcodeWiseCommissionDetails",
    "BarcodeWiseDiscountDetails",
    "RANGEWISECOMMISSION",
    "SALESMANAGEWISECOMMISSION",
  ]),
];

/**
 * Setting tables that identify the product by NAME only (no code column). A rename would silently detach
 * these settings, so rename (and delete) is refused while they name the product.
 */
export const PRODUCT_NAME_KEYS: RefColumn[] = [
  ...pairs("ProductName", [
    "BarcodeBalStockMinQtyInsert",
    "BrandPatternSize",
    "BrandPatternSize1",
    "BrandPatternSize2",
    "BrandPatternSize3",
    "BrandPatternSize4",
    "BrandPatternSize5",
    "BrandPatternSize6",
    "Brandwiseminimumqty",
    "Days_Commision",
    "Days_Commision_New",
    "FloorColorWiseSizeQty",
    "FloorWiseSizeQty",
    "PatternSize",
    "PatternSize1",
    "PatternSize2",
    "PatternSize3",
    "PatternSize4",
    "PatternSize5",
    "PatternSize6",
    "SupplierPatternSize",
    "SupplierPatternsize1",
    "SupplierPatternSize2",
    "SupplierPatternSize3",
    "SupplierPatternSize4",
    "SupplierPatternSize5",
    "SupplierPatternsize6",
  ]),
  { table: "Datewiseproductdissetting", column: "product_name" },
  { table: "ProductDisToken", column: "pname" },
  { table: "mrpcat", column: "pname" },
];

// ------------------------------------------------------------------------------------------------
// Number / HSN checks
// ------------------------------------------------------------------------------------------------

/** Numeric fields: [label, max or null]. Empty = not set (allowed, as in Textilesoft). */
const NUMERIC: Record<string, [string, number | null]> = {
  discountPercent: ["Discount %", 100],
  commissionPercent: ["Commission %", 100],
  commissionAmount: ["Commission amount", null],
  mrp: ["MRP", null],
  retailRate: ["Retail rate", null],
  wholesaleRate: ["Wholesale rate", null],
};

/**
 * Validates and normalises the numeric fields and HSN of a product input (only the fields present).
 * "1,250.50" -> "1250.5". Throws SqlWriteError(400) naming the field. Returns a new object.
 * `current` (on update): a field sent back unchanged is left as it is, so old Textilesoft values that
 * don't fit these rules don't block editing something else on the product.
 */
export function checkProductNumbers(input: Row, current?: Row): Row {
  const out: Row = { ...input };
  const unchanged = (f: string) =>
    current !== undefined && txt(input[f]) === txt(current[f]);
  for (const [field, [label, max]] of Object.entries(NUMERIC)) {
    if (input[field] === undefined || input[field] === null || unchanged(field)) continue;
    const raw = txt(input[field]).replace(/,/g, "");
    if (!raw) {
      out[field] = "";
      continue;
    }
    const n = Number(raw);
    if (!/^\d*\.?\d+$|^\d+\.$/.test(raw) || !Number.isFinite(n))
      throw new SqlWriteError(`${label} must be a number (got "${txt(input[field])}").`, 400);
    if (max !== null && n > max)
      throw new SqlWriteError(`${label} can't be more than ${max}.`, 400);
    out[field] = String(n);
  }
  if (input.hsnCode !== undefined && input.hsnCode !== null && !unchanged("hsnCode")) {
    const hsn = txt(input.hsnCode).replace(/\s/g, "");
    if (hsn && !/^(\d{4}|\d{6}|\d{8})$/.test(hsn))
      throw new SqlWriteError(`HSN code must be 4, 6 or 8 digits (got "${txt(input.hsnCode)}").`, 400);
    out.hsnCode = hsn;
  }
  return out;
}

function merge(rows: Row[]): SqlProduct[] {
  const byCode = new Map<string, SqlProduct>();
  for (const r of rows) {
    const code = txt(r.code);
    const company = txt(r.cmy_name);
    const existing = byCode.get(code);
    if (existing) {
      if (company && !existing.companies.includes(company))
        existing.companies.push(company);
      continue;
    }
    const p: Row = {
      code,
      companies: company ? [company] : [],
      racks: [],
      fashions: [],
      date: txt(r.date),
    };
    for (const [field, col] of Object.entries(COLUMNS)) p[field] = txt(r[col]);
    byCode.set(code, p as SqlProduct);
  }
  return [...byCode.values()];
}

export interface ProductQuery {
  search?: string;
  company?: string;
  group?: string;
}

export async function listProducts(
  q: ProductQuery = {},
): Promise<SqlProduct[]> {
  const where: string[] = ["NULLIF(LTRIM(RTRIM(name)), '') IS NOT NULL"];
  const params: Row = {};
  if (q.search) {
    where.push("(name LIKE @s OR code LIKE @s OR print_name LIKE @s)");
    params.s = `%${q.search.trim()}%`;
  }
  if (q.company) {
    where.push("LTRIM(RTRIM(cmy_name)) = @c");
    params.c = q.company.trim();
  }
  if (q.group) {
    where.push("LTRIM(RTRIM(group_name)) = @g");
    params.g = q.group.trim();
  }
  const rows = await sqlRead(
    `SELECT * FROM dbo.[newproduct] WHERE ${where.join(" AND ")} ORDER BY TRY_CAST(code AS int), code, cmy_name`,
    params,
  );
  const products = merge(rows);
  if (products.length) {
    const [bought, maps] = await Promise.all([
      sqlRead(
        "SELECT DISTINCT LTRIM(RTRIM(code)) AS code FROM dbo.[purentrydetails] WHERE code IS NOT NULL",
      ),
      productMappings(),
    ]);
    const set = new Set(bought.map((b) => txt(b.code)));
    for (const p of products) {
      p.purchased = set.has(p.code);
      p.racks = maps.racks.get(p.code) ?? [];
      p.fashions = maps.fashions.get(p.code) ?? [];
    }
  }
  return products;
}

export async function getProduct(code: string): Promise<SqlProduct | null> {
  const rows = await sqlRead(
    "SELECT * FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c ORDER BY cmy_name",
    { c: code.trim() },
  );
  const [p] = merge(rows);
  if (!p) return null;
  const [b] = await sqlRead(
    "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.[purentrydetails] WHERE LTRIM(RTRIM(code)) = @c) THEN 1 ELSE 0 END AS used",
    { c: p.code },
  );
  p.purchased = Boolean(Number(b?.used));
  const maps = await productMappings();
  p.racks = maps.racks.get(p.code) ?? [];
  p.fashions = maps.fashions.get(p.code) ?? [];
  return p;
}

// ------------------------------------------------------------------------------------------------
// Validation against Textilesoft's masters
// ------------------------------------------------------------------------------------------------

async function mustExist(
  tx: SqlTx,
  table: string,
  column: string,
  value: string,
  label: string,
): Promise<void> {
  if (!value) return;
  const r = await tx.query(
    `SELECT 1 FROM dbo.[${table}] WHERE LTRIM(RTRIM([${column}])) = @v`,
    { v: value },
  );
  if (!r.length)
    throw new SqlWriteError(
      `${label} "${value}" is not in Textilesoft's list. Add it under Master Data first.`,
      400,
    );
}

async function validate(tx: SqlTx, p: Row, companies: string[]): Promise<void> {
  if (!txt(p.name)) throw new SqlWriteError("Enter the product name.", 400);
  if (!txt(p.unit_de)) throw new SqlWriteError("Select the unit.", 400);
  if (!txt(p.gst_group)) throw new SqlWriteError("Enter the GST group.", 400);
  if (!companies.length)
    throw new SqlWriteError("Select at least one company.", 400);
  await mustExist(tx, "prounit", "name_eng", txt(p.unit_de), "Unit");
  await mustExist(tx, "gstgroup", "gst_name", txt(p.gst_group), "GST group");
  await mustExist(tx, "progroup", "name_eng", txt(p.group_name), "Group");
  await mustExist(
    tx,
    "prosubgroup",
    "name_eng",
    txt(p.sub_group_name),
    "Sub group",
  );
  await mustExist(tx, "foolerdetail", "name_eng", txt(p.floor_name), "Floor");
  for (const c of companies)
    await mustExist(tx, "companydetail", "cmy_name_eng", c, "Company");
}

function toColumns(input: Row): Row {
  const out: Row = {};
  for (const [field, col] of Object.entries(COLUMNS)) {
    if (input[field] === undefined) continue;
    const v = txt(input[field]);
    // Names/codes are upper case in Textilesoft; free text (Tamil names) is kept as typed.
    out[col] = [
      "name",
      "printName",
      "unit",
      "group",
      "subGroup",
      "floor",
      "gstGroup",
    ].includes(field)
      ? v.toUpperCase()
      : v;
  }
  return out;
}

const companiesOf = (input: Row): string[] =>
  Array.from(
    new Set(
      (Array.isArray(input.companies) ? input.companies : [input.company])
        .map((c: unknown) => txt(c).toUpperCase())
        .filter(Boolean),
    ),
  );

// ------------------------------------------------------------------------------------------------
// Create / update / delete
// ------------------------------------------------------------------------------------------------

export async function createProduct(inputRaw: Row): Promise<SqlProduct> {
  const input = checkProductNumbers(inputRaw);
  const cols = toColumns(input);
  if (!cols.print_name) cols.print_name = cols.name;
  const companies = companiesOf(input);
  const code = await withSqlTransaction("Saving the product", async (tx) => {
    await validate(tx, cols, companies);
    let code = txt(input.code);
    if (code) {
      if (
        (
          await tx.query(
            "SELECT 1 FROM dbo.[newproduct] WITH (UPDLOCK, HOLDLOCK) WHERE LTRIM(RTRIM(code)) = @c",
            { c: code },
          )
        ).length
      ) {
        throw new SqlWriteError(`Product code ${code} is already used.`, 409);
      }
    } else {
      code = String(await tx.nextNumber("newproduct", "code"));
    }
    if (
      (
        await tx.query(
          "SELECT 1 FROM dbo.[newproduct] WHERE LTRIM(RTRIM(name)) = @n",
          { n: cols.name },
        )
      ).length
    ) {
      throw new SqlWriteError(`Product "${cols.name}" already exists.`, 409);
    }
    for (const company of companies) {
      // hsn_code is filled with the product code, as Textilesoft's own saves do.
      await tx.insert("newproduct", {
        ...blank(),
        ...cols,
        code,
        hsn_code: code,
        cmy_name: company,
        date: tsDate(),
      });
    }
    if (Array.isArray(input.racks))
      await setProductMapping(tx, "rack", code, cols.name, input.racks);
    if (Array.isArray(input.fashions))
      await setProductMapping(tx, "fashion", code, cols.name, input.fashions);
    return code;
  });
  return (await getProduct(code)) as SqlProduct;
}

function blank(): Row {
  return Object.fromEntries(Object.values(COLUMNS).map((c) => [c, ""]));
}

export async function updateProduct(
  code: string,
  inputRaw: Row,
): Promise<SqlProduct> {
  await withSqlTransaction("Updating the product", async (tx) => {
    const rows = await tx.query(
      "SELECT * FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c",
      { c: code },
    );
    if (!rows.length) throw new SqlWriteError("Product not found.", 404);
    const [current] = merge(rows);
    const input = checkProductNumbers(inputRaw, current as unknown as Row);
    const set = toColumns(input);
    const merged: Row = {};
    for (const [field, col] of Object.entries(COLUMNS))
      merged[col] = set[col] ?? txt((current as unknown as Row)[field]);
    const companies =
      input.companies !== undefined || input.company !== undefined
        ? companiesOf(input)
        : current.companies.map((c) => c.toUpperCase());
    await validate(tx, merged, companies);
    if (set.name && set.name !== current.name.toUpperCase()) {
      const keyed = await findReferencesIn(tx, PRODUCT_NAME_KEYS, current.name);
      if (keyed.length)
        throw new SqlWriteError(
          `"${current.name}" can't be renamed: settings in ${describeReferences(keyed)} are linked to it by name. Rename it in Textilesoft after moving those settings.`,
          409,
        );
      const dup = await tx.query(
        "SELECT 1 FROM dbo.[newproduct] WHERE LTRIM(RTRIM(name)) = @n AND LTRIM(RTRIM(code)) <> @c",
        { n: set.name, c: code },
      );
      if (dup.length)
        throw new SqlWriteError(`Product "${set.name}" already exists.`, 409);
    }
    const have = current.companies.map((c) => c.toUpperCase());
    const removed = have.filter((c) => !companies.includes(c));
    for (const company of removed) {
      const [u] = await tx.query(
        `SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.[purentrydetails] d JOIN dbo.[purgrnentry] h ON h.grn_no = d.grn_no
                  WHERE LTRIM(RTRIM(d.code)) = @c AND LTRIM(RTRIM(h.cmy_name)) = @m) THEN 1 ELSE 0 END AS used`,
        { c: code, m: company },
      );
      if (Number(u?.used))
        throw new SqlWriteError(
          `${company} has purchases of this product, so it can't be removed from it.`,
          409,
        );
      await tx.remove("newproduct", { code, cmy_name: company });
    }
    for (const company of have.filter((c) => companies.includes(c))) {
      await tx.update(
        "newproduct",
        { ...set, date: tsDate() },
        { code, cmy_name: company },
      );
    }
    for (const company of companies.filter((c) => !have.includes(c))) {
      await tx.insert("newproduct", {
        ...blank(),
        ...merged,
        code,
        hsn_code: code,
        cmy_name: company,
        date: tsDate(),
      });
    }
    if (Array.isArray(input.racks))
      await setProductMapping(tx, "rack", code, merged.name, input.racks);
    if (Array.isArray(input.fashions))
      await setProductMapping(tx, "fashion", code, merged.name, input.fashions);
    // The mappings keep the product name as text; keep it in step with a rename.
    if (set.name && set.name !== current.name.toUpperCase()) {
      await tx.update(
        "productwiserackno",
        { pname: set.name },
        { pcode: code },
      );
      await tx.update(
        "productwisefashionname",
        { pname: set.name },
        { pcode: code },
      );
    }
  });
  return (await getProduct(code)) as SqlProduct;
}

export async function deleteProduct(code: string): Promise<void> {
  await withSqlTransaction("Deleting the product", async (tx) => {
    const rows = await tx.query(
      "SELECT 1 FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c",
      { c: code },
    );
    if (!rows.length) throw new SqlWriteError("Product not found.", 404);
    const [u] = await tx.query(
      "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.[purentrydetails] WHERE LTRIM(RTRIM(code)) = @c) THEN 1 ELSE 0 END AS used",
      { c: code },
    );
    // Same rule and message as Textilesoft's newproduct.aspx.
    if (Number(u?.used))
      throw new SqlWriteError(
        "This product is already purchased, so it can't be deleted.",
        409,
      );
    // Beyond Textilesoft: bills, stock, POs, returns, transfers, product-wise settings.
    const [{ name }] = await tx.query(
      "SELECT TOP 1 LTRIM(RTRIM(name)) AS name FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c",
      { c: code },
    );
    const used = [
      ...(await findReferencesIn(tx, PRODUCT_CODE_REFS, code)),
      ...(await findReferencesIn(tx, PRODUCT_NAME_KEYS, txt(name))),
    ];
    if (used.length)
      throw new SqlWriteError(
        `This product is used in ${describeReferences(used)}, so it can't be deleted.`,
        409,
      );
    await tx.remove("newproduct", { code });
    await tx.remove("productwiserackno", { pcode: code });
    await tx.remove("productwisefashionname", { pcode: code });
  });
}

/** Everything the product form needs in one call. */
export async function productFormOptions() {
  const names = async (table: string, col = "name_eng") =>
    (
      await sqlRead(
        `SELECT DISTINCT LTRIM(RTRIM([${col}])) AS v FROM dbo.[${table}] WHERE NULLIF(LTRIM(RTRIM([${col}])), '') IS NOT NULL ORDER BY v`,
      )
    ).map((r) => txt(r.v));
  const [
    units,
    groups,
    subGroups,
    floors,
    gstGroups,
    companies,
    racks,
    fashions,
  ] = await Promise.all([
    names("prounit"),
    names("progroup"),
    names("prosubgroup"),
    names("foolerdetail"),
    names("gstgroup", "gst_name"),
    names("companydetail", "cmy_name_eng"),
    names("RackNo"),
    names("FashionName"),
  ]);
  return {
    units,
    groups,
    subGroups,
    floors,
    gstGroups,
    companies,
    racks,
    fashions,
  };
}

// ------------------------------------------------------------------------------------------------
// Duplicate product codes (startup check)
// ------------------------------------------------------------------------------------------------

export interface DuplicateCode {
  code: string;
  names: string[];
}

/**
 * Product codes used for more than one product NAME. Textilesoft's desktop reads MAX(code) without a lock,
 * so if it and the ERP add a product in the same moment both can take the same code; nothing in the
 * database prevents it. (One code with several rows is normal -- one row per company -- only differing
 * names are a problem.)
 */
export async function duplicateProductCodes(): Promise<DuplicateCode[]> {
  const rows = await sqlRead(
    `SELECT LTRIM(RTRIM(code)) AS code, UPPER(LTRIM(RTRIM(name))) AS name
       FROM dbo.[newproduct]
      WHERE LTRIM(RTRIM(code)) IN (
        SELECT LTRIM(RTRIM(code)) FROM dbo.[newproduct]
         WHERE NULLIF(LTRIM(RTRIM(name)), '') IS NOT NULL
         GROUP BY LTRIM(RTRIM(code))
        HAVING COUNT(DISTINCT UPPER(LTRIM(RTRIM(name)))) > 1)
      GROUP BY LTRIM(RTRIM(code)), UPPER(LTRIM(RTRIM(name)))
      ORDER BY TRY_CAST(LTRIM(RTRIM(code)) AS bigint), LTRIM(RTRIM(code))`,
  );
  const byCode = new Map<string, string[]>();
  for (const r of rows) {
    const list = byCode.get(txt(r.code)) ?? [];
    if (txt(r.name)) list.push(txt(r.name));
    byCode.set(txt(r.code), list);
  }
  return [...byCode.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([code, names]) => ({ code, names }));
}

/** Startup log line; never throws. */
export async function logDuplicateProductCodes(): Promise<void> {
  try {
    const dups = await duplicateProductCodes();
    if (!dups.length) {
      info("[products] No product code is shared by two different products.");
      return;
    }
    const shown = dups
      .slice(0, 10)
      .map((d) => `${d.code} (${d.names.join(" / ")})`)
      .join("; ");
    warn(
      `[products] ${dups.length} product code(s) are used for different products: ${shown}${dups.length > 10 ? "; ..." : ""}. Give one of each pair a new code in Textilesoft.`,
    );
  } catch (err) {
    warn(`[products] duplicate code check skipped - ${(err as Error).message}`);
  }
}
