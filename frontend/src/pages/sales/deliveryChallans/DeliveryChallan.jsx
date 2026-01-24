import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from '../../../components/Layout';
import PageHeader from '../../../components/PageHeader';
import FormInput from '../../../components/FormInput';
import CustomerSelectionModal from '../../../components/CustomerSelectionModal';
import ItemSelectionModal from '../../../components/ItemSelectionModal';
import SalesOrderSelectionModal from '../../../components/SalesOrderSelectionModal';
import { createDeliveryChallan, reset } from '../../../redux/slices/deliveryChallanSlice';

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading, isSuccess, isError, message, challan } = useSelector(state => state.deliveryChallan);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
    const [formData, setFormData] = useState({
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

    const handleSalesOrderSelect = (order) => {
        // Auto-populate customer and items from sales order
        const orderItems = order.items.map(item => ({
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

    const handleItemSelect = (item) => {
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

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Validate deliveredQty doesn't exceed available stock
        if (field === 'deliveredQty') {
            const maxQty = newItems[index].availableStock;
            if (value > maxQty) {
                toast.warning(`Cannot deliver more than available stock (${maxQty})`);
                newItems[index][field] = maxQty;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
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

        dispatch(createDeliveryChallan(challanData));
    };

    const totalItems = formData.items.length;
    const totalQuantity = formData.items.reduce((sum, item) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-50">
                {/* ERP Header Action Bar */}
                <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Delivery Challan</h1>
                        <p className="text-xs text-slate-500">Create and manage delivery documents</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sales/delivery-challan-list')}
                            className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-6 py-1.5 text-sm font-medium text-white bg-indigo-700 border border-transparent rounded shadow-sm hover:bg-indigo-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        <div className="bg-white border rounded shadow-sm overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Document Details</h2>
                                <div className="text-xs text-slate-500">
                                    {formData.salesOrder && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">Linked to SO</span>}
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Column 1: Challan Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Challan No.</label>
                                        <input
                                            type="text"
                                            value={formData.challanNo}
                                            disabled
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-sm font-medium text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Challan Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={formData.challanDate}
                                            onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Column 2: Logistics Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Delivery Expected</label>
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Column 3 & 4: Customer Panel */}
                                <div className="md:col-span-2 border rounded bg-slate-50/50 p-3 relative group">
                                    <label className="block text-xs font-bold text-indigo-700 mb-2 uppercase">Customer</label>
                                    {formData.customer ? (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{formData.customer.name}</p>
                                                <p className="text-xs text-slate-600 mt-1">{formData.customer.address?.line1}, {formData.customer.address?.city}</p>
                                                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                                                    <span>Ph: {formData.customer.phone}</span>
                                                    {formData.customer.email && <span>• {formData.customer.email}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFormData({ ...formData, customer: null, salesOrder: null, items: [] })}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 bg-white px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center gap-2 py-2">
                                            <p className="text-sm text-slate-500">No customer selected</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowCustomerModal(true)}
                                                    className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-50 shadow-sm"
                                                >
                                                    Find Customer
                                                </button>
                                                <span className="text-slate-400 text-xs flex items-center">or</span>
                                                <button
                                                    onClick={() => setShowSalesOrderModal(true)}
                                                    className="px-3 py-1.5 bg-indigo-600 border border-transparent text-white text-xs font-medium rounded hover:bg-indigo-700 shadow-sm"
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
                        <div className="bg-white border rounded shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                            <div className="px-4 py-2 border-b bg-slate-100 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Items & Quantities</h2>
                                <button
                                    onClick={() => setShowItemModal(true)}
                                    className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 flex items-center gap-1 shadow-sm"
                                >
                                    <span className="text-lg leading-none">+</span> Add Item
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200 w-12 text-center">#</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">Item Details</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200 w-24 text-right">Stock</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200 w-32 text-right">Delivery Qty</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200 w-20">Unit</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">Description / Remarks</th>
                                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase w-16 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center text-slate-400 text-sm">
                                                    Start adding items to create the challan
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50 group">
                                                    <td className="px-4 py-2 text-xs text-slate-500 text-center border-r border-slate-200 bg-slate-50/30">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-slate-200">
                                                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                                        {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-slate-200 text-right">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.availableStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.availableStock}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 text-right border-r border-slate-200 p-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.availableStock}
                                                            value={item.deliveredQty}
                                                            onChange={(e) => updateItem(index, 'deliveredQty', parseFloat(e.target.value) || 0)}
                                                            className={`w-full text-right px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none ${!item.deliveredQty || item.deliveredQty <= 0 ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-xs text-slate-600 border-r border-slate-200">
                                                        {item.unit}
                                                    </td>
                                                    <td className="px-4 p-1 border-r border-slate-200">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                            placeholder="Add remarks..."
                                                            className="w-full px-2 py-1 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-400 rounded focus:outline-none transition-colors bg-transparent focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                            title="Remove Item"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {formData.items.length > 0 && (
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-2 text-xs text-right text-slate-600 uppercase border-r border-slate-200">Totals:</td>
                                                <td className="px-4 py-2 text-sm text-right text-indigo-700 border-r border-slate-200">{totalQuantity}</td>
                                                <td className="px-4 py-2 text-xs text-slate-600 border-r border-slate-200" colSpan="3">
                                                    {totalItems} Item(s)
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Bottom Section: Transport & Logistics */}
                        <div className="bg-white border rounded shadow-sm overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 border-b">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Transport & Notes</h2>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Transport Mode</label>
                                        <select
                                            value={formData.transportMode}
                                            onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="road">Road</option>
                                            <option value="rail">Rail</option>
                                            <option value="air">Air</option>
                                            <option value="ship">Ship</option>
                                            <option value="courier">Courier</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle No.</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleNo}
                                            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                            placeholder="MH-01-AB-1234"
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Driver Name / Carrier</label>
                                        <input
                                            type="text"
                                            value={formData.driverName}
                                            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Additional Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="4"
                                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
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
                    onSelect={(customer) => {
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
        </Layout>
    );
};

export default DeliveryChallan;
