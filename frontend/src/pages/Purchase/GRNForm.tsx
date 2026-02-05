import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    ArrowLeft,
    Save,
    Package,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    Plus,
    Trash2,
    FileText,
    Camera,
    Truck,
    Info,
    Search
} from 'lucide-react';
import { RootState } from "../../../redux/store";
import { addGRN, updateOrder } from "../../../redux/slices/purchaseSlice";
import { GRN, GRNItem, GRNStatus, InspectionStatus, PurchaseOrder } from "../../../types/purchase";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import FormField from "../../../components/shared/Form/FormField";

const GRNForm: React.FC = () => {
    const { poId } = useParams<{ poId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { orders } = useSelector((state: RootState) => state.purchase);
    const { user, currentBranch } = useSelector((state: RootState) => state.auth);

    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [grnData, setGrnData] = useState<Partial<GRN>>({
        grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Draft',
        items: [],
        notes: '',
        attachments: []
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Fetch PO details if poId is provided
    useEffect(() => {
        if (poId) {
            const order = orders.find(o => o.id === poId);
            if (order) {
                setSelectedPO(order);
                initializeGRNFromPO(order);
            }
        }
    }, [poId, orders]);

    const initializeGRNFromPO = (order: PurchaseOrder) => {
        const items: GRNItem[] = order.items.map(item => ({
            id: `ITEM-${Math.random().toString(36).substr(2, 9)}`,
            poItemId: item.product_id || '', // Assuming product_id maps to poItemId
            productId: item.product_id || '',
            productName: item.product_name,
            sku: item.sku,
            orderedQty: item.quantity,
            receivedQty: item.quantity - (item.received_quantity || 0),
            acceptedQty: item.quantity - (item.received_quantity || 0),
            rejectedQty: 0,
            inspectionStatus: 'Accepted',
            discrepancyNotes: ''
        }));

        setGrnData(prev => ({
            ...prev,
            poId: order.id,
            poNumber: order.po_number,
            vendorId: order.vendor_id || '',
            vendorName: order.vendor_name,
            items: items
        }));
    };

    const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
        const newItems = [...(grnData.items || [])];
        const item = { ...newItems[index], [field]: value };

        // Auto-calculate accepted/rejected if receivedQty changes
        if (field === 'receivedQty') {
            item.acceptedQty = value;
            item.rejectedQty = 0;
            item.inspectionStatus = 'Accepted';
        }

        // Auto-calculate rejected if accepted changes
        if (field === 'acceptedQty') {
            item.rejectedQty = Math.max(0, item.receivedQty - value);
            item.inspectionStatus = item.rejectedQty > 0 ? 'Partial' : 'Accepted';
        }

        newItems[index] = item;
        setGrnData(prev => ({ ...prev, items: newItems }));
    };

    const getStatusIcon = (status: InspectionStatus) => {
        switch (status) {
            case 'Accepted': return <CheckCircle className="w-4 h-4 text-success" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-error" />;
            case 'Hold': return <Clock className="w-4 h-4 text-warning" />;
            case 'Partial': return <AlertTriangle className="w-4 h-4 text-warning" />;
        }
    };

    const saveGRN = (status: GRNStatus) => {
        const finalGRN: GRN = {
            ...grnData as GRN,
            status,
            created_at: new Date().toISOString(),
            created_by: user?.name,
            branch_id: currentBranch || 'Main'
        };

        dispatch(addGRN(finalGRN));

        // Logic to update inventory would be triggered here in a real app

        navigate('/purchase/grn');
    };

    const availablePOs = useMemo(() => {
        return orders.filter(o => o.status === 'Approved' || o.status === 'Partial Receipt');
    }, [orders]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-20">
                <PageHeader
                    title={poId ? "Create GRN" : "New Goods Receipt"}
                    description="Record incoming shipment details and perform quality checks."
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/purchase/grn')}
                                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveGRN('Accepted')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Accept & Receive
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" /> General Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!poId && (
                                    <FormField label="Select Purchase Order" required>
                                        <select
                                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                            onChange={(e) => {
                                                const order = orders.find(o => o.id === e.target.value);
                                                if (order) {
                                                    setSelectedPO(order);
                                                    initializeGRNFromPO(order);
                                                }
                                            }}
                                        >
                                            <option value="">Choose a PO...</option>
                                            {availablePOs.map(po => (
                                                <option key={po.id} value={po.id}>{po.po_number} - {po.vendor_name}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                )}
                                <FormField label="GRN Number">
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500"
                                        value={grnData.grnNumber}
                                    />
                                </FormField>
                                <FormField label="Receipt Date" required>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                        value={grnData.receivedDate}
                                        onChange={e => setGrnData(prev => ({ ...prev, receivedDate: e.target.value }))}
                                    />
                                </FormField>
                                <FormField label="Vendor">
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500"
                                        value={grnData.vendorName || ''}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" /> Item Inspection
                                </h3>
                                <div className="text-xs font-medium text-neutral-500 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                    {grnData.items?.length || 0} Items linked to {grnData.poNumber}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Product Details</th>
                                            <th className="px-4 py-4 text-center">Ordered</th>
                                            <th className="px-4 py-4 text-center">Received</th>
                                            <th className="px-4 py-4 text-center">Accepted</th>
                                            <th className="px-4 py-4 text-center">Status</th>
                                            <th className="px-6 py-4">Batch / Serial</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                        {grnData.items?.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-8 h-8 opacity-20" />
                                                        <p>Select a Purchase Order to load items</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            grnData.items?.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-neutral-900 dark:text-white mb-0.5">{item.productName}</p>
                                                        <p className="text-xs text-neutral-500 font-mono">{item.sku}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-bold text-neutral-400">
                                                        {item.orderedQty}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            className="w-20 mx-auto px-2 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center font-bold focus:ring-1 focus:ring-primary outline-none"
                                                            value={item.receivedQty}
                                                            onChange={e => handleItemChange(idx, 'receivedQty', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            className="w-20 mx-auto px-2 py-1.5 bg-success/5 border border-success/20 rounded-lg text-center font-bold text-success focus:ring-1 focus:ring-success outline-none"
                                                            value={item.acceptedQty}
                                                            onChange={e => handleItemChange(idx, 'acceptedQty', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {getStatusIcon(item.inspectionStatus)}
                                                            <span className="text-[10px] font-bold uppercase text-neutral-400">{item.inspectionStatus}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Batch #"
                                                                className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none"
                                                                value={item.batchNumber || ''}
                                                                onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Expiry Date"
                                                                className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none"
                                                                onFocus={(e) => e.target.type = 'date'}
                                                                onBlur={(e) => e.target.type = 'text'}
                                                                value={item.expiryDate || ''}
                                                                onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" /> Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                                    <span className="text-sm text-neutral-500">Total Items</span>
                                    <span className="font-bold">{grnData.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-success/5 rounded-xl">
                                    <span className="text-sm text-success">Accepted Qty</span>
                                    <span className="font-bold text-success">
                                        {grnData.items?.reduce((sum, item) => sum + item.acceptedQty, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-error/5 rounded-xl">
                                    <span className="text-sm text-error">Rejected Qty</span>
                                    <span className="font-bold text-error">
                                        {grnData.items?.reduce((sum, item) => sum + (item.receivedQty - item.acceptedQty), 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" /> Attachments
                            </h3>
                            <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer capitalize">
                                <Plus className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                <p className="text-xs text-neutral-500 font-medium">Upload Delivery Challan or Photos</p>
                            </div>
                            <div className="mt-4 space-y-2">
                                {grnData.attachments?.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-medium truncate max-w-[150px]">{file}</span>
                                        </div>
                                        <button className="text-error hover:text-error/80"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> Discrepancy Notes
                            </h3>
                            <textarea
                                className="w-full p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                                placeholder="Any shortages, damages, or notes from the delivery..."
                                value={grnData.notes}
                                onChange={e => setGrnData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GRNForm;
