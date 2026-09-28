import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../../../redux/store";
import { createTransfer } from "../../../redux/slices/cashbankSlice";
import { ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/shared';

interface TransferModalProps {
    accounts: any[];
    onClose: () => void;
    onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ accounts, onClose, onSuccess }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [formData, setFormData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            await dispatch(createTransfer({
                ...formData,
                amount: parseFloat(formData.amount)
            })).unwrap();
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Fund Transfer"
            size="sm"
        >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic -mt-4 mb-4">Internal Liquidity Movement</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 block mb-2">From account</label>
                            <Select
                                options={[
                                    { value: '', label: 'Select Source Account...' },
                                    ...accounts.map(acc => ({ value: acc._id, label: `${acc.bankName} - ${acc.accountNumber} (₹${acc.currentBalance})`, disabled: acc._id === formData.toAccount }))
                                ]}
                                value={formData.fromAccount}
                                onChange={(value) => setFormData({ ...formData, fromAccount: typeof value === 'string' ? value : value[0] })}
                            />
                        </div>

                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700">
                                <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 block mb-2">To account</label>
                            <Select
                                options={[
                                    { value: '', label: 'Select Designation Account...' },
                                    ...accounts.map(acc => ({ value: acc._id, label: `${acc.bankName} - ${acc.accountNumber}`, disabled: acc._id === formData.fromAccount }))
                                ]}
                                value={formData.toAccount}
                                onChange={(value) => setFormData({ ...formData, toAccount: typeof value === 'string' ? value : value[0] })}
                            />
                        </div>

                        <Input
                            label="Transfer Magnitude (₹)"
                            type="number"
                            required
                            min="1"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                        />

                        <Input
                            label="Reference / Memo"
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="E.g. Daily Cash Deposit"
                        />

                        <Button
                            type="submit"
                            variant="secondary"
                            size="lg"
                            icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                            disabled={loading || !formData.fromAccount || !formData.toAccount || !formData.amount}
                            loading={loading}
                            fullWidth
                        >
                            Authorize Transfer
                        </Button>
            </form>
        </Modal>
    );
};

export default TransferModal;
