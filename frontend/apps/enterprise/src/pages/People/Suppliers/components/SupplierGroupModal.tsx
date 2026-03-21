import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, Shield, Tag, CreditCard, Palette, Truck, Crown, Building, Star } from 'lucide-react';
import { AppDispatch, RootState } from "@/app/store/store";
import { createSupplierGroup, updateSupplierGroup, reset, SupplierGroup } from "@/entities/contact/model/supplierGroupSlice";
import { toast } from 'react-toastify';

interface SupplierGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: SupplierGroup | null;
}

const SupplierGroupModal: React.FC<SupplierGroupModalProps> = ({ isOpen, onClose, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess, isError, message } = useSelector((state: RootState) => state.supplierGroups);

    const [formData, setFormData] = useState<Partial<SupplierGroup>>({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'truck',
        paymentTerms: 30,
        creditLimit: 0,
        discountPercent: 0,
        priority: 'Medium',
        nature: 'Standard'
    });

    useEffect(() => {
        if (initialData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                description: '',
                color: '#6366f1',
                icon: 'truck',
                paymentTerms: 30,
                creditLimit: 0,
                discountPercent: 0,
                priority: 'Medium',
                nature: 'Standard'
            });
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isSuccess && isOpen) {
            toast.success(`Group ${initialData ? 'updated' : 'created'} successfully`);
            onClose();
            dispatch(reset());
        }
        if (isError && message && isOpen) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isSuccess, isError, message, isOpen, initialData, onClose, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData?._id) {
            dispatch(updateSupplierGroup({ id: initialData._id, data: formData }));
        } else {
            dispatch(createSupplierGroup(formData));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--erp-bg)]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[var(--erp-bg)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-default dark:border-default animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-default flex items-center justify-between bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50">
                    <div>
                        <h2 className="text-xl font-black text-main uppercase tracking-tight">
                            {initialData ? 'Refine Group Logic' : 'Initialize New Group'}
                        </h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Classification Artifact</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 dark:hover:bg-neutral-700 rounded-xl transition-all">
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" /> Group Designation
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                                placeholder="e.g. Strategic Tech Partners"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Priority Level
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm appearance-none"
                            >
                                <option value="High">High Priority</option>
                                <option value="Medium">Standard</option>
                                <option value="Low">Low Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Aesthetics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                                <Palette className="w-3.5 h-3.5" /> Visual Identifier (Color)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className="w-14 h-14 p-1 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border-none rounded-2xl cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    readOnly
                                    className="flex-grow px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-mono text-xs font-bold text-muted"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                                <Crown className="w-3.5 h-3.5" /> Symbolic Glyph (Icon)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {['truck', 'crown', 'building', 'star'].map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.icon === icon
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                                                : 'border-transparent bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted hover:bg-[var(--erp-bg-sunken)]'
                                            }`}
                                    >
                                        {icon === 'truck' && <Truck className="w-5 h-5" />}
                                        {icon === 'crown' && <Crown className="w-5 h-5" />}
                                        {icon === 'building' && <Building className="w-5 h-5" />}
                                        {icon === 'star' && <Star className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Financial Logic */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border-b border-indigo-50 dark:border-indigo-500/10 pb-2">Financial Constraints</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Payment Window (Days)</label>
                                <input
                                    type="number"
                                    name="paymentTerms"
                                    value={formData.paymentTerms}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-xl font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-1">Credit Ceiling <CreditCard className="w-3 h-3" /></label>
                                <input
                                    type="number"
                                    name="creditLimit"
                                    value={formData.creditLimit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-xl font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Strategic Discount %</label>
                                <input
                                    type="number"
                                    name="discountPercent"
                                    value={formData.discountPercent}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-xl font-bold text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Contextual Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-sm"
                            placeholder="Define the purpose and scope of this group..."
                        />
                    </div>
                </form>

                <div className="px-8 py-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-t border-slate-50 dark:border-default flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-muted font-black text-[10px] uppercase tracking-widest hover:text-secondary transition-all"
                    >
                        Abort
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {initialData ? 'Update Matrix' : 'Initialize Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierGroupModal;
