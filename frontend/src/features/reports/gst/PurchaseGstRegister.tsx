import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, Ban, FileText, Undo2 } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { FilterSelect, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from '../components';
import type { ReportColumn } from '../components';
import { filterSummary } from '../utils/reportExport';
import { GstChecks } from './GstChecks';
import type { Finding } from './gstFindings';
import { RATE_COLUMNS, rupees, rupees0 } from './gstFormat';
import type { InwardRow, PurchaseRegisterData } from './gstTypes';

const REPORT_URL = '/api/reports/gst/purchase-register';

const ELIGIBILITY = [
    { value: 'eligible', label: 'ITC claimable (valid GSTIN)' },
    { value: 'no-gstin', label: 'Not claimable (no GSTIN)' },
];
const SOURCES = [
    { value: 'shop', label: 'Textilesoft GRNs' },
    { value: 'erp', label: 'ERP supplier bills' },
];

const COLUMNS: ReportColumn<InwardRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date, sortable: true },
    {
        key: 'doc', header: 'Document', value: r => r.doc, sortable: true,
        subtext: r => [r.kind === 'return' ? 'Purchase return' : r.source === 'shop' ? 'GRN' : 'Supplier bill', r.supplierInvoiceNo && `Inv ${r.supplierInvoiceNo}`].filter(Boolean).join(' · '),
    },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier, sortable: true },
    {
        key: 'gstin', header: 'GSTIN', type: 'status', sortable: true,
        value: r => (r.itcEligible ? r.gstin : r.gstin ? `Invalid: ${r.gstin}` : 'Missing'),
        render: r => (r.itcEligible
            ? <span className="font-mono text-xs">{r.gstin}</span>
            : <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{r.gstin ? 'Invalid GSTIN' : 'No GSTIN'}</span>),
    },
    { key: 'rates', header: 'Rates', value: r => r.rates },
    { key: 'taxable', header: 'Taxable value', type: 'currency', value: r => r.taxable, sortable: true },
    { key: 'cgst', header: 'CGST', type: 'currency', value: r => r.cgst },
    { key: 'sgst', header: 'SGST', type: 'currency', value: r => r.sgst },
    { key: 'igst', header: 'IGST', type: 'currency', value: r => r.igst, defaultHidden: true },
    { key: 'tax', header: 'Total GST', type: 'currency', value: r => r.tax, sortable: true },
    { key: 'value', header: 'Invoice value', type: 'currency', value: r => r.value, sortable: true },
];

const EXPORT_COLUMNS: ReportColumn<InwardRow>[] = [
    { key: 'date', header: 'Entry date', value: r => r.date },
    { key: 'invoiceDate', header: 'Supplier invoice date', value: r => r.invoiceDate },
    { key: 'kind', header: 'Type', value: r => (r.kind === 'return' ? 'Purchase return' : 'Purchase') },
    { key: 'source', header: 'Source', value: r => (r.source === 'shop' ? 'Textilesoft GRN' : 'ERP supplier bill') },
    { key: 'doc', header: 'GRN / bill no.', value: r => r.doc },
    { key: 'supplierInvoiceNo', header: 'Supplier invoice no.', value: r => r.supplierInvoiceNo },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'gstin', header: 'Supplier GSTIN', value: r => r.gstin },
    { key: 'itcEligible', header: 'ITC claimable', value: r => (r.itcEligible ? 'Yes' : 'No') },
    { key: 'rates', header: 'Rates', value: r => r.rates },
    { key: 'taxable', header: 'Taxable value', value: r => r.taxable },
    { key: 'cgst', header: 'CGST', value: r => r.cgst },
    { key: 'sgst', header: 'SGST', value: r => r.sgst },
    { key: 'igst', header: 'IGST', value: r => r.igst },
    { key: 'tax', header: 'Total GST', value: r => r.tax },
    { key: 'value', header: 'Invoice value', value: r => r.value },
];

/**
 * Purchase GST Register (replaces "GSTR-2", which is no longer filed): every purchase document with its
 * GST, marked claimable only when the supplier has a valid GSTIN. Use it to match against GSTR-2B.
 */
const PurchaseGstRegister: React.FC = () => {
    const period = useReportPeriod('last-month');
    const { from, to } = period.period;
    const [eligibility, setEligibility] = useState('');
    const [source, setSource] = useState('');
    const filters = useMemo(() => ({ from, to, eligibility, source }), [from, to, eligibility, source]);
    const report = useServerReport<PurchaseRegisterData, InwardRow>(REPORT_URL, filters, {
        numericSort: ['date', 'taxable', 'tax', 'value'],
        searchPlaceholder: 'GRN, bill, supplier or GSTIN…',
        noun: 'documents',
    });
    const { data, loading, error, reload, searchInput } = report;
    const s = data?.summary;
    const active = (eligibility ? 1 : 0) + (source ? 1 : 0);

    const findings: Finding[] = [];
    if (s && s.suppliersWithoutGstin > 0) {
        findings.push({ tone: 'warning', text: `${formatNumber(s.suppliersWithoutGstin)} suppliers have no valid GSTIN recorded, so ${rupees(s.noGstin.tax)} of GST on their purchases is not counted as ITC. Add their GSTIN in the supplier master if they are registered.` });
    }
    if (data && data.checks.unknownRate > 0) {
        findings.push({ tone: 'warning', text: `${formatNumber(data.checks.unknownRate)} documents have lines whose GST rate could not be determined.` });
    }
    if (data && !data.checks.returnsAvailable) {
        findings.push({ tone: 'warning', text: 'The shop database\'s purchase return tables could not be read, so returns are not deducted.' });
    }
    findings.push({ tone: 'info', text: 'Textilesoft does not record the supplier\'s own invoice number, only the GRN number and invoice date. Match against GSTR-2B by supplier GSTIN, date and amount.' });

    return (
        <ReportPageShell<InwardRow>
            reportId="purchase-gst-register"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setEligibility(''); setSource(''); },
                content: (
                    <>
                        <FilterSelect label="ITC" value={eligibility} onChange={setEligibility} options={ELIGIBILITY} allLabel="All documents" />
                        <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCES} allLabel="Shop and ERP" />
                    </>
                ),
            }}
            note="Textilesoft GRN lines (by GRN entry date) and ERP supplier bills that are approved, paid, unpaid or overdue. Taxable value = GST-inclusive line value minus the line's GST. Purchase returns are shown as negative amounts."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.documents === 0 && !active && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([
                    ['ITC', ELIGIBILITY.find(o => o.value === eligibility)?.label],
                    ['Source', SOURCES.find(o => o.value === source)?.label],
                    ['Search', report.params.search],
                ]),
            }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Purchases (taxable)', value: rupees0(s.all.taxable), sub: `${formatNumber(s.documents)} documents`, icon: <FileText className="w-4 h-4" /> },
                        { label: 'Claimable ITC', value: rupees(s.eligible.tax), sub: 'suppliers with a valid GSTIN', icon: <ArrowDownToLine className="w-4 h-4" /> },
                        { label: 'Not claimable', value: rupees(s.noGstin.tax), sub: `${formatNumber(s.suppliersWithoutGstin)} suppliers without GSTIN`, tone: s.noGstin.tax > 0 ? 'warning' : 'default', icon: <Ban className="w-4 h-4" /> },
                        { label: 'Purchase returns', value: rupees(Math.abs(s.returns.tax)), sub: `GST reversed on ${rupees0(Math.abs(s.returns.taxable))}`, icon: <Undo2 className="w-4 h-4" /> },
                    ]} />
                    <GstChecks findings={findings} />
                    <ReportTable title="Rate-wise summary" subtitle="All purchase documents in the period, by GST rate" columns={RATE_COLUMNS} rows={data.byRate} rowKey={r => String(r.rate)} />
                    <ReportTable
                        title="Purchase documents"
                        subtitle="One row per GRN, supplier bill or purchase return"
                        columns={COLUMNS}
                        rowKey={r => `${r.source}:${r.kind}:${r.doc}`}
                        {...report.tableProps}
                        emptyMessage="No purchase documents match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default PurchaseGstRegister;
