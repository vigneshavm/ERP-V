/** How to read the stock reports; shown under the toolbar and written into the CSV header. */
export const stockNote = (data: { approximate?: boolean; source?: string }, extra = ''): string => [
    'Stock per barcode = shop stock + ERP movements, same as Aged Stock.',
    extra,
    data.approximate || data.source === 'mongo' ? 'Read from the ERP’s MongoDB copy (shop database unavailable or not in use), so purchase dates are approximate.' : '',
].filter(Boolean).join(' ');
