import React from 'react';
import { FileText, IndianRupee, Percent, XCircle } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { ReportAnalysisCard, ReportAnalysisGrid, ReportKpiGrid, ReportPageShell, ReportTable, useClientReportTable, useReportData, useReportPeriod } from '../components';
import type { ReportColumn } from '../components';
import { GstChecks } from './GstChecks';
import { outwardFindings } from './gstFindings';
import { HSN_COLUMNS, HSN_EXPORT_COLUMNS, RATE_COLUMNS, rupees, rupees0 } from './gstFormat';
import type { Gstr1Data, HsnRow } from './gstTypes';

type DocRow = Gstr1Data['documents'][number];

const DOC_COLUMNS: ReportColumn<DocRow>[] = [
    { key: 'series', header: 'Series', value: r => r.series, subtext: r => (r.source === 'erp' ? 'ERP' : 'Shop'), sortable: false },
    { key: 'from', header: 'From no.', type: 'number', value: r => (r.from || null), sortable: false },
    { key: 'to', header: 'To no.', type: 'number', value: r => (r.to || null), sortable: false },
    { key: 'total', header: 'Total', type: 'number', value: r => r.total, sortable: false },
    { key: 'cancelled', header: 'Cancelled', type: 'number', value: r => r.cancelled, sortable: false },
    { key: 'net', header: 'Net issued', type: 'number', value: r => r.total - r.cancelled, sortable: false },
];

/**
 * GSTR-1: outward supplies for the period. Retail sales carry no customer GSTIN, so everything is B2C:
 * rate-wise totals (Table 7), HSN summary (Table 12) and documents issued (Table 13).
 */
const Gstr1Report: React.FC = () => {
    const period = useReportPeriod('last-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<Gstr1Data>('/api/reports/gst/gstr1', { from, to });
    const hsn = useClientReportTable<HsnRow>(data?.byHsn ?? [], HSN_COLUMNS, { pageSize: 25, searchPlaceholder: 'HSN or description…' });
    const s = data?.summary;

    return (
        <ReportPageShell<HsnRow>
            reportId="gstr1"
            period={period}
            note="B2C outward supplies: Textilesoft bills plus ERP invoices. Taxable value = GST-inclusive line value minus the line's GST. Cancelled bills are excluded. Prepared figures for filing, not a filed return."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.documents === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.byHsn.length }}
            export={{ columns: HSN_EXPORT_COLUMNS, fetchRows: () => hsn.filteredRows }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Taxable value', value: rupees0(s.taxable), sub: `${formatNumber(s.documents)} bills and invoices`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Total GST', value: rupees(s.tax), sub: s.igst ? `CGST ${rupees0(s.cgst)} · SGST ${rupees0(s.sgst)} · IGST ${rupees0(s.igst)}` : `CGST ${rupees0(s.cgst)} · SGST ${rupees0(s.sgst)}`, icon: <Percent className="w-4 h-4" /> },
                        { label: 'Invoice value', value: rupees0(s.value), sub: `Shop ${rupees0(data.bySource.shop.value)} · ERP ${rupees0(data.bySource.erp.value)}`, icon: <FileText className="w-4 h-4" /> },
                        { label: 'Cancelled bills', value: formatNumber(data.counts.cancelledShopBills.bills), sub: `${rupees0(data.counts.cancelledShopBills.value)} excluded`, icon: <XCircle className="w-4 h-4" /> },
                    ]} />

                    <GstChecks findings={outwardFindings(data.checks)} />

                    <ReportTable title="Rate-wise summary" subtitle="B2C supplies by GST rate (GSTR-1 Table 7)" columns={RATE_COLUMNS} rows={data.byRate} rowKey={r => String(r.rate)} emptyMessage="No taxable supplies in this period." />

                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Shop vs ERP" subtitle="Where the supplies were billed" autoHeight>
                            <dl className="grid grid-cols-3 gap-y-2 text-xs">
                                <dt className="text-slate-500" />
                                <dd className="text-right font-bold text-slate-500">Taxable</dd>
                                <dd className="text-right font-bold text-slate-500">GST</dd>
                                {(['shop', 'erp'] as const).map(k => (
                                    <React.Fragment key={k}>
                                        <dt className="font-bold text-slate-700 dark:text-slate-200">{k === 'shop' ? 'Textilesoft bills' : 'ERP invoices'}</dt>
                                        <dd className="text-right tabular-nums text-slate-900 dark:text-white">{rupees0(data.bySource[k].taxable)}</dd>
                                        <dd className="text-right tabular-nums text-slate-900 dark:text-white">{rupees(data.bySource[k].tax)}</dd>
                                    </React.Fragment>
                                ))}
                            </dl>
                        </ReportAnalysisCard>
                        <ReportTable title="Documents issued" subtitle="Bill series (GSTR-1 Table 13)" columns={DOC_COLUMNS} rows={data.documents} rowKey={r => `${r.source}:${r.series}`} emptyMessage="No documents in this period." />
                    </ReportAnalysisGrid>

                    <ReportTable
                        title="HSN summary"
                        subtitle="Outward supplies by HSN and rate (GSTR-1 Table 12). Export gives the portal's column order."
                        columns={HSN_COLUMNS}
                        rowKey={r => `${r.hsn}|${r.rate}`}
                        {...hsn.tableProps}
                        emptyMessage="No HSN matches the search."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default Gstr1Report;
