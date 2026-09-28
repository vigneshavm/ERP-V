import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { ReportColumn, StatusTone } from '../components';
import type { FinanceChecks, FinanceEntry, TypeRow } from './financeTypes';

export const rupees = (v: number) => formatCurrency(v, { fractionDigits: 2 });
export const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/** Zero shows as "—" in money columns so the eye goes to the amounts that moved. */
export const nz = (v: number): number | null => (Math.abs(v) < 0.005 ? null : v);

export const TYPE_OPTIONS = [
    { value: 'sale', label: 'Sale' },
    { value: 'sale-return', label: 'Sales return' },
    { value: 'receipt', label: 'Customer receipt' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'purchase-return', label: 'Purchase return' },
    { value: 'supplier-payment', label: 'Supplier payment' },
    { value: 'expense', label: 'Expense' },
    { value: 'cash-in', label: 'Cash in' },
    { value: 'cash-out', label: 'Cash out' },
    { value: 'transfer', label: 'Transfer' },
];
export const MODE_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank / UPI / card' },
    { value: 'credit', label: 'On credit (unpaid)' },
];
export const SOURCE_OPTIONS = [
    { value: 'shop', label: 'Textilesoft (shop)' },
    { value: 'erp', label: 'ERP' },
];

const TYPE_TONES: Record<string, StatusTone> = {
    'Sale': 'success', 'Customer receipt': 'success', 'Cash in': 'success',
    'Sales return': 'warning', 'Expense': 'warning', 'Cash out': 'warning',
    'Purchase': 'info', 'Supplier payment': 'info',
    'Purchase return': 'neutral', 'Transfer': 'neutral',
};

/** "Cash ₹600 · Bank ₹400 · Credit ₹0" → only the parts that apply. */
export function howPaid(e: Pick<FinanceEntry, 'cashIn' | 'bankIn' | 'cashOut' | 'bankOut' | 'credit' | 'type'>): string {
    if (e.type === 'transfer') return 'Own accounts';
    const parts: string[] = [];
    const cash = e.cashIn + e.cashOut;
    const bank = e.bankIn + e.bankOut;
    if (cash) parts.push(`Cash ${rupees0(cash)}`);
    if (bank) parts.push(`Bank ${rupees0(bank)}`);
    if (e.credit) parts.push(`Credit ${rupees0(e.credit)}`);
    return parts.join(' · ') || '—';
}

export const ENTRY_COLUMNS: ReportColumn<FinanceEntry>[] = [
    { key: 'date', header: 'Date', type: 'date', value: e => e.date, subtext: e => e.time, sortable: true },
    { key: 'type', header: 'Type', type: 'status', value: e => e.typeLabel, statusTones: TYPE_TONES, sortable: true },
    { key: 'ref', header: 'Ref', value: e => e.ref || '—', subtext: e => (e.source === 'shop' ? 'Shop' : 'ERP'), sortable: true },
    { key: 'party', header: 'Party / category', value: e => e.party || '—', subtext: e => e.note, sortable: true },
    { key: 'amount', header: 'Amount', type: 'currency', value: e => e.amount, sortable: true },
    { key: 'in', header: 'Money in', type: 'currency', value: e => nz(e.cashIn + e.bankIn), sortable: true },
    { key: 'out', header: 'Money out', type: 'currency', value: e => nz(e.cashOut + e.bankOut), sortable: true },
    { key: 'how', header: 'How paid', value: e => howPaid(e) },
];

export const ENTRY_EXPORT_COLUMNS: ReportColumn<FinanceEntry>[] = [
    { key: 'date', header: 'Date', value: e => e.date },
    { key: 'time', header: 'Time', value: e => e.time },
    { key: 'type', header: 'Type', value: e => e.typeLabel },
    { key: 'source', header: 'Source', value: e => (e.source === 'shop' ? 'Textilesoft' : 'ERP') },
    { key: 'ref', header: 'Ref', value: e => e.ref },
    { key: 'party', header: 'Party / category', value: e => e.party },
    { key: 'note', header: 'Note', value: e => e.note },
    { key: 'amount', header: 'Amount', value: e => e.amount },
    { key: 'cashIn', header: 'Cash in', value: e => e.cashIn },
    { key: 'bankIn', header: 'Bank in', value: e => e.bankIn },
    { key: 'cashOut', header: 'Cash out', value: e => e.cashOut },
    { key: 'bankOut', header: 'Bank out', value: e => e.bankOut },
    { key: 'credit', header: 'On credit', value: e => e.credit },
];

export const TYPE_SUMMARY_COLUMNS: ReportColumn<TypeRow>[] = [
    { key: 'label', header: 'Type', value: r => r.label, sortable: false },
    { key: 'entries', header: 'Entries', type: 'number', value: r => r.entries, sortable: false },
    { key: 'amount', header: 'Amount', type: 'currency', value: r => r.amount, sortable: false },
    { key: 'cashIn', header: 'Cash in', type: 'currency', value: r => nz(r.cashIn), sortable: false },
    { key: 'bankIn', header: 'Bank in', type: 'currency', value: r => nz(r.bankIn), sortable: false },
    { key: 'cashOut', header: 'Cash out', type: 'currency', value: r => nz(r.cashOut), sortable: false },
    { key: 'bankOut', header: 'Bank out', type: 'currency', value: r => nz(r.bankOut), sortable: false },
    { key: 'credit', header: 'On credit', type: 'currency', value: r => nz(r.credit), sortable: false },
];

/** Plain notes about the data behind the figures (shown in the shell's note). */
export function financeNotes(c?: FinanceChecks): string {
    const parts = [
        'Money in/out counts only money that moved: credit sales and credit purchases are shown as "On credit", and transfers between your own cash and bank are left out.',
        'Shop bills: cash is the bill total minus card, UPI and other non-cash parts.',
        'ERP expenses, receipts, returns and cash-book entries of every user in this shop are included.',
    ];
    if (c && c.overpaidShopBills > 0) parts.push(`${formatNumber(c.overpaidShopBills)} shop bills record non-cash payments above the bill total; they were capped at the total.`);
    if (c && !c.returnsAvailable) parts.push('The shop\'s purchase return tables could not be read.');
    return parts.join(' ');
}
