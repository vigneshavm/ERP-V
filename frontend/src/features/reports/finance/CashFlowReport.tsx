import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Clock3, Scale } from 'lucide-react';
import { formatReportDate } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_SERIES, LegendItem, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportKpiGrid, ReportPageShell,
    ReportTable, axisProps, compactRupees, cursorFill, gridProps, useReportData, useReportPeriod,
} from '../components';
import type { ReportColumn } from '../components';
import { financeNotes, nz, rupees, rupees0 } from './financeFormat';
import type { CashFlowData, FlowLine } from './financeTypes';

type DayRow = CashFlowData['byDay'][number];

const FLOW_COLUMNS: ReportColumn<FlowLine>[] = [
    { key: 'label', header: 'Category', value: r => r.label, sortable: false },
    { key: 'entries', header: 'Entries', type: 'number', value: r => r.entries, sortable: false },
    { key: 'cash', header: 'Cash', type: 'currency', value: r => nz(r.cash), sortable: false },
    { key: 'bank', header: 'Bank / UPI / card', type: 'currency', value: r => nz(r.bank), sortable: false },
    { key: 'total', header: 'Total', type: 'currency', value: r => r.total, sortable: false },
];

const DAY_COLUMNS: ReportColumn<DayRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date, sortable: false },
    { key: 'inflow', header: 'Money in', type: 'currency', value: r => r.inflow, sortable: false },
    { key: 'outflow', header: 'Money out', type: 'currency', value: r => r.outflow, sortable: false },
    { key: 'net', header: 'Net', type: 'currency', value: r => r.net, sortable: false },
    { key: 'cashNet', header: 'Cash net', type: 'currency', value: r => r.cashNet, sortable: false },
    { key: 'bankNet', header: 'Bank net', type: 'currency', value: r => r.bankNet, sortable: false },
];

const SERIES = { in: CHART_SERIES[0], out: CHART_SERIES[1] };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Daily bars up to ~2 months; monthly bars beyond that so the chart stays readable. */
function chartRows(days: DayRow[]): { label: string; inflow: number; outflow: number }[] {
    if (days.length <= 62) return days.map(d => ({ label: formatReportDate(d.date).replace(/ \d{4}$/, ''), inflow: d.inflow, outflow: d.outflow }));
    const m = new Map<string, { label: string; inflow: number; outflow: number }>();
    for (const d of days) {
        const k = d.date.slice(0, 7);
        const cur = m.get(k) ?? { label: `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}`, inflow: 0, outflow: 0 };
        cur.inflow += d.inflow;
        cur.outflow += d.outflow;
        m.set(k, cur);
    }
    return [...m.values()];
}

/**
 * Cash Flow: money that actually came in and went out over the period, by category and by cash vs bank.
 * Credit sales/purchases are shown separately (billed, not paid). No opening or closing balance: neither the shop
 * database nor the ERP records an opening cash position.
 */
const CashFlowReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<CashFlowData>('/api/reports/finance/cash-flow', { from, to });
    const t = data?.totals;
    const chart = useMemo(() => chartRows(data?.byDay ?? []), [data]);
    const monthly = (data?.byDay.length ?? 0) > 62;

    return (
        <ReportPageShell<DayRow>
            reportId="cash-flow"
            period={period}
            note={`${financeNotes(data?.checks)} There is no opening or closing balance: no opening cash position is recorded, so this shows movement only.`}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.entries === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.byDay.length }}
            export={{ columns: DAY_COLUMNS, fetchRows: () => data?.byDay ?? [] }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Money in', value: rupees0(t.cashIn + t.bankIn), sub: `Cash ${rupees0(t.cashIn)} · Bank ${rupees0(t.bankIn)}`, icon: <ArrowDownLeft className="w-4 h-4" /> },
                        { label: 'Money out', value: rupees0(t.cashOut + t.bankOut), sub: `Cash ${rupees0(t.cashOut)} · Bank ${rupees0(t.bankOut)}`, icon: <ArrowUpRight className="w-4 h-4" /> },
                        { label: 'Net cash flow', value: rupees(t.net), sub: `Cash ${rupees0(t.cashIn - t.cashOut)} · Bank ${rupees0(t.bankIn - t.bankOut)}`, tone: t.net < 0 ? 'negative' : 'positive', icon: <Scale className="w-4 h-4" /> },
                        { label: 'Billed on credit', value: rupees0(data.credit.sales), sub: `sales not yet received · purchases unpaid ${rupees0(data.credit.purchases)}`, icon: <Clock3 className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisCard
                        title={monthly ? 'Money in and out by month' : 'Money in and out by day'}
                        subtitle="Both in rupees; transfers between your own accounts are left out"
                        empty={chart.every(r => r.inflow === 0 && r.outflow === 0)}
                        legend={<><LegendItem color={SERIES.in} label="Money in" /><LegendItem color={SERIES.out} label="Money out" /></>}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
                                <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees(v)} />} />
                                <Bar dataKey="inflow" name="Money in" fill={SERIES.in} radius={BAR_RADIUS} />
                                <Bar dataKey="outflow" name="Money out" fill={SERIES.out} radius={BAR_RADIUS} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ReportAnalysisCard>
                    <ReportAnalysisGrid>
                        <ReportTable title="Inflows" subtitle="Money received, by category" columns={FLOW_COLUMNS} rows={data.inflows} rowKey={r => r.type} emptyMessage="No money received in this period." />
                        <ReportTable title="Outflows" subtitle="Money paid, by category" columns={FLOW_COLUMNS} rows={data.outflows} rowKey={r => r.type} emptyMessage="No money paid in this period." />
                    </ReportAnalysisGrid>
                    <ReportTable title="By day" subtitle="The table behind the chart" columns={DAY_COLUMNS} rows={data.byDay} rowKey={r => r.date} />
                </>
            )}
        </ReportPageShell>
    );
};

export default CashFlowReport;
