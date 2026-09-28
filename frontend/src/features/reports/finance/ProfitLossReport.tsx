import React from 'react';
import { IndianRupee, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { ReportKpiGrid, ReportPageShell, ReportTable, useReportData, useReportPeriod } from '../components';
import type { ReportColumn } from '../components';
import { rupees, rupees0 } from './financeFormat';
import type { ProfitLossData } from './financeTypes';

interface Line {
    label: string;
    amount: number | null;
    note?: string;
    kind: 'item' | 'subtotal' | 'total' | 'info';
    indent?: boolean;
}

const EXPORT_COLUMNS: ReportColumn<Line>[] = [
    { key: 'label', header: 'Line', value: l => l.label },
    { key: 'amount', header: 'Amount', value: l => l.amount },
    { key: 'note', header: 'Note', value: l => l.note },
];

type MonthRow = ProfitLossData['byMonth'][number];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_COLUMNS: ReportColumn<MonthRow>[] = [
    { key: 'month', header: 'Month', value: r => `${MONTHS[Number(r.month.slice(5, 7)) - 1]} ${r.month.slice(0, 4)}`, sortable: false },
    { key: 'netSales', header: 'Net sales', type: 'currency', fractionDigits: 0, value: r => r.netSales, sortable: false },
    { key: 'cost', header: 'Cost of goods', type: 'currency', fractionDigits: 0, value: r => r.cost, sortable: false },
    { key: 'grossProfit', header: 'Gross profit', type: 'currency', fractionDigits: 0, value: r => r.grossProfit, sortable: false },
    { key: 'expenses', header: 'Expenses', type: 'currency', fractionDigits: 0, value: r => r.expenses, sortable: false },
    { key: 'netProfit', header: 'Net profit', type: 'currency', fractionDigits: 0, value: r => r.netProfit, sortable: false },
];

function statement(d: ProfitLossData): Line[] {
    const margin = d.total.marginPct === null ? '' : `${d.total.marginPct}% of costed sales`;
    return [
        { label: 'Sales (excluding GST)', amount: d.sales.netSales, note: `${d.sales.bills} bills and invoices`, kind: 'item' },
        { label: 'Less: sales returns', amount: d.returns.netSales, note: d.returns.bills ? `${d.returns.bills} ERP returns` : 'None', kind: 'item' },
        { label: 'Net sales', amount: d.total.netSales, kind: 'subtotal' },
        { label: 'Of which: sales with a known cost', amount: d.total.costedSales, note: `${d.total.coveragePct}% of net sales`, kind: 'info', indent: true },
        { label: 'Of which: sales with no known cost', amount: d.uncostedSales, note: 'Left out of gross profit, not counted as zero cost', kind: 'info', indent: true },
        { label: 'Less: cost of goods sold', amount: -d.total.cost, note: 'Quantity × lot purchase rate (excl. GST)', kind: 'item' },
        { label: 'Gross profit', amount: d.total.grossProfit, note: margin, kind: 'subtotal' },
        ...d.expenses.byCategory.map((e): Line => ({ label: e.category, amount: -e.amount, kind: 'item', indent: true })),
        { label: 'Less: expenses', amount: -d.expenses.total, note: d.expenses.byCategory.length ? '' : 'No expenses recorded in the ERP for this period', kind: 'subtotal' },
        { label: 'Net profit', amount: d.netProfit, kind: 'total' },
    ];
}

const Statement: React.FC<{ lines: Line[] }> = ({ lines }) => (
    <section className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Profit & loss statement</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Trading P&L: sales less the cost of what was sold, less expenses</p>
        <table className="w-full mt-4 text-sm">
            <tbody>
                {lines.map(l => {
                    const strong = l.kind !== 'item' && l.kind !== 'info';
                    const neg = (l.amount ?? 0) < 0;
                    return (
                        <tr key={l.label} className={`${l.kind === 'subtotal' ? 'border-t border-slate-200 dark:border-slate-700' : ''} ${l.kind === 'total' ? 'border-t-2 border-slate-900 dark:border-white' : ''}`}>
                            <td className={`py-2 pr-4 ${l.indent ? 'pl-5' : ''} ${strong ? 'font-bold text-slate-900 dark:text-white' : l.kind === 'info' ? 'text-slate-500 dark:text-slate-400 text-xs' : 'text-slate-700 dark:text-slate-300'}`}>
                                {l.label}
                                {l.note && <span className="block text-[11px] font-normal text-slate-400">{l.note}</span>}
                            </td>
                            <td className={`py-2 text-right tabular-nums whitespace-nowrap ${strong ? 'font-bold' : ''} ${l.kind === 'info' ? 'text-slate-500 dark:text-slate-400 text-xs' : neg ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'} ${l.kind === 'total' && neg ? 'text-danger dark:text-danger' : ''}`}>
                                {l.amount === null ? '—' : rupees(l.amount)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </section>
);

/**
 * Profit & Loss (trading): net sales excluding GST (Textilesoft bills + ERP invoices, less ERP returns), cost of goods
 * sold at lot purchase rates, gross profit, ERP expenses by category, net profit.
 */
const ProfitLossReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<ProfitLossData>('/api/reports/finance/profit-loss', { from, to });
    const lines = data ? statement(data) : [];

    return (
        <ReportPageShell<Line>
            reportId="profit-loss"
            period={period}
            note="Gross profit is worked out only on sales whose cost is known (the lot's purchase rate from the shop database, or the ERP item's cost price); sales with no known cost are shown separately. Expenses are the ERP expenses of every user in this shop. Opening and closing stock are not used: cost is taken per item sold."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.total.bills === 0 && data.expenses.total === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: () => lines }}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Net sales', value: rupees0(data.total.netSales), sub: `${data.total.coveragePct}% with a known cost`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Gross profit', value: rupees0(data.total.grossProfit), sub: data.total.marginPct === null ? 'no costed sales' : `${data.total.marginPct}% margin`, icon: <TrendingUp className="w-4 h-4" /> },
                        { label: 'Expenses', value: rupees0(data.expenses.total), sub: `${data.expenses.byCategory.length} categories`, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Net profit', value: rupees0(data.netProfit), tone: data.netProfit < 0 ? 'negative' : 'positive', icon: <Wallet className="w-4 h-4" /> },
                    ]} />
                    <Statement lines={lines} />
                    {data.byMonth.length > 1 && (
                        <ReportTable title="By month" subtitle="The same statement, month by month" columns={MONTH_COLUMNS} rows={data.byMonth} rowKey={r => r.month} />
                    )}
                </>
            )}
        </ReportPageShell>
    );
};

export default ProfitLossReport;
