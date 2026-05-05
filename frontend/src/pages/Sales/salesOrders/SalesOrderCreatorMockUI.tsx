import React from 'react';
import { Save, X, Plus, FileText, ArrowLeft } from 'lucide-react';

const SalesOrderCreatorMockUI: React.FC = () => {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-main/70" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Sales Order Creator
                        </h1>
                        <p className="text-sm text-main/60">Cyber-Carbon Form Workspace</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all text-sm">
                        <X className="w-4 h-4" /> Cancel
                    </button>
                    <button className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm">
                        <Save className="w-4 h-4" /> Save Record
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-xl space-y-4 border border-white/5 bg-white/[0.02]">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" /> Primary Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-main/60 uppercase tracking-wider">Document No</label>
                                <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:border-blue-500/50 outline-none transition-all text-main/50" value="Auto-generated" disabled />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-main/60 uppercase tracking-wider">Date</label>
                                <input type="date" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:border-blue-500/50 outline-none transition-all text-main" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl space-y-4 border border-white/5 bg-white/[0.02]">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Line Items</h2>
                            <button className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded border border-blue-500/20 flex items-center gap-1 transition-all">
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 text-main/60 border-b border-white/5">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Item Name</th>
                                        <th className="p-3 text-right font-medium w-24">Qty</th>
                                        <th className="p-3 text-right font-medium w-32">Rate</th>
                                        <th className="p-3 text-right font-medium w-32">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 text-blue-400 font-medium">Premium Support Plan</td>
                                        <td className="p-3 text-right">1</td>
                                        <td className="p-3 text-right">$500.00</td>
                                        <td className="p-3 text-right font-medium">$500.00</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 text-blue-400 font-medium">Cloud Storage (1TB)</td>
                                        <td className="p-3 text-right">3</td>
                                        <td className="p-3 text-right">$50.00</td>
                                        <td className="p-3 text-right font-medium">$150.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                        <h2 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-main/70">
                                <span>Subtotal</span>
                                <span>$650.00</span>
                            </div>
                            <div className="flex justify-between text-main/70">
                                <span>Tax (10%)</span>
                                <span>$65.00</span>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-lg mt-4">
                                <span>Total</span>
                                <span className="text-emerald-400">$715.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOrderCreatorMockUI;
