import React, { useMemo } from 'react';
import { ReportColumn, ReportTable, useClientReportTable } from '../components';

export interface StockGroup {
    key: string;
    lots: number;
    qty: number;
    costValue: number;
    mrpValue: number;
}

const isRollUp = (g: StockGroup) => g.key.startsWith('Others (');

const columnsFor = (label: string, showMrp: boolean): ReportColumn<StockGroup>[] => [
    { key: 'key', header: label, value: g => g.key, sortable: true },
    { key: 'lots', header: 'Lots', type: 'number', value: g => g.lots },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: g => g.qty },
    { key: 'costValue', header: 'Value (cost)', type: 'currency', fractionDigits: 0, value: g => g.costValue, cellClassName: () => 'font-bold' },
    ...(showMrp ? [{ key: 'mrpValue', header: 'Value (MRP)', type: 'currency', fractionDigits: 0, value: (g: StockGroup) => g.mrpValue } as ReportColumn<StockGroup>] : []),
];

/**
 * Stock grouped by category / brand / band / city / rack. Complete lists, so sorting and paging happen in the
 * browser; an "Others (n)" roll-up row always stays last. With `onPick`, clicking a row filters the report by it.
 */
export const StockGroupTable: React.FC<{
    title: string;
    subtitle?: string;
    label: string;
    groups: StockGroup[];
    showMrp?: boolean;
    onPick?: (key: string) => void;
    picked?: string;
}> = ({ title, subtitle, label, groups, showMrp = false, onPick, picked }) => {
    const columns = useMemo(() => columnsFor(label, showMrp), [label, showMrp]);
    const main = useMemo(() => groups.filter(g => !isRollUp(g)), [groups]);
    const rollUps = useMemo(() => groups.filter(isRollUp), [groups]);
    const { tableProps } = useClientReportTable(main, columns, { pageSize: 25, searchPlaceholder: `Search ${label.toLowerCase()}…` });

    return (
        <ReportTable
            title={title}
            subtitle={subtitle ?? (onPick ? 'Click a row to filter the report by it' : undefined)}
            columns={columns}
            rowKey={g => g.key}
            {...tableProps}
            // Short lists don't need a search box.
            search={main.length > 12 ? tableProps.search : undefined}
            pinnedBottomRows={rollUps}
            onRowClick={onPick ? g => onPick(g.key === picked ? '' : g.key) : undefined}
            rowClassName={g => (picked && g.key === picked ? 'bg-[rgb(var(--color-primary)/0.06)]' : undefined)}
            emptyMessage="Nothing to show."
        />
    );
};
