import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, MapPin, Search, X, Briefcase } from 'lucide-react';
import { FormSection, InputWrapper } from './CustomerUI';
import { Customer } from "../../../../types";

interface CustomerFormProps {
    initialData?: Partial<Customer>;
    customers: Customer[];
    onSubmit: (data: any) => void;
    isLoading: boolean;
    duplicateField: string | null;
    submitLabel: string;
    onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
    initialData,
    customers,
    onSubmit,
    isLoading,
    duplicateField,
    submitLabel,
    onCancel
}) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        address: initialData?.address || '',
        referredBy: typeof initialData?.referrer === 'string' ? initialData.referrer : (initialData?.referrer as any)?._id || '',
    });

    const [referralSearch, setReferralSearch] = useState('');
    const [showReferralDropdown, setShowReferralDropdown] = useState(false);
    const [selectedReferrer, setSelectedReferrer] = useState<Customer | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                address: initialData.address || '',
                referredBy: typeof initialData.referrer === 'string' ? initialData.referrer : (initialData.referrer as any)?._id || '',
            });

            if (initialData.referrer && typeof initialData.referrer !== 'string') {
                setSelectedReferrer(initialData.referrer as any);
                setReferralSearch((initialData.referrer as any).name);
            }
        }
    }, [initialData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowReferralDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectReferrer = (customer: Customer) => {
        setSelectedReferrer(customer);
        setFormData(prev => ({ ...prev, referredBy: customer._id }));
        setReferralSearch(customer.name);
        setShowReferralDropdown(false);
    };

    const handleClearReferrer = () => {
        setSelectedReferrer(null);
        setFormData(prev => ({ ...prev, referredBy: '' }));
        setReferralSearch('');
    };

    const filteredReferralCustomers = customers.filter(
        c => c.name.toLowerCase().includes(referralSearch.toLowerCase()) ||
            c.phone.includes(referralSearch)
    ).filter(c => c._id !== initialData?._id); // Don't allow self-referral

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Partner Identity" description="Core contact parameters and decision-maker details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <InputWrapper label="Partner Name" icon={User} required>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            required
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-[rgb(var(--color-text))]"
                            placeholder="Full Commercial Name"
                        />
                    </InputWrapper>

                    <InputWrapper
                        label="Communication Node"
                        icon={Phone}
                        required
                        error={duplicateField === 'phone' ? 'Node collision: Phone already exists' : undefined}
                    >
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={onChange}
                            required
                            pattern="[0-9]{10}"
                            className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-[rgb(var(--color-text))] ${duplicateField === 'phone' ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                            placeholder="10-Digit Primary Line"
                        />
                    </InputWrapper>

                    <InputWrapper
                        label="Email Registry"
                        icon={Mail}
                        error={duplicateField === 'email' ? 'Node collision: Email already exists' : undefined}
                    >
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-[rgb(var(--color-text))] ${duplicateField === 'email' ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                            placeholder="Official Digital Correspondence"
                        />
                    </InputWrapper>

                    <InputWrapper label="Network Referral" icon={Briefcase}>
                        <div className="relative" ref={dropdownRef}>
                            {selectedReferrer ? (
                                <div className="w-full px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-sm flex items-center justify-between group">
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter leading-none mb-1">Referrer Selected</p>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-success">{selectedReferrer.name}</p>
                                    </div>
                                    <button type="button" onClick={handleClearReferrer} className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all">
                                        <X className="w-4 h-4 text-emerald-600" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={referralSearch}
                                        onChange={(e) => {
                                            setReferralSearch(e.target.value);
                                            setShowReferralDropdown(true);
                                        }}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-[rgb(var(--color-text))]"
                                        placeholder="Search existing partners..."
                                    />
                                    {showReferralDropdown && referralSearch.length > 0 && (
                                        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                            {filteredReferralCustomers.length > 0 ? (
                                                filteredReferralCustomers.map((c) => (
                                                    <button
                                                        key={c._id}
                                                        type="button"
                                                        onClick={() => handleSelectReferrer(c)}
                                                        className="w-full px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all text-left"
                                                    >
                                                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{c.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{c.phone}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center opacity-40">
                                                    <Search className="w-8 h-8 mx-auto mb-2" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No matching partners<br />detected in registry</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </InputWrapper>
                </div>
            </FormSection>

            <FormSection title="Logistics Reachability" description="Physical warehouse and billing coordinates">
                <div className="w-full">
                    <InputWrapper label="Primary Reachability Node" icon={MapPin}>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={onChange}
                            rows={3}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm leading-relaxed text-[rgb(var(--color-text))]"
                            placeholder="Warehouse Access Point / Billing Logistics Center"
                        />
                    </InputWrapper>
                </div>
            </FormSection>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-8 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                >
                    Abort
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-sm text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? 'Synchronizing Pipeline...' : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default CustomerForm;
