/**
 * Company / Branch / Warehouse / Counter masters, read and written directly in Textilesoft's own tables:
 *   companydetail   (cmy_cd, cmy_name_eng, ...)          company master; status1.cmy_status '1' = active company
 *   branchdetail    (ware_cd, ware_name_eng, ...)        branch master
 *   warehousedetail (ware_cd, ware_name_eng, ...)        warehouse (the purchase/GRN receiving location)
 *   countername     (sl_no, counter_name, counter_mode)  billing counters; CommonSettings holds each counter's settings
 *
 * Codes are Textilesoft's MAX+1 (allocated under lock, see sqlWrite.ts). Textilesoft links these masters to
 * transactions BY NAME (newproduct.cmy_name, purgrnentry.warehouse, sales2.countername ...), so renaming or
 * deleting one that is already used would orphan those rows -- both are refused while references exist.
 * Which tables count as references is read from the database schema (sqlReferences.ts).
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
import { findReferences, describeReferences } from "./sqlReferences.js";

// ------------------------------------------------------------------------------------------------
// Companies
// ------------------------------------------------------------------------------------------------

export interface SqlCompany {
  code: string;
  name: string;
  nameTamil: string;
  printName: string;
  address: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  pincode: string;
  phone: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  tin: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankBranch: string;
  ifsc: string;
  active: boolean;
  date: string;
}

const GSTIN = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/;

/** Textilesoft puts the GSTIN in whichever tax field was free, often with a label ("GST NO : 33AF..."). */
export function gstinFrom(...values: unknown[]): string {
  for (const v of values) {
    const m = txt(v).toUpperCase().match(GSTIN);
    if (m) return m[0];
  }
  return "";
}

/**
 * Columns to blank when the GSTIN is changed or cleared. Reading falls back from cmp_cgstno to sgst / cgst /
 * tin_nu (wherever Textilesoft users typed it), so a GSTIN left in one of those would come back after being
 * cleared -- or show instead of the new one. Only fields that actually hold a GSTIN are blanked, so a real
 * TIN in tin_nu is kept.
 */
export function gstinFallbacksToClear(current: Row): Row {
  const out: Row = {};
  for (const col of ["sgst", "cgst", "tin_nu"])
    if (gstinFrom(current[col])) out[col] = "";
  return out;
}

function toCompany(r: Row, activeNames: Set<string>): SqlCompany {
  const name = txt(r.cmy_name_eng);
  return {
    code: txt(r.cmy_cd),
    name,
    nameTamil: txt(r.cmy_name_tam),
    printName: txt(r.print_eng) || name,
    address: txt(r.address_eng),
    address1: txt(r.cmp_address1),
    address2: txt(r.cmp_address2),
    address3: txt(r.cmp_address3),
    city: txt(r.city_eng),
    pincode: txt(r.pin_cd),
    phone: txt(r.ph_nu),
    mobile: txt(r.mb_nu),
    email: txt(r.e_id),
    gstin: gstinFrom(r.cmp_cgstno, r.sgst, r.cgst, r.tin_nu),
    pan: txt(r.pan_nu),
    tin: txt(r.tin_nu),
    bankName: txt(r.bank_name),
    accountName: txt(r.acc_name),
    accountNumber: txt(r.ac_nu),
    bankBranch: txt(r.branch_name_eng),
    ifsc: txt(r.ifsc_nu),
    active: activeNames.size === 0 || activeNames.has(name.toUpperCase()),
    date: txt(r.date),
  };
}

/** ERP field -> companydetail column. The GSTIN goes to cmp_cgstno (Textilesoft's own insert does the same). */
const COMPANY_COLUMNS: Record<string, string> = {
  name: "cmy_name_eng",
  nameTamil: "cmy_name_tam",
  printName: "print_eng",
  address: "address_eng",
  address1: "cmp_address1",
  address2: "cmp_address2",
  address3: "cmp_address3",
  city: "city_eng",
  pincode: "pin_cd",
  phone: "ph_nu",
  mobile: "mb_nu",
  email: "e_id",
  gstin: "cmp_cgstno",
  pan: "pan_nu",
  tin: "tin_nu",
  bankName: "bank_name",
  accountName: "acc_name",
  accountNumber: "ac_nu",
  bankBranch: "branch_name_eng",
  ifsc: "ifsc_nu",
};

function pick(input: Row, map: Record<string, string>): Row {
  const out: Row = {};
  for (const [field, col] of Object.entries(map)) {
    if (input[field] !== undefined) out[col] = txt(input[field]);
  }
  return out;
}

async function activeCompanyNames(): Promise<Set<string>> {
  try {
    const rows = await sqlRead(
      "SELECT cmy_name FROM dbo.[status1] WHERE LTRIM(RTRIM(cmy_status)) = '1'",
    );
    return new Set(rows.map((r) => txt(r.cmy_name).toUpperCase()));
  } catch {
    return new Set(); // no status1 table: treat every company as active
  }
}

export async function listCompanies(): Promise<SqlCompany[]> {
  const [rows, active] = await Promise.all([
    sqlRead(
      "SELECT * FROM dbo.[companydetail] ORDER BY TRY_CAST(cmy_cd AS int), cmy_cd",
    ),
    activeCompanyNames(),
  ]);
  return rows.map((r) => toCompany(r, active));
}

/** The shop's main company: the first active one (status1), else the first company. */
export async function mainCompany(): Promise<SqlCompany | null> {
  const all = await listCompanies();
  return all.find((c) => c.active) ?? all[0] ?? null;
}

/** Tables naming this company (products, purchases, bills, cash entries, status1 ...); [] = unused. */
const companyUsage = (tx: SqlTx, name: string): Promise<string[]> =>
  findReferences(tx, "company", name);

export async function createCompany(input: Row): Promise<SqlCompany> {
  const name = txt(input.name).toUpperCase();
  if (!name) throw new SqlWriteError("Company name is required.", 400);
  const code = await withSqlTransaction("Saving the company", async (tx) => {
    const dup = await tx.query(
      "SELECT 1 FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_name_eng)) = @n",
      { n: name },
    );
    if (dup.length)
      throw new SqlWriteError(`Company "${name}" already exists.`, 409);
    const next = String(await tx.nextNumber("companydetail", "cmy_cd"));
    await tx.insert("companydetail", {
      ...emptyRow(COMPANY_COLUMNS),
      ...pick(
        { ...input, name, printName: txt(input.printName) || name },
        COMPANY_COLUMNS,
      ),
      cmy_cd: next,
      cgst: "",
      sgst: "",
      cst_nu: "",
      address_tam: "",
      city_tam: "",
      branch_name_tam: "",
      print_tam: "",
      acc_tam: "",
      date: tsDate(),
    });
    return next;
  });
  return (await listCompanies()).find((c) => c.code === code) as SqlCompany;
}

export async function updateCompany(
  code: string,
  input: Row,
): Promise<SqlCompany> {
  await withSqlTransaction("Updating the company", async (tx) => {
    const [cur] = await tx.query(
      "SELECT cmy_name_eng, sgst, cgst, tin_nu FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_cd)) = @c",
      { c: code },
    );
    if (!cur) throw new SqlWriteError("Company not found.", 404);
    const oldName = txt(cur.cmy_name_eng);
    const picked = pick(input, COMPANY_COLUMNS);
    if (picked.cmp_cgstno !== undefined) {
      const g = txt(picked.cmp_cgstno).toUpperCase().replace(/\s/g, "");
      if (g && !gstinFrom(g))
        throw new SqlWriteError(`"${txt(picked.cmp_cgstno)}" is not a valid GSTIN.`, 400);
      picked.cmp_cgstno = g;
    }
    // An explicitly sent TIN (picked.tin_nu) wins over the clean-up.
    const set: Row =
      picked.cmp_cgstno !== undefined
        ? { ...gstinFallbacksToClear(cur), ...picked }
        : picked;
    if (set.cmy_name_eng !== undefined) {
      set.cmy_name_eng = txt(set.cmy_name_eng).toUpperCase();
      if (!set.cmy_name_eng)
        throw new SqlWriteError("Company name is required.", 400);
      if (set.cmy_name_eng !== oldName) {
        const used = await companyUsage(tx, oldName);
        if (used.length)
          throw new SqlWriteError(
            `"${oldName}" can't be renamed: Textilesoft links rows in ${describeReferences(used)} to it by name.`,
            409,
          );
        const dup = await tx.query(
          "SELECT 1 FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_name_eng)) = @n",
          { n: set.cmy_name_eng },
        );
        if (dup.length)
          throw new SqlWriteError(
            `Company "${set.cmy_name_eng}" already exists.`,
            409,
          );
      }
    }
    await tx.update("companydetail", set, { cmy_cd: code });
  });
  return (await listCompanies()).find((c) => c.code === code) as SqlCompany;
}

export async function deleteCompany(code: string): Promise<void> {
  await withSqlTransaction("Deleting the company", async (tx) => {
    const [cur] = await tx.query(
      "SELECT cmy_name_eng FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_cd)) = @c",
      { c: code },
    );
    if (!cur) throw new SqlWriteError("Company not found.", 404);
    const used = await companyUsage(tx, txt(cur.cmy_name_eng));
    if (used.length)
      throw new SqlWriteError(
        `"${txt(cur.cmy_name_eng)}" is used in ${describeReferences(used)} and can't be deleted.`,
        409,
      );
    await tx.remove("companydetail", { cmy_cd: code });
  });
}

// ------------------------------------------------------------------------------------------------
// Branches (branchdetail) and warehouses (warehousedetail) -- same layout in Textilesoft
// ------------------------------------------------------------------------------------------------

export type LocationTable = "branchdetail" | "warehousedetail";

export interface SqlLocation {
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  tin: string;
  cst: string;
  landmark: string;
  bankName: string;
  accountNumber: string;
  bankBranch: string;
  ifsc: string;
  date: string;
}

const LOCATION_COLUMNS: Record<string, string> = {
  name: "ware_name_eng",
  address: "address_eng",
  city: "city_eng",
  phone: "ph_nu",
  mobile: "mb_nu",
  email: "e_id",
  gstin: "gst_nu",
  pan: "pan_cd",
  tin: "tin_nu",
  cst: "cst_nu",
  landmark: "land_mark",
  bankName: "bank_name",
  accountNumber: "ac_nu",
  bankBranch: "branch_name_eng",
  ifsc: "ifsc_cd",
};

const toLocation = (r: Row): SqlLocation => ({
  code: txt(r.ware_cd),
  name: txt(r.ware_name_eng),
  address: txt(r.address_eng),
  city: txt(r.city_eng),
  phone: txt(r.ph_nu),
  mobile: txt(r.mb_nu),
  email: txt(r.e_id),
  gstin: gstinFrom(r.gst_nu) || txt(r.gst_nu),
  pan: txt(r.pan_cd),
  tin: txt(r.tin_nu),
  cst: txt(r.cst_nu),
  landmark: txt(r.land_mark),
  bankName: txt(r.bank_name),
  accountNumber: txt(r.ac_nu),
  bankBranch: txt(r.branch_name_eng),
  ifsc: txt(r.ifsc_cd),
  date: txt(r.date),
});

const emptyRow = (map: Record<string, string>): Row =>
  Object.fromEntries(Object.values(map).map((c) => [c, ""]));
const label = (t: LocationTable) =>
  t === "branchdetail" ? "branch" : "warehouse";

export async function listLocations(
  table: LocationTable,
): Promise<SqlLocation[]> {
  const rows = await sqlRead(
    `SELECT * FROM dbo.[${table}] ORDER BY TRY_CAST(ware_cd AS int), ware_cd`,
  );
  return rows.map(toLocation);
}

async function locationUsage(
  tx: SqlTx,
  table: LocationTable,
  name: string,
): Promise<string[]> {
  // Purchases, POs, returns ... name the warehouse. Textilesoft's transactions don't name a branch
  // (02_company_branch_store.md); not re-checked against the schema -- add "branch" columns to
  // REF_COLUMNS if one turns up.
  if (table !== "warehousedetail") return [];
  return findReferences(tx, "warehouse", name);
}

export async function createLocation(
  table: LocationTable,
  input: Row,
): Promise<SqlLocation> {
  const name = txt(input.name).toUpperCase();
  if (!name) throw new SqlWriteError(`The ${label(table)} needs a name.`, 400);
  const code = await withSqlTransaction(
    `Saving the ${label(table)}`,
    async (tx) => {
      const dup = await tx.query(
        `SELECT 1 FROM dbo.[${table}] WHERE LTRIM(RTRIM(ware_name_eng)) = @n`,
        { n: name },
      );
      if (dup.length)
        throw new SqlWriteError(
          `${label(table)[0].toUpperCase()}${label(table).slice(1)} "${name}" already exists.`,
          409,
        );
      const next = String(await tx.nextNumber(table, "ware_cd"));
      await tx.insert(table, {
        ...emptyRow(LOCATION_COLUMNS),
        ...pick({ ...input, name }, LOCATION_COLUMNS),
        ware_cd: next,
        date: tsDate(),
      });
      return next;
    },
  );
  return (await listLocations(table)).find(
    (l) => l.code === code,
  ) as SqlLocation;
}

export async function updateLocation(
  table: LocationTable,
  code: string,
  input: Row,
): Promise<SqlLocation> {
  await withSqlTransaction(`Updating the ${label(table)}`, async (tx) => {
    const [cur] = await tx.query(
      `SELECT ware_name_eng FROM dbo.[${table}] WHERE LTRIM(RTRIM(ware_cd)) = @c`,
      { c: code },
    );
    if (!cur) throw new SqlWriteError(`${label(table)} not found.`, 404);
    const oldName = txt(cur.ware_name_eng);
    const set = pick(input, LOCATION_COLUMNS);
    if (set.ware_name_eng !== undefined) {
      set.ware_name_eng = txt(set.ware_name_eng).toUpperCase();
      if (!set.ware_name_eng)
        throw new SqlWriteError(`The ${label(table)} needs a name.`, 400);
      if (set.ware_name_eng !== oldName) {
        const used = await locationUsage(tx, table, oldName);
        if (used.length)
          throw new SqlWriteError(
            `"${oldName}" can't be renamed: Textilesoft links rows in ${describeReferences(used)} to it by name.`,
            409,
          );
        const dup = await tx.query(
          `SELECT 1 FROM dbo.[${table}] WHERE LTRIM(RTRIM(ware_name_eng)) = @n`,
          { n: set.ware_name_eng },
        );
        if (dup.length)
          throw new SqlWriteError(
            `"${set.ware_name_eng}" already exists.`,
            409,
          );
      }
    }
    await tx.update(table, set, { ware_cd: code });
  });
  return (await listLocations(table)).find(
    (l) => l.code === code,
  ) as SqlLocation;
}

export async function deleteLocation(
  table: LocationTable,
  code: string,
): Promise<void> {
  await withSqlTransaction(`Deleting the ${label(table)}`, async (tx) => {
    const [cur] = await tx.query(
      `SELECT ware_name_eng FROM dbo.[${table}] WHERE LTRIM(RTRIM(ware_cd)) = @c`,
      { c: code },
    );
    if (!cur) throw new SqlWriteError(`${label(table)} not found.`, 404);
    const used = await locationUsage(tx, table, txt(cur.ware_name_eng));
    if (used.length)
      throw new SqlWriteError(
        `"${txt(cur.ware_name_eng)}" is used in ${describeReferences(used)} and can't be deleted.`,
        409,
      );
    await tx.remove(table, { ware_cd: code });
  });
}

// ------------------------------------------------------------------------------------------------
// Counters (countername + CommonSettings)
// ------------------------------------------------------------------------------------------------

export interface SqlCounterInfo {
  id: string;
  name: string;
  slNo: string;
  /** Bill-number letter (countername.counter_mode). */
  mode: string;
  yearFrom: string | null;
  yearTo: string | null;
  settings: Record<string, string>;
}

const iso = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString().slice(0, 10) : txt(v) || null;

export async function listCounters(): Promise<SqlCounterInfo[]> {
  const [ctrs, settings] = await Promise.all([
    sqlRead(
      "SELECT * FROM dbo.[countername] WHERE NULLIF(LTRIM(RTRIM(counter_name)), '') IS NOT NULL ORDER BY TRY_CAST(sl_no AS int), sl_no",
    ),
    sqlRead("SELECT * FROM dbo.[CommonSettings]").catch(() => [] as Row[]),
  ]);
  return ctrs.map((c) => {
    const name = txt(c.counter_name);
    const s = settings.find(
      (r) => txt(r.Counter).toUpperCase() === name.toUpperCase(),
    );
    const flat: Record<string, string> = {};
    if (s)
      for (const [k, v] of Object.entries(s))
        if (k !== "ID" && k !== "Counter")
          flat[k] = v instanceof Date ? v.toISOString() : txt(v);
    return {
      id: name,
      name,
      slNo: txt(c.sl_no),
      mode: txt(c.counter_mode),
      yearFrom: iso(c.year_from),
      yearTo: iso(c.year_to),
      settings: flat,
    };
  });
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Date value from Textilesoft (datetime column, ISO text or dd/mm/yyyy text) -> epoch ms, or null. */
function when(v: unknown): number | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  const t = txt(v);
  if (!t) return null;
  const dmy = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (dmy) return Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : ms;
}

const bySlNo = (a: Row, b: Row): number =>
  (Number(txt(a.sl_no)) || Number.MAX_SAFE_INTEGER) -
  (Number(txt(b.sl_no)) || Number.MAX_SAFE_INTEGER);

/**
 * The counter a new counter copies its financial-year window (year_from/year_to/last_bil_up_date) and
 * settings from. Textilesoft checks the year window at login, so it must come from a counter that is in
 * use now -- not whichever row SQL returns first (that can be a retired counter with an expired year).
 * Order: most recent bill (last_bil_up_date), then latest year_to, then lowest sl_no.
 */
export function pickReferenceCounter(counters: Row[]): Row | undefined {
  const desc = (a: number | null, b: number | null): number =>
    (b ?? -Infinity) - (a ?? -Infinity) || 0;
  return [...counters].sort(
    (a, b) =>
      desc(when(a.last_bil_up_date), when(b.last_bil_up_date)) ||
      desc(when(a.year_to), when(b.year_to)) ||
      bySlNo(a, b),
  )[0];
}

/**
 * First bill letter not used by any counter. Textilesoft keeps the letter in both counter_mode and
 * st_mode (the ERP writes both), so a letter taken in either column is taken.
 */
export function freeBillLetter(counters: Row[]): string | undefined {
  const used = new Set<string>();
  for (const r of counters)
    for (const v of [r.counter_mode, r.st_mode]) {
      const m = txt(v).toUpperCase();
      if (m) used.add(m);
    }
  return [...LETTERS].find((l) => !used.has(l));
}

/**
 * CommonSettings row a new counter starts from: the reference counter's own row, else the row of the
 * lowest-numbered counter that still exists, else the first row (only when no row belongs to a live
 * counter). Rows left behind by deleted counters are skipped while a live one exists.
 */
export function pickSettingsTemplate(
  settings: Row[],
  counters: Row[],
  ref: Row | undefined,
): Row | undefined {
  const key = (v: unknown) => txt(v).toUpperCase();
  const rowFor = (c: Row) => settings.find((s) => key(s.Counter) === key(c.counter_name));
  if (ref) {
    const own = rowFor(ref);
    if (own) return own;
  }
  for (const c of [...counters].sort(bySlNo)) {
    const r = rowFor(c);
    if (r) return r;
  }
  return [...settings].sort((a, b) => Number(a.ID) - Number(b.ID))[0];
}

export async function createCounter(nameIn: string): Promise<SqlCounterInfo> {
  const name = txt(nameIn).toUpperCase();
  if (!name) throw new SqlWriteError("Enter a counter name, e.g. USER3.", 400);
  if (!/^[A-Z0-9_ -]{1,30}$/.test(name))
    throw new SqlWriteError(
      "Counter names may use letters, numbers, space, - and _ (max 30).",
      400,
    );
  await withSqlTransaction("Adding the counter", async (tx) => {
    const existing = await tx.query(
      "SELECT sl_no, counter_name, counter_mode, st_mode, year_from, year_to, last_bil_up_date FROM dbo.[countername] WITH (UPDLOCK, HOLDLOCK)",
    );
    if (existing.some((r) => txt(r.counter_name).toUpperCase() === name))
      throw new SqlWriteError(`Counter ${name} already exists.`, 409);
    // Each counter needs its own bill letter (bill numbers are letter + number, e.g. A95).
    const letter = freeBillLetter(existing);
    if (!letter)
      throw new SqlWriteError(
        "No free bill letter left for a new counter.",
        409,
      );
    const ref = pickReferenceCounter(existing) ?? {};
    const slNo = String(await tx.nextNumber("countername", "sl_no"));
    await tx.insert("countername", {
      sl_no: slNo,
      counter_name: name,
      date: tsDate(),
      counter_mode: letter,
      st_mode: letter,
      count_days: "0",
      // Same financial-year window as the existing counters (Textilesoft checks it at login).
      year_from: ref.year_from ?? null,
      year_to: ref.year_to ?? null,
      last_bil_up_date: ref.last_bil_up_date ?? null,
    });
    // Start the new counter with the settings of the counter it copied its year from (see pickSettingsTemplate).
    const tpl = pickSettingsTemplate(
      await tx.query("SELECT * FROM dbo.[CommonSettings]"),
      existing,
      pickReferenceCounter(existing),
    );
    if (tpl) {
      const copy: Row = { ...tpl, Counter: name };
      delete copy.ID;
      await tx.insert("CommonSettings", copy);
    }
  });
  return (await listCounters()).find((c) => c.id === name) as SqlCounterInfo;
}

export async function deleteCounter(nameIn: string): Promise<void> {
  const name = txt(nameIn).toUpperCase();
  await withSqlTransaction("Deleting the counter", async (tx) => {
    const [cur] = await tx.query(
      "SELECT counter_name FROM dbo.[countername] WHERE UPPER(LTRIM(RTRIM(counter_name))) = @n",
      { n: name },
    );
    if (!cur) throw new SqlWriteError(`Counter ${name} not found.`, 404);
    // Any row naming the counter blocks the delete: bills (salbill, salsntry.systemname, sales2 ...), users
    // assigned to it (newuser.counter_name), its business date / login state (AccountDate, LoginOpen),
    // petty cash, printer and barcode settings. Only a counter that was never used can go.
    // (CommonSettings names it in a "Counter" column, not matched here; it is removed below with it.)
    const used = await findReferences(tx, "counter", txt(cur.counter_name));
    if (used.length)
      throw new SqlWriteError(
        `Counter ${name} is used in ${describeReferences(used)} and can't be deleted.`,
        409,
      );
    await tx.remove("countername", { counter_name: txt(cur.counter_name) });
    await tx.remove("CommonSettings", { Counter: txt(cur.counter_name) });
  });
}

export interface SettingColumn {
  /** INFORMATION_SCHEMA.COLUMNS.DATA_TYPE, e.g. "bit", "int", "decimal", "datetime", "varchar". */
  type: string;
  nullable: boolean;
  /** CHARACTER_MAXIMUM_LENGTH for text columns (-1 = max). */
  maxLength?: number | null;
}

const INT_TYPES = new Set(["int", "bigint", "smallint", "tinyint"]);
const NUM_TYPES = new Set(["decimal", "numeric", "float", "real", "money", "smallmoney"]);
const DATE_TYPES = new Set(["date", "datetime", "datetime2", "smalldatetime", "datetimeoffset"]);
const TEXT_TYPES = new Set(["char", "varchar", "nchar", "nvarchar", "text", "ntext"]);

/**
 * A setting value from the UI (usually text, as listCounters sends it) -> the JS value for its column type,
 * so the driver sends a bit / number / date instead of a string. Throws SqlWriteError(400) naming the setting.
 */
export function coerceSetting(name: string, value: unknown, col: SettingColumn): unknown {
  const t = col.type.toLowerCase();
  const raw = value === null || value === undefined ? "" : txt(value);
  const bad = (what: string): never => {
    throw new SqlWriteError(`Setting ${name} must be ${what} (got "${raw}").`, 400);
  };
  if (!TEXT_TYPES.has(t) && raw === "") {
    if (col.nullable) return null;
    bad(t === "bit" ? "yes or no" : INT_TYPES.has(t) || NUM_TYPES.has(t) ? "a number" : "a date");
  }
  if (t === "bit") {
    if (typeof value === "boolean") return value;
    if (/^(1|true|yes|y|on)$/i.test(raw)) return true;
    if (/^(0|false|no|n|off)$/i.test(raw)) return false;
    return bad("yes or no");
  }
  if (INT_TYPES.has(t)) {
    if (!/^-?\d+$/.test(raw)) bad("a whole number");
    return Number(raw);
  }
  if (NUM_TYPES.has(t)) {
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n) || !/\d/.test(raw)) bad("a number");
    return n;
  }
  if (DATE_TYPES.has(t)) {
    const d = value instanceof Date ? value : new Date(raw);
    if (Number.isNaN(d.getTime())) bad("a date");
    return d;
  }
  if (TEXT_TYPES.has(t) && col.maxLength && col.maxLength > 0 && raw.length > col.maxLength)
    bad(`at most ${col.maxLength} characters`);
  return raw;
}

/** Updates CommonSettings columns for one counter. Unknown columns are rejected (not silently dropped). */
export async function updateCounterSettings(
  nameIn: string,
  settings: Row,
): Promise<SqlCounterInfo> {
  const name = txt(nameIn).toUpperCase();
  const current = (await listCounters()).find((c) => c.id === name);
  if (!current) throw new SqlWriteError(`Counter ${name} not found.`, 404);
  const allowed = new Set(Object.keys(current.settings));
  const bad = Object.keys(settings).filter((k) => !allowed.has(k));
  if (bad.length)
    throw new SqlWriteError(
      `Unknown counter setting(s): ${bad.join(", ")}.`,
      400,
    );
  const types = new Map(
    (
      await sqlRead(
        "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'CommonSettings'",
      )
    ).map((r) => [
      txt(r.COLUMN_NAME).toLowerCase(),
      {
        type: txt(r.DATA_TYPE),
        nullable: txt(r.IS_NULLABLE).toUpperCase() === "YES",
        maxLength: r.CHARACTER_MAXIMUM_LENGTH == null ? null : Number(r.CHARACTER_MAXIMUM_LENGTH),
      } as SettingColumn,
    ]),
  );
  const set: Row = {};
  for (const [k, v] of Object.entries(settings)) {
    const col = types.get(k.toLowerCase());
    // Column type unknown (schema not readable): keep the old behaviour, send text.
    set[k] = col ? coerceSetting(k, v, col) : txt(v);
  }
  await withSqlTransaction("Saving counter settings", async (tx) => {
    const n = await tx.update("CommonSettings", set, { Counter: name });
    if (!n)
      throw new SqlWriteError(
        `Counter ${name} has no settings row in Textilesoft.`,
        404,
      );
  });
  return (await listCounters()).find((c) => c.id === name) as SqlCounterInfo;
}

// ------------------------------------------------------------------------------------------------
// Business profile (the ERP's shop header) from the main company
// ------------------------------------------------------------------------------------------------

/** GSTIN state code -> state name (first two digits of a GSTIN). */
const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

export function stateFromGstin(gstin: string): string {
  return GST_STATES[gstin.slice(0, 2)] ?? "";
}

/** The ERP business-profile shape, built from the main Textilesoft company. */
export async function businessProfileFromSql() {
  const c = await mainCompany();
  if (!c)
    throw new SqlWriteError(
      "No company is set up in Textilesoft (companydetail is empty).",
      404,
    );
  const address = [c.address, c.address1, c.address2, c.address3]
    .filter(Boolean)
    .join(", ");
  return {
    source: "sql",
    companyCode: c.code,
    businessName: c.printName || c.name,
    legalName: c.name,
    address,
    phone: c.mobile || c.phone,
    email: c.email,
    gstNumber: c.gstin,
    gstin: c.gstin,
    pan: c.pan,
    bank: {
      name: c.bankName,
      accountName: c.accountName,
      accountNumber: c.accountNumber,
      branch: c.bankBranch,
      ifsc: c.ifsc,
    },
    tenantAddress: {
      street: address,
      city: c.city,
      state: stateFromGstin(c.gstin),
      zipCode: c.pincode,
      country: "India",
    },
  };
}

/** Profile fields that have a place in companydetail; anything else can't be stored in Textilesoft. */
const PROFILE_TO_COMPANY: Record<string, string> = {
  businessName: "printName",
  legalName: "name",
  address: "address",
  phone: "mobile",
  email: "email",
  gstNumber: "gstin",
  gstin: "gstin",
  pan: "pan",
};

export async function updateBusinessProfileInSql(body: Row) {
  const c = await mainCompany();
  if (!c)
    throw new SqlWriteError(
      "No company is set up in Textilesoft (companydetail is empty).",
      404,
    );
  const unsupported = Object.keys(body).filter(
    (k) => !(k in PROFILE_TO_COMPANY),
  );
  if (unsupported.length) {
    throw new SqlWriteError(
      `These settings have no place in Textilesoft's company details and were not saved: ${unsupported.join(", ")}.`,
      400,
    );
  }
  const input: Row = {};
  for (const [k, v] of Object.entries(body)) input[PROFILE_TO_COMPANY[k]] = v;
  await updateCompany(c.code, input);
  return businessProfileFromSql();
}
