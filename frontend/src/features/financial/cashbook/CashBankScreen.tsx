import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Landmark, Receipt } from 'lucide-react';
import {
    BAR_RADIUS, CHART_SERIES, LegendItem, ReportAnalysisCard, ReportChartTooltip, ReportKpiGrid, ReportPeriodPicker, ReportTable,
    axisProps, compactRupees, cursorFill, gridProps, useReportData, useReportPeriod,
} from '../../reports/components';
import type { ReportColumn } from '../../reports/components';
import { FinancePage } from '../overview/FinancePage';
import { dateText, rupees0 } from '../overview/cashBankFormat';
import type {
    BankEntryRow, BankSummaryRow, CashBankSqlData, CashEntryRow, DayCloseRow, TakingsDayRow,
} from './cashBankSqlTypes';

const CASH_COLUMNS: ReportColumn<CashEntryRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'party', header: 'Details', value: r => r.party || '—', subtext: r => [r.counter, r.cashier].filter(Boolean).join(' · ') || null },
    { key: 'bill', header: 'Bill', value: r => r.bill || null },
    { key: 'in', header: 'Cash in', type: 'currency', value: r => r.in || null },
    { key: 'out', header: 'Cash out', type: 'currency', value: r => r.out || null },
];

const TAKINGS_COLUMNS: ReportColumn<TakingsDayRow>[] = [
    { key: 'date', header: 'Day', type: 'date', value: r => r.date },
    { key: 'bills', header: 'Bills', type: 'number', value: r => r.bills },
    { key: 'total', header: 'Sales', type: 'currency', value: r => r.total },
    { key: 'cash', header: 'Cash', type: 'currency', value: r => r.cash || null },
    { key: 'card', header: 'Card', type: 'currency', value: r => r.card || null },
    { key: 'upi', header: 'UPI', type: 'currency', value: r => r.upi || null },
    { key: 'credit', header: 'Credit', type: 'currency', value: r => r.credit || null },
];

const CLOSE_COLUMNS: ReportColumn<DayCloseRow>[] = [
    { key: 'date', header: 'Day', type: 'date', value: r => r.date, subtext: r => [r.counter, r.cashier].filter(Boolean).join(' · ') || null },
    { key: 'bills', header: 'Bills', type: 'number', value: r => r.bills },
    { key: 'sales', header: 'Sales', type: 'currency', value: r => r.sales },
    { key: 'card', header: 'Card', type: 'currency', value: r => r.card || null },
    { key: 'upi', header: 'UPI', type: 'currency', value: r => r.upi || null },
    { key: 'credit', header: 'Credit', type: 'currency', value: r => r.credit || null },
    { key: 'opening', header: 'Opening cash', type: 'currency', value: r => r.opening || null },
    { key: 'cashIn', header: 'Cash in', type: 'currency', value: r => r.cashIn || null },
    { key: 'cashOut', header: 'Cash out', type: 'currency', value: r => r.cashOut || null },
    { key: 'counted', header: 'Counted at close', type: 'currency', value: r => r.counted },
];

const BANK_SUMMARY_COLUMNS: ReportColumn<BankSummaryRow>[] = [
    { key: 'bank', header: 'Bank', value: r => r.bank, subtext: r => `${r.entries} entries` },
    { key: 'in', header: 'In', type: 'currency', value: r => r.in || null },
    { key: 'out', header: 'Out', type: 'currency', value: r => r.out || null },
    { key: 'net', header: 'Net', type: 'currency', value: r => r.net, cellClassName: r => (r.net < 0 ? 'text-danger font-bold' : 'font-bold') },
];

const BANK_COLUMNS: ReportColumn<BankEntryRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'name', header: 'Transaction', value: r => r.name || r.code || '—', subtext: r => [r.bank, r.mode, r.remarks].filter(Boolean).join(' · ') || null },
    { key: 'in', header: 'In', type: 'currency', value: r => r.in || null },
    { key: 'out', header: 'Out', type: 'currency', value: r => r.out || null },
    { key: 'balance', header: 'Balance', type: 'currency', value: r => r.balance },
];

const Missing: React.FC<{ what: string }> = ({ what }) => (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        {what} could not be read from the shop database, so it is not shown.
    </p>
);

/**
 * Finance › Overview (Cash & Bank): read straight from Textilesoft's own tables - cash in/out entries, the Petty Cash
 * open/close, and bank transactions. Nothing here is estimated or kept in the ERP. Loans and cheques are not shown:
 * Textilesoft has no table for them.
 */
const CashBankScreen: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<CashBankSqlData>('/api/reports/finance/cash-bank', { from, to }, { enabled: Boolean(from && to) });
    const takings = data?.takings.available ? data.takings : null;
    const cash = data?.cash.available ? data.cash : null;
    const close = data?.dayClose.available ? data.dayClose : null;
    const bank = data?.bank.available ? data.bank : null;

    const chart = useMemo(() => (cash?.byDay ?? []).map(d => ({ label: dateText(d.date).replace(/ \d{4}$/, ''), inflow: d.in, outflow: d.out })), [cash]);

    return (
        <FinancePage
            title="Cash & Bank"
            subtitle="Cash in and out, day closes and bank transactions, as recorded in the shop database"
            basis={data ? `Read from Textilesoft's Cash In/Out, Petty Cash open/close and Bank Transaction entries.${data.asOf ? ` Shop sales up to ${dateText(data.asOf)}.` : ''}` : undefined}
            actions={<ReportPeriodPicker value={period} disabled={loading} />}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Cash in', value: cash ? rupees0(cash.in) : '—', sub: cash ? `${rupees0(cash.out)} out · net ${rupees0(cash.net)}` : 'Not available', tone: cash && cash.net < 0 ? 'negative' : 'default', icon: <Banknote className="w-4 h-4" /> },
                        { label: 'Cash received on bills', value: takings ? rupees0(takings.totals.cash) : '—', sub: takings ? `Sales ${rupees0(takings.totals.total)} · card ${rupees0(takings.totals.card)} · UPI ${rupees0(takings.totals.upi)}` : 'Not available', icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Bank in', value: bank ? rupees0(bank.in) : '—', sub: bank ? `${rupees0(bank.out)} out · net ${rupees0(bank.net)}` : 'Not available', tone: bank && bank.net < 0 ? 'negative' : 'default', icon: <Landmark className="w-4 h-4" /> },
                    ]} />

                    {!data.takings.available && <Missing what="Daily sales by payment type" />}
                    {takings && <ReportTable title="Daily takings" subtitle={`Sales ${rupees0(takings.totals.total)} · cash ${rupees0(takings.totals.cash)} · card ${rupees0(takings.totals.card)} · UPI ${rupees0(takings.totals.upi)} · credit ${rupees0(takings.totals.credit)}`} columns={TAKINGS_COLUMNS} rows={takings.days} rowKey={r => r.date} emptyMessage="No bills in this period." />}

                    {!data.cash.available && <Missing what="Cash in/out" />}
                    {cash && (
                        <ReportAnalysisCard
                            title="Cash in and out by day"
                            subtitle={`In ${rupees0(cash.in)} · out ${rupees0(cash.out)}`}
                            legend={<><LegendItem color={CHART_SERIES[0]} label="Cash in" /><LegendItem color={CHART_SERIES[1]} label="Cash out" /></>}
                            empty={chart.every(d => !d.inflow && !d.outflow)}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={20} />
                                    <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                    <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees0(v)} />} />
                                    <Bar dataKey="inflow" name="Cash in" fill={CHART_SERIES[0]} radius={BAR_RADIUS} />
                                    <Bar dataKey="outflow" name="Cash out" fill={CHART_SERIES[1]} radius={BAR_RADIUS} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportAnalysisCard>
                    )}

                    {!data.dayClose.available && <Missing what="Petty Cash day closes" />}
                    {close && <ReportTable title="Day closes" subtitle="One row per counter and cashier close, as saved in Petty Cash" columns={CLOSE_COLUMNS} rows={close.rows} rowKey={(r, i) => `${r.date}-${r.counter}-${r.cashier}-${r.slNo}-${i}`} emptyMessage="No day close was saved in this period." />}

                    {cash && <ReportTable title="Cash in / out entries" subtitle={cash.truncated ? 'Showing the latest 2,000 entries' : undefined} columns={CASH_COLUMNS} rows={cash.rows} rowKey={(r, i) => `${r.date}-${r.counter}-${r.bill}-${i}`} emptyMessage="No cash in/out entries in this period." />}

                    {!data.bank.available && <Missing what="Bank transactions" />}
                    {bank && (
                        <>
                            <ReportTable title="Banks" columns={BANK_SUMMARY_COLUMNS} rows={bank.byBank} rowKey={r => r.bank} emptyMessage="No bank transactions in this period." />
                            <ReportTable title="Bank transactions" subtitle={bank.truncated ? 'Showing the latest 2,000 transactions' : undefined} columns={BANK_COLUMNS} rows={bank.rows} rowKey={(r, i) => `${r.tranNo}-${r.date}-${i}`} emptyMessage="No bank transactions in this period." />
                        </>
                    )}
                </>
            )}
        </FinancePage>
    );
};

export default CashBankScreen;
