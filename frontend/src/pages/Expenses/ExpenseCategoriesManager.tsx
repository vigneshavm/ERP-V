import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import { useExpenseCategories, ExpenseCategory } from "../../hooks/useExpenseCategories";
import Layout from "../../components/shared/Layout";
import {
    Settings,
    Plus,
    Filter,
    Search,
    ChevronRight,
    Edit3,
    Trash2,
    ShieldCheck,
    Lock,
    Unlock,
    DollarSign,
    Zap,
    Scale,
    PieChart,
    Building2,
    CheckCircle2,
    XCircle,
    Info,
    MoreVertical,
    TrendingUp,
    Database,
} from 'lucide-react';

const ExpenseCategoriesManager: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { categories, loading, upsertCategory, deleteCategory } = useExpenseCategories();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<ExpenseCategory> | null>(null);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            await upsertCategory(editingCategory);
            setIsModalOpen(false);
            setEditingCategory(null);
        }
    };

    const startEdit = (cat: ExpenseCategory) => {
        setEditingCategory(cat);
        setIsModalOpen(true);
    };

    const startNew = () => {
        setEditingCategory({
            name: '',
            monthly_budget: 0,
            approval_required: false,
            is_cash_allowed: true,
            is_active: true,
            gst_eligible: true
        });
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Settings className="w-6 h-6 text-primary" />
                            Expense Categories Master
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Define spending policies & budgets for <span className="font-bold text-primary">{user?.tenantId || 'Organization'}</span>
                        </p>
                    </div>
                    <button
                        onClick={startNew}
                        className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Category Policy</span>
                    </button>
                </div>

                {/* Strategic Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Database className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Policy Coverage</p>
                        <h3 className="text-3xl font-black">{categories.length} <span className="text-xs text-neutral-400 font-black uppercase">Active Categories</span></h3>
                        <div className="flex items-center gap-1.5 mt-2 text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Master Layer Synced</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Budget Cap</p>
                        <h3 className="text-3xl font-black tabular-nums">₹{categories.reduce((s, c) => s + c.monthly_budget, 0).toLocaleString()}</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold uppercase tracking-tight">Across all organizational units</p>
                    </div>

                    <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl border border-neutral-800 relative group overflow-hidden">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Policy Intelligence</p>
                        <h3 className="text-xs font-black italic leading-tight text-neutral-300">
                            "Enforce strict approval for high-variance categories like 'Travel' to protect net margins."
                        </h3>
                    </div>
                </div>

                {/* Main Table Layer */}
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search category policy..."
                                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl text-neutral-400 hover:text-primary transition-colors">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="p-6">Category Name</th>
                                    <th className="p-6">Monthly Budget</th>
                                    <th className="p-6">Cash Allowed</th>
                                    <th className="p-6">Approval Rules</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredCategories.map(cat => (
                                    <tr key={cat.id} className="group hover:bg-neutral-50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black">
                                                    {cat.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm tracking-tight">{cat.name}</p>
                                                    {cat.gst_eligible && <span className="text-[8px] bg-success/10 text-success px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">GST Enabled</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-bold text-sm tracking-tight italic">₹{cat.monthly_budget.toLocaleString()}</p>
                                            <p className="text-[9px] text-neutral-400 font-black uppercase tracking-tighter">Per Month Cap</p>
                                        </td>
                                        <td className="p-6">
                                            {cat.is_cash_allowed ? (
                                                <div className="flex items-center gap-1.5 text-success font-black text-[10px] uppercase tracking-widest">
                                                    <Unlock className="w-3.5 h-3.5" /> Allowed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-error font-black text-[10px] uppercase tracking-widest">
                                                    <Lock className="w-3.5 h-3.5" /> Restricted
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            {cat.approval_required ? (
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-widest">Requires Manager Sig</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[9px] font-black rounded-lg uppercase tracking-widest">Auto-Approve</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(cat)}
                                                    className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteCategory(cat.id)}
                                                    className="p-2 text-neutral-400 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Overlay */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">{editingCategory?.id ? 'Edit Policy' : 'New Spend Policy'}</h3>
                                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Master Control Layer</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Category Name</label>
                                        <input
                                            required
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g. Travel, Rent..."
                                            value={editingCategory?.name}
                                            onChange={e => setEditingCategory(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Monthly Budget Cap (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 tabular-nums"
                                            placeholder="100000"
                                            value={editingCategory?.monthly_budget}
                                            onChange={e => setEditingCategory(prev => prev ? ({ ...prev, monthly_budget: Number(e.target.value) }) : null)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Cash Allowed</p>
                                                <p className="text-[9px] text-neutral-400 font-bold">Bypass Bank requirement</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCategory(prev => ({ ...prev!, is_cash_allowed: !prev!.is_cash_allowed }))}
                                                className={`w-12 h-6 rounded-full transition-all relative ${editingCategory?.is_cash_allowed ? 'bg-primary' : 'bg-neutral-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingCategory?.is_cash_allowed ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Approval Req.</p>
                                                <p className="text-[9px] text-neutral-400 font-bold">Mandate owner sign-off</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCategory(prev => ({ ...prev!, approval_required: !prev!.approval_required }))}
                                                className={`w-12 h-6 rounded-full transition-all relative ${editingCategory?.approval_required ? 'bg-primary' : 'bg-neutral-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingCategory?.approval_required ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-2xl font-black text-sm hover:bg-neutral-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        Activate Policy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ExpenseCategoriesManager;
