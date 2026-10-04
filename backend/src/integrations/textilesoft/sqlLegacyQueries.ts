import { sqlRead, txt, SqlWriteError, sqlWriter, type Row } from "./sqlWrite.js";

const complete = (rows: Row[]) => {
  if (rows.length > 5000) throw new SqlWriteError("More than 5000 records match; narrow the filters. No partial report is presented.", 400);
  return rows;
};
const day = (value: unknown) => {
  const text = txt(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)
    throw new SqlWriteError("Use a valid YYYY-MM-DD date.", 400);
  return text;
};

/** MissingSalesReport.GridFind: ESC=1, deleted line=0; these are not missing bill numbers. */
export async function legacyMissingSales(input: Row) {
  const from = day(input.from), to = day(input.to), status = txt(input.status);
  if (from > to) throw new SqlWriteError("From date must not follow To date.", 400);
  if (status && !["0", "1"].includes(status)) throw new SqlWriteError("Choose ESC or Delete status.", 400);
  const page = Math.max(1, parseInt(txt(input.page), 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(txt(input.limit), 10) || 100));
  const where = `FROM dbo.[Escsave] WHERE CONVERT(date,DateTime) BETWEEN @from AND @to
      AND (@counter='' OR counterName=@counter) AND (@login='' OR LoginName=@login) AND (@status='' OR status=@status)`;
  const filters = { from, to, counter: txt(input.counter), login: txt(input.login), status };
  const [count] = await sqlRead(`SELECT COUNT(*) AS total ${where}`, filters);
  const total = Number(count?.total ?? 0);
  const rows = await sqlRead(
    `SELECT SmNo,barcode,code,productname,Mrp,qty,amt,Pdisperc,Pdisamt,Bdisperc,Billdisamt,Billless,Billnetamt,DateTime,counterName,LoginName,
      CASE WHEN status='1' THEN 'ESC' WHEN status='0' THEN 'Delete' ELSE '' END AS status
      ${where} ORDER BY DateTime,SmNo OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`,
    { ...filters, off: (page - 1) * limit, lim: limit },
  );
  return { rows, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

/** barcode.aspx.btnRCGRN_Click and btnREFGRN_Click use two distinct native relationships. */
export async function legacyGrnDetails(kind: "rc" | "reference", value: string) {
  if (!txt(value)) throw new SqlWriteError("GRN identifier is required.", 400);
  if (kind === "rc") return complete(await sqlRead(
    `SELECT TOP (5001) r.RCGRN,r.grn_no,r.sl_no,r.barcode,r.code,r.pname,r.qty,r.brand,r.patrn,r.size,r.color,r.style,p.design,p.mtr,p.fqty,p.mrp,p.cr_rate,p.pratecode
      FROM dbo.[ratecha] r INNER JOIN dbo.[purentrydetails] p ON p.barcode=r.barcode WHERE r.RCGRN=@value ORDER BY r.sl_no`, { value: txt(value) },
  ));
  if (kind !== "reference") throw new SqlWriteError("Unsupported GRN relationship.", 400);
  return complete(await sqlRead(
    `SELECT TOP (5001) c.CLREFGRN,p.grn_no,p.sl_no,p.barcode,p.design,p.code,p.pname,p.mtr,p.qty,p.fqty,p.mrp,p.cr_per,p.cr_rate,p.brand,p.patrn,p.size,p.color,p.style,p.pratecode
      FROM dbo.[clientpurentrydetails] c INNER JOIN dbo.[purentrydetails] p ON p.barcode=c.barcode WHERE c.CLREFGRN=@value ORDER BY p.sl_no`, { value: txt(value) },
  ));
}

export async function legacySalesmen() {
  return complete(await sqlRead("SELECT TOP (5001) code,name_eng FROM dbo.[newemployee] WHERE NULLIF(LTRIM(RTRIM(code)),'') IS NOT NULL GROUP BY code,name_eng ORDER BY code"));
}

/** Legacy cancellation refuses any barcode with saved sales, even if subsequently returned. */
export async function assertBarcodeUnused(barcode: string) {
  if (!txt(barcode)) throw new SqlWriteError("Barcode is required.", 400);
  const used = await sqlRead("SELECT TOP 1 barcode FROM dbo.[salsntry] WHERE barcode=@barcode", { barcode: txt(barcode) });
  if (used.length) throw new SqlWriteError("Already this barcode sale: cancellation is prohibited; history is retained.", 409, "BARCODE_ALREADY_SOLD");
}

/** Permission metadata from the actual configured writer; no grant or business write. */
export async function legacyNativeCapabilities() {
  const { pool } = await sqlWriter();
  const response = await pool.request().query(
    "SELECT HAS_PERMS_BY_NAME('dbo.newcustomer','OBJECT','INSERT') AS customerRegister,HAS_PERMS_BY_NAME('dbo.agentdetail','OBJECT','INSERT') AS agentRegister,HAS_PERMS_BY_NAME('dbo.newcustomer','OBJECT','UPDATE') AS customerUpdate,HAS_PERMS_BY_NAME('dbo.sales2','OBJECT','UPDATE') AS historyUpdate",
  );
  const row = response.recordset?.[0];
  if (!row) throw new SqlWriteError("SQL writer capabilities could not be inspected.", 503);
  return { customerRegister: Number(row.customerRegister) === 1, agentRegister: Number(row.agentRegister) === 1, customerChange: Number(row.customerUpdate) === 1 && Number(row.historyUpdate) === 1 };
}
