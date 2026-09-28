import React from 'react';
import { Save } from 'lucide-react';
import { Button, Input, Modal, Select, Textarea } from '@/components/shared';

interface FinanceModalsProps {
    showExpenseModal: boolean;
    setShowExpenseModal: (show: boolean) => void;
    handleAddExpense: (e: React.FormEvent) => void;
    newExpense: any;
    setNewExpense: (expense: any) => void;
    showChequeModal: boolean;
    setShowChequeModal: (show: boolean) => void;
    handleAddCheque: (e: React.FormEvent) => void;
    newCheque: any;
    setNewCheque: (cheque: any) => void;
}

const FinanceModals: React.FC<FinanceModalsProps> = ({
    showExpenseModal, setShowExpenseModal, handleAddExpense, newExpense, setNewExpense,
    showChequeModal, setShowChequeModal, handleAddCheque, newCheque, setNewCheque
}) => {
    return (
        <>
            <Modal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title="Log New Expense"
                size="sm"
            >
                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <Input
                            label="Category"
                            type="text"
                            placeholder="e.g. Marketing, Utilities"
                            value={newExpense.category}
                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                            required
                        />
                        <Input
                            label="Amount"
                            type="number"
                            placeholder="0.00"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                            icon={<span className="font-bold text-slate-400">₹</span>}
                            required
                        />
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                            <Select
                                options={[
                                    { value: 'Cash', label: 'Cash' },
                                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                                    { value: 'Card', label: 'Card' },
                                    { value: 'UPI', label: 'UPI' },
                                ]}
                                value={newExpense.paymentMethod || 'Cash'}
                                onChange={(value) => setNewExpense({ ...newExpense, paymentMethod: typeof value === 'string' ? value : value[0] })}
                            />
                        </div>
                        <Textarea
                            label="Description"
                            placeholder="Details..."
                            minRows={3}
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                        <Button type="submit" variant="primary" size="lg" icon={<Save className="w-4 h-4" />} fullWidth>
                            Save Record
                        </Button>
                    </form>
            </Modal>

            <Modal
                isOpen={showChequeModal}
                onClose={() => setShowChequeModal(false)}
                title="Register Cheque"
                size="sm"
            >
                    <form onSubmit={handleAddCheque} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cheque No"
                                type="text"
                                placeholder="XXXXXX"
                                value={newCheque.number}
                                onChange={e => setNewCheque({ ...newCheque, number: e.target.value })}
                                required
                            />
                            <Input
                                label="Date"
                                type="date"
                                value={newCheque.date}
                                onChange={e => setNewCheque({ ...newCheque, date: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="Bank Name"
                            type="text"
                            placeholder="Bank Name"
                            value={newCheque.bankName}
                            onChange={e => setNewCheque({ ...newCheque, bankName: e.target.value })}
                            required
                        />
                        <Input
                            label="Amount"
                            type="number"
                            placeholder="0.00"
                            value={newCheque.amount}
                            onChange={e => setNewCheque({ ...newCheque, amount: e.target.value })}
                            icon={<span className="font-bold text-slate-400">₹</span>}
                            required
                        />
                        <Input
                            label="Payee"
                            type="text"
                            placeholder="Payee Name"
                            value={newCheque.payee}
                            onChange={e => setNewCheque({ ...newCheque, payee: e.target.value })}
                            required
                        />
                        <Button type="submit" variant="primary" size="lg" icon={<Save className="w-4 h-4" />} fullWidth>
                            Issue Cheque
                        </Button>
                    </form>
            </Modal>
        </>
    );
};

export default FinanceModals;
