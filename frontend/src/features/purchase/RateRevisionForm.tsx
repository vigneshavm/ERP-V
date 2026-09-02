import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { Save, Calculator, AlertCircle, Info, ArrowLeft, Activity, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface Supplier {
    _id: string;
    businessName: string;
}

interface Item {
    _id: string;
    name: string;
    stockQty: number;
    batches: any[];
}

const RateRevisionForm: React.FC = () => {
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Form State
    const [supplierId, setSupplierId] = useState('');
    const [itemId, setItemId] = useState('');
    const [batchNumber, setBatchNumber] = useState('');

    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [newRate, setNewRate] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Fetch Suppliers
        api.get('/purchases/suppliers').then(res => {
            if (res.data.success) setSuppliers(res.data.data);
        }).catch(err => console.error("Failed to fetch suppliers", err));

        // Fetch Items
        api.get('/inventory/items').then(res => {
            if (res.data.data?.items) setItems(res.data.data.items);
            else if (Array.isArray(res.data.data)) setItems(res.data.data);
        }).catch(err => console.error("Failed to fetch items", err));
    }, []);

    useEffect(() => {
        if (itemId && batchNumber) {
            const item = items.find(i => i._id === itemId);
            if (item && item.batches) {
                const batch = item.batches.find((b: any) => b.batchNumber === batchNumber);
                setSelectedBatch(batch || null);
            }
        } else {
            setSelectedBatch(null);
        }
    }, [itemId, batchNumber, items]);

    const oldRate = selectedBatch?.costPrice || 0;
    const affectedQty = selectedBatch?.quantity || 0;
    const diffAmount = (newRate - oldRate) * affectedQty;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !itemId || !batchNumber || !newRate) return toast.error("Please fill all fields");
        if (newRate <= oldRate) return toast.error("New rate must be higher than old rate");

        setIsSaving(true);
        try {
            await api.post('/purchases/rate-revisions', {
                supplierId,
                itemId,
                batchNumber,
                oldRate,
                newRate,
                affectedQty,
                reason
            });
            toast.success("Revision Request Created");
            navigate('/purchase/rate-revisions');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create request");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Initialize Revision Node"
                    description="Configure retrospective rate adjustment protocols and analyze institutional fiscal impact."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Rate Revisions', link: '/purchase/rate-revisions' },
                        { label: 'New Revision' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/purchase/rate-revisions')}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2 inline" /> Abort
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                            >
                                {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Initialize Protocol
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Parameters */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3 mb-10">
                                <Activity className="w-5 h-5 text-primary" /> Node Specifications
                            </h3>
                            
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Supplier</label>
                                    <select
                                        value={supplierId}
                                        onChange={e => setSupplierId(e.target.value)}
                                        className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Select Entity...</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.businessName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Item Oracle</label>
                                        <select
                                            value={itemId}
                                            onChange={e => {
                                                setItemId(e.target.value);
                                                setBatchNumber('');
                                            }}
                                            className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">Select Item...</option>
                                            {items.map(i => (
                                                <option key={i._id} value={i._id}>{i.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {itemId && (
                                        <div className="animate-in slide-in-from-right-4 duration-500">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Target Batch Node</label>
                                            <select
                                                value={batchNumber}
                                                onChange={e => setBatchNumber(e.target.value)}
                                                className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">Select Batch...</option>
                                                {items.find(i => i._id === itemId)?.batches
                                                    ?.filter((b: any) => !supplierId || b.supplierId === supplierId)
                                                    ?.map((b: any) => (
                                                        <option key={b.batchNumber} value={b.batchNumber}>
                                                            {b.batchNumber} (Cost: ₹{b.costPrice})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Revision Justification Narrative</label>
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-8 py-6 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-[2rem] text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                        placeholder="Retrospective cost adjustment rationale..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Impact Workspace */}
                    <div className="lg:col-span-5 space-y-10">
                        {selectedBatch ? (
                            <div className="bg-neutral-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-700">
                                <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                    <Calculator className="w-48 h-48" />
                                </div>
                                
                                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] relative z-10 flex items-center gap-3">
                                    <Calculator className="w-5 h-5" /> Fiscal Impact Simulation
                                </h3>

                                <div className="space-y-8 relative z-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Original Basis</p>
                                            <p className="text-2xl font-black tabular-nums tracking-tighter">₹{oldRate.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">In-Stock Quantum</p>
                                            <p className="text-2xl font-black tabular-nums tracking-tighter text-neutral-400">{affectedQty} Units</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 block">Adjusted Rate Protocol</label>
                                        <div className="relative group/input">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/40 group-focus-within/input:text-primary transition-colors">₹</span>
                                            <input
                                                type="number"
                                                value={newRate}
                                                onChange={e => setNewRate(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-12 pr-8 py-5 bg-white/5 border border-white/10 rounded-sm text-3xl font-black text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all tabular-nums"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/5 w-full"></div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Total Liability Delta</p>
                                            <p className={`text-5xl font-black tracking-tighter tabular-nums ${diffAmount > 0 ? 'text-danger' : 'text-success'}`}>
                                                {diffAmount > 0 ? '+' : ''}₹{Math.abs(diffAmount).toLocaleString()}
                                            </p>
                                        </div>
                                        {diffAmount > 0 && (
                                            <div className="p-4 bg-danger/10 rounded-sm border border-danger/20 animate-pulse">
                                                <AlertCircle className="w-6 h-6 text-danger" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 flex items-start gap-4 relative z-10 opacity-60 italic">
                                    <Info className="w-5 h-5 text-primary flex-shrink-0" />
                                    <p className="text-[10px] font-black leading-relaxed text-neutral-400">
                                        Execution of this node will recalibrate <span className="text-white underline">WAC (Weighted Average Cost)</span> and initialize an institutional debit-note request.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-neutral-800 p-12 rounded-[3.5rem] border border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-center opacity-30 grayscale min-h-[400px]">
                                <Calculator className="w-16 h-16 mb-6" />
                                <p className="font-black text-xs uppercase tracking-widest">Awaiting Parameter Input</p>
                                <p className="text-[10px] font-bold mt-2 leading-relaxed">Select institutional item and batch nodes to initialize the fiscal impact simulator.</p>
                            </div>
                        )}
                        
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-4 animate-in slide-in-from-right-10 duration-1000">
                            <div className="p-3 bg-warning/10 rounded-sm">
                                <ShieldCheck className="text-warning w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Authorization Protocol</p>
                                <p className="text-[10px] font-bold text-neutral-400 leading-relaxed italic">
                                    Retrospective adjustments require institutional sign-off before inventory basis is recalibrated.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RateRevisionForm;
