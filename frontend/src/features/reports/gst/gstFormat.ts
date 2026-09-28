import { formatCurrency } from '@/utils/formatters';
import type { ReportColumn } from '../components';
import type { HsnRow, RateRow } from './gstTypes';

/** GST amounts are shown to the paise: returns are filed in rupees and paise. */
export const rupees = (v: number) => formatCurrency(v, { fractionDigits: 2 });
export const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

export const rateLabel = (rate: number): string => (rate < 0 ? 'Unknown rate' : `${rate}%`);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-08' → 'Aug 2026'. */
export const monthLabel = (m: string): string => `${MONTHS[Number(m.slice(5, 7)) - 1] ?? m} ${m.slice(0, 4)}`;

export const RATE_COLUMNS: ReportColumn<RateRow>[] = [
    { key: 'rate', header: 'GST rate', value: r => rateLabel(r.rate), sortable: false },
    { key: 'lines', header: 'Lines', type: 'number', value: r => r.lines, sortable: false },
    { key: 'taxable', header: 'Taxable value', type: 'currency', value: r => r.taxable, sortable: false },
    { key: 'cgst', header: 'CGST', type: 'currency', value: r => r.cgst, sortable: false },
    { key: 'sgst', header: 'SGST', type: 'currency', value: r => r.sgst, sortable: false },
    { key: 'igst', header: 'IGST', type: 'currency', value: r => r.igst, sortable: false },
    { key: 'tax', header: 'Total GST', type: 'currency', value: r => r.tax, sortable: false },
];

export const HSN_COLUMNS: ReportColumn<HsnRow>[] = [
    { key: 'hsn', header: 'HSN', value: r => r.hsn || '—', subtext: r => r.description, hideable: false },
    { key: 'rate', header: 'Rate', type: 'number', value: r => r.rate, render: r => rateLabel(r.rate) },
    { key: 'qty', header: 'Qty', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Total value', type: 'currency', value: r => r.value },
    { key: 'taxable', header: 'Taxable value', type: 'currency', value: r => r.taxable },
    { key: 'cgst', header: 'CGST', type: 'currency', value: r => r.cgst },
    { key: 'sgst', header: 'SGST', type: 'currency', value: r => r.sgst },
    { key: 'igst', header: 'IGST', type: 'currency', value: r => r.igst, defaultHidden: true },
];

export const HSN_EXPORT_COLUMNS: ReportColumn<HsnRow>[] = [
    { key: 'hsn', header: 'HSN', value: r => r.hsn },
    { key: 'description', header: 'Description', value: r => r.description },
    { key: 'qty', header: 'Total quantity', value: r => r.qty },
    { key: 'value', header: 'Total value', value: r => r.value },
    { key: 'rate', header: 'Rate (%)', value: r => (r.rate < 0 ? '' : r.rate) },
    { key: 'taxable', header: 'Taxable value', value: r => r.taxable },
    { key: 'igst', header: 'Integrated tax', value: r => r.igst },
    { key: 'cgst', header: 'Central tax', value: r => r.cgst },
    { key: 'sgst', header: 'State/UT tax', value: r => r.sgst },
    { key: 'cess', header: 'Cess', value: () => 0 },
];
