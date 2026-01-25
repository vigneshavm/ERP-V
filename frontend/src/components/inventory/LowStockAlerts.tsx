import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    AlertTriangle,
    TrendingUp,
    Package,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Download,
    RefreshCw,
    Info,
    CheckCircle2,
    Clock,
    Truck,
    Box,
    ChevronRight,
    Zap,
} from 'lucide-react';

// --- Types ---

type RiskLevel = 'CRITICAL' | 'LOW' | 'WATCH' | 'OK';

interface LowStockAlert {
    sku: string;
    item_name: string;
    category: string;
    branch_id: string;
    current_stock: number;
    floor_stock: number;
    backroom_stock: number;
    avg_daily_sales: number;
    days_of_stock: number;
    risk_level: RiskLevel;
    recommended_action: string;
    recommended_order_qty: number;
    supplier: string;
    expected_stockout_date: string;
    isFastMoving: boolean;
    hasImbalance: boolean;
}

// --- Component ---

const LowStockAlerts: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentBranch, user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

    // --- Intelligence Engine ---
    const alerts: LowStockAlert[] = useMemo(() => {
        return products.map(product => {
            const seed = product.id.length + product.stock;

            // Mocking input data for intelligence logic
            const avg_daily_sales = parseFloat((0.5 + (seed % 5) / 1.2).toFixed(1));
            const lead_time_days = 3 + (seed % 7);
            const quantity_on_order = (seed % 4 === 0) ? 20 + (seed % 30) : 0;

            const days_of_stock = avg_daily_sales > 0 ? product.stock / avg_daily_sales : 999;

            // Risk Classification
            let risk_level: RiskLevel = 'OK';
            if (days_of_stock <= 3) risk_level = 'CRITICAL';
            else if (days_of_stock <= 7) risk_level = 'LOW';
            else if (days_of_stock <= 14) risk_level = 'WATCH';

            // Floor vs Backroom Intelligence
            // Use 70/30 split logic for mock
            const floor_stock = Math.round(product.stock * 0.3);
            const backroom_stock = product.stock - floor_stock;
            const hasImbalance = floor_stock === 0 && backroom_stock > 0;

            // Reorder Recommendation
            const safety_growth_factor = product.category.toLowerCase().includes('shirt') ? 1.4 : 1.2;
            const safety_buffer = Math.ceil(avg_daily_sales * 5 * safety_growth_factor);
            const raw_recommended = (avg_daily_sales * lead_time_days) + safety_buffer - product.stock - quantity_on_order;
            const recommended_order_qty = Math.max(0, Math.ceil(raw_recommended / 10) * 10);

            // Action Generation
            let recommended_action = "Stock levels are healthy.";
            if (hasImbalance) recommended_action = "Floor stock empty. Refill from backroom immediately.";
            else if (risk_level === 'CRITICAL') recommended_action = `Critical shortage! Place immediate PO for ${recommended_order_qty} units.`;
            else if (risk_level === 'LOW') recommended_action = `Low stock. Schedule replenishment order of ${recommended_order_qty} units.`;
            else if (risk_level === 'WATCH') recommended_action = "Monitoring sales velocity. No immediate action.";

            // Stockout Prediction
            const stockoutDate = new Date();
            stockoutDate.setDate(stockoutDate.getDate() + Math.floor(days_of_stock));

            return {
                sku: product.sku,
                item_name: product.name,
                category: product.category,
                branch_id: currentBranch || 'MAIN-01',
                current_stock: product.stock,
                floor_stock,
                backroom_stock,
                avg_daily_sales,
                days_of_stock: parseFloat(days_of_stock.toFixed(1)),
                risk_level,
                recommended_action,
                recommended_order_qty,
                supplier: "Vardhman Textiles", // Mock supplier
                expected_stockout_date: stockoutDate.toISOString().split('T')[0],
                isFastMoving: avg_daily_sales > 3,
                hasImbalance
            };
        });
    }, [products, currentBranch]);

    const filteredAlerts = useMemo(() => {
        return alerts.filter(a => {
            const matchesSearch = a.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRisk = riskFilter === 'ALL' || a.risk_level === riskFilter;
            return matchesSearch && matchesRisk;
        }).sort((a, b) => {
            const priority = { 'CRITICAL': 0, 'LOW': 1, 'WATCH': 2, 'OK': 3 };
            return priority[a.risk_level] - priority[b.risk_level];
        });
    }, [alerts, searchTerm, riskFilter]);

    // Metrics
    const metrics = useMemo(() => {
        return {
            critical: alerts.filter(a => a.risk_level === 'CRITICAL').length,
            low: alerts.filter(a => a.risk_level === 'LOW').length,
            imbalances: alerts.filter(a => a.hasImbalance).length,
            potentialOutages: alerts.filter(a => a.days_of_stock < 2).length
        };
    }, [alerts]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-error" />
                        Low Stock Intelligence Agent
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        AI-driven predictive stock analysis for <span className="font-bold text-primary">{tenantId}</span> / <span className="font-bold">{currentBranch || 'Global'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh Agent
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-error/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-error" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Critical Risks</span>
                    </div>
                    <h3 className="text-3xl font-bold text-error">{metrics.critical}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Stockout expected &lt; 3 days</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-warning/10 rounded-lg">
                            <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Low Stock</span>
                    </div>
                    <h3 className="text-3xl font-bold text-warning">{metrics.low}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Stockout expected &lt; 7 days</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Floor Refills</span>
                    </div>
                    <h3 className="text-3xl font-bold text-primary">{metrics.imbalances}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Stock available in backroom</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Fast Movers</span>
                    </div>
                    <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {alerts.filter(a => a.isFastMoving).length}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">Daily sales &gt; 3 units</p>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by SKU or Item Name..."
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-48">
                    <select
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none font-medium"
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Risk Levels</option>
                        <option value="CRITICAL">Critical Risk</option>
                        <option value="LOW">Low Stock</option>
                        <option value="WATCH">Watch List</option>
                        <option value="OK">Healthy Stock</option>
                    </select>
                </div>
            </div>

            {/* Smart Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAlerts.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
                        <h4 className="text-lg font-bold">All items are healthy!</h4>
                        <p className="text-neutral-500">The intelligence agent reports no immediate risks.</p>
                    </div>
                ) : (
                    filteredAlerts.map(item => (
                        <div
                            key={item.sku}
                            className={`bg-white dark:bg-neutral-800 rounded-xl border-l-4 p-5 shadow-sm transition-all hover:shadow-md ${item.risk_level === 'CRITICAL' ? 'border-error' :
                                    item.risk_level === 'LOW' ? 'border-warning' :
                                        item.risk_level === 'WATCH' ? 'border-indigo-400' : 'border-success'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${item.risk_level === 'CRITICAL' ? 'bg-error/10' :
                                            item.risk_level === 'LOW' ? 'bg-warning/10' : 'bg-neutral-100 dark:bg-neutral-700'
                                        }`}>
                                        <Package className={`w-6 h-6 ${item.risk_level === 'CRITICAL' ? 'text-error' :
                                                item.risk_level === 'LOW' ? 'text-warning' : 'text-neutral-500'
                                            }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-900 dark:text-white leading-tight">{item.item_name}</h4>
                                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1">
                                            <span className="font-mono">{item.sku}</span>
                                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                            <span>{item.category}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex flex-col items-end`}>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.risk_level === 'CRITICAL' ? 'bg-error text-white' :
                                            item.risk_level === 'LOW' ? 'bg-warning text-white' :
                                                item.risk_level === 'WATCH' ? 'bg-indigo-100 text-indigo-700' : 'bg-success/10 text-success'
                                        }`}>
                                        {item.risk_level} Risk
                                    </span>
                                    {item.isFastMoving && (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-primary mt-1.5 uppercase tracking-widest">
                                            <Zap className="w-2.5 h-2.5 fill-current" /> Fast Moving
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-center">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase">On Hand</p>
                                    <p className="text-lg font-bold mt-0.5">{item.current_stock}</p>
                                </div>
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-center border border-primary/10">
                                    <p className="text-[10px] font-bold text-primary uppercase">Sales Velocity</p>
                                    <p className="text-lg font-bold mt-0.5">{item.avg_daily_sales}</p>
                                    <p className="text-[9px] text-neutral-400">units / day</p>
                                </div>
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-center">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Run-rate</p>
                                    <p className={`text-lg font-bold mt-0.5 ${item.days_of_stock < 3 ? 'text-error' : ''}`}>{item.days_of_stock}</p>
                                    <p className="text-[9px] text-neutral-400">days left</p>
                                </div>
                            </div>

                            {/* Intelligent Alerts */}
                            <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 ${item.hasImbalance ? 'bg-primary/5 border border-primary/20' :
                                    item.risk_level === 'CRITICAL' ? 'bg-error/5 border border-error/20' : 'bg-neutral-50 dark:bg-neutral-900/50'
                                }`}>
                                <Info className={`w-4 h-4 mt-0.5 ${item.hasImbalance || item.risk_level === 'CRITICAL' ? 'text-primary' : 'text-neutral-400'}`} />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Intelligent Recommendation</p>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 italic leading-relaxed">
                                        "{item.recommended_action}"
                                    </p>
                                </div>
                                {item.days_of_stock < 30 && (
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Stockout By</p>
                                        <p className="text-[10px] font-bold text-error">{new Date(item.expected_stockout_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700">
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Floor</p>
                                        <p className="text-xs font-bold">{item.floor_stock}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Backroom</p>
                                        <p className="text-xs font-bold">{item.backroom_stock}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {item.recommended_order_qty > 0 && (
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
                                            <ShoppingCart className="w-3.5 h-3.5" /> Order {item.recommended_order_qty}
                                        </button>
                                    )}
                                    <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-500">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Strategy Panel */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Truck className="w-40 h-40" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                            Inventory Strategy Mode: Automated Replenishment
                        </h4>
                        <p className="text-neutral-400 mt-2 text-sm leading-relaxed">
                            The intelligence agent is currently optimizing for **{currentBranch || 'Global'}**.
                            We detect high seasonal demand for shirt categories. Reorder buffers have been adjusted by 1.4x
                            to ensure continuity. Total estimated purchase value for critical items:
                            <span className="text-white font-bold ml-1">₹{(metrics.critical * 4500).toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="flex items-center justify-center lg:justify-end">
                        <button className="px-6 py-3 bg-white text-neutral-900 rounded-xl font-bold shadow-lg hover:bg-neutral-100 transition-all flex items-center gap-2">
                            <Box className="w-4 h-4" /> Bulk Create POs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LowStockAlerts;
