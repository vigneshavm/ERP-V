import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDir } from './ReportTable';

/**
 * Clickable column header for hand-built tables outside the report kit (e.g. Aged Stock): click to sort, click
 * again to reverse. Report pages use ReportTable, which has this built in.
 */
export const SortTh: React.FC<{ label: string; col: string; sort: string | null; dir: SortDir; onSort: (col: string) => void; align?: 'left' | 'right' }> = ({ label, col, sort, dir, onSort, align = 'left' }) => {
    const active = sort === col;
    const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button
                type="button"
                onClick={() => onSort(col)}
                className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold hover:text-primary transition-colors ${align === 'right' ? 'flex-row-reverse' : ''} ${active ? 'text-primary' : ''}`}
                title={`Sort by ${label.toLowerCase()}`}
            >
                {label}
                <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} />
            </button>
        </th>
    );
};
