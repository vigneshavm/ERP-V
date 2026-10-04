import { sqlDate } from "./sqlDates.js";
import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlShopClock.js";

/**
 * Cash & Bank screen, read-only from Textilesoft's own tables - nothing is created or written:
 *   dbo.CashInOutEntry   cash taken out / put in at a counter (Counter_Name, Cashier_Name, cmy_name, daily_cashier_bill, date,
 *                        Cash_Out_Amout, Cash_In_Amount)
 *   dbo.openpattycash    opening cash count of a counter's day (tot_amm)
 *   dbo.closepattycash   the day close: bills, cash/card/credit/UPI, cash in/out, opening, cash handed over, counted total
 *   dbo.BankTransEntry   bank transactions (TranEntryDate, TranInAmount, TranOutAmount, TranBalanceAmount, BankName, ...)
 * Each section is read on its own; one that cannot be read (table missing in an installation) is reported as
 * `available: false` instead of failing the screen. `takings` is the daily tender split from dbo.sales2 (cash/card/UPI/credit received on live bills); the cash tables are empty
 * in shops that do not use Petty Cash. Loans have no Textilesoft table; cheque status columns exist on BankTransEntry but are not shown yet.
 */

type Row = Record<string, unknown>;
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number): number => Math.round(n * 100) / 100;
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());

async function run(text: string, params: QueryParam[] = []): Promise<Row[]> {
  const req = (await getPool()).request();
  for (const p of params) req.input(p.name, p.value);
  const res = await req.query(SESSION_PREFIX + text);
  return res ? res.recordset : [];
}

/** Textilesoft keeps some dates as text (dd/MM/yyyy) and some as date columns: read either. */
const D = sqlDate;
const N = (col: string): string => `ISNULL(TRY_CAST(${col} AS float), 0)`;

export interface CashBankRange {
  from: string;
  to: string;
}

const section = async <T>(read: () => Promise<T>): Promise<(T & { available: true }) | { available: false; reason: string }> => {
  try {
    return { ...(await read()), available: true as const };
  } catch (err) {
    return { available: false, reason: (err as Error).message };
  }
};

export async function sqlCashBank(range: CashBankRange) {
  const p: QueryParam[] = [
    { name: "f", value: range.from },
    { name: "t", value: range.to },
  ];

  const cash = section(async () => {
    const rows = await run(
      `SELECT TOP (2000) CONVERT(varchar(10), d, 23) AS d, counter, cashier, party, bill, cin, cout FROM (
         SELECT ${D("[date]")} AS d, [Counter_Name] AS counter, [Cashier_Name] AS cashier, [cmy_name] AS party, [daily_cashier_bill] AS bill,
                SUM(${N("[Cash_In_Amount]")}) AS cin, SUM(${N("[Cash_Out_Amout]")}) AS cout
           FROM dbo.[CashInOutEntry] GROUP BY ${D("[date]")}, [Counter_Name], [Cashier_Name], [cmy_name], [daily_cashier_bill]) x
        WHERE d >= CAST(@f AS date) AND d <= CAST(@t AS date) ORDER BY d DESC, counter, bill`,
      p,
    );
    const byDay = new Map<string, { date: string; in: number; out: number; entries: number }>();
    for (const r of rows) {
      const d = byDay.get(str(r.d)) ?? { date: str(r.d), in: 0, out: 0, entries: 0 };
      d.in += num(r.cin);
      d.out += num(r.cout);
      d.entries += 1;
      byDay.set(d.date, d);
    }
    const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, in: r2(d.in), out: r2(d.out) }));
    const totalIn = r2(rows.reduce((s, r) => s + num(r.cin), 0));
    const totalOut = r2(rows.reduce((s, r) => s + num(r.cout), 0));
    return {
      in: totalIn,
      out: totalOut,
      net: r2(totalIn - totalOut),
      byDay: days,
      rows: rows.map((r) => ({
        date: str(r.d), counter: str(r.counter), cashier: str(r.cashier), party: str(r.party), bill: str(r.bill),
        in: r2(num(r.cin)), out: r2(num(r.cout)),
      })),
      truncated: rows.length >= 2000,
    };
  });

  const dayClose = section(async () => {
    const [closes, opens] = await Promise.all([
      run(
        `SELECT TOP (1000) CONVERT(varchar(10), d, 23) AS d, counter, cashier, slno, bills, net, cashin, cashout, opening, drawn, card, credit, gpay, selfpay, counted, status FROM (
           SELECT ${D("[date]")} AS d, [counter_name] AS counter, [cashier_name] AS cashier, [sl_no] AS slno, ${N("[totalbillno]")} AS bills,
                  ${N("[netamount]")} AS net, ${N("[cashinamt]")} AS cashin, ${N("[cashoutamt]")} AS cashout, ${N("[openingamt]")} AS opening,
                  ${N("[cashdrawamt]")} AS drawn, ${N("[cardamt]")} AS card, ${N("[creditamt]")} AS credit, ${N("[googlepay]")} AS gpay,
                  ${N("[selfpay]")} AS selfpay, ${N("[tot_amm]")} AS counted, [status] AS status FROM dbo.[closepattycash]) x
          WHERE d >= CAST(@f AS date) AND d <= CAST(@t AS date) ORDER BY d DESC, counter, cashier`,
        p,
      ),
      run(
        `SELECT CONVERT(varchar(10), d, 23) AS d, counter, cashier, opened FROM (
           SELECT ${D("[date]")} AS d, [counter_name] AS counter, [cashier_name] AS cashier, ${N("[tot_amm]")} AS opened FROM dbo.[openpattycash]) x
          WHERE d >= CAST(@f AS date) AND d <= CAST(@t AS date)`,
        p,
      ),
    ]);
    const rows = closes.map((r) => {
      const sales = num(r.net);
      const counted = num(r.counted);
      return {
        date: str(r.d), counter: str(r.counter), cashier: str(r.cashier), slNo: str(r.slno), bills: Math.round(num(r.bills)),
        sales: r2(sales), card: r2(num(r.card)),
        upi: r2(num(r.gpay)), selfPay: r2(num(r.selfpay)), credit: r2(num(r.credit)), cashIn: r2(num(r.cashin)), cashOut: r2(num(r.cashout)),
        opening: r2(num(r.opening)), handedOver: r2(num(r.drawn)), counted: r2(counted), status: str(r.status),
      };
    });
    return {
      rows,
      openings: opens.map((o) => ({ date: str(o.d), counter: str(o.counter), cashier: str(o.cashier), opened: r2(num(o.opened)) })),
      totals: {
        days: new Set(rows.map((r) => r.date)).size,
        sales: r2(rows.reduce((s, r) => s + r.sales, 0)),
        card: r2(rows.reduce((s, r) => s + r.card, 0)),
        upi: r2(rows.reduce((s, r) => s + r.upi, 0)),
        credit: r2(rows.reduce((s, r) => s + r.credit, 0)),
      },
    };
  });

  const bank = section(async () => {
    const rows = await run(
      `SELECT TOP (2000) CONVERT(varchar(10), d, 23) AS d, tranNo, code, name, bank, account, mode, remarks, counter, tin, tout, bal FROM (
         SELECT ${D("[TranEntryDate]")} AS d, [TranNo] AS tranNo, [TansactionCode] AS code, [TranasctionName] AS name, [BankName] AS bank,
                [AccountNo] AS account, [Mode] AS mode, [Remarks] AS remarks, [CounterName] AS counter,
                ${N("[TranInAmount]")} AS tin, ${N("[TranOutAmount]")} AS tout, ${N("[TranBalanceAmount]")} AS bal FROM dbo.[BankTransEntry]) x
        WHERE d >= CAST(@f AS date) AND d <= CAST(@t AS date) ORDER BY d DESC, tranNo DESC`,
      p,
    );
    const byBank = new Map<string, { bank: string; in: number; out: number; entries: number }>();
    for (const r of rows) {
      const key = str(r.bank) || "Unnamed bank";
      const b = byBank.get(key) ?? { bank: key, in: 0, out: 0, entries: 0 };
      b.in += num(r.tin);
      b.out += num(r.tout);
      b.entries += 1;
      byBank.set(key, b);
    }
    const totalIn = r2(rows.reduce((s, r) => s + num(r.tin), 0));
    const totalOut = r2(rows.reduce((s, r) => s + num(r.tout), 0));
    return {
      in: totalIn,
      out: totalOut,
      net: r2(totalIn - totalOut),
      byBank: [...byBank.values()].map((b) => ({ ...b, in: r2(b.in), out: r2(b.out), net: r2(b.in - b.out) })).sort((a, b) => b.in + b.out - (a.in + a.out)),
      rows: rows.map((r) => ({
        date: str(r.d), tranNo: str(r.tranNo), code: str(r.code), name: str(r.name), bank: str(r.bank), account: str(r.account),
        mode: str(r.mode), remarks: str(r.remarks), counter: str(r.counter), in: r2(num(r.tin)), out: r2(num(r.tout)), balance: r2(num(r.bal)),
      })),
      truncated: rows.length >= 2000,
    };
  });

  const takings = section(async () => {
    const rows = await run(
      `SELECT CONVERT(varchar(10), s.[date], 23) AS d, COUNT(*) AS bills, SUM(${N("s.[tot_netamnt]")}) AS total, SUM(${N("s.[s_recevied_cashamt]")}) AS cash,
              SUM(${N("s.[s_card_amt]")}) AS card, SUM(${N("s.[s_googlepay]")}) AS upi, SUM(${N("s.[s_credit_amt]")}) AS credit, SUM(${N("s.[s_selfamt]")}) AS selfpay
         FROM dbo.[sales2] AS s
        WHERE ISNULL(s.[status], '') <> '1' AND s.[date] >= CAST(@f AS date) AND s.[date] < DATEADD(day, 1, CAST(@t AS date))
        GROUP BY CONVERT(varchar(10), s.[date], 23) ORDER BY d DESC`,
      p,
    );
    const days = rows.map((r) => ({
      date: str(r.d), bills: Math.round(num(r.bills)), total: r2(num(r.total)), cash: r2(num(r.cash)), card: r2(num(r.card)),
      upi: r2(num(r.upi)), credit: r2(num(r.credit)), selfPay: r2(num(r.selfpay)),
    }));
    const sum = (k: "bills" | "total" | "cash" | "card" | "upi" | "credit" | "selfPay") => r2(days.reduce((a, d) => a + d[k], 0));
    return {
      days,
      totals: { bills: sum("bills"), total: sum("total"), cash: sum("cash"), card: sum("card"), upi: sum("upi"), credit: sum("credit"), selfPay: sum("selfPay") },
    };
  });

  const [cashData, closeData, bankData, takingsData, asOf] = await Promise.all([cash, dayClose, bank, takings, shopAsOf().catch(() => null)]);
  return { range, takings: takingsData, cash: cashData, dayClose: closeData, bank: bankData, asOf, source: "sql" as const };
}
