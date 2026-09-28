import React, { useState } from 'react';
import { Plus, Trash2, Percent } from 'lucide-react';
import { debitNoteService, DebitNote } from "../../../services/debitNoteService";
import { toast } from 'react-toastify';
import { Button, Modal, Select, Textarea } from '../../../components/shared';import { Input } from '@/components/shared/Input';
import { getApiErrorMessage } from '../../../utils/apiError';


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

        // Lines go to the server as line totals (qty x rate + tax); the server looks up the
        // supplier name and adds up the note total itself. Linked bill/GRN are kept as a reference.
        const lines = (newNote.items || [])
            .filter(item => item.name && item.qty > 0)
            .map(item => ({
                name: item.name,
                qty: item.qty,
                amount: Math.round((item.qty * item.amount + (item.taxAmount || 0)) * 100) / 100,
            }));
        if (lines.length === 0 || lines.some(line => line.amount <= 0)) {
            toast.error('Add at least one line with a description, quantity and rate');
            return;
        }
        const payload = {
            vendorId: newNote.vendorId,
            reason: newNote.reason,
            items: lines,
            notes: newNote.notes,
            poReference: newNote.originalBillNumber || newNote.originalGrnNumber || undefined,
        };

        try {
            await debitNoteService.createDebitNote(payload as Partial<DebitNote>);
            toast.success('Debit note created successfully');
            onSuccess();
            setNewNote({
                reason: 'OTHER',
                items: [{ name: '', qty: 1, amount: 0 }],
                notes: ''
            });
        } catch (error: any) {
            toast.error(getApiErrorMessage(error, 'Failed to create debit note'));
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Debit Note"
            size="lg"
        >
            <p className="text-xs text-slate-500 font-medium -mt-4 mb-4">Issue a claim or return to a supplier</p>
            <form onSubmit={handleCreateNote} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Vendor / Supplier</label>
                            <Select
                                options={vendors.map((v: any) => ({ value: v._id, label: v.businessName || v.name }))}
                                value={newNote.vendorId}
                                onChange={(value) => setNewNote({ ...newNote, vendorId: (typeof value === 'string' ? value : value[0]) })}
                                placeholder="Select Vendor"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Reason</label>
                            <Select
                                options={Object.entries(REASON_LABELS).map(([val, label]) => ({ value: val, label }))}
                                value={newNote.reason}
                                onChange={(value) => setNewNote({ ...newNote, reason: (typeof value === 'string' ? value : value[0]) as any })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Link to Bill</label>
                            <Select
                                options={[
                                    { value: '', label: 'Direct / No Bill Link' },
                                    ...bills.filter(b => b.vendor_id === newNote.vendorId || !newNote.vendorId).map((b: any) => ({
                                        value: b._id,
                                        label: `${b.bill_number} (₹${(b.amount || b.total_amount).toLocaleString()})`
                                    }))
                                ]}
                                value={newNote.originalBillId}
                                onChange={(value) => {
                                    const id = typeof value === 'string' ? value : value[0];
                                    const bill = bills.find(b => b._id === id);
                                    setNewNote({
                                        ...newNote,
                                        originalBillId: id,
                                        originalBillNumber: bill?.bill_number || ''
                                    });
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Link to GRN</label>
                            <Select
                                options={[
                                    { value: '', label: 'No GRN Link' },
                                    ...grns.filter(g => { const v: any = vendors.find(x => x._id === newNote.vendorId); return !newNote.vendorId || g.vendorName === (v?.businessName || v?.name); }).map((g: any) => ({
                                        value: g.id,
                                        label: `${g.grnNumber || g.id} (${g.vendorName})`
                                    }))
                                ]}
                                value={newNote.originalGrnId}
                                onChange={(value) => {
                                    const id = typeof value === 'string' ? value : value[0];
                                    const grn = grns.find(g => g.id === id);
                                    setNewNote({
                                        ...newNote,
                                        originalGrnId: id,
                                        originalGrnNumber: grn?.grnNumber || grn?.id || ''
                                    });
                                }}
                            />
                        </div>
                    </div>


                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Items / Adjustments</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-xs font-black text-error uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        {newNote.items?.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-sm border border-slate-100 dark:border-slate-700 space-y-4">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                                        <input
                                            type="text"
                                            placeholder="Item name or description"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200"
                                            value={item.name}
                                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-center">Qty</label>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-center"
                                            value={item.qty}
                                            onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-right">Unit Price</label>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-right"
                                            value={item.amount}
                                            onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tax %</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                                                    value={item.taxRate}
                                                    onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value))}
                                                />
                                                <Percent className="w-3 h-3 absolute right-3 top-2 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tax Amount</label>
                                            <span className="text-sm font-medium">₹{(item.taxAmount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-right">Row Total</label>
                                            <span className="text-sm font-bold text-error">₹{((item.qty * item.amount) + (item.taxAmount || 0)).toLocaleString()}</span>
                                        </div>
                                        {newNote.items!.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-slate-400 hover:text-error transition-colors"
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
                            <Textarea
                                label="Notes / Observations"
                                minRows={3}
                                value={newNote.notes}
                                onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                                placeholder="Add any additional details here..."
                            />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-sm border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Subtotal</span>
                                <span>₹{(newNote.subTotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Total Tax</span>
                                <span>₹{(newNote.taxAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-error pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span>GRAND TOTAL</span>
                                <span>₹{(newNote.totalAmount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-4">
                        <Button type="button" variant="secondary" size="md" onClick={onClose}>
                            Discard
                        </Button>
                        <Button type="submit" variant="danger" size="md">
                            Deploy Debit Note
                        </Button>
                    </div>
            </form>
        </Modal>
    );
};

export default CreateDebitNoteModal;
