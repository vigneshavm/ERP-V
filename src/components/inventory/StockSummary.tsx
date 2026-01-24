import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    BarChart3,
    Search,
    Filter,
    Download,
    AlertTriangle,
    Zap,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Package,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    RefreshCw,
    Info,
    ChevronDown,
    MapPin,
    Calendar
} from 'lucide-react';

// --- Types ---

type EventType =
    | 'PURCHASE_GRN'
    | 'SALES_INVOICE'
    | 'SALES_RETURN'
    | 'PURCHASE_RETURN'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'STOCK_ADJUSTMENT';

interface StockEvent {
    id: string;
    type: EventType;
    sku: string;
    variant: string;
    batch: string;
    quantity: number;
    location: 'Floor' | 'Backroom';
    timestamp: string;
}

interface StockSummaryRow {
    sku: string;
    variant: string;
    batch: string;
    location: 'Floor' | 'Backroom';
    opening: number;
    inward: number;
    outward: number;
    adjustments: number;
    closing: number;
    lowStock: boolean;
    deadstock: boolean;
    excessStock: boolean;
    lastSaleDate?: string;
    reorderLevel: number;
    maxThreshold: number;
}

// --- Component ---

const StockSummary: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId;
    const { currentBranch } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState<'All' | 'Floor' | 'Backroom'>('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // --- Mock Data Generation (Simulating Enterprise Event Stream) ---
    const events: StockEvent[] = useMemo(() => {
        // Generate some realistic events for demonstration
        const baseEvents: StockEvent[] = [];

        products.slice(0, 10).forEach(product => {
            const sku = product.sku;
            const variant = "Default";
            const batch = "B" + Math.floor(Math.random() * 900 + 100);

            // Purchase GRN
            baseEvents.push({
                id: `evt-${sku}-1`,
                type: 'PURCHASE_GRN',
                sku,
                variant,
                batch,
                quantity: 100,
                location: 'Backroom',
                timestamp: '2024-01-01T10:00:00Z'
            });

            // Sales Invoice
            baseEvents.push({
                id: `evt-${sku}-2`,
                type: 'SALES_INVOICE',
                sku,
                variant,
                batch,
                quantity: 30,
                location: 'Floor',
                timestamp: '2024-01-05T14:30:00Z'
            });

            // Transfer In (Backroom to Floor)
            baseEvents.push({
                id: `evt-${sku}-3`,
                type: 'TRANSFER_IN',
                sku,
                variant,
                batch,
                quantity: 50,
                location: 'Floor',
                timestamp: '2024-01-02T11:00:00Z'
            });
            baseEvents.push({
                id: `evt-${sku}-4`,
                type: 'TRANSFER_OUT',
                sku,
                variant,
                batch,
                quantity: 50,
                location: 'Backroom',
                timestamp: '2024-01-02T11:00:00Z'
            });

            // Stock Adjustment
            baseEvents.push({
                id: `evt-${sku}-5`,
                type: 'STOCK_ADJUSTMENT',
                sku,
                variant,
                batch,
                quantity: -2,
                location: 'Floor',
                timestamp: '2024-01-10T09:00:00Z'
            });
        });

        return baseEvents;
    }, [products]);

    // --- Core Aggregation Engine ---
    const stockSummary: StockSummaryRow[] = useMemo(() => {
        const summaryMap = new Map<string, StockSummaryRow>();

        events.forEach(event => {
            const key = `${event.sku}|${event.variant}|${event.batch}|${event.location}`;

            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    sku: event.sku,
                    variant: event.variant,
                    batch: event.batch,
                    location: event.location,
                    opening: 10, // Simulated opening stock
                    inward: 0,
                    outward: 0,
                    adjustments: 0,
                    closing: 10,
                    lowStock: false,
                    deadstock: false,
                    excessStock: false,
                    reorderLevel: 20,
                    maxThreshold: 200
                });
            }

            const row = summaryMap.get(key)!;

            switch (event.type) {
                case 'PURCHASE_GRN':
                case 'SALES_RETURN':
                case 'TRANSFER_IN':
                    row.inward += event.quantity;
                    break;
                case 'SALES_INVOICE':
                case 'PURCHASE_RETURN':
                case 'TRANSFER_OUT':
                    row.outward += event.quantity;
                    if (event.type === 'SALES_INVOICE') {
                        row.lastSaleDate = event.timestamp;
                    }
                    break;
                case 'STOCK_ADJUSTMENT':
                    row.adjustments += event.quantity;
                    break;
            }

            // Recalculate Closing
            row.closing = row.opening + row.inward - row.outward + row.adjustments;

            // Intelligence Flags
            row.lowStock = row.closing < row.reorderLevel;
            row.excessStock = row.closing > row.maxThreshold;

            // Deadstock: If no sales in last 30 days (mock check)
            if (row.lastSaleDate) {
                const lastSale = new Date(row.lastSaleDate).getTime();
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                row.deadstock = lastSale < thirtyDaysAgo;
            } else {
                row.deadstock = true; // No sales at all
            }
        });

        return Array.from(summaryMap.values());
    }, [events]);

    const filteredSummary = useMemo(() => {
        return stockSummary.filter(row => {
            const matchesSearch = row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.variant.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter === 'All' || row.location === locationFilter;
            return matchesSearch && matchesLocation;
        });
    }, [stockSummary, searchTerm, locationFilter]);

    // --- UI Helpers ---

    const stats = useMemo(() => {
        const totalItems = filteredSummary.length;
        const lowStockCount = filteredSummary.filter(r => r.lowStock).length;
        const deadstockCount = filteredSummary.filter(r => r.deadstock).length;
        const totalClosing = filteredSummary.reduce((acc, r) => acc + r.closing, 0);

        return { totalItems, lowStockCount, deadstockCount, totalClosing };
    }, [filteredSummary]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Warehouse className="w-6 h-6 text-primary" />
                        Stock Summary
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{tenantId || 'GLOBAL'}</span>
                        <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                        <span>Branch: {currentBranch || 'BR01'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                        <Zap className="w-4 h-4" />
                        Run AI Forecast
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Stock Units</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase">{stats.totalClosing.toLocaleString()}</h3>
                        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            Across {stats.totalItems} Variants/Batches
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-error/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-error" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Low Stock Alerts</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-error uppercase">{stats.lowStockCount}</h3>
                        <p className="text-xs text-error/60 mt-1 flex items-center gap-1">
                            Action Required Immediately
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-warning/10 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-warning" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Deadstock (30+ Days)</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-warning uppercase">{stats.deadstockCount}</h3>
                        <p className="text-xs text-warning/60 mt-1 flex items-center gap-1">
                            Requires Liquidiation
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-success/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Stock Valuation</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-success uppercase">₹{(stats.totalClosing * 450).toLocaleString()}</h3>
                        <p className="text-xs text-success/60 mt-1 flex items-center gap-1">
                            Estimated Asset Value
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Search SKU / Variant</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-40">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Location</label>
                    <select
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value as any)}
                    >
                        <option value="All">All Locations</option>
                        <option value="Floor">Floor</option>
                        <option value="Backroom">Backroom</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">From</label>
                        <input
                            type="date"
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">To</label>
                        <input
                            type="date"
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        setSearchTerm('');
                        setLocationFilter('All');
                        setDateFrom('');
                        setDateTo('');
                    }}
                    className="px-4 py-2.5 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-500 hover:text-primary hover:border-primary transition-all uppercase tracking-widest"
                >
                    Reset
                </button>
            </div>

            {/* Grid Area */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Opening</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Inward (+)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Outward (-)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Adjust (+/-)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right bg-primary/5">Closing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Status Filters</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredSummary.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-neutral-900 dark:text-white text-sm">{row.sku}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{row.variant}</span>
                                                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                <span className="text-[10px] font-bold text-primary group-hover:text-primary/80">Batch: {row.batch}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.location === 'Floor'
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}>
                                            <MapPin className="w-3 h-3" />
                                            {row.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-neutral-500">{row.opening}</td>
                                    <td className="px-6 py-4 text-right font-medium text-success">
                                        <span className="flex items-center justify-end gap-1">
                                            {row.inward}
                                            <ArrowUpCircle className="w-3 h-3" />
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-error">
                                        <span className="flex items-center justify-end gap-1">
                                            {row.outward}
                                            <ArrowDownCircle className="w-3 h-3" />
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-warning">
                                        {row.adjustments > 0 ? `+${row.adjustments}` : row.adjustments}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white bg-primary/5">
                                        {row.closing}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {row.lowStock && (
                                                <div className="group/tip relative">
                                                    <div className="p-1 bg-error/10 text-error rounded-md hover:bg-error dark:hover:text-white transition-colors cursor-help">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block bg-neutral-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-neutral-700 capitalize">
                                                        Low Stock (Limit: {row.reorderLevel})
                                                    </div>
                                                </div>
                                            )}
                                            {row.deadstock && (
                                                <div className="group/tip relative">
                                                    <div className="p-1 bg-warning/10 text-warning rounded-md hover:bg-warning dark:hover:text-white transition-colors cursor-help">
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block bg-neutral-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-neutral-700 capitalize">
                                                        Deadstock (&gt;30 days)
                                                    </div>
                                                </div>
                                            )}
                                            {row.excessStock && (
                                                <div className="group/tip relative">
                                                    <div className="p-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-600 dark:hover:text-white transition-colors cursor-help">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block bg-neutral-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-neutral-700 capitalize">
                                                        Excess Stock (Max: {row.maxThreshold})
                                                    </div>
                                                </div>
                                            )}
                                            {!row.lowStock && !row.deadstock && !row.excessStock && (
                                                <span className="text-[10px] font-bold text-success uppercase tracking-widest">Healthy</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSummary.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-neutral-300" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No Stock Data Found</h3>
                        <p className="text-sm text-neutral-500 max-w-xs mt-1">
                            Try adjusting your filters or search terms to find what you're looking for.
                        </p>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-500 italic">
                        * Intelligence flags are computed in real-time based on your reorder levels and transaction history.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500 font-medium tracking-wide flex items-center gap-2">
                            <Info className="w-3 h-3" />
                            Audit Log Last Refreshed: {new Date().toLocaleTimeString()}
                        </span>
                        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded overflow-hidden">
                            <button className="px-3 py-1 bg-white dark:bg-neutral-800 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 border-r border-neutral-200 dark:border-neutral-700 transition-colors uppercase">First</button>
                            <button className="px-3 py-1 bg-white dark:bg-neutral-800 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors uppercase">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights Section (Enterprise Grade) */}
            <div className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Zap className="w-40 h-40" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 fill-current" />
                            Stock Intelligence Insights
                        </h3>
                        <p className="text-indigo-100 mt-2 text-sm leading-relaxed max-w-2xl">
                            Our AI suggests rotating **{stats.deadstockCount} items** from Backroom to Floor display.
                            Also, based on sales velocity, **{stats.lowStockCount} items** risk stockout before your next delivery.
                            Consider placing an emergency purchase order.
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-white text-primary rounded-xl font-bold shadow-lg hover:bg-neutral-100 transition-all text-sm whitespace-nowrap">
                        Optimize Inventory Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockSummary;
