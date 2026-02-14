import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createSupplierGroup, updateSupplierGroup } from '../../redux/slices/supplierGroupSlice';
import Modal from '../shared/Overlay/Modal';
import {
    Tag, MapPin, DollarSign, Flag, Percent, Calendar,
    CreditCard, Truck, AlertCircle, Save
} from 'lucide-react';
import { toast } from 'react-toastify';

interface SupplierGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

const SupplierGroupModal: React.FC<SupplierGroupModalProps> = ({ isOpen, onClose, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.supplierGroups);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3b82f6',
        nature: 'Raw Material',
        region: 'Local',
        financialCategory: 'Credit',
        priority: 'Medium',
        taxType: 'GST',
        paymentTerms: 30,
        creditLimit: 0,
        discountPercent: 0,
        icon: 'truck'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                description: '',
                color: '#3b82f6',
                nature: 'Raw Material',
                region: 'Local',
                financialCategory: 'Credit',
                priority: 'Medium',
                taxType: 'GST',
                paymentTerms: 30,
                creditLimit: 0,
                discountPercent: 0,
                icon: 'truck'
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData && initialData._id) {
                await dispatch(updateSupplierGroup({ id: initialData._id, data: formData })).unwrap();
                toast.success('Supplier group updated successfully');
            } else {
                await dispatch(createSupplierGroup(formData)).unwrap();
                toast.success('Supplier group created successfully');
            }
            onClose();
        } catch (error: any) {
            toast.error(error || 'Failed to save group');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['paymentTerms', 'creditLimit', 'discountPercent'].includes(name) ? Number(value) : value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Supplier Group" : "Create Supplier Group"}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Group Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Critical Raw Materials"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                            placeholder="Brief purpose of this group..."
                        />
                    </div>
                </div>

                {/* Categorization Grid */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mb-4">
                        <Tag className="w-4 h-4 text-indigo-500" /> Categorization
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nature</label>
                            <select
                                name="nature"
                                value={formData.nature}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option>Raw Material</option>
                                <option>Finished Goods</option>
                                <option>Services</option>
                                <option>Others</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Region</label>
                            <select
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option>Local</option>
                                <option>Outstation</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Financial Type</label>
                            <select
                                name="financialCategory"
                                value={formData.financialCategory}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option>Credit</option>
                                <option>Cash</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Terms & Limits */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Credit Days
                        </label>
                        <input
                            type="number"
                            name="paymentTerms"
                            value={formData.paymentTerms}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> Limit (₹)
                        </label>
                        <input
                            type="number"
                            name="creditLimit"
                            value={formData.creditLimit}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Discount %
                        </label>
                        <input
                            type="number"
                            name="discountPercent"
                            value={formData.discountPercent}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-emerald-600"
                        />
                    </div>
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
                        <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Group'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierGroupModal;
