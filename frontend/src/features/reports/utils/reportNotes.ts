import { formatNumber } from '@/utils/formatters';

/** Sales-return status for report notes: the shop records none today; if that changes, say so plainly. */
export const salesReturnsNote = (entries?: number | null): string =>
    entries === undefined || entries === null
        ? ''
        : entries === 0
            ? 'No sales returns are recorded in the shop data.'
            : `Note: ${formatNumber(entries)} sales-return entries exist in the shop data and are not deducted here yet.`;

/** "Bills 2026-04-01 to latest" / "All bills" from an API `range`. */
export const rangeText = (noun: string, range: { from: string | null; to: string | null } | undefined): string =>
    range && (range.from || range.to) ? `${noun} ${range.from ?? 'from the start'} to ${range.to ?? 'latest'}` : `All ${noun.toLowerCase()}`;
