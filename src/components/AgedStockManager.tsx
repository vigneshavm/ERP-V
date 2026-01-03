import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useConfig } from './ConfigContext';
import { Clock, AlertTriangle, TrendingDown, DollarSign, Calendar, Settings as SettingsIcon, X, Save } from 'lucide-react';
import { Product } from '../types/product';
import { updateSettings } from '../store/tenantSlice';

const AgedStockManager: React.FC = () => {
    const dispatch = useDispatch();
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { expiryRules } = useSelector((state: RootState) => state.settings);

    // Default rules if not set in Redux yet (fallback)
    const rules = expiryRules || {
        criticalDays: 30,
        criticalDiscount: 50,
        highDays: 60,
        highDiscount: 30,
        mediumDays: 90,
        mediumDiscount: 15
    };

    const [viewMode, setViewMode] = useState<'AGED' | 'EXPIRY'>('AGED');
    const [thresholdDays, setThresholdDays] = useState(90);
    const [showConfig, setShowConfig] = useState(false);

    // Config State
    const [tempRules, setTempRules] = useState(rules);

    const handleSaveRules = () => {
        dispatch(updateSettings({ expiryRules: tempRules }));
        setShowConfig(false);
    };

    // Get valid products for this view
    const validProducts = useMemo(() => {
        return products.filter(p => {
            // Basic Sector/Branch Filter
            if (p.sector !== currentSector) return false;

            if (viewMode === 'AGED') {
                if (!p.lastRestocked) return false;
                const restockDate = new Date(p.lastRestocked);
                const diffTime = Math.abs(new Date().getTime() - restockDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= thresholdDays;
            } else {
                if (!p.expiryDate) return false;
                const expiry = new Date(p.expiryDate);
                const today = new Date();
                const diffTime = expiry.getTime() - today.getTime();
                const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return daysToExpiry <= rules.mediumDays && daysToExpiry > -365; // Show items expiring soon or recently expired
            }
        });
    }, [products, currentSector, currentBranch, thresholdDays, viewMode, rules]);

    // Recommendation Logic
    const getRecommendation = (product: Product, days: number) => {
        if (viewMode === 'AGED') {
            const daysHeld = days;
            if (daysHeld > 180) {
                const recPrice = product.cost * 0.9;
                const discountPercent = ((product.price - recPrice) / product.price) * 100;
                return {
                    status: 'DEAD_STOCK',
                    label: 'Liquidation',
                    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: 'Stop Loss (-10% cost)',
                    discountPercent: Math.round(discountPercent)
                };
            } else if (daysHeld > 120) {
                const recPrice = product.cost;
                const discountPercent = ((product.price - recPrice) / product.price) * 100;
                return {
                    status: 'SLOW_MOVING',
                    label: 'Break Even',
                    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: 'At Cost (0% margin)',
                    discountPercent: Math.round(discountPercent)
                };
            } else {
                const recPrice = product.price * 0.9;
                return {
                    status: 'AGING',
                    label: 'Clearance',
                    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: '10% Off',
                    discountPercent: 10
                };
            }
        } else {
            const daysToExpiry = days;
            if (daysToExpiry <= rules.criticalDays) {
                const discountPercent = rules.criticalDiscount;
                const recPrice = product.price * ((100 - discountPercent) / 100);
                return {
                    status: 'CRITICAL',
                    label: 'Immediate Clearing',
                    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: `${discountPercent}% Flat Off`,
                    discountPercent: discountPercent
                };
            } else if (daysToExpiry <= rules.highDays) {
                const discountPercent = rules.highDiscount;
                const recPrice = product.price * ((100 - discountPercent) / 100);
                return {
                    status: 'HIGH_RISK',
                    label: 'High Risk',
                    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: `${discountPercent}% Off`,
                    discountPercent: discountPercent
                };
            } else {
                const discountPercent = rules.mediumDiscount;
                const recPrice = product.price * ((100 - discountPercent) / 100);
                return {
                    status: 'MODERATE_RISK',
                    label: 'Expiring Soon',
                    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                    recPrice: recPrice,
                    recovery: recPrice * product.stock,
                    discount: `${discountPercent}% Off`,
                    discountPercent: discountPercent
                };
            }
        }
    };

    const enhancedData = useMemo(() => {
        return validProducts.map(p => {
            let days = 0;
            if (viewMode === 'AGED') {
                const restockDate = new Date(p.lastRestocked!);
                const diffTime = Math.abs(new Date().getTime() - restockDate.getTime());
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
                const expiry = new Date(p.expiryDate!);
                const today = new Date();
                const diffTime = expiry.getTime() - today.getTime();
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                ...p,
                calculatedDays: days,
                algo: getRecommendation(p, days)
            };
        }).sort((a, b) => viewMode === 'AGED' ? b.calculatedDays - a.calculatedDays : a.calculatedDays - b.calculatedDays);
    }, [validProducts, viewMode, rules]);

    // Metrics
    const totalValue = enhancedData.reduce((acc, p) => acc + (p.cost * p.stock), 0);
    const potentialRecovery = enhancedData.reduce((acc, p) => acc + p.algo.recovery, 0);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {viewMode === 'AGED' ? 'Aged Stock Analysis' : 'Expiry Risk Management'}
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{enhancedData.length} Items</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                        {viewMode === 'AGED'
                            ? `Inventory held longer than ${thresholdDays} days`
                            : 'Products nearing expiration date'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            onClick={() => setViewMode('AGED')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'AGED' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Aged Stock
                        </button>
                        <button
                            onClick={() => setViewMode('EXPIRY')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'EXPIRY' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Expiry Risk
                        </button>
                    </div>

                    {viewMode === 'AGED' ? (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {[60, 90, 120, 180].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setThresholdDays(d)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${thresholdDays === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    {d}+ Days
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setTempRules(rules);
                                setShowConfig(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">Risk Rules</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Config Modal */}
            {showConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expiry Risk Rules</h3>
                                <p className="text-sm text-slate-500">Configure discount triggers based on expiry days.</p>
                            </div>
                            <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Critical */}
                            <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Critical Risk</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Days Left Less Than</label>
                                        <input
                                            type="number"
                                            value={tempRules.criticalDays}
                                            onChange={(e) => setTempRules({ ...tempRules, criticalDays: parseInt(e.target.value) })}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Suggest Discount %</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={tempRules.criticalDiscount}
                                                onChange={(e) => setTempRules({ ...tempRules, criticalDiscount: parseInt(e.target.value) })}
                                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-400 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* High */}
                            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold">
                                    <Clock className="w-4 h-4" />
                                    <span>High Risk</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Days Left Less Than</label>
                                        <input
                                            type="number"
                                            value={tempRules.highDays}
                                            onChange={(e) => setTempRules({ ...tempRules, highDays: parseInt(e.target.value) })}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Suggest Discount %</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={tempRules.highDiscount}
                                                onChange={(e) => setTempRules({ ...tempRules, highDiscount: parseInt(e.target.value) })}
                                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-600"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-400 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Medium */}
                            <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-bold">
                                    <Calendar className="w-4 h-4" />
                                    <span>Moderate Risk</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Days Left Less Than</label>
                                        <input
                                            type="number"
                                            value={tempRules.mediumDays}
                                            onChange={(e) => setTempRules({ ...tempRules, mediumDays: parseInt(e.target.value) })}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Suggest Discount %</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={tempRules.mediumDiscount}
                                                onChange={(e) => setTempRules({ ...tempRules, mediumDiscount: parseInt(e.target.value) })}
                                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-yellow-600"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-400 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfig(false)}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200/50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRules}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Rules
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                            {viewMode === 'AGED' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                        {viewMode === 'AGED' ? 'Total Trapped Capital (Cost)' : 'Value at Risk (Cost)'}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{totalValue.toLocaleString()}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Potential Recovery</p>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{potentialRecovery.toLocaleString()}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                        {viewMode === 'AGED' ? 'Avg. Holding Period' : 'Avg. Days to Expiry'}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {Math.round(enhancedData.reduce((a, b) => a + b.calculatedDays, 0) / (enhancedData.length || 1))} Days
                    </h3>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="p-4">Product</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4">Cost Price</th>
                            <th className="p-4">Current Price</th>
                            <th className="p-4">
                                {viewMode === 'AGED' ? 'Days Held' : 'Days to Expiry'}
                            </th>
                            <th className="p-4">Recommendation</th>
                            <th className="p-4 text-right">Discount %</th>
                            <th className="p-4 text-right">Target Price</th>
                            <th className="p-4 text-right">Est. Recovery</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {enhancedData.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                                    {viewMode === 'EXPIRY' && (
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            Exp: {new Date(p.expiryDate!).toLocaleDateString()}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 font-bold">{p.stock}</td>
                                <td className="p-4 text-slate-500">₹{p.cost}</td>
                                <td className="p-4 text-slate-500">₹{p.price}</td>
                                <td className={`p-4 font-bold ${viewMode === 'EXPIRY' && p.calculatedDays < 15 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {p.calculatedDays} Days
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold flex flex-col w-fit ${p.algo.color}`}>
                                        <span>{p.algo.label}</span>
                                        <span className="text-[10px] opacity-80">{p.algo.discount}</span>
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-rose-600">
                                    {p.algo.discountPercent}%
                                </td>
                                <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                    ₹{p.algo.recPrice.toFixed(2)}
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                    ₹{p.algo.recovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                            </tr>
                        ))}
                        {enhancedData.length === 0 && (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                        <p className="text-lg font-medium">Healthy Inventory!</p>
                                        <p className="text-sm">
                                            {viewMode === 'AGED'
                                                ? `No products found older than ${thresholdDays} days.`
                                                : 'No immediate expiry risks found.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AgedStockManager;
