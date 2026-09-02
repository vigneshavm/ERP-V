import React, { useState } from 'react';
import { XCircle, Plus, Trash2, Percent } from 'lucide-react';
import { debitNoteService, DebitNote } from "../../../services/debitNoteService";
import { toast } from 'react-toastify';

interface CreateDebitNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vendors: any[];
    bills: any[];
    grns: any[];
    REASON_LABELS: Record<string, string>;
}

const CreateDebitNoteModal: React.FC<CreateDebitNoteModalProps> = ({
    isOpen, onClose, onSuccess, vendors, bills, grns, REASON_LABELS
}) => {
    const [newNote, setNewNote] = useState<Partial<DebitNote>>({
        reason: 'OTHER',
        items: [{ name: '', qty: 1, amount: 0, taxRate: 0, taxAmount: 0 }],
        subTotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: '',
        status: 'DRAFT'
    });

    if (!isOpen) return null;

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newNote.vendorId) {
            toast.error('Please select a vendor');
            return;
        }

        const selectedVendor = vendors.find((v: any) => v._id === newNote.vendorId);
        const finalNote = {
            ...newNote,
            vendorName: selectedVendor?.name || '',
            totalAmount: newNote.items?.reduce((sum, item) => sum + item.amount, 0) || 0
        };

        try {
            await debitNoteService.createDebitNote(finalNote);
            toast.success('Debit note created successfully');
            onSuccess();
            setNewNote({
                reason: 'OTHER',
                items: [{ name: '', qty: 1, amount: 0 }],
                notes: ''
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create debit note');
        }
    };

    const calculateTotals = (items: any[]) => {
        const subTotal = items.reduce((sum, item) => sum + (item.qty * item.amount), 0);
        const taxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
        const totalAmount = subTotal + taxAmount;
        return { subTotal, taxAmount, totalAmount };
    };

    const addItem = () => {
        const updatedItems = [...(newNote.items || []), { name: '', qty: 1, amount: 0, taxRate: 0, taxAmount: 0 }];
        const totals = calculateTotals(updatedItems);
        setNewNote({
            ...newNote,
            items: updatedItems,
            ...totals
        });
    };

    const removeItem = (index: number) => {
        const items = [...(newNote.items || [])];
        items.splice(index, 1);
        const totals = calculateTotals(items);
        setNewNote({ ...newNote, items, ...totals });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...(newNote.items || [])];
        const item = { ...items[index], [field]: value };

        if (field === 'qty' || field === 'amount' || field === 'taxRate') {
            const qty = field === 'qty' ? value : item.qty;
            const amount = field === 'amount' ? value : item.amount;
            const taxRate = field === 'taxRate' ? value : (item.taxRate || 0);
            item.taxAmount = (qty * amount * taxRate) / 100;
        }

        items[index] = item;
        const totals = calculateTotals(items);
        setNewNote({ ...newNote, items, ...totals });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Create Debit Note</h2>
                        <p className="text-xs text-neutral-500 font-medium">Issue a claim or return to a supplier</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                    >
                        <XCircle className="w-6 h-6 text-neutral-400" />
                    </button>
                </div>

                <form onSubmit={handleCreateNote} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Vendor / Supplier</label>
                            <select
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                value={newNote.vendorId}
                                onChange={(e) => setNewNote({ ...newNote, vendorId: e.target.value })}
                                required
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map((v: any) => (
                                    <option key={v._id} value={v._id}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Reason</label>
                            <select
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                value={newNote.reason}
                                onChange={(e) => setNewNote({ ...newNote, reason: e.target.value as any })}
                                required
                            >
                                {Object.entries(REASON_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Link to Bill</label>
                            <select
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                value={newNote.originalBillId}
                                onChange={(e) => {
                                    const bill = bills.find(b => b._id === e.target.value);
                                    setNewNote({
                                        ...newNote,
                                        originalBillId: e.target.value,
                                        originalBillNumber: bill?.bill_number || ''
                                    });
                                }}
                            >
                                <option value="">Direct / No Bill Link</option>
                                {bills.filter(b => b.vendor_id === newNote.vendorId || !newNote.vendorId).map((b: any) => (
                                    <option key={b._id} value={b._id}>{b.bill_number} (₹{(b.amount || b.total_amount).toLocaleString()})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Link to GRN</label>
                            <select
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                value={newNote.originalGrnId}
                                onChange={(e) => {
                                    const grn = grns.find(g => g.id === e.target.value);
                                    setNewNote({
                                        ...newNote,
                                        originalGrnId: e.target.value,
                                        originalGrnNumber: grn?.grnNumber || grn?.id || ''
                                    });
                                }}
                            >
                                <option value="">No GRN Link</option>
                                {grns.filter(g => g.vendorName === vendors.find(v => v._id === newNote.vendorId)?.name || !newNote.vendorId).map((g: any) => (
                                    <option key={g.id} value={g.id}>{g.grnNumber || g.id} ({g.vendorName})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Items / Adjustments</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-xs font-black text-error uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        {newNote.items?.map((item, idx) => (
                            <div key={idx} className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-sm border border-neutral-100 dark:border-neutral-700 space-y-4">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">Description</label>
                                        <input
                                            type="text"
                                            placeholder="Item name or description"
                                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm"
                                            value={item.name}
                                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block text-center">Qty</label>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm text-center"
                                            value={item.qty}
                                            onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block text-right">Unit Price</label>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm text-right"
                                            value={item.amount}
                                            onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 items-end justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">Tax %</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg text-xs"
                                                    value={item.taxRate}
                                                    onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value))}
                                                />
                                                <Percent className="w-3 h-3 absolute right-3 top-2 text-neutral-400" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">Tax Amount</label>
                                            <span className="text-sm font-medium">₹{(item.taxAmount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block text-right">Row Total</label>
                                            <span className="text-sm font-bold text-error">₹{((item.qty * item.amount) + (item.taxAmount || 0)).toLocaleString()}</span>
                                        </div>
                                        {newNote.items!.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-neutral-400 hover:text-error transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Notes / Observations</label>
                            <textarea
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm focus:ring-2 focus:ring-error/20"
                                rows={3}
                                value={newNote.notes}
                                onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                                placeholder="Add any additional details here..."
                            ></textarea>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-sm border border-neutral-200 dark:border-neutral-700 space-y-2">
                            <div className="flex justify-between text-xs font-medium text-neutral-500">
                                <span>Subtotal</span>
                                <span>₹{(newNote.subTotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-neutral-500">
                                <span>Total Tax</span>
                                <span>₹{(newNote.taxAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-error pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                <span>GRAND TOTAL</span>
                                <span>₹{(newNote.totalAmount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-200"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-error text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-error/90 shadow-lg shadow-error/20 transform active:scale-95 transition-all"
                        >
                            Deploy Debit Note
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDebitNoteModal;
