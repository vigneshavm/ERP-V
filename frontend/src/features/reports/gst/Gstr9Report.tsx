import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownToLine, ArrowUpFromLine, IndianRupee, Scale } from 'lucide-react';
import {
    BAR_RADIUS, CHART_SERIES, LegendItem, ReportAnalysisCard, ReportChartTooltip, ReportKpiGrid, ReportPageShell, ReportTable,
    axisProps, compactRupees, cursorFill, gridProps, useClientReportTable, useReportData,
} from '../components';
import type { ReportColumn } from '../components';
import { GstChecks } from './GstChecks';
import { outwardFindings } from './gstFindings';
import { HSN_COLUMNS, RATE_COLUMNS, monthLabel, rupees, rupees0 } from './gstFormat';
import type { Gstr9Data, HsnRow } from './gstTypes';

type MonthRow = Gstr9Data['byMonth'][number];

const MONTH_COLUMNS: ReportColumn<MonthRow>[] = [
    { key: 'month', header: 'Month', value: r => monthLabel(r.month), sortable: false },
    { key: 'taxable', header: 'Outward taxable', type: 'currency', value: r => r.taxable, sortable: false },
    { key: 'cgst', header: 'CGST', type: 'currency', value: r => r.cgst, sortable: false },
    { key: 'sgst', header: 'SGST', type: 'currency', value: r => r.sgst, sortable: false },
    { key: 'igst', header: 'IGST', type: 'currency', value: r => r.igst, sortable: false, defaultHidden: true },
    { key: 'outputTax', header: 'Output tax', type: 'currency', value: r => r.outputTax, sortable: false },
    { key: 'itc', header: 'Eligible ITC', type: 'currency', value: r => r.itc, sortable: false },
    { key: 'net', header: 'Net', type: 'currency', value: r => r.net, sortable: false },
];

/** Financial year (start year) containing today, e.g. 2026 for 2026-27. */
const currentFyStart = (): number => {
    const d = new Date();
    return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
};
const FIRST_FY = 2021; // the shop's data starts in Feb 2022 (FY 2021-22)
const fyLabel = (y: number) => `FY ${y}-${String((y + 1) % 100).padStart(2, '0')}`;

const SERIES = { output: CHART_SERIES[0], itc: CHART_SERIES[1] };

/**
 * GSTR-9: the financial year in one view. Month-wise output tax and ITC, rate-wise and HSN-wise (Table 17)
 * summaries. Defaults to the last completed financial year, the one an annual return is filed for.
 */
const Gstr9Report: React.FC = () => {
    const [fy, setFy] = useState(() => currentFyStart() - 1);
    const { data, loading, error, reload } = useReportData<Gstr9Data>('/api/reports/gst/gstr9', { fy: String(fy) });
    const hsn = useClientReportTable<HsnRow>(data?.byHsn ?? [], HSN_COLUMNS, { pageSize: 25, searchPlaceholder: 'HSN or description…' });
    const years = Array.from({ length: currentFyStart() - FIRST_FY + 1 }, (_, i) => currentFyStart() - i);

    const selector = (
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            Financial year
            <select
                value={fy}
                onChange={e => setFy(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
            >
                {years.map(y => <option key={y} value={y}>{fyLabel(y)}{y === currentFyStart() ? ' (in progress)' : ''}</option>)}
            </select>
        </label>
    );

    return (
        <ReportPageShell<MonthRow>
            reportId="gstr9"
            primarySelector={selector}
            note={`Annual summary for ${fyLabel(fy)} (1 April to 31 March): Textilesoft bills and GRNs plus ERP invoices and supplier bills, on the same rules as GSTR-1 and GSTR-3B. Compare it with the GSTR-1 and GSTR-3B returns actually filed for the year before preparing GSTR-9.`}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.outward.lines === 0 && data.itc.lines === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.byMonth.length }}
            export={{ columns: MONTH_COLUMNS, fetchRows: () => data?.byMonth ?? [], filterSummary: [`Financial year: ${fyLabel(fy)}`] }}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Outward taxable', value: rupees0(data.outward.taxable), sub: fyLabel(fy), icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Output tax', value: rupees(data.outward.tax), icon: <ArrowUpFromLine className="w-4 h-4" /> },
                        { label: 'Eligible ITC', value: rupees(data.itc.tax), icon: <ArrowDownToLine className="w-4 h-4" /> },
                        { label: 'Net tax', value: rupees(data.outward.tax - data.itc.tax), sub: 'output tax minus ITC', icon: <Scale className="w-4 h-4" /> },
                    ]} />
                    <GstChecks findings={outwardFindings(data.checks)} />
                    <ReportAnalysisCard
                        title="Output tax and ITC by month"
                        subtitle="Both in rupees, side by side for each month"
                        empty={data.byMonth.every(m => m.outputTax === 0 && m.itc === 0)}
                        legend={<><LegendItem color={SERIES.output} label="Output tax" /><LegendItem color={SERIES.itc} label="Eligible ITC" /></>}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byMonth.map(m => ({ ...m, label: monthLabel(m.month).slice(0, 3) }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="label" {...axisProps} />
                                <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees(v)} />} />
                                <Bar dataKey="outputTax" name="Output tax" fill={SERIES.output} radius={BAR_RADIUS} />
                                <Bar dataKey="itc" name="Eligible ITC" fill={SERIES.itc} radius={BAR_RADIUS} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ReportAnalysisCard>
                    <ReportTable title="By month" subtitle="The table behind the chart" columns={MONTH_COLUMNS} rows={data.byMonth} rowKey={r => r.month} />
                    <ReportTable title="Rate-wise summary" subtitle="Outward supplies by GST rate for the year" columns={RATE_COLUMNS} rows={data.byRate} rowKey={r => String(r.rate)} />
                    <ReportTable
                        title="HSN summary"
                        subtitle="Outward supplies by HSN and rate for the year (GSTR-9 Table 17)"
                        columns={HSN_COLUMNS}
                        rowKey={r => `${r.hsn}|${r.rate}`}
                        {...hsn.tableProps}
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default Gstr9Report;
