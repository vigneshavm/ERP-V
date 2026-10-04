/**
 * Staff directory on Textilesoft's own employee master, dbo.newemployee (no MongoDB, no new tables).
 * The category / group / section pick-lists are Textilesoft's empolyeecatagary, empolyeegroupentry and
 * empolyeesectionentry (read only here). Textilesoft keeps every value as text; `code` is MAX+1.
 *
 * dbo.newemployee has no primary key or unique index on `code` (checked on the shop database), so uniqueness is
 * enforced here: the code is allocated MAX+1 under a table lock, and a save is refused if the code (or the name)
 * is already used, or if the code would be blank.
 *
 * Only the columns below are read or written; every other newemployee column (photo, attendance code,
 * cancel flags ...) is left exactly as it is on update and empty on insert.
 * A salesperson on a bill is stored as this `code` in salsntry.sls_man, so an employee whose code is used
 * on a bill cannot be deleted.
 */
import { sqlRead, withSqlTransaction, SqlWriteError, txt, type Row } from "./sqlWrite.js";

/** API field -> newemployee column. */
const FIELDS: Record<string, string> = {
  name: "name_eng", nameTamil: "name_tam", gender: "genter", bloodGroup: "blood_grup",
  mobile: "mb_nu", phone: "ph_nu", address: "address_eng", city: "city_eng", pinCode: "pin_code",
  category: "catagaray", group: "grup", section: "section",
  salary: "salary", totalSalary: "tot_salary", batta: "batta", pf: "pf", pfNo: "pf_nu", esi: "esa", advance: "ad_amm",
  commissionPercent: "com_per", commissionFromAmount: "com_from_amt", targetAmount1: "target_amount1", targetAmount2: "target_amount2",
  attendanceCardNo: "att_card_nu", idNo: "id_cd_nu",
  bankAccountName: "ac_name", bankAccountNo: "ac_nu", bankName: "banck_name", bankIfsc: "ifsc_cd",
};
/** Fields that must be numbers when given. */
const NUMERIC = new Set(["salary", "totalSalary", "batta", "pf", "esi", "advance", "commissionPercent", "commissionFromAmount", "targetAmount1", "targetAmount2"]);

export interface SqlEmployee { code: string; [field: string]: string }

const toEmployee = (r: Row): SqlEmployee => {
  const out: SqlEmployee = { code: txt(r.code) };
  for (const [field, col] of Object.entries(FIELDS)) out[field] = txt(r[col]);
  return out;
};

const SELECT_COLS = ["code", ...Object.values(FIELDS)].map((c) => `[${c}]`).join(", ");

export async function listEmployees(): Promise<SqlEmployee[]> {
  const rows = await sqlRead(`SELECT ${SELECT_COLS} FROM dbo.[newemployee]`);
  return rows.map(toEmployee).sort((a, b) => Number(a.code) - Number(b.code) || a.name.localeCompare(b.name));
}

export async function getEmployee(code: string): Promise<SqlEmployee> {
  const rows = await sqlRead(`SELECT TOP 2 ${SELECT_COLS} FROM dbo.[newemployee] WHERE LTRIM(RTRIM([code])) = @c`, { c: txt(code) });
  if (!rows.length) throw new SqlWriteError("Employee not found.", 404);
  if (rows.length > 1) throw new SqlWriteError("Employee code matches multiple SQL records.", 409);
  return toEmployee(rows[0]);
}

/** Textilesoft's pick-lists for category, group and section (names only). */
export async function employeeLookups(): Promise<{ categories: string[]; groups: string[]; sections: string[] }> {
  const names = async (table: string): Promise<string[]> => {
    try {
      const rows = await sqlRead(`SELECT [name_eng] FROM dbo.[${table}]`);
      return rows.map((r) => txt(r.name_eng)).filter(Boolean);
    } catch {
      return [];
    }
  };
  const [categories, groups, sections] = await Promise.all([names("empolyeecatagary"), names("empolyeegroupentry"), names("empolyeesectionentry")]);
  return { categories, groups, sections };
}

const ALL_COLUMNS = Object.values(FIELDS);

function clean(input: Row, requireName: boolean): Row {
  const out: Row = {};
  for (const [field, col] of Object.entries(FIELDS)) {
    if (input[field] === undefined) continue;
    const v = txt(input[field]);
    if (NUMERIC.has(field) && v !== "" && !Number.isFinite(Number(v)))
      throw new SqlWriteError(`${field} must be a number.`, 400);
    out[col] = field === "name" ? v.toUpperCase() : v;
  }
  if ((requireName || out.name_eng !== undefined) && !txt(out.name_eng))
    throw new SqlWriteError("The employee needs a name.", 400);
  return out;
}

export async function createEmployee(input: Row): Promise<SqlEmployee> {
  const cols = clean(input, true);
  const code = await withSqlTransaction("Saving the employee", async (tx) => {
    const dup = await tx.query(`SELECT 1 FROM dbo.[newemployee] WHERE LTRIM(RTRIM([name_eng])) = @n`, { n: cols.name_eng });
    if (dup.length) throw new SqlWriteError(`Employee "${cols.name_eng}" already exists.`, 409);
    const next = String(await tx.nextNumber("newemployee", "code")).trim();
    if (!next) throw new SqlWriteError("Could not allocate an employee code.", 500);
    const taken = await tx.query(`SELECT 1 FROM dbo.[newemployee] WHERE LTRIM(RTRIM([code])) = @c`, { c: next });
    if (taken.length) throw new SqlWriteError(`Employee code ${next} is already used; nothing was saved.`, 409);
    await tx.insert("newemployee", { ...Object.fromEntries(ALL_COLUMNS.map((c) => [c, ""])), ...cols, code: next });
    return next;
  });
  return getEmployee(code);
}

export async function updateEmployee(code: string, input: Row): Promise<SqlEmployee> {
  const cols = clean(input, false);
  const c = txt(code);
  if (!c) throw new SqlWriteError("Employee not found.", 404);
  await withSqlTransaction("Updating the employee", async (tx) => {
    const found = await tx.query(`SELECT [name_eng] FROM dbo.[newemployee] WHERE LTRIM(RTRIM([code])) = @c`, { c });
    if (found.length === 0) throw new SqlWriteError("Employee not found.", 404);
    if (found.length > 1) throw new SqlWriteError(`Employee code ${c} is used by more than one row; fix it in Textilesoft first.`, 409);
    if (cols.name_eng !== undefined) {
      const dup = await tx.query(`SELECT 1 FROM dbo.[newemployee] WHERE LTRIM(RTRIM([name_eng])) = @n AND LTRIM(RTRIM([code])) <> @c`, { n: cols.name_eng, c });
      if (dup.length) throw new SqlWriteError(`Employee "${cols.name_eng}" already exists.`, 409);
    }
    if (Object.keys(cols).length) await tx.update("newemployee", cols, { code: c });
  });
  return getEmployee(c);
}

export async function deleteEmployee(code: string): Promise<void> {
  const c = txt(code);
  if (!c) throw new SqlWriteError("Employee not found.", 404);
  await withSqlTransaction("Deleting the employee", async (tx) => {
    const found = await tx.query(`SELECT [name_eng] FROM dbo.[newemployee] WHERE LTRIM(RTRIM([code])) = @c`, { c });
    if (found.length === 0) throw new SqlWriteError("Employee not found.", 404);
    if (found.length > 1) throw new SqlWriteError(`Employee code ${c} is used by more than one row; fix it in Textilesoft first.`, 409);
    const used = await tx.query(`SELECT TOP 1 1 AS x FROM dbo.[salsntry] WHERE LTRIM(RTRIM([sls_man])) = @c`, { c });
    if (used.length) throw new SqlWriteError("This employee is the salesperson on existing bills, so it cannot be deleted.", 409, "EMPLOYEE_IN_USE");
    await tx.remove("newemployee", { code: c });
  });
}

/** Codes (of those given) that are not in dbo.newemployee. Used to refuse a bill naming an unknown salesperson. */
export async function unknownEmployeeCodes(codes: string[]): Promise<string[]> {
  const wanted = [...new Set(codes.map(txt).filter(Boolean))];
  if (!wanted.length) return [];
  const rows = await sqlRead(`SELECT [code] FROM dbo.[newemployee]`);
  const have = new Set(rows.map((r) => txt(r.code)));
  return wanted.filter((c) => !have.has(c));
}
