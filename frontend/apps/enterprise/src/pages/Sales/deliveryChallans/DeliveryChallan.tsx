import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import FormInput from "@/shared/ui/Form/Input";
import CustomerSelectionModal from "@/shared/ui/Modals/CustomerSelectionModal";
import ItemSelectionModal from "@/shared/ui/Modals/ItemSelectionModal";
import SalesOrderSelectionModal from "@/shared/ui/Modals/SalesOrderSelectionModal";
import { createDeliveryChallan, reset } from "@/entities/sales/model/deliveryChallanSlice";

import { RootState } from '@/app/store/store';

interface ChallanItem {
    item: string;
    name: string;
    sku: string;
    quantity: number;
    deliveredQty: number;
    unit: string;
    description: string;
    availableStock: number;
    sellingPrice: number;
}

interface ChallanFormData {
    challanNo: string;
    challanDate: string;
    deliveryDate: string;
    customer: any;
    salesOrder: any;
    items: ChallanItem[];
    vehicleNo: string;
    driverName: string;
    transportMode: string;
    notes: string;
}

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const { isLoading, isSuccess, isError, message, challan } = useSelector((state: RootState) => state.deliveryChallan);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
    const [formData, setFormData] = useState<ChallanFormData>({
        // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
        challanNo: 'DC-' + Date.now(),
        challanDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customer: null,
        salesOrder: null,
        items: [],
        vehicleNo: '',
        driverName: '',
        transportMode: 'road',
        notes: ''
    });

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }

        if (isSuccess && challan) {
            toast.success('Delivery Challan created successfully!');

            // Reset Redux state BEFORE navigation
            dispatch(reset());

            // Reset form state
            setFormData({
                challanNo: 'DC-' + Date.now(),
                challanDate: new Date().toISOString().split('T')[0],
                deliveryDate: '',
                customer: null,
                salesOrder: null,
                items: [],
                vehicleNo: '',
                driverName: '',
                transportMode: 'road',
                notes: ''
            });

            // Navigate to detail page
            navigate(`/sales/delivery-challan/${challan._id}`);
        }
    }, [isError, isSuccess, message, challan, navigate, dispatch]);

    const handleSalesOrderSelect = (order: any) => {
        // Auto-populate customer and items from sales order
        const orderItems = order.items.map((item: any) => ({
            item: item.item._id || item.item,
            name: item.item.name || 'Unknown',
            sku: item.item.sku || '',
            quantity: item.quantity,
            deliveredQty: item.quantity - (item.deliveredQty || 0), // Remaining quantity
            unit: item.item.unit || 'pcs',
            description: '',
            availableStock: item.item.stock || 0,
            sellingPrice: item.rate
        }));

        setFormData({
            ...formData,
            customer: order.customer,
            salesOrder: order._id,
            items: orderItems,
            deliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ''
        });

        toast.success(`Loaded ${orderItems.length} items from Sales Order ${order.orderNumber}`);
    };

    const handleItemSelect = (item: any) => {
        const newItem = {
            item: item._id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            deliveredQty: item.quantity,
            unit: item.unit || 'pcs',
            description: '',
            availableStock: item.stockQty - (item.reservedStock || 0),
            sellingPrice: item.sellingPrice
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;

        // Validate deliveredQty doesn't exceed available stock
        if (field === 'deliveredQty') {
            const maxQty = newItems[index].availableStock;
            if (value > maxQty) {
                toast.warning(`Cannot deliver more than available stock (${maxQty})`);
                (newItems[index] as any)[field] = maxQty;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSave = () => {
        // Validation
        if (!formData.customer) {
            toast.error('Please select a customer');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        // Check all items have deliveredQty > 0
        const invalidItems = formData.items.filter(item => !item.deliveredQty || item.deliveredQty <= 0);
        if (invalidItems.length > 0) {
            toast.error('All items must have a delivered quantity greater than 0');
            return;
        }

        // Prepare data for API
        const challanData = {
            customerId: formData.customer._id,
            challanDate: formData.challanDate,
            deliveryDate: formData.deliveryDate || undefined,
            salesOrderId: formData.salesOrder || undefined,
            items: formData.items.map(item => ({
                item: item.item,
                quantity: item.quantity,
                deliveredQty: item.deliveredQty,
                unit: item.unit,
                description: item.description
            })),
            vehicleNo: formData.vehicleNo,
            driverName: formData.driverName,
            transportMode: formData.transportMode,
            notes: formData.notes
        };

        dispatch(createDeliveryChallan(challanData) as any);
    };

    const totalItems = formData.items.length;
    const totalQuantity = formData.items.reduce((sum: number, item: any) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <div className="page-shell">
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-app">
                {/* ERP Header Action Bar */}
                <div className="bg-card border-b border-default px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-main">Delivery Challan</h1>
                        <p className="text-xs text-secondary">Create and manage delivery documents</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sales/delivery-challan-list')}
                            className="px-4 py-1.5 text-sm font-bold text-secondary bg-card border border-default rounded-lg hover:bg-surface transition-all btn-interactive"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-6 py-1.5 text-sm font-bold text-white bg-primary border border-transparent rounded-lg shadow-lg shadow-primary/25 hover:bg-primary-hover focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center gap-2 transition-all btn-interactive"
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-main" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Saving...' : 'Save Challan'}
                        </button>
                    </div>
                </div>

                {/* Main Content Scrollable Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Top Section: Basic Info & Customer - ERP Grid Style */}
                        <div className="bg-card border border-default rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-surface px-4 py-2 border-b border-default flex justify-between items-center">
                                <h2 className="text-sm font-bold text-main uppercase tracking-wide">Document Details</h2>
                                <div className="text-xs text-secondary font-medium">
                                    {formData.salesOrder && <span className="bg-primary-soft text-primary px-2 py-0.5 rounded border border-primary/20">Linked to SO</span>}
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Column 1: Challan Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Challan No.</label>
                                        <input
                                            type="text"
                                            value={formData.challanNo}
                                            disabled
                                            className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-bold text-main focus:outline-none opacity-80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Challan Date <span className="text-rose-500">*</span></label>
                                        <input
                                            value={formData.challanDate}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, challanDate: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Column 2: Logistics Date */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Delivery Expected</label>
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Column 3 & 4: Customer Panel */}
                                <div className="md:col-span-2 border border-default rounded-xl bg-surface/30 p-4 relative group transition-all hover:bg-surface/50">
                                    <label className="block text-xs font-bold text-primary mb-3 uppercase tracking-wider">Customer</label>
                                    {formData.customer ? (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-main text-base">{formData.customer.name}</p>
                                                <p className="text-xs text-secondary mt-1 font-medium">{formData.customer.address?.line1}, {formData.customer.address?.city}</p>
                                                <div className="flex gap-3 mt-3 text-xs text-secondary font-medium">
                                                    <span>Ph: {formData.customer.phone}</span>
                                                    {formData.customer.email && <span>• {formData.customer.email}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFormData({ ...formData, customer: null, salesOrder: null, items: [] })}
                                                className="text-rose-600 hover:text-rose-700 text-xs font-bold border border-rose-200 bg-card px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all btn-interactive"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center gap-3 py-2">
                                            <p className="text-sm text-secondary font-medium">No customer selected</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setShowCustomerModal(true)}
                                                    className="px-4 py-2 bg-card border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary-soft shadow-sm transition-all btn-interactive"
                                                >
                                                    Find Customer
                                                </button>
                                                <span className="text-muted text-xs flex items-center font-bold">OR</span>
                                                <button
                                                    onClick={() => setShowSalesOrderModal(true)}
                                                    className="px-4 py-2 bg-primary border border-transparent text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all btn-interactive"
                                                >
                                                    Select from Sales Order
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Section - Dense Table */}
                        <div className="bg-card border border-default rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                            <div className="px-4 py-2 border-b border-default bg-surface flex justify-between items-center">
                                <h2 className="text-sm font-bold text-main uppercase tracking-wide">Items & Quantities</h2>
                                <button
                                    onClick={() => setShowItemModal(true)}
                                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all btn-interactive"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Item
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface border-b border-default">
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default w-12 text-center tracking-wider">#</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default tracking-wider">Item Details</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default w-24 text-right tracking-wider">Stock</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default w-32 text-right tracking-wider">Delivery Qty</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default w-20 tracking-wider">Unit</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase border-r border-default tracking-wider">Description</th>
                                            <th className="px-4 py-3 text-xs font-bold text-secondary uppercase w-16 text-center tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default">
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-16 text-center text-muted font-medium italic">
                                                    Start adding items to create the challan
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-surface transition-colors group">
                                                    <td className="px-4 py-3 text-xs text-secondary font-bold text-center border-r border-default bg-surface/30">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-default font-medium">
                                                        <p className="text-sm font-bold text-main">{item.name}</p>
                                                        {item.sku && <p className="text-[10px] text-muted font-bold mt-0.5 tracking-tight">SKU: {item.sku}</p>}
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-default text-right">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.availableStock > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20'
                                                            }`}>
                                                            {item.availableStock} in stock
                                                        </span>
                                                    </td>
                                                    <td className="px-4 text-right border-r border-default p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.availableStock}
                                                            value={item.deliveredQty}
                                                            onChange={(e) => updateItem(index, 'deliveredQty', parseFloat(e.target.value) || 0)}
                                                            className={`w-full text-right px-3 py-1.5 text-sm font-bold border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all ${!item.deliveredQty || item.deliveredQty <= 0 ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/10' : 'border-default bg-input'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-secondary font-bold border-r border-default">
                                                        {item.unit}
                                                    </td>
                                                    <td className="px-4 p-2 border-r border-default">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                            placeholder="Add remarks..."
                                                            className="w-full px-3 py-1.5 text-xs font-medium border border-transparent hover:border-default focus:border-primary rounded-lg focus:outline-none transition-all bg-transparent focus:bg-input text-main"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-muted hover:text-rose-600 transition-all p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                                            title="Remove Item"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {formData.items.length > 0 && (
                                        <tfoot className="bg-surface border-t border-default">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-xs font-bold text-right text-secondary uppercase border-r border-default tracking-wider">Totals:</td>
                                                <td className="px-4 py-3 text-sm text-right text-primary font-bold border-r border-default">{totalQuantity}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-secondary border-r border-default" colSpan={3}>
                                                    {totalItems} Item(s)
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Bottom Section: Transport & Logistics */}
                        <div className="bg-card border border-default rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-surface px-4 py-2 border-b border-default">
                                <h2 className="text-sm font-bold text-main uppercase tracking-wide">Transport & Notes</h2>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Transport Mode</label>
                                        <select
                                            value={formData.transportMode}
                                            onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        >
                                            <option value="road">Road</option>
                                            <option value="rail">Rail</option>
                                            <option value="air">Air</option>
                                            <option value="ship">Ship</option>
                                            <option value="courier">Courier</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Vehicle No.</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleNo}
                                            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                            placeholder="MH-01-AB-1234"
                                            className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Driver Name / Carrier</label>
                                        <input
                                            type="text"
                                            value={formData.driverName}
                                            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Additional Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-input border border-default rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                        placeholder="Enter any special instructions or remarks..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <CustomerSelectionModal
                    isOpen={showCustomerModal}
                    onClose={() => setShowCustomerModal(false)}
                    onSelect={(customer: any) => {
                        setFormData({ ...formData, customer });
                        setShowCustomerModal(false);
                    }}
                />

                <ItemSelectionModal
                    isOpen={showItemModal}
                    onClose={() => setShowItemModal(false)}
                    onSelect={handleItemSelect}
                />

                <SalesOrderSelectionModal
                    isOpen={showSalesOrderModal}
                    onClose={() => setShowSalesOrderModal(false)}
                    onSelect={handleSalesOrderSelect}
                />
            </div>
                  </div>

        </Layout>
    );
};

export default DeliveryChallan;

