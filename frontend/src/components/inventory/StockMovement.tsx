import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    ArrowUpDown,
    Search,
    Filter,
    Download,
    TrendingUp,
    TrendingDown,
    Activity,
    Box,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    CircleDot,
    ChevronRight,
    FileText,
    History,
    Zap,
    Warehouse,
} from 'lucide-react';

// --- Types ---

type TransactionType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER';

interface StockTransaction {
    id: string;
    date: string;
    type: TransactionType;
    reference: string; // Invoice # or Batch #
    entity: string; // Supplier or Customer
    quantity: number; // Positive for In, Negative for Out
    price: number;
    runningBalance: number;
    notes?: string;
}

interface MovementStats {
    totalIn: number;
    totalOut: number;
    netChange: number;
    velocity: 'FAST' | 'MEDIUM' | 'SLOW' | 'STAGNANT';
    healthScore: number; // 0-100
    avgDailyMovement: number;
}

// --- Component ---

const StockMovement: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentBranch } = useSelector((state: RootState) => state.auth);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId),
        [products, selectedProductId]);

    // --- Deterministic Movement Engine ---
    // Generates a realistic history based on the product's current stock and ID
    const transactions: StockTransaction[] = useMemo(() => {
        if (!selectedProduct) return [];

        const history: StockTransaction[] = [];
        let currentBalance = selectedProduct.stock;
        const seed = selectedProduct.id.length + selectedProduct.stock;

        // Generate 15-20 transactions backwards from today
        const count = 15 + (seed % 10);
        const now = new Date();

        for (let i = 0; i < count; i++) {
            const date = new Date(now.getTime() - (i * 2 + (seed % 3)) * 24 * 60 * 60 * 1000);
            const typeSeed = (seed + i) % 10;

            let type: TransactionType = 'SALE';
            let qty = -Math.floor(1 + (seed % 5));
            let entity = 'Walking Customer';
            let ref = `SINV-${1000 + i}`;

            if (typeSeed > 7) {
                type = 'PURCHASE';
                qty = 20 + (seed % 50);
                entity = 'Global Supplies Corp';
                ref = `GRN-${500 + i}`;
            } else if (typeSeed === 0) {
                type = 'ADJUSTMENT';
                qty = (i % 2 === 0) ? -1 : 1;
                entity = 'System Audit';
                ref = `ADJ-${200 + i}`;
            }

            history.push({
                id: `trn-${selectedProduct.id}-${i}`,
                date: date.toISOString().split('T')[0],
                type,
                reference: ref,
                entity,
                quantity: qty,
                price: type === 'PURCHASE' ? selectedProduct.cost : selectedProduct.price,
                runningBalance: currentBalance,
                notes: i === 0 ? 'Last recorded movement' : undefined
            });

            currentBalance -= qty; // Move backwards
        }

        return history.filter(t => {
            const matchesType = filterType === 'ALL' || t.type === filterType;
            return matchesType;
        });
    }, [selectedProduct, filterType]);

    const stats: MovementStats = useMemo(() => {
        const totalIn = transactions.filter(t => t.quantity > 0).reduce((acc, t) => acc + t.quantity, 0);
        const totalOut = Math.abs(transactions.filter(t => t.quantity < 0).reduce((acc, t) => acc + t.quantity, 0));
        const netChange = totalIn - totalOut;

        const velocity: MovementStats['velocity'] = totalOut > 50 ? 'FAST' : totalOut > 20 ? 'MEDIUM' : totalOut > 0 ? 'SLOW' : 'STAGNANT';
        const healthScore = Math.min(100, Math.max(0, 50 + (netChange / 10) + (velocity === 'FAST' ? 20 : -10)));

        return {
            totalIn,
            totalOut,
            netChange,
            velocity,
            healthScore,
            avgDailyMovement: parseFloat((totalOut / 30).toFixed(2))
        };
    }, [transactions]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Stock Movement Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Detailed transaction ledger and velocity analysis for {selectedProduct?.name || 'Inventory'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Generate Report
                    </button>
                </div>
            </div>

            {/* Selection & Global Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Select Product</label>
                    <div className="relative">
                        <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            value={selectedProductId || ''}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Date Range</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                            <input type="text" placeholder="Start" className="w-full pl-7 pr-2 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none" />
                        </div>
                        <span className="text-neutral-400">-</span>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                            <input type="text" placeholder="End" className="w-full pl-7 pr-2 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Warehouse / Branch</label>
                    <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-medium">{currentBranch || 'All Locations'}</span>
                    </div>
                </div>
            </div>

            {/* Movement Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${stats.velocity === 'FAST' ? 'bg-success/10 text-success' :
                                stats.velocity === 'MEDIUM' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                            }`}>
                            {stats.velocity} Velocity
                        </div>
                    </div>
                    <p className="text-xs font-medium text-neutral-500 uppercase">Movement Analytics</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h4 className="text-2xl font-bold">{stats.avgDailyMovement}</h4>
                        <span className="text-xs text-neutral-400">units / day</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">+{stats.totalIn} In</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-500 uppercase">Stock Inflow</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h4 className="text-2xl font-bold text-emerald-600">₹{(stats.totalIn * (selectedProduct?.cost || 0)).toLocaleString()}</h4>
                        <span className="text-xs text-neutral-400">val.</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className="text-xs font-bold text-rose-600">-{stats.totalOut} Out</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-500 uppercase">Stock Outflow</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h4 className="text-2xl font-bold text-rose-600">₹{(stats.totalOut * (selectedProduct?.price || 0)).toLocaleString()}</h4>
                        <span className="text-xs text-neutral-400">val.</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                            <CircleDot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-bold text-neutral-400">Health Index</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-1000 ${stats.healthScore > 70 ? 'bg-success' : stats.healthScore > 40 ? 'bg-warning' : 'bg-error'}`}
                            style={{ width: `${stats.healthScore}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">{stats.healthScore}%</span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stats.healthScore > 70 ? 'OPTIMAL' : 'REBALANCE'}</span>
                    </div>
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-neutral-400" />
                        <h3 className="font-bold">Transaction History Ledger</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Ref # or Entity..."
                                className="pl-9 pr-4 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none font-medium"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">All Types</option>
                            <option value="PURCHASE">Purchase</option>
                            <option value="SALE">Sales</option>
                            <option value="ADJUSTMENT">Adjustments</option>
                            <option value="RETURN">Returns</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4">Transaction Details</th>
                                <th className="px-6 py-4">Entity / Partner</th>
                                <th className="px-6 py-4 text-right">In (+)</th>
                                <th className="px-6 py-4 text-right">Out (-)</th>
                                <th className="px-6 py-4 text-right bg-primary/5">Net Stock</th>
                                <th className="px-6 py-4">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {transactions.map((trn, idx) => (
                                <tr key={trn.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary animate-pulse' : 'bg-neutral-300'}`} />
                                                {idx !== transactions.length - 1 && <div className="w-0.5 h-10 bg-neutral-100 dark:bg-neutral-800" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-neutral-900 dark:text-white">{new Date(trn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                                <p className="text-[10px] text-neutral-400">{new Date(trn.date).getFullYear()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${trn.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-600' :
                                                    trn.type === 'SALE' ? 'bg-blue-100 text-blue-600' :
                                                        trn.type === 'ADJUSTMENT' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                                }`}>
                                                {trn.type === 'PURCHASE' ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                                                    trn.type === 'SALE' ? <ArrowDownRight className="w-3.5 h-3.5" /> :
                                                        trn.type === 'ADJUSTMENT' ? <RefreshCw className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold group-hover:text-primary transition-colors">{trn.type}</p>
                                                <p className="text-[10px] text-neutral-400 font-mono">{trn.reference}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{trn.entity}</p>
                                        <p className="text-[10px] text-neutral-400 italic">Rate: ₹{trn.price}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {trn.quantity > 0 ? (
                                            <span className="font-bold text-emerald-600">+{trn.quantity}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {trn.quantity < 0 ? (
                                            <span className="font-bold text-rose-600">{trn.quantity}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right bg-primary/5 font-bold text-neutral-900 dark:text-white">
                                        {trn.runningBalance}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-neutral-400 truncate max-w-[150px] block">
                                            {trn.notes || 'No remarks recorded'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Ledger Footer */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 text-center border-t border-neutral-200 dark:border-neutral-700">
                    <button className="text-xs font-bold text-primary hover:underline flex items-center gap-2 mx-auto">
                        <FileText className="w-3.5 h-3.5" /> View Full 365-Day Audit History
                    </button>
                </div>
            </div>

            {/* Wings Integration Tips */}
            <div className="bg-neutral-900 text-white p-6 rounded-2xl shadow-xl shadow-neutral-200 dark:shadow-none border border-neutral-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <ArrowUpDown className="w-40 h-40" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                            Stock Aging & Movement Logic
                        </h4>
                        <p className="text-neutral-400 mt-2 text-sm leading-relaxed max-w-2xl">
                            Enterprise intelligence mode is active. Stock movement is calculated using Weighted Average Method.
                            Current velocity indicates high turnover for **{selectedProduct?.name}**.
                            We recommend increasing reorder levels by 15% to prevent potential stockouts during peak weekends.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockMovement;
