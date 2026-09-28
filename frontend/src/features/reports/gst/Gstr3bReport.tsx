import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Banknote, Wallet } from 'lucide-react';
import { ReportKpiGrid, ReportPageShell, ReportTable, useReportData, useReportPeriod } from '../components';
import type { ReportColumn } from '../components';
import { GstChecks } from './GstChecks';
import { outwardFindings } from './gstFindings';
import { monthLabel, rupees, rupees0 } from './gstFormat';
import type { Gstr3bData, Heads } from './gstTypes';

interface SetOffRow {
    head: 'IGST' | 'CGST' | 'SGST';
    liability: number;
    byIgst: number;
    byCgst: number;
    bySgst: number;
    cash: number;
    carryForward: number;
}

const SETOFF_COLUMNS: ReportColumn<SetOffRow>[] = [
    { key: 'head', header: 'Tax', value: r => r.head, sortable: false },
    { key: 'liability', header: 'Output tax', type: 'currency', value: r => r.liability, sortable: false },
    { key: 'byIgst', header: 'Paid by IGST credit', type: 'currency', value: r => r.byIgst, sortable: false },
    { key: 'byCgst', header: 'Paid by CGST credit', type: 'currency', value: r => r.byCgst, sortable: false },
    { key: 'bySgst', header: 'Paid by SGST credit', type: 'currency', value: r => r.bySgst, sortable: false },
    { key: 'cash', header: 'Pay in cash', type: 'currency', value: r => r.cash, sortable: false },
    { key: 'carryForward', header: 'Credit left', type: 'currency', value: r => r.carryForward, sortable: false },
];

interface SummaryRow { label: string; taxable: number; cgst: number; sgst: number; igst: number; tax: number }

const SUMMARY_COLUMNS: ReportColumn<SummaryRow>[] = [
    { key: 'label', header: 'Section', value: r => r.label, sortable: false },
    { key: 'taxable', header: 'Taxable value', type: 'currency', value: r => r.taxable, sortable: false },
    { key: 'igst', header: 'IGST', type: 'currency', value: r => r.igst, sortable: false },
    { key: 'cgst', header: 'CGST', type: 'currency', value: r => r.cgst, sortable: false },
    { key: 'sgst', header: 'SGST', type: 'currency', value: r => r.sgst, sortable: false },
    { key: 'tax', header: 'Total tax', type: 'currency', value: r => r.tax, sortable: false },
];

type MonthRow = Gstr3bData['byMonth'][number];
const MONTH_COLUMNS: ReportColumn<MonthRow>[] = [
    { key: 'month', header: 'Month', value: r => monthLabel(r.month), sortable: false },
    { key: 'taxable', header: 'Outward taxable', type: 'currency', value: r => r.taxable, sortable: false },
    { key: 'outputTax', header: 'Output tax', type: 'currency', value: r => r.outputTax, sortable: false },
    { key: 'itc', header: 'Eligible ITC', type: 'currency', value: r => r.itc, sortable: false },
    { key: 'net', header: 'Net (before set-off)', type: 'currency', value: r => r.net, sortable: false },
];

const HEADS: (keyof Heads)[] = ['igst', 'cgst', 'sgst'];

const setOffRows = (s: Gstr3bData['setOff']): SetOffRow[] =>
    HEADS.map(h => ({
        head: h.toUpperCase() as SetOffRow['head'],
        liability: s.liability[h],
        byIgst: s.paidByCredit.igst[h],
        byCgst: s.paidByCredit.cgst[h],
        bySgst: s.paidByCredit.sgst[h],
        cash: s.cash[h],
        carryForward: s.carryForward[h],
    }));

/**
 * GSTR-3B: outward tax (3.1), eligible ITC (4) and a suggested set-off (6.1) for the period.
 * Usually run for one month.
 */
const Gstr3bReport: React.FC = () => {
    const period = useReportPeriod('last-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<Gstr3bData>('/api/reports/gst/gstr3b', { from, to });
    const rows = data ? setOffRows(data.setOff) : [];
    const cash = data ? data.setOff.cash.cgst + data.setOff.cash.sgst + data.setOff.cash.igst : 0;
    const carry = data ? data.setOff.carryForward.cgst + data.setOff.carryForward.sgst + data.setOff.carryForward.igst : 0;

    const summary: SummaryRow[] = data ? [
        { label: '3.1(a) Outward taxable supplies', ...pick(data.outward.taxable) },
        { label: '3.1(c) Nil-rated / exempt (0%)', ...pick(data.outward.nilRated) },
        { label: '4(A)(5) Eligible ITC, net of purchase returns', ...pick(data.itc.eligible) },
        { label: 'Not claimed: suppliers without a valid GSTIN', ...pick(data.itc.blocked) },
    ] : [];

    return (
        <ReportPageShell<SetOffRow>
            reportId="gstr3b"
            period={period}
            note="Output tax from Textilesoft bills plus ERP invoices; ITC from GRNs and ERP supplier bills whose supplier has a valid GSTIN, net of purchase returns. The set-off follows the CGST Act order (IGST credit first) and is a suggestion: the portal lets you choose the split."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.outward.total.lines === 0 && data.itc.allPurchases.lines === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf }}
            export={{ columns: SETOFF_COLUMNS, fetchRows: () => rows }}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Output tax', value: rupees(data.outward.total.tax), sub: `on ${rupees0(data.outward.total.taxable)} taxable`, icon: <ArrowUpFromLine className="w-4 h-4" /> },
                        { label: 'Eligible ITC', value: rupees(data.itc.eligible.tax), sub: `${rupees0(data.itc.blocked.tax)} not claimable (no GSTIN)`, icon: <ArrowDownToLine className="w-4 h-4" /> },
                        { label: 'Pay in cash', value: rupees(cash), sub: 'after suggested set-off', tone: cash > 0 ? 'warning' : 'default', icon: <Banknote className="w-4 h-4" /> },
                        { label: 'Credit carried forward', value: rupees(carry), sub: 'unused ITC', icon: <Wallet className="w-4 h-4" /> },
                    ]} />
                    <GstChecks findings={outwardFindings(data.checks)} />
                    <ReportTable title="Summary" subtitle="GSTR-3B tables 3.1 and 4" columns={SUMMARY_COLUMNS} rows={summary} rowKey={r => r.label} />
                    <ReportTable title="Payment of tax" subtitle="Suggested set-off of ITC against output tax (table 6.1)" columns={SETOFF_COLUMNS} rows={rows} rowKey={r => r.head} />
                    {data.byMonth.length > 1 && (
                        <ReportTable title="By month" subtitle="Output tax and eligible ITC per month in the period" columns={MONTH_COLUMNS} rows={data.byMonth} rowKey={r => r.month} />
                    )}
                </>
            )}
        </ReportPageShell>
    );
};

function pick(t: { taxable: number; cgst: number; sgst: number; igst: number; tax: number }) {
    return { taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst, tax: t.tax };
}

export default Gstr3bReport;
