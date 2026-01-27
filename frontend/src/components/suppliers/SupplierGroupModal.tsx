import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { createSupplierGroup } from '../../redux/slices/supplierGroupSlice';
import Modal from '../Modal';
import { FolderPlus, Save, Truck, Crown, Building, Star } from 'lucide-react';

interface SupplierGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupplierGroupModal: React.FC<SupplierGroupModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3b82f6',
        paymentTerms: 30,
        creditLimit: 0,
        discountPercent: 0,
        icon: 'truck'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await dispatch(createSupplierGroup(formData)).unwrap();
            onClose();
            // Reset form
            setFormData({
                name: '',
                description: '',
                color: '#3b82f6',
                paymentTerms: 30,
                creditLimit: 0,
                discountPercent: 0,
                icon: 'truck'
            });
        } catch (error) {
            console.error('Failed to create group:', error);
            // Handle error (could add toast notification here)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Supplier Group"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Group Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g., Strategic Partners"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        placeholder="Brief description of this group..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Payment Terms (Days)</label>
                        <input
                            type="number"
                            name="paymentTerms"
                            value={formData.paymentTerms}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Credit Limit (₹)</label>
                        <input
                            type="number"
                            name="creditLimit"
                            value={formData.creditLimit}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Discount (%)</label>
                        <input
                            type="number"
                            name="discountPercent"
                            value={formData.discountPercent}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Color Tag</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                className="w-10 h-10 rounded-lg cursor-pointer border-none"
                            />
                            <span className="text-xs font-mono text-neutral-500">{formData.color}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Group Icon</label>
                    <div className="flex gap-4">
                        {['truck', 'crown', 'building', 'star'].map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                className={`p-3 rounded-xl border-2 transition-all ${formData.icon === icon
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-transparent bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isLoading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierGroupModal;
