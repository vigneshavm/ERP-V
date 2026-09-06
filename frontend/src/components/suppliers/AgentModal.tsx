import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createAgent, updateAgent } from '../../redux/slices/agentSlice';
import Modal from '../shared/Overlay/Modal';
import {
    User, Phone, Mail, MapPin, Percent,
    Landmark, Hash, Save
} from 'lucide-react';
import { toast } from 'react-toastify';

interface AgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

const EMPTY_AGENT = {
    name: '',
    phone: '',
    email: '',
    address: '',
    commissionPercent: 0,
    linkedSupplierId: '',
    bankAccountNumber: '',
    bankName: '',
    ifsc: '',
    notes: '',
    status: 'active' as 'active' | 'inactive'
};

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.agents);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // Parent mounts a fresh AgentModal instance per open (keyed by the agent being edited, see
    // Agents.tsx), so initial state can be derived once here instead of synced via an effect.
    const [formData, setFormData] = useState<typeof EMPTY_AGENT>(() =>
        initialData ? { ...EMPTY_AGENT, ...initialData } : EMPTY_AGENT
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData && initialData._id) {
                await dispatch(updateAgent({ id: initialData._id, data: formData })).unwrap();
                toast.success('Agent updated successfully');
            } else {
                await dispatch(createAgent(formData)).unwrap();
                toast.success('Agent created successfully');
            }
            onClose();
        } catch (error: any) {
            toast.error(error || 'Failed to save agent');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'commissionPercent' ? Number(value) : value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Agent' : 'Register Agent'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <User className="w-3 h-3" /> Agent Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Ramesh Textiles Agency"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-16 text-sm"
                        />
                    </div>
                </div>

                {/* Commission & Linked Supplier */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Commission %
                        </label>
                        <input
                            type="number"
                            name="commissionPercent"
                            value={formData.commissionPercent}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-emerald-600"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Linked Supplier</label>
                        <select
                            name="linkedSupplierId"
                            value={formData.linkedSupplierId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        >
                            <option value="">None</option>
                            {(suppliers || []).map((s: any) => (
                                <option key={s._id || s.id} value={s._id || s.id}>{s.businessName || s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bank Details -- for commission payouts, mirrors Supplier's bankAccounts shape */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mb-4">
                        <Landmark className="w-4 h-4 text-primary" /> Bank Details (for payouts)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> Account No.
                            </label>
                            <input
                                type="text"
                                name="bankAccountNumber"
                                value={formData.bankAccountNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">IFSC</label>
                            <input
                                type="text"
                                name="ifsc"
                                value={formData.ifsc}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Agent'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AgentModal;
