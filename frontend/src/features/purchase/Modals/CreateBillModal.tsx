
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { PurchaseOrder } from "../../../types/purchase";
import { useDispatch } from 'react-redux';
// We assume we can import these. If not, we might need to verify paths.
// Based on Bills.tsx imports:
import { createBill } from "../../../redux/slices/billSlice";
import { AppDispatch } from "../../../redux/store";
import { toast } from 'react-toastify';
import { Button, Input, Modal, Textarea } from '../../../components/shared';

interface CreateBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrder;
    onBillCreated: () => void;
}

const CreateBillModal: React.FC<CreateBillModalProps> = ({ isOpen, onClose, order, onBillCreated }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);

    // Initial State pre-filled from Order
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: order.vendor_id || '', // Provided order has vendor_id
        amount: order.total_amount,
        dueDate: '',
        status: 'unpaid',
        description: `Bill for PO #${order.po_number}`,
        paymentMethod: 'cash',
        paidAmount: 0,
        bankAccount: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await dispatch(createBill(formData)).unwrap(); // Assuming unwrap is available if using createAsyncThunk
            toast.success('Bill created successfully');
            onBillCreated();
            onClose();
        } catch (error: any) {
            console.error("Failed to create bill:", error);
            toast.error(error.message || 'Failed to create bill');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Bill"
            size="md"
        >
            <p className="text-sm text-slate-500 -mt-4 mb-4">For PO #{order.po_number}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Bill Date"
                            required
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                        <Input
                            type="date"
                            label="Due Date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <Input
                        type="number"
                        label="Amount"
                        required
                        disabled
                        icon={<span className="text-slate-500">₹</span>}
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    />

                    <Textarea
                        label="Description"
                        minRows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" size="md" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            icon={<FileText className="w-4 h-4" />}
                            disabled={loading}
                            loading={loading}
                        >
                            Create Bill
                        </Button>
                    </div>
            </form>
        </Modal>
    );
};

export default CreateBillModal;
