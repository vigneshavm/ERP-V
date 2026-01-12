import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Truck,
    Warehouse,
    PieChart,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Download,
    Globe,
    ChevronRight,
    Info,
    History,
    Boxes,
    Building2,
} from 'lucide-react';

// --- Types ---

type WarehouseType = 'CENTRAL' | 'BRANCH' | 'GODOWN' | 'SHOWROOM' | 'TRANSIT';
type UtilizationRisk = 'OVERLOADED' | 'OPTIMAL' | 'UNDER_UTILIZED' | 'STOCKOUT_RISK';

interface WarehouseStat {
    id: string;
    name: string;
    type: WarehouseType;
    branch_id: string;
    capacity: number;
    current_occupancy: number; // units
    utilization_pct: number;
    risk: UtilizationRisk;
    stock_value: number;
    pending_in: number;
    pending_out: number;
}

interface IntelligenceAction {
    id: string;
    type: 'REBALANCE' | 'REPLENISH' | 'RETURN';
    item_name: string;
    sku: string;
    from: string;
    to: string;
    quantity: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
}

// --- Component ---

const WarehouseIntelligence: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [viewMode, setViewMode] = useState<'OVERVIEW' | 'REBALANCE' | 'TRANSIT'>('OVERVIEW');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Simulation Engines ---

    const warehouses: WarehouseStat[] = useMemo(() => {
        const base = [
            { id: 'W-001', name: 'Central Godown - Bangalore', type: 'CENTRAL' as WarehouseType, branch_id: 'BANGALORE', capacity: 10000, occupancy: 9200 },
            { id: 'W-002', name: 'Chennai Showroom Floor', type: 'SHOWROOM' as WarehouseType, branch_id: 'CHENNAI', capacity: 1500, occupancy: 400 },
            { id: 'W-003', name: 'Madurai Branch Store', type: 'BRANCH' as WarehouseType, branch_id: 'MADURAI', capacity: 3000, occupancy: 2850 },
            { id: 'W-004', name: 'Transit Pool - South', type: 'TRANSIT' as WarehouseType, branch_id: 'SOUTH', capacity: 5000, occupancy: 800 },
            { id: 'W-005', name: 'Hyderabad Warehouse', type: 'BRANCH' as WarehouseType, branch_id: 'HYDERABAD', capacity: 4500, occupancy: 1200 },
        ];

        return base.map(w => {
            const utilization = (w.occupancy / w.capacity) * 100;
            let risk: UtilizationRisk = 'OPTIMAL';
            if (utilization > 90) risk = 'OVERLOADED';
            else if (utilization < 20) risk = 'UNDER_UTILIZED';
            else if (w.type === 'SHOWROOM' && utilization < 30) risk = 'STOCKOUT_RISK';

            return {
                id: w.id,
                name: w.name,
                type: w.type,
                branch_id: w.branch_id,
                capacity: w.capacity,
                current_occupancy: w.occupancy,
                utilization_pct: Math.round(utilization),
                risk,
                stock_value: w.occupancy * 450, // Average valuation
                pending_in: w.id === 'W-002' ? 500 : 0,
                pending_out: w.id === 'W-001' ? 800 : 0
            };
        });
    }, []);

    const recommendations: IntelligenceAction[] = useMemo(() => {
        return [
            {
                id: 'ACT-001', type: 'REBALANCE', item_name: 'Cotton Shirt XL', sku: 'SHIRT-XL-P01',
                from: 'Central Godown', to: 'Chennai Showroom', quantity: 350,
                urgency: 'HIGH', reason: 'High sales velocity in Chennai; showroom floor &lt; 30% capacity.'
            },
            {
                id: 'ACT-002', type: 'RETURN', item_name: 'Winter Parka XXL', sku: 'PARKA-XXL-09',
                from: 'Madurai Branch', to: 'Central Godown', quantity: 120,
                urgency: 'MEDIUM', reason: 'Zero sales in Madurai for 45 days. Reclaim shelf space.'
            },
            {
                id: 'ACT-003', type: 'REPLENISH', item_name: 'Silk Blend Saree', sku: 'SAREE-SILK-02',
                from: 'Central Godown', to: 'Hyderabad Warehouse', quantity: 500,
                urgency: 'LOW', reason: 'Upcoming festive demand forecast for Hyderabad region.'
            },
        ];
    }, []);

    const metrics = useMemo(() => {
        return {
            overloaded: warehouses.filter(w => w.risk === 'OVERLOADED').length,
            stockouts: warehouses.filter(w => w.risk === 'STOCKOUT_RISK').length,
            valueInTransit: 850000,
            avgUtilization: Math.round(warehouses.reduce((acc, w) => acc + w.utilization_pct, 0) / warehouses.length)
        };
    }, [warehouses]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <Warehouse className="w-6 h-6 text-primary" />
                        Warehouse Intelligence Agent
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Multi-location placement optimization for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Transit Report
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-current" /> Auto-Rebalance All
                    </button>
                </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-error/10 text-error rounded-lg">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Efficiency Risk</span>
                    </div>
                    <h3 className="text-3xl font-black text-error">{metrics.overloaded}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Warehouses over 90% capacity</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-warning/10 text-warning rounded-lg">
                            <Boxes className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Stockout Alert</span>
                    </div>
                    <h3 className="text-3xl font-black text-warning">{metrics.stockouts}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Showrooms with &lt; 30% display stock</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">In-Transit Value</span>
                    </div>
                    <h3 className="text-3xl font-black text-indigo-600">₹{(metrics.valueInTransit / 100000).toFixed(1)}L</h3>
                    <p className="text-xs text-neutral-500 mt-1">3 active Inter-Branch Transfers</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-success/10 text-success rounded-lg">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Network Health</span>
                    </div>
                    <h3 className="text-3xl font-black text-success">{metrics.avgUtilization}%</h3>
                    <p className="text-xs text-neutral-500 mt-1">Average warehouse utilization</p>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {['OVERVIEW', 'REBALANCE', 'TRANSIT'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${viewMode === mode
                                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {viewMode === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Warehouse Cards */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Network Nodes</h4>
                        {warehouses.map(w => (
                            <div key={w.id} className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${w.type === 'CENTRAL' ? 'bg-primary/10 text-primary' :
                                                w.type === 'SHOWROOM' ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                                            }`}>
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-neutral-900 dark:text-white">{w.name}</h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${w.type === 'CENTRAL' ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                                                    }`}>{w.type}</span>
                                                <span className="text-[10px] text-neutral-400 font-bold uppercase">{w.branch_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-2 py-1 rounded-md text-[10px] font-black ${w.risk === 'OVERLOADED' ? 'bg-error text-white' :
                                                w.risk === 'STOCKOUT_RISK' ? 'bg-warning text-white' : 'bg-success/10 text-success'
                                            }`}>
                                            {w.risk.replace('_', ' ')}
                                        </div>
                                        <p className="text-[10px] text-neutral-400 font-bold mt-2 uppercase">Utilization: {w.utilization_pct}%</p>
                                    </div>
                                </div>

                                <div className="mt-6 w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${w.utilization_pct > 90 ? 'bg-error' : w.utilization_pct < 30 ? 'bg-warning' : 'bg-success'
                                            }`}
                                        style={{ width: `${w.utilization_pct}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-4 py-4 border-t border-neutral-100 dark:border-neutral-700">
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase">Valuation</p>
                                        <p className="text-sm font-bold">₹{(w.stock_value / 100000).toFixed(1)}L</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase">Pending In</p>
                                        <p className="text-sm font-bold text-success">+{w.pending_in || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase">Pending Out</p>
                                        <p className="text-sm font-bold text-error">-{w.pending_out || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Agent Insights Area */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Intelligent Advisor</h4>
                        <div className="bg-neutral-900 text-white p-6 rounded-[2rem] border border-neutral-800 shadow-xl min-h-[400px] flex flex-col justify-between relative overflow-hidden">
                            <Zap className="absolute -top-10 -right-10 w-40 h-40 text-primary/10" />

                            <div>
                                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] mb-4">
                                    <Zap className="w-4 h-4 fill-current" /> Warehouse Agent AI
                                </div>
                                <h4 className="text-2xl font-black leading-tight">
                                    Optimizing placement for <br />
                                    <span className="text-primary italic">Festive Peak Demand.</span>
                                </h4>

                                <div className="mt-8 space-y-4">
                                    <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="p-2 bg-error/20 rounded-lg h-fit">
                                            <AlertTriangle className="w-4 h-4 text-error" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Space Bottleneck Detected</p>
                                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                                Central Godown is at 92%. Moving 12% of bulky furniture stock to Madurai Branch
                                                will reduce retrieval time by 40%.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg h-fit">
                                            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Fulfillment Rerouting Recommended</p>
                                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                                Sales are spiking in Chennai. Current SHOWROOM stock is critical.
                                                Enable auto-ship from Central pool for orders &gt; 5 units.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-8">
                                <Zap className="w-5 h-5 fill-current" /> Execute Smart Rebalance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'REBALANCE' && (
                <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <h4 className="font-black text-lg flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-primary" />
                            Stock Placement Recommendations
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">Inter-branch placement logic based on real-time sales velocity.</p>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-400 font-black uppercase text-[10px] tracking-widest border-b border-neutral-100 dark:border-neutral-700">
                                    <th className="px-8 py-4">Item Details</th>
                                    <th className="px-6 py-4">Source → Logic</th>
                                    <th className="px-6 py-4">Destination</th>
                                    <th className="px-6 py-4 text-center">Qty</th>
                                    <th className="px-6 py-4">Urgency</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                {recommendations.map(act => (
                                    <tr key={act.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-neutral-900 dark:text-white leading-tight">{act.item_name}</p>
                                            <p className="text-[10px] font-mono text-neutral-400 mt-1">{act.sku}</p>
                                        </td>
                                        <td className="px-6 py-6 border-l border-neutral-50 dark:border-neutral-800/50">
                                            <p className="font-bold text-sm">{act.from}</p>
                                            <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1 italic">
                                                <Info className="w-3 h-3" /> {act.type} Movement
                                            </p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="font-bold text-sm text-primary">{act.to}</p>
                                            <p className="text-[10px] text-neutral-400 mt-1 font-bold">Placement optimization</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg font-black text-xs">
                                                {act.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${act.urgency === 'HIGH' ? 'text-error' : act.urgency === 'MEDIUM' ? 'text-warning' : 'text-neutral-400'
                                                }`}>
                                                {act.urgency}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 hover:bg-primary transition-all">
                                                Create IBT
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'TRANSIT' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 text-center py-20">
                        <Truck className="w-16 h-16 text-neutral-200 mx-auto mb-4 animate-bounce" />
                        <h4 className="text-xl font-black">Active Transit Monitoring</h4>
                        <p className="text-sm text-neutral-500 max-w-md mx-auto mt-2">
                            Tracking active Inter-Branch Transfers between Central Godown and Branch showrooms.
                            DISCREPANCY ALERT: 12 units of "Denim Slim Fit" unacknowledged at Chennai.
                        </p>
                        <button className="mt-8 px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all">
                            View Logistics Audit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseIntelligence;
