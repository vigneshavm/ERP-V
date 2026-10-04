import { shopReturnsData } from "../../../integrations/textilesoft/sqlReturnsAudit.js";
import {
    CASH_REFUND_LIMIT, CASHIER_DAILY_LIMIT, FLAG_LABEL, FLAG_LEVEL, REPEAT_CUSTOMER_COUNT, REPEAT_WINDOW_DAYS,
    auditReturn, summarize, type AuditRow,
} from "./returnAudit.js";
import { istStart, istEndExclusive, todayIst } from "../../../utils/dateUtils.js";

/**
 * GET /api/reports/returns-audit?from&to - every sales return in the shop database for the period, with the risk
 * flags from returnAudit.ts. SQL only: returns are the bills with returned (negative-quantity) lines.
 * `shopReturnRows` counts returns that cannot be tied to a source bill (older Textilesoft returns), so the page can
 * say the "refund exceeds the bill" check does not cover them.
 */
export async function buildReturnsAudit(_tenantId: string, range: { from: string; to: string }) {
    const start = istStart(range.from);
    const end = istEndExclusive(range.to);
    const data = await shopReturnsData(range, REPEAT_WINDOW_DAYS);
    const window = data.window;
    const inPeriod = window.filter((r) => {
        const t = new Date(String(r.returnDate)).getTime();
        return t >= start.getTime() && t < end.getTime();
    });
    const rows: AuditRow[] = inPeriod.map((r) => auditReturn(r, { window, returnedByInvoice: data.returnedBySource }));
    return {
        range,
        summary: { ...summarize(rows, inPeriod), erpBills: data.bills, returnRatePct: data.bills ? Math.round((rows.length / data.bills) * 1000) / 10 : null },
        rows,
        rules: (Object.keys(FLAG_LEVEL) as (keyof typeof FLAG_LEVEL)[]).map((code) => ({ code, label: FLAG_LABEL[code], level: FLAG_LEVEL[code] })),
        limits: { cashRefund: CASH_REFUND_LIMIT, cashierDaily: CASHIER_DAILY_LIMIT, repeatCount: REPEAT_CUSTOMER_COUNT, repeatDays: REPEAT_WINDOW_DAYS },
        shopReturnRows: data.unlinked,
        asOf: todayIst(),
        source: "sql" as const,
    };
}
