/**
 * Read-only party masters from Textilesoft's existing tables (no schema change, no writes):
 *   customers       dbo.newcustomer   (the table Textilesoft's screens read/write; customercmyname is a separate company-wise copy) (sl_nu, card_number, eng_name, mobile_nu, ...)
 *   agents          dbo.agentdetail
 *   cashiers        dbo.cashiername       (the password column is never read)
 *   customer groups dbo.CustomerGroup
 * Legacy IDs are kept as-is: a customer's id is its card number (falling back to sl_nu).
 */
import { sqlRead, txt, SqlWriteError, withSqlTransaction, tsDate, type Row, type SqlTx } from "./sqlWrite.js";

const num = (v: unknown): number => {
  const n = Number(txt(v));
  return Number.isFinite(n) ? n : 0;
};
const balance = (value: unknown): number | null => {
  const text = txt(value); if (!text) return null;
  const amount = Number(text); if (!Number.isFinite(amount)) throw new SqlWriteError("Native customer balance is not numeric.", 409);
  return amount;
};
const addr = (r: Record<string, unknown>): string =>
  [r.eng_address, r.Adress1, r.Adress2, r.Adress3, r.Adress4, r.Adress5, r.eng_address1, r.eng_address2, r.eng_address3, r.eng_address4, r.eng_address5]
    .map(txt).filter(Boolean).join(", ");

function toCustomer(r: Record<string, unknown>) {
  const id = txt(r.card_number) || txt(r.sl_nu);
  return {
    _id: id,
    id,
    slNo: txt(r.sl_nu),
    cardNumber: txt(r.card_number),
    name: txt(r.eng_name),
    phone: txt(r.mobile_nu) || txt(r.phone_nu),
    email: txt(r.emil_id),
    address: addr(r),
    city: txt(r.eng_city),
    pincode: txt(r.pin_code),
    gstNo: txt(r.gst_no),
    discountPercent: num(r.discount),
    loyaltyPoints: num(r.points),
    creditDays: num(r.creditdays),
    outstanding: num(r.SaleBalance),
    creditBalance: balance(r.creditbalance),
    points: balance(r.points),
    birthday: txt(r.dob),
    weddingDate: txt(r.wedding_date),
    source: "sql" as const,
  };
}

export async function listCustomers(search?: string, limit = 200) {
  const s = (search ?? "").trim();
  const rows = await sqlRead(
    `SELECT TOP (@lim) * FROM dbo.[newcustomer]
      WHERE @s = '' OR eng_name LIKE '%' + @s + '%' OR mobile_nu LIKE '%' + @s + '%' OR card_number LIKE '%' + @s + '%'
      ORDER BY TRY_CAST(sl_nu AS int), sl_nu`,
    { s, lim: Math.min(1000, Math.max(1, limit)) },
  );
  return rows.map(toCustomer);
}

export async function getCustomer(id: string) {
  const rows = await sqlRead(
    `SELECT TOP 2 * FROM dbo.[newcustomer]
      WHERE LTRIM(RTRIM(card_number)) = @id OR LTRIM(RTRIM(sl_nu)) = @id`,
    { id: id.trim() },
  );
  if (rows.length > 1) throw new SqlWriteError("Customer key matches multiple SQL records.", 409);
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function listAgents() {
  const rows = await sqlRead(
    "SELECT * FROM dbo.[agentdetail] ORDER BY TRY_CAST(sl_nu AS int), sl_nu",
  );
  return rows.map((r) => {
    const id = txt(r.card_number) || txt(r.sl_nu);
    return {
      _id: id, id, slNo: txt(r.sl_nu), cardNumber: txt(r.card_number),
      name: txt(r.eng_name), phone: txt(r.mobile_nu) || txt(r.phone_nu),
      email: txt(r.emil_id), address: addr(r), city: txt(r.eng_city),
      discountPercent: num(r.discount), source: "sql" as const,
    };
  });
}

export async function listCashiers() {
  const rows = await sqlRead(
    "SELECT sl_no, cashier_name, cashier_mode, cashier_bil_no_strt, cashier_bil_no_rest FROM dbo.[cashiername] ORDER BY TRY_CAST(sl_no AS int), sl_no",
  );
  return rows.map((r) => ({
    _id: txt(r.sl_no), id: txt(r.sl_no), name: txt(r.cashier_name),
    mode: txt(r.cashier_mode), billNoStart: txt(r.cashier_bil_no_strt),
    billNoReset: txt(r.cashier_bil_no_rest), source: "sql" as const,
  }));
}

export async function listCustomerGroups() {
  const rows = await sqlRead("SELECT ID, code, name FROM dbo.[CustomerGroup] ORDER BY ID");
  return rows.map((r) => ({ _id: txt(r.code) || txt(r.ID), id: txt(r.code) || txt(r.ID), code: txt(r.code), name: txt(r.name), source: "sql" as const }));
}

/** Barcodes that appear on more than one row -- a barcode should identify one purchase lot. Read-only. */
export async function duplicateBarcodes(limit = 200) {
  const out: Record<string, { barcode: string; rows: number }[]> = {};
  for (const table of ["purentrydetails", "stockdetails"]) {
    try {
      const rows = await sqlRead(
        `SELECT TOP (@lim) LTRIM(RTRIM(barcode)) AS barcode, COUNT(*) AS n
           FROM dbo.[${table}] WHERE NULLIF(LTRIM(RTRIM(barcode)), '') IS NOT NULL
          GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC`,
        { lim: limit },
      );
      out[table] = rows.map((r) => ({ barcode: txt(r.barcode), rows: Number(r.n) }));
    } catch {
      out[table] = [];
    }
  }
  return out;
}


async function requirePartyWrite(tx: SqlTx, table: "newcustomer" | "agentdetail" | "sales2", permission: "INSERT" | "UPDATE") {
  const rows = await tx.query("SELECT HAS_PERMS_BY_NAME(@object, 'OBJECT', @permission) AS allowed", { object: "dbo." + table, permission });
  if (Number(rows[0]?.allowed) !== 1) throw new SqlWriteError("The configured SQL writer lacks " + permission + " permission on dbo." + table + ". This operation is unavailable; no permissions or data were changed.", 503, "SQL_NATIVE_PARTY_WRITE_UNAVAILABLE");
}

type Field = "mobile" | "card" | "name";
export async function changeCustomerField(id: string, field: Field, rawValue: unknown) {
  if (typeof rawValue !== "string") throw new SqlWriteError("New customer value must be text.", 400);
  const key = txt(id), value = txt(rawValue);
  if (!key || !value) throw new SqlWriteError("Customer and new value are required.", 400);
  if (!["mobile", "card", "name"].includes(field)) throw new SqlWriteError("Unsupported customer field.", 400);
  if (field === "mobile" && !/^\d{10}$/.test(value)) throw new SqlWriteError("Mobile number must be 10 digits.", 400);
  if (value.length > (field === "name" ? 200 : 50)) throw new SqlWriteError("The new value is too long.", 400);
  const column = field === "mobile" ? "mobile_nu" : field === "card" ? "card_number" : "eng_name";
  await withSqlTransaction("Changing the customer and matching bill history", async tx => {
    await requirePartyWrite(tx, "newcustomer", "UPDATE");
    await requirePartyWrite(tx, "sales2", "UPDATE");
    const found = await tx.query(
      "SELECT * FROM dbo.[newcustomer] WITH (UPDLOCK, HOLDLOCK) WHERE LTRIM(RTRIM(card_number)) = @key OR LTRIM(RTRIM(sl_nu)) = @key", { key },
    );
    if (!found.length) throw new SqlWriteError("Customer not found.", 404);
    if (found.length !== 1) throw new SqlWriteError("Customer card/serial identity is ambiguous.", 409);
    const current = { ...found[0] };
    if (!txt(current.sl_nu) || !txt(current.card_number) || !txt(current.eng_name))
      throw new SqlWriteError("The existing customer identity is incomplete; no history was changed.", 409);
    const serialRows = await tx.query("SELECT sl_nu FROM dbo.[newcustomer] WITH (UPDLOCK, HOLDLOCK) WHERE sl_nu = @serial OR card_number = @card", { serial: current.sl_nu, card: current.card_number });
    if (serialRows.length !== 1) throw new SqlWriteError("Existing card/serial belongs to multiple rows.", 409);
    if (txt(current[column]) === value) return;
    const duplicate = await tx.query(
      `SELECT 1 AS duplicate FROM dbo.[newcustomer] WITH (UPDLOCK, HOLDLOCK) WHERE LTRIM(RTRIM([${column}])) = @value AND sl_nu <> @serial`,
      { value, serial: current.sl_nu },
    );
    if (duplicate.length) throw new SqlWriteError("The new value already belongs to another customer.", 409);
    if (field === "card") {
      const collision = await tx.query("SELECT 1 AS duplicate FROM dbo.[newcustomer] WITH (UPDLOCK, HOLDLOCK) WHERE sl_nu = @value AND sl_nu <> @serial", { value, serial: current.sl_nu });
      if (collision.length) throw new SqlWriteError("New card collides with another serial identity.", 409);
    }
    const affected = await tx.update("newcustomer", { [column]: value }, { sl_nu: current.sl_nu, card_number: current.card_number, eng_name: current.eng_name, mobile_nu: current.mobile_nu });
    if (affected !== 1) throw new SqlWriteError("Customer changed concurrently; no history was changed.", 409);
    // The three compiled Table_Update handlers explicitly update these historical bill fields.
    const historyColumn = field === "mobile" ? "mbl_no" : field === "card" ? "cus_card" : "cus_name";
    await tx.query(`SELECT TOP 0 [${historyColumn}],cus_card,cus_name,mbl_no FROM dbo.[sales2]`);
    await tx.update("sales2", { [historyColumn]: value }, { cus_card: current.card_number, cus_name: current.eng_name, mbl_no: current.mobile_nu });
  });
  const result = await getCustomer(field === "card" ? value : key);
  if (!result) throw new SqlWriteError("Changed customer could not be read back.", 503);
  return result;
}

const NATIVE_PARTY_FIELDS = new Set(["name", "cardNumber", "mobile", "phone", "email", "address", "address1", "address2", "address3", "address4", "address5", "city", "pincode", "discountPercent", "birthday", "weddingDate", "creditDays", "religion"]);

function partyDate(value: unknown): string {
  const date = txt(value);
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new SqlWriteError("Use a valid YYYY-MM-DD party date.", 400);
  return date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4);
}
function nativePartyInput(data: Row, agent: boolean): Row {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new SqlWriteError("Party fields are required.", 400);
  if (Object.keys(data).some(key => !NATIVE_PARTY_FIELDS.has(key) || (agent && ["creditDays", "religion"].includes(key))))
    throw new SqlWriteError("Unsupported party field; no substitute storage is used.", 400);
  const name = txt(data.name), card = txt(data.cardNumber), mobile = txt(data.mobile);
  if (Object.values(data).some(value => value != null && (typeof value !== "string" && typeof value !== "number" || String(value).length > 100))) throw new SqlWriteError("Party fields must be text/numbers of at most 100 characters.", 400);
  if (!name || !card || !mobile) throw new SqlWriteError("Name, card number and mobile are required.", 400);
  if (!/^\d{10}$/.test(mobile)) throw new SqlWriteError("Mobile number must be 10 digits.", 400);
  const discount = Number(data.discountPercent ?? 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) throw new SqlWriteError("Bill discount must be between 0 and 100.", 400);
  const row: Row = { card_number: card, eng_name: name, eng_city: txt(data.city), pin_code: txt(data.pincode), phone_nu: txt(data.phone), mobile_nu: mobile, emil_id: txt(data.email), date: tsDate(), discount: String(discount), dob: partyDate(data.birthday), wedding_date: partyDate(data.weddingDate) };
  if (agent) {
    for (let i = 1; i <= 5; i++) row[`eng_address${i}`] = txt(data[`address${i}`] ?? (i === 1 ? data.address : undefined));
  } else {
    row.eng_address = txt(data.address);
    for (let i = 1; i <= 5; i++) row[`Adress${i}`] = txt(data[`address${i}`]);
    const days = Number(data.creditDays ?? 0);
    if (!Number.isSafeInteger(days) || days < 0) throw new SqlWriteError("Credit days must be a non-negative integer.", 400);
    row.creditdays = String(days); row.religion = txt(data.religion);
  }
  return row;
}

async function createNativeParty(table: "agentdetail" | "newcustomer", data: Row): Promise<string> {
  const row = nativePartyInput(data, table === "agentdetail");
  let serial = "";
  await withSqlTransaction("Registering the native party", async tx => {
    await requirePartyWrite(tx, table, "INSERT");
    await tx.query(`SELECT TOP 0 [${["sl_nu", ...Object.keys(row)].join("],[")}] FROM dbo.[${table}]`);
    const duplicates = await tx.query(`SELECT 1 AS duplicate FROM dbo.[${table}] WITH (UPDLOCK, HOLDLOCK) WHERE card_number = @card OR mobile_nu = @mobile OR sl_nu = @card`, { card: row.card_number, mobile: row.mobile_nu });
    if (duplicates.length) throw new SqlWriteError("Card/mobile already exists or collides with a serial identity.", 409);
    serial = String(await tx.nextNumber(table, "sl_nu"));
    const serialCollision = await tx.query(`SELECT 1 AS duplicate FROM dbo.[${table}] WHERE card_number = @serial`, { serial });
    if (serialCollision.length) throw new SqlWriteError("Allocated serial collides with an existing card; no party saved.", 409);
    await tx.insert(table, { ...row, sl_nu: serial });
  });
  return serial;
}

export async function createDifferentCustomer(data: Row) {
  const serial = await createNativeParty("newcustomer", data);
  const rows = await sqlRead("SELECT * FROM dbo.[newcustomer] WHERE sl_nu = @serial", { serial });
  if (rows.length !== 1) throw new SqlWriteError("Created customer could not be read back uniquely.", 503);
  return toCustomer(rows[0]);
}

export async function createNativeAgent(data: Row) {
  const serial = await createNativeParty("agentdetail", data);
  const agent = (await listAgents()).filter(row => row.slNo === serial);
  if (agent.length !== 1) throw new SqlWriteError("Created agent could not be read back uniquely.", 503);
  return agent[0];
}
