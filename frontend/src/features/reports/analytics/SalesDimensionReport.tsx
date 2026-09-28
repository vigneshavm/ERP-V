import React, { useMemo, useState } from 'react';
import { Award, Boxes, IndianRupee, Receipt } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import {
    FilterMultiSelect, ReportAnalysisCard, ReportAnalysisGrid, ReportColumn, ReportKpiGrid, ReportPageShell, ReportRankList, ReportTable,
    useClientReportTable, useReportPeriod,
} from '../components';
import type { ReportId } from '../config/reportRegistry';
import { DimensionRow, ShopSalesDim, useShopSales, withBasis } from './shopSales';

interface Row extends DimensionRow { sharePct: number }

export interface SalesDimensionConfig {
    reportId: ReportId;
    dim: ShopSalesDim;
    /** Singular name of the dimension: "Brand", "Category", "Counter", "Product". */
    label: string;
    /** What `count` means for this dimension. */
    countLabel: 'Bills' | 'Sale lines';
    /** Whether pieces sold are known (not for billing counters). */
    hasItems: boolean;
    /** How the figures are computed, for the note line. */
    note: string;
    /** Offer a multi-select filter on the dimension's values (Product-Wise). */
    multiSelect?: boolean;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/**
 * One report for every "sales by X" breakdown (brand, category, billing counter, sales counter, product type):
 * the same KPIs, ranked bars, table and export, configured per dimension.
 */
export const SalesDimensionReport: React.FC<{ config: SalesDimensionConfig }> = ({ config }) => {
    const { reportId, dim, label, countLabel, hasItems, note, multiSelect } = config;
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const shop = useShopSales<DimensionRow>(dim, from, to);
    const [selected, setSelected] = useState<string[]>([]);

    const allRows = shop.rows;
    const rows: Row[] = useMemo(() => {
        const picked = selected.length ? allRows.filter(r => selected.includes(r.name)) : allRows;
        const total = picked.reduce((a, r) => a + r.revenue, 0);
        return picked.map(r => ({ ...r, sharePct: total > 0 ? Math.round((r.revenue / total) * 1000) / 10 : 0 }));
    }, [allRows, selected]);

    const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
    const totalCount = rows.reduce((a, r) => a + r.count, 0);
    const totalItems = rows.reduce((a, r) => a + (r.items ?? 0), 0);
    const top = rows[0];
    const topByPieces = hasItems ? [...rows].sort((a, b) => (b.items ?? 0) - (a.items ?? 0))[0] : undefined;

    const columns = useMemo<ReportColumn<Row>[]>(() => [
        { key: 'name', header: label, value: r => r.name, sortable: true },
        { key: 'count', header: countLabel, type: 'number', value: r => r.count },
        ...(hasItems ? [{ key: 'items', header: 'Pcs', type: 'quantity', value: (r: Row) => r.items ?? null } as ReportColumn<Row>] : []),
        { key: 'revenue', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.revenue, cellClassName: () => 'font-bold' },
        { key: 'sharePct', header: 'Share', type: 'percent', value: r => r.sharePct },
    ], [label, countLabel, hasItems]);
    const { tableProps, filteredRows } = useClientReportTable(rows, columns, { searchPlaceholder: `Search ${label.toLowerCase()}…` });

    const ranked = rows.slice(0, 10);
    const rankedByPieces = hasItems ? [...rows].sort((a, b) => (b.items ?? 0) - (a.items ?? 0)).slice(0, 10) : [];

    return (
        <ReportPageShell<Row>
            reportId={reportId}
            period={period}
            filters={multiSelect ? {
                activeCount: selected.length ? 1 : 0,
                onClear: () => setSelected([]),
                content: <FilterMultiSelect label={label} values={selected} onChange={setSelected} options={allRows.map(r => r.name)} />,
            } : undefined}
            note={shop.loaded ? withBasis(`${note} Cancelled bills excluded.`, shop.basis) : undefined}
            onRefresh={() => shop.reload(true)}
            loading={shop.loading}
            error={shop.error}
            isEmpty={shop.loaded && allRows.length === 0}
            meta={{ resolvedSource: shop.source, asOf: shop.asOf, recordCount: rows.length }}
            export={{
                columns: [
                    ...columns,
                    { key: 'avg', header: 'Sales per piece', value: r => (hasItems && r.items ? Math.round((r.revenue / r.items) * 100) / 100 : null), exportable: hasItems },
                ],
                fetchRows: () => filteredRows,
                filterSummary: [...(selected.length ? [`${label}: ${selected.join(', ')}`] : []), ...(tableProps.search?.value ? [`Search: ${tableProps.search.value}`] : [])],
            }}
        >
            {shop.loaded && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Total sales', value: rupees0(totalRevenue), sub: selected.length ? `${selected.length} selected` : 'Selected period', icon: <IndianRupee className="w-4 h-4" /> },
                        { label: countLabel, value: formatNumber(totalCount), sub: `${formatNumber(rows.length)} ${label.toLowerCase()}${rows.length === 1 ? '' : 's'}`, icon: <Receipt className="w-4 h-4" /> },
                        hasItems
                            ? { label: 'Pieces sold', value: formatQuantity(totalItems), sub: topByPieces ? `Most: ${topByPieces.name}` : undefined, icon: <Boxes className="w-4 h-4" /> }
                            : { label: 'Average bill', value: totalCount ? rupees0(totalRevenue / totalCount) : '—', icon: <Boxes className="w-4 h-4" /> },
                        { label: `Top ${label.toLowerCase()}`, value: top?.name ?? '—', sub: top ? `${rupees0(top.revenue)} · ${top.sharePct}% of sales` : undefined, icon: <Award className="w-4 h-4" /> },
                    ]} />
                    {rows.length > 1 && (hasItems ? (
                        <ReportAnalysisGrid>
                            <ReportAnalysisCard title={`Top ${label.toLowerCase()}s by sales`} subtitle={`Sales value, top ${ranked.length}`} autoHeight>
                                <ReportRankList items={ranked.map(r => ({ label: r.name, value: r.revenue, display: rupees0(r.revenue) }))} />
                            </ReportAnalysisCard>
                            <ReportAnalysisCard title={`Top ${label.toLowerCase()}s by pieces`} subtitle={`Pieces sold, top ${rankedByPieces.length}`} autoHeight>
                                <ReportRankList items={rankedByPieces.map(r => ({ label: r.name, value: r.items ?? 0, display: `${formatQuantity(r.items ?? 0)} pcs` }))} />
                            </ReportAnalysisCard>
                        </ReportAnalysisGrid>
                    ) : (
                        <ReportAnalysisCard title={`Sales by ${label.toLowerCase()}`} subtitle="Sales value" autoHeight>
                            <ReportRankList items={ranked.map(r => ({ label: `${r.name} · ${formatNumber(r.count)} bills`, value: r.revenue, display: rupees0(r.revenue) }))} />
                        </ReportAnalysisCard>
                    ))}
                    <ReportTable
                        title={`Sales by ${label.toLowerCase()}`}
                        subtitle={`Share is of ${selected.length ? 'the selected' : 'all'} sales in the period`}
                        columns={columns}
                        rowKey={r => r.name}
                        {...tableProps}
                        emptyMessage={`No ${label.toLowerCase()} matches the search.`}
                    />
                </>
            )}
        </ReportPageShell>
    );
};
