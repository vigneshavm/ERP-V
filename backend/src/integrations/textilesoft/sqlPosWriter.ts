/**
 * ERP POS -> Textilesoft bills. Writes a POS bill into the shop database the way Textilesoft's own billing
 * does: one header row in dbo.sales2 and one row per line in dbo.salsntry, joined on
 * sysidandbill = systemidbill. Also reads the billing counters (dbo.countername) for the POS counter picker.
 *
 * The column conventions below were derived from Textilesoft's own recent bills (e.g. bill A95 of
 * 2 Jan 2026, SERVER counter), because Textilesoft's billing code is compiled and none of its stored
 * procedures or triggers write these tables:
 *   - billno       daily sequence per counter (bill_option: sys_bil_no_rest = DAILY), e.g. 95
 *   - mode         counter letter (countername.counter_mode) + billno, e.g. "A95"; Lmode = "K" + mode
 *   - sysidandbill counter serial (countername.sl_no) + DDMMYY + billno, e.g. "1" + "020126" + "95"
 *   - cmny_bill    company series (bill_option.cmny_mode, e.g. "DA") + running number, e.g. "DA142426"
 *   - amounts      GST-inclusive: amount = net_amount = qty * price; rate = price ex-GST;
 *                  tax = amount - gstcrossamt; cgst = sgst = tax / 2; header gst5/12/18/28 = tax per rate
 *   - status '0' = live bill ('1' = cancelled), SBillStatus '1', paymenttype '0'
 * Running line counters (count_IDBillno, comp_continu_billno, cmy_wo_continu_billno) continue from the
 * latest line; their exact meaning in Textilesoft is not documented, so they are best-effort.
 *
 * Writing is OFF unless TEXTILESOFT_POS_WRITE=on, and uses its own login (TEXTILESOFT_DB_WRITE_USER /
 * TEXTILESOFT_DB_WRITE_PASSWORD) because the ERP's normal login is read-only. Only columns that exist in
 * the target tables are written (checked against INFORMATION_SCHEMA at run time).
 */
import { loadDbConfig } from "./shopDbReader.js";
import { getPool } from "./sqlItemSource.js";
import { info } from "../../config/logger.js";
import { healDbAccess } from "./sqlDbAccess.js";

/** Error with an HTTP status: 400 = the bill itself is wrong (not retried), 503 = shop DB unavailable (retried). */
export class SqlPosError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
    }
}

const onFlag = (v: string | undefined): boolean => /^(1|true|on|yes)$/i.test((v ?? "").trim());

export function isSqlPosWriteEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return onFlag(env.TEXTILESOFT_POS_WRITE);
}

// ------------------------------------------------------------------------------------------------
// Counters (read-only login)
// ------------------------------------------------------------------------------------------------

export interface SqlCounter {
    /** Textilesoft counter name, e.g. "SERVER" -- also the ERP counter id and the bill's systemname. */
    id: string;
    name: string;
    /** Bill-number letter, e.g. "A". */
    mode: string;
    /** Serial used as the first part of sysidandbill. */
    slNo: string;
}

export async function sqlCounters(): Promise<SqlCounter[]> {
    const req = (await getPool()).request();
    const res = await req.query(
        "SELECT sl_no, counter_name, counter_mode FROM dbo.[countername] WHERE NULLIF(LTRIM(RTRIM(counter_name)), '') IS NOT NULL ORDER BY TRY_CAST(sl_no AS int), sl_no",
    );
    const rows = (res as { recordset: Record<string, unknown>[] }).recordset ?? [];
    return rows.map((r) => {
        const id = String(r.counter_name ?? "").trim();
        return { id, name: id, mode: String(r.counter_mode ?? "").trim(), slNo: String(r.sl_no ?? "").trim() };
    });
}

// ------------------------------------------------------------------------------------------------
// Writer pool (write login, no read-only intent)
// ------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mssql = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let writerPromise: Promise<{ mssql: Mssql; pool: any; database: string }> | null = null;

async function writer() {
    if (!writerPromise) {
        writerPromise = (async () => {
            const cfg = loadDbConfig();
            const mssql = (await import("mssql")).default;
            const makePool = () => new mssql.ConnectionPool({
                server: cfg.server,
                port: cfg.instanceName ? undefined : cfg.port,
                database: cfg.database,
                user: process.env.TEXTILESOFT_DB_WRITE_USER || cfg.user,
                password: process.env.TEXTILESOFT_DB_WRITE_PASSWORD || cfg.password,
                connectionTimeout: cfg.connectionTimeoutMs,
                requestTimeout: 30000,
                pool: { max: 2, min: 0 },
                options: { instanceName: cfg.instanceName, encrypt: cfg.encrypt, trustServerCertificate: cfg.trustServerCertificate },
            });
            let pool = makePool();
            try {
                await pool.connect();
            } catch (err) {
                // After a restore the write login has no database user: re-apply access and retry once.
                if (!(await healDbAccess(err))) throw err;
                pool = makePool();
                await pool.connect();
            }
            info(`[sql-pos] writer connected to database '${cfg.database}'`);
            return { mssql, pool, database: cfg.database };
        })().catch((err) => {
            writerPromise = null;
            throw err;
        });
    }
    return writerPromise;
}

// Existing columns per table (cached): only these are written.
const columnCache = new Map<string, Set<string>>();
async function columnsOf(pool: { request(): { input(n: string, v: unknown): unknown; query(t: string): Promise<{ recordset: Record<string, unknown>[] }> } }, table: string): Promise<Set<string>> {
    const cached = columnCache.get(table);
    if (cached) return cached;
    const req = pool.request();
    req.input("t", table);
    const res = await req.query("SELECT COLUMN_NAME AS c, COLUMNPROPERTY(OBJECT_ID('dbo.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS ident FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @t");
    // Identity columns are filled by SQL Server; mark them so they're never inserted explicitly.
    const set = new Set<string>();
    for (const r of res.recordset) set.add(Number(r.ident) === 1 ? `#identity:${String(r.c)}` : String(r.c));
    if (set.size === 0) throw new SqlPosError(`Table dbo.${table} was not found in the shop database.`, 503);
    columnCache.set(table, set);
    return set;
}

// ------------------------------------------------------------------------------------------------
// Bill
// ------------------------------------------------------------------------------------------------

export interface SqlPosLine {
    barcode: string;
    name: string;
    hsn?: string;
    group?: string;
    unit?: string;
    gstRate: number;
    qty: number;
    /** Price per unit as charged to the customer, GST included. */
    unitPriceIncl: number;
}

export interface SqlPosBill {
    counter: string;
    /** Login recorded on the bill (UserID), e.g. "ERP". */
    userId: string;
    customerName?: string;
    phone?: string;
    lines: SqlPosLine[];
    /** Bill-level discount (rupees), taken off the total. */
    billDiscount: number;
    payment: { cash: number; card: number; upi: number; credit: number };
}

export interface SqlPosResult {
    /** Bill number as printed, e.g. "A96". */
    billNo: string;
    billno: number;
    sysidandbill: string;
    date: string;
    datetime: string;
    total: number;
    counter: string;
}

const r2 = (n: number): number => Math.round(n * 100) / 100;
const f2 = (n: number): string => r2(n).toFixed(2);
const whole = (n: number): string => (Number.isInteger(r2(n)) ? String(r2(n)) : f2(n));

export async function writePosBillToSql(bill: SqlPosBill): Promise<SqlPosResult> {
    if (!bill.lines.length) throw new SqlPosError("The bill has no lines.", 400);
    const counter = bill.counter.trim();
    if (!counter) throw new SqlPosError("Select a billing counter first.", 400);

    let w;
    try {
        w = await writer();
    } catch (err) {
        throw new SqlPosError(`Could not connect to the shop database for writing: ${(err as Error).message}`, 503);
    }
    const { mssql, pool } = w;
    const salesCols = await columnsOf(pool, "sales2");
    const lineCols = await columnsOf(pool, "salsntry");

    const tx = new mssql.Transaction(pool);
    await tx.begin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = async (text: string, params: Record<string, unknown> = {}): Promise<Record<string, any>[]> => {
        const req = new mssql.Request(tx);
        for (const [k, v] of Object.entries(params)) req.input(k, v);
        const res = await req.query(text);
        return res.recordset ?? [];
    };

    try {
        // 1. Counter + company numbering rules.
        const [ctr] = await q("SELECT TOP 1 sl_no, counter_mode FROM dbo.[countername] WHERE LTRIM(RTRIM(counter_name)) = @c", { c: counter });
        if (!ctr) throw new SqlPosError(`Counter "${counter}" is not in Textilesoft's counter list (dbo.countername).`, 400);
        const letter = String(ctr.counter_mode ?? "").trim();
        const serial = String(ctr.sl_no ?? "").trim();
        if (!letter || !serial) throw new SqlPosError(`Counter "${counter}" has no bill letter or serial in dbo.countername.`, 400);

        const wantCompany = (process.env.TEXTILESOFT_POS_COMPANY || "").trim();
        const companies = await q(
            "SELECT cmny_name, cmny_mode, sys_name FROM dbo.[bill_option] WHERE NULLIF(LTRIM(RTRIM(cmny_mode)), '') IS NOT NULL ORDER BY slno",
        );
        const company =
            companies.find((c) => String(c.sys_name).trim() === counter && (!wantCompany || String(c.cmny_name).trim() === wantCompany)) ??
            companies.find((c) => !wantCompany || String(c.cmny_name).trim() === wantCompany) ??
            companies[0];
        const companyName = String(company?.cmny_name ?? wantCompany).trim();
        const companyPrefix = String(company?.cmny_mode ?? "").trim();

        // 2. Server date/time (the shop's clock, same as Textilesoft).
        const [now] = await q("SELECT CONVERT(varchar(10), CAST(GETDATE() AS date), 23) AS d, CONVERT(varchar(6), GETDATE(), 12) AS yymmdd, GETDATE() AS dt");
        const d: string = now.d; // YYYY-MM-DD
        const yymmdd: string = now.yymmdd;
        const ddmmyy = yymmdd.slice(4, 6) + yymmdd.slice(2, 4) + yymmdd.slice(0, 2);

        // 3. Next numbers. UPDLOCK + HOLDLOCK keeps two tills from taking the same number until commit.
        const [nb] = await q(
            "SELECT ISNULL(MAX(billno), 0) + 1 AS n FROM dbo.[sales2] WITH (UPDLOCK, HOLDLOCK) WHERE LTRIM(RTRIM(systemname)) = @c AND [date] = CAST(@d AS date)",
            { c: counter, d },
        );
        const billno = Number(nb.n);
        const mode = `${letter}${billno}`;
        const sysid = `${serial}${ddmmyy}${billno}`;

        const [dup] = await q("SELECT TOP 1 1 AS x FROM dbo.[sales2] WITH (UPDLOCK, HOLDLOCK) WHERE sysidandbill = @k", { k: sysid });
        if (dup) throw new SqlPosError(`Bill key ${sysid} already exists; try again.`, 503);

        const [lastLine] = await q(
            "SELECT TOP 1 cmny_bill, count_IDBillno, comp_continu_billno, cmy_wo_continu_billno FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) " +
                (companyPrefix ? "WHERE cmny_bill LIKE @p + '%' " : "") +
                "ORDER BY [No] DESC",
            companyPrefix ? { p: companyPrefix } : {},
        ).catch(async () =>
            // Older copies without the running-counter columns.
            q("SELECT TOP 1 cmny_bill FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) " + (companyPrefix ? "WHERE cmny_bill LIKE @p + '%' " : "") + "ORDER BY [No] DESC", companyPrefix ? { p: companyPrefix } : {}),
        );
        const lastCmnyNo = Number(String(lastLine?.cmny_bill ?? "").slice(companyPrefix.length)) || 0;
        const cmnyBill = companyPrefix ? `${companyPrefix}${lastCmnyNo + 1}` : "";
        const nextOf = (v: unknown): number | undefined => (Number.isFinite(Number(v)) && v !== null && v !== undefined ? Number(v) + 1 : undefined);

        // 4. Amounts, Textilesoft style (GST-inclusive).
        const lines = bill.lines.map((l, i) => {
            const amount = r2(l.qty * l.unitPriceIncl);
            const gst = Number(l.gstRate) || 0;
            const cross = r2(amount / (1 + gst / 100));
            const tax = r2(amount - cross);
            return { ...l, srl: i + 1, amount, gst, cross, tax, half: r2(tax / 2), rate: r2(l.unitPriceIncl / (1 + gst / 100)) };
        });
        const gross = r2(lines.reduce((s, l) => s + l.amount, 0));
        const discount = Math.min(Math.max(0, r2(bill.billDiscount || 0)), gross);
        const total = r2(gross - discount);
        const qty = lines.reduce((s, l) => s + l.qty, 0);
        const taxAt = (rate: number) => f2(lines.filter((l) => l.gst === rate).reduce((s, l) => s + l.tax, 0));

        const [ts] = await q("SELECT CONVERT(varchar(19), @dt, 126) AS iso", { dt: now.dt });

        // 5. Insert header.
        const insert = async (table: string, cols: Set<string>, values: Record<string, unknown>) => {
            const keys = Object.keys(values).filter((k) => cols.has(k) && values[k] !== undefined);
            const params: Record<string, unknown> = {};
            keys.forEach((k, i) => { params[`v${i}`] = values[k]; });
            await q(`INSERT INTO dbo.[${table}] (${keys.map((k) => `[${k}]`).join(", ")}) VALUES (${keys.map((_, i) => `@v${i}`).join(", ")})`, params);
        };
        const nextNo = async (table: string, cols: Set<string>): Promise<number | undefined> => {
            if (!cols.has("No")) return undefined; // identity (or absent): SQL Server assigns it
            const [m] = await q(`SELECT ISNULL(MAX([No]), 0) + 1 AS n FROM dbo.[${table}] WITH (UPDLOCK, HOLDLOCK)`);
            return Number(m.n);
        };

        await insert("sales2", salesCols, {
            No: await nextNo("sales2", salesCols),
            billno,
            mode,
            Lmode: `K${mode}`,
            date: d,
            datetime: now.dt,
            sysidandbill: sysid,
            systemname: counter,
            countername: counter,
            UserID: bill.userId,
            cus_name: bill.customerName || undefined,
            mbl_no: bill.phone || undefined,
            tot_qty: whole(qty),
            tot_netamnt: whole(total),
            notdislesamt: f2(gross),
            totnetsub: f2(gross),
            crs_amount: f2(total),
            CM_Amt: f2(total),
            upnet: whole(total),
            upsat: "0",
            bill_less: discount ? f2(discount) : undefined,
            gst5: taxAt(5),
            gst12: lines.some((l) => l.gst === 12) ? taxAt(12) : undefined,
            gst18: lines.some((l) => l.gst === 18) ? taxAt(18) : undefined,
            gst28: lines.some((l) => l.gst === 28) ? taxAt(28) : undefined,
            tmtr: "0.00",
            pdisamtot: "0.00",
            tot_pdis: "0",
            paymenttype: "0",
            status: "0",
            SBillStatus: "1",
            s_recevied_cashamt: whole(bill.payment.cash),
            s_card_amt: whole(bill.payment.card),
            s_googlepay: whole(bill.payment.upi),
            s_credit_amt: whole(bill.payment.credit),
            s_selfamt: "0",
            s_balance_amt: "0",
        });

        // 6. Insert lines.
        // All lines of one bill share the bill-level running numbers (as in Textilesoft's own bills).
        const idBill = nextOf(lastLine?.count_IDBillno);
        const compNo = nextOf(lastLine?.comp_continu_billno);
        const cmyNo = nextOf(lastLine?.cmy_wo_continu_billno);
        for (const l of lines) {
            await insert("salsntry", lineCols, {
                No: await nextNo("salsntry", lineCols),
                srl_no: String(l.srl),
                sls_man: "1",
                barcode: l.barcode || "",
                p_name: l.name,
                PrintNameEng: l.name,
                rate: f2(l.rate),
                qty: whole(l.qty),
                amount: f2(l.amount),
                amt: f2(l.amount),
                less: "0.00",
                dis: "0",
                net_amount: f2(l.amount),
                pre_bill_amnt: f2(l.amount),
                upnet: f2(l.amount),
                tax: f2(l.tax),
                cgst: f2(l.half),
                sgst: f2(l.half),
                gstcrossamt: f2(l.cross),
                hdngst: String(l.gst),
                gst_group: `GST${l.gst}`,
                hsncode: l.hsn || undefined,
                hdnunit: (l.unit || "PCS").toUpperCase(),
                mrp: f2(l.unitPriceIncl),
                upmrp: f2(l.unitPriceIncl),
                Sub_Mrp: f2(l.unitPriceIncl),
                c_Mrp: whole(l.unitPriceIncl),
                c_Amt: whole(l.amount),
                upsta: "0",
                bil_cl_qty: "0",
                EMIAMOUNT: "0",
                billno,
                mode,
                Lmode: `K${mode}`,
                date: d,
                SystemDate: d,
                LLDate: d,
                datetime: now.dt,
                systemidbill: sysid,
                systemname: counter,
                status: "0",
                UserID: bill.userId,
                cmnyname: companyName || undefined,
                company_name: companyName || undefined,
                cmny_bill: cmnyBill || undefined,
                ProGroupName: l.group || undefined,
                count_IDBillno: idBill,
                company_code: 0,
                comp_continu_billno: compNo,
                cmy_wo_continu_billno: cmyNo,
                cmy_wo_cont_idbillno: 0,
            });
        }

        await tx.commit();
        info(`[sql-pos] wrote bill ${mode} (${sysid}) at ${counter}: ${lines.length} line(s), total ${total}`);
        return { billNo: mode, billno, sysidandbill: sysid, date: d, datetime: String(ts?.iso ?? d), total, counter };
    } catch (err) {
        await tx.rollback().catch(() => undefined);
        if (err instanceof SqlPosError) throw err;
        const msg = (err as Error).message || String(err);
        // Permission problems are a setup issue, not a bad bill -- but retrying won't help either.
        if (/permission|denied/i.test(msg)) {
            // Most likely a restore removed the grants: re-apply them; the bill is queued and retried.
            if (await healDbAccess(err)) {
                throw new SqlPosError("The shop database access was just restored after a restore; the bill will be sent again automatically.", 503);
            }
            throw new SqlPosError(`The shop database refused the write (${msg}). Set TEXTILESOFT_DB_WRITE_USER/PASSWORD to a login that may insert into dbo.sales2 and dbo.salsntry.`, 503);
        }
        throw new SqlPosError(`Writing the bill to the shop database failed: ${msg}`, 503);
    }
}
