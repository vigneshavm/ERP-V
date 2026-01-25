import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Clock,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Search,
    Filter,
    ArrowRight,
    Zap,
    Download,
    Calendar,
    History,
    FileWarning,
    Package,
    TrendingDown,
    DollarSign,
    Box,
    Warehouse,
    Info,
} from 'lucide-react';

// --- Types ---

type ExpiryRisk = 'EXPIRED' | 'CRITICAL' | 'NEAR_EXPIRY' | 'SAFE';

interface BatchAuditResult {
    sku: string;
    item_name: string;
    batch_no: string;
    dye_lot?: string;
    warehouse: string;
    mfg_date: string;
    expiry_date: string;
    days_to_expiry: number;
    risk_level: ExpiryRisk;
    total_stock: number;
    stock_value: number;
    recommended_action: string;
    fifo_violation: boolean;
    margin_loss_pct: number;
}

// --- Intelligence Engine Components ---

const BatchExpiryIntelligence: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<ExpiryRisk | 'ALL'>('ALL');

    // --- Intelligence Engine ---
    const auditResults: BatchAuditResult[] = useMemo(() => {
        const today = new Date();

        // Mocking batch data associated with existing products
        return products.flatMap((product, index) => {
            // Generate 1-2 batches per product for simulation
            const batches = [
                {
                    no: `B-${1000 + index}`,
                    lot: index % 3 === 0 ? `LOT-${200 + index}` : undefined,
                    expiry: new Date(today.getTime() + (index % 5 === 0 ? -2 : index % 3 === 0 ? 5 : index % 2 === 0 ? 25 : 120) * 24 * 60 * 60 * 1000),
                    mfg: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
                    stock: Math.floor(Math.random() * 500) + 50,
                    warehouse: index % 2 === 0 ? 'Central Godown' : 'Chennai Backroom'
                }
            ];

            return batches.map(b => {
                const diffTime = b.expiry.getTime() - today.getTime();
                const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let risk: ExpiryRisk = 'SAFE';
                let action = 'No immediate action required';
                let lossPct = 0;

                if (daysToExpiry < 0) {
                    risk = 'EXPIRED';
                    action = 'Immediate Disposal required. Notify Compliance.';
                    lossPct = 100;
                } else if (daysToExpiry <= 7) {
                    risk = 'CRITICAL';
                    action = 'Clearance Sale: Apply 50% discount & move to showroom floor.';
                    lossPct = 50;
                } else if (daysToExpiry <= 30) {
                    risk = 'NEAR_EXPIRY';
                    action = 'Promotional Focus: Apply 20% discount or bundle offer.';
                    lossPct = 20;
                }

                return {
                    sku: product.sku,
                    item_name: product.name,
                    batch_no: b.no,
                    dye_lot: b.lot,
                    warehouse: b.warehouse,
                    mfg_date: b.mfg.toISOString().split('T')[0],
                    expiry_date: b.expiry.toISOString().split('T')[0],
                    days_to_expiry: daysToExpiry,
                    risk_level: risk,
                    total_stock: b.stock,
                    stock_value: b.stock * (product.cost || 0),
                    recommended_action: action,
                    fifo_violation: index % 7 === 0, // Simulate occasional FIFO violations
                    margin_loss_pct: lossPct
                };
            });
        });
    }, [products]);

    const filteredAudit = useMemo(() => {
        return auditResults.filter(a => {
            const matchesSearch = a.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.batch_no.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRisk = riskFilter === 'ALL' || a.risk_level === riskFilter;
            return matchesSearch && matchesRisk;
        }).sort((a, b) => a.days_to_expiry - b.days_to_expiry);
    }, [auditResults, searchTerm, riskFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const atRisk = auditResults.filter(a => a.risk_level !== 'SAFE');
        return {
            totalBatches: auditResults.length,
            expiredCount: auditResults.filter(a => a.risk_level === 'EXPIRED').length,
            criticalCount: auditResults.filter(a => a.risk_level === 'CRITICAL').length,
            valueAtRisk: atRisk.reduce((acc, a) => acc + a.stock_value, 0),
            fifoViolations: auditResults.filter(a => a.fifo_violation).length
        };
    }, [auditResults]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <History className="w-6 h-6 text-primary" />
                        Batch & Expiry Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Ensuring FIFO compliance and expiry protection for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download Audit
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-current" /> Run FEFO Optimization
                    </button>
                </div>
            </div>

            {/* Intelligence Pulse Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Value at Risk</p>
                    <h3 className="text-2xl font-black text-error">₹{(metrics.valueAtRisk / 100000).toFixed(1)}L</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <TrendingDown className="w-4 h-4 text-error" />
                        <span className="text-xs font-bold text-error">Potential margin leak</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Critical Batches</p>
                    <h3 className="text-2xl font-black text-warning">{metrics.criticalCount}</h3>
                    <p className="text-xs text-neutral-500 mt-2">Expiring within 7 days</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Expired Stock</p>
                    <h3 className="text-2xl font-black text-neutral-300">{metrics.expiredCount}</h3>
                    <p className="text-xs text-neutral-500 mt-2">Stock units to be removed</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">FIFO Violations</p>
                    <h3 className="text-2xl font-black text-indigo-500">{metrics.fifoViolations}</h3>
                    <p className="text-xs text-neutral-500 mt-2">Newer batches sold first</p>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search SKU, Batch or Item..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none font-bold"
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Risk Levels</option>
                        <option value="EXPIRED">Expired Only</option>
                        <option value="CRITICAL">Critical (&lt; 7d)</option>
                        <option value="NEAR_EXPIRY">Near Expiry (&lt; 30d)</option>
                        <option value="SAFE">Safe Stock</option>
                    </select>
                </div>
            </div>

            {/* Batch Audit List */}
            <div className="space-y-4">
                {filteredAudit.map((item) => (
                    <div
                        key={`${item.sku}-${item.batch_no}`}
                        className={`group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700/30 ${item.risk_level === 'CRITICAL' ? 'border-l-4 border-l-error shadow-sm' :
                                item.risk_level === 'EXPIRED' ? 'border-l-4 border-l-neutral-400 opacity-70' : ''
                            }`}
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Product & Batch Identity */}
                            <div className="lg:w-1/3">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${item.risk_level === 'SAFE' ? 'bg-success/10 text-success' :
                                            item.risk_level === 'EXPIRED' ? 'bg-neutral-100 text-neutral-400' : 'bg-error/10 text-error'
                                        }`}>
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                            {item.item_name}
                                            {item.fifo_violation && (
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase rounded tracking-widest">FIFO Warning</span>
                                            )}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono text-neutral-400 uppercase tracking-tighter">{item.sku}</span>
                                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                            <span className="text-xs font-bold text-primary uppercase">BATCH: {item.batch_no}</span>
                                        </div>
                                        {item.dye_lot && (
                                            <p className="text-[10px] text-neutral-500 mt-1 uppercase font-medium">Dye Lot: <span className="text-neutral-900 dark:text-neutral-200">{item.dye_lot}</span></p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-700 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-3 h-3 text-primary fill-current" />
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Agent Recommendation</p>
                                    </div>
                                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{item.recommended_action}</p>
                                </div>
                            </div>

                            {/* Timeline & Quantitative Details */}
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-700 lg:pl-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase px-1">Expiry Clock</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                                        <p className={`text-sm font-black ${item.risk_level === 'SAFE' ? 'text-success' : 'text-error'
                                            }`}>
                                            {item.days_to_expiry < 0 ? 'EXPIRED' : `${item.days_to_expiry} Days`}
                                        </p>
                                        <p className="text-[9px] text-neutral-500 mt-0.5">{item.expiry_date}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase px-1">Stock Position</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase">{item.total_stock} Unit</p>
                                        <p className="text-[9px] text-neutral-500 mt-0.5">{item.warehouse}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase px-1">Exposure Value</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                                        <p className="text-sm font-black">₹{item.stock_value.toLocaleString()}</p>
                                        <p className="text-[9px] text-error font-bold mt-0.5">-{item.margin_loss_pct}% Projected</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase px-1">FIFO Status</p>
                                    <div className="flex items-center gap-2 p-2">
                                        <div className={`w-2 h-2 rounded-full ${item.fifo_violation ? 'bg-indigo-500' : 'bg-success'
                                            }`} />
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${item.fifo_violation ? 'text-indigo-500' : 'text-success'
                                            }`}>
                                            {item.fifo_violation ? 'Violation' : 'Compliant'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Intelligent Actions */}
                            <div className="lg:w-1/4 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-700 pt-4 lg:pt-0 lg:pl-6">
                                <button className="w-full flex items-center justify-between px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                    <span>Apply Liquidation</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    View Movement History
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Strategic Advice Panel */}
            <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
                    <Clock className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-2/3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <ShieldAlert className="w-3 h-3 fill-current" /> FEFO Guard Active
                        </div>
                        <h4 className="text-3xl font-black leading-tight mb-4">
                            Protecting your margins from <br />
                            <span className="text-primary italic font-serif">Inventory Decay.</span>
                        </h4>
                        <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                            Our agent detected <span className="text-white font-bold">{metrics.fifoViolations} FIFO violations</span> where newer stock was sold before earlier expiring batches.
                            Automatic clearance pricing has been calculated for the <span className="text-white font-bold">{metrics.criticalCount} critical batches</span> to ensure maximum recovery.
                        </p>
                    </div>

                    <div className="lg:w-1/3 w-full flex flex-col gap-3">
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                            <Zap className="w-5 h-5 fill-current" /> Auto-Apply Discounts
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3">
                            <History className="w-5 h-5" /> Batch Cleanup Audit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchExpiryIntelligence;
