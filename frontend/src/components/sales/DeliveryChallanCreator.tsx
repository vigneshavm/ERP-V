import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Truck, Search, Plus, Trash2, Save, Printer,
    Calendar, User, Package, AlertCircle, FileText, CheckCircle,
    MapPin, Box
} from 'lucide-react';
import { RootState } from '../../store';

// Types
interface SalesOrder {
    id: string;
    orderNo: string;
    date: string;
    customer: { id: string; name: string; phone: string };
    items: {
        id: string;
        productId: string;
        name: string;
        sku: string;
        orderedQty: number;
        deliveredQty: number;
        unit: string;
    }[];
}

interface ChallanItem {
    id: string;
    productId: string;
    name: string;
    sku: string;
    unit: string;
    orderedQty?: number;
    previouslyDeliveredQty?: number;
    currentDeliveryQty: number;
    stock: number;
}

interface InventoryProduct {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unit: string;
}

const DeliveryChallanCreator: React.FC = () => {
    // Get tenant, branch, and sector from auth state
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { products } = useSelector((state: RootState) => state.inventory);
    const { salesHistory } = useSelector((state: RootState) => state.pos);

    // Filter products by tenant, branch, and sector
    const availableInventory: InventoryProduct[] = useMemo(() => {
        return products
            .filter(p => {
                if (currentSector && p.sector !== currentSector) return false;
                if (currentBranch && currentBranch !== 'All' && p.branchId !== currentBranch) return false;
                return true;
            })
            .map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                stock: p.stock || 0,
                unit: 'pcs'
            }));
    }, [products, currentSector, currentBranch]);

    // Demo Sales Orders - would typically come from Redux/API
    const demoSalesOrders: SalesOrder[] = useMemo(() => {
        return salesHistory.slice(0, 5).map((s: any, idx: number) => ({
            id: s.id || `SO${idx}`,
            orderNo: `SO-${new Date().getFullYear()}-${String(idx + 1).padStart(5, '0')}`,
            date: s.date || new Date().toISOString().split('T')[0],
            customer: { id: s.customerId || 'C001', name: s.customerName || 'Customer', phone: '' },
            items: (s.items || []).map((item: any, itemIdx: number) => ({
                id: `I${itemIdx}`,
                productId: item.id || item.sku,
                name: item.name,
                sku: item.sku,
                orderedQty: item.qty || 1,
                deliveredQty: 0,
                unit: 'pcs'
            }))
        }));
    }, [salesHistory]);

    // Generate Challan No
    const [challanNo] = useState(`DC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`);

    // State
    const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

    const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
    const [customer, setCustomer] = useState<{ name: string; phone: string } | null>(null);
    const [items, setItems] = useState<ChallanItem[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Transport Details
    const [transportMode, setTransportMode] = useState('Road');
    const [vehicleNo, setVehicleNo] = useState('');
    const [driverName, setDriverName] = useState('');
    const [notes, setNotes] = useState('');

    // Handle SO Selection
    const handleSelectSO = (so: SalesOrder) => {
        setSelectedSO(so);
        setCustomer(so.customer);

        // Auto-populate items with pending quantities
        const newItems = so.items.map(item => {
            const product = availableInventory.find(p => p.id === item.productId || p.sku === item.sku);
            const pendingQty = item.orderedQty - item.deliveredQty;
            return {
                id: `CI-${Date.now()}-${item.id}`,
                productId: item.productId,
                name: item.name,
                sku: item.sku,
                unit: item.unit,
                orderedQty: item.orderedQty,
                previouslyDeliveredQty: item.deliveredQty,
                currentDeliveryQty: pendingQty,
                stock: product?.stock || 0
            };
        });
        setItems(newItems);
        setSearchQuery('');
        setShowSearchDropdown(false);
    };

    // Add Manual Item
    const addManualItem = (product: InventoryProduct) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, currentDeliveryQty: i.currentDeliveryQty + 1 } : i);
            }
            return [...prev, {
                id: `CI-${Date.now()}`,
                productId: product.id,
                name: product.name,
                sku: product.sku,
                unit: product.unit,
                currentDeliveryQty: 1,
                stock: product.stock
            }];
        });
        setSearchQuery('');
        setShowSearchDropdown(false);
    };

    // Update Qty
    const updateQty = (id: string, qty: number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, currentDeliveryQty: qty };
        }));
    };

    // Remove Item
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    // Summary
    const totalItems = items.length;
    const totalQty = items.reduce((sum, i) => sum + i.currentDeliveryQty, 0);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="w-6 h-6 text-brand-600" />
                        Delivery Challan
                    </h1>
                    <p className="text-sm text-neutral-500">Create delivery notes for goods dispatch</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button className="btn btn-primary" disabled={items.length === 0}>
                        <Save className="w-4 h-4" /> Save Challan
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer & Order Link */}
                    <div className="lg:col-span-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-sm text-neutral-500 uppercase flex items-center gap-2">
                                <User className="w-4 h-4" /> Customer & Order
                            </h3>
                            {selectedSO && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Linked to {selectedSO.orderNo}
                                </span>
                            )}
                        </div>

                        {!customer ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Sales Order or Manual Customer..."
                                        className="input pl-10"
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                                        onFocus={() => setShowSearchDropdown(true)}
                                    />
                                    {showSearchDropdown && searchQuery && (
                                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 z-20 max-h-60 overflow-auto">
                                            {/* Sales Order Matches */}
                                            <div className="p-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-800">Sales Orders</div>
                                            {demoSalesOrders.filter(so =>
                                                so.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                so.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).map(so => (
                                                <button
                                                    key={so.id}
                                                    onClick={() => handleSelectSO(so)}
                                                    className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                                >
                                                    <div className="font-medium flex justify-between">
                                                        <span>{so.orderNo}</span>
                                                        <span className="text-xs text-neutral-500">{so.date}</span>
                                                    </div>
                                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">{so.customer.name}</div>
                                                </button>
                                            ))}

                                            {/* Manual Customer Option */}
                                            <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                                                <button
                                                    onClick={() => {
                                                        setCustomer({ name: searchQuery, phone: '' });
                                                        setShowSearchDropdown(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-brand-600 text-sm font-medium"
                                                >
                                                    + Use "{searchQuery}" as Manual Customer
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-neutral-400">
                                    Tip: Search for "SO" to see pending orders.
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xl font-bold">{customer.name}</div>
                                    <div className="text-neutral-500">{customer.phone || 'No phone'}</div>
                                </div>
                                <button onClick={() => { setCustomer(null); setSelectedSO(null); setItems([]); }} className="text-sm text-red-500 hover:underline">
                                    Change
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Challan Info */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50">
                        <h3 className="font-bold text-sm text-neutral-500 uppercase mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Challan Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Challan No</label>
                                <div className="font-mono font-bold text-lg">{challanNo}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 mb-1 block">Challan Date</label>
                                    <input
                                        type="date"
                                        className="input text-sm"
                                        value={challanDate}
                                        onChange={e => setChallanDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 mb-1 block">Delivery Date</label>
                                    <input
                                        type="date"
                                        className="input text-sm"
                                        value={deliveryDate}
                                        onChange={e => setDeliveryDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Package className="w-5 h-5" /> Items to Dispatch
                        </h2>
                    </div>

                    {/* Quick Add Item (Manual) */}
                    {!selectedSO && (
                        <div className="relative max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search inventory to add manual items..."
                                className="input pl-10"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                                onFocus={() => setShowSearchDropdown(true)}
                            />
                            {showSearchDropdown && searchQuery && !selectedSO && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 z-20 max-h-60 overflow-auto">
                                    {availableInventory.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addManualItem(p)}
                                            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0 flex justify-between"
                                        >
                                            <span>{p.name}</span>
                                            <span className="text-xs text-neutral-500">{p.sku}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                            <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                            <p className="text-neutral-500">No items added.</p>
                            <p className="text-sm text-neutral-400">Select a Sales Order or add items manually.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
                                    <tr>
                                        <th className="p-4 font-bold text-neutral-500">Product</th>
                                        <th className="p-4 font-bold text-neutral-500 w-24 text-center">Unit</th>
                                        {selectedSO && (
                                            <>
                                                <th className="p-4 font-bold text-neutral-500 w-24 text-center">Ordered</th>
                                                <th className="p-4 font-bold text-neutral-500 w-24 text-center">Delivered</th>
                                            </>
                                        )}
                                        <th className="p-4 font-bold text-neutral-500 w-32 text-center text-brand-600">Dispatch Qty</th>
                                        <th className="p-4 font-bold text-neutral-500 w-24 text-right">Stock</th>
                                        <th className="p-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {items.map(item => {
                                        const pendingQty = item.orderedQty ? item.orderedQty - (item.previouslyDeliveredQty || 0) : Infinity;
                                        const isOverDelivery = item.currentDeliveryQty > pendingQty;
                                        const isOutOfStock = item.currentDeliveryQty > item.stock;

                                        return (
                                            <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                <td className="p-4">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-neutral-500">{item.sku}</div>
                                                    {(isOverDelivery || isOutOfStock) && (
                                                        <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {isOverDelivery ? 'Exceeds Order' : 'Exceeds Stock'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center text-neutral-500">{item.unit}</td>
                                                {selectedSO && (
                                                    <>
                                                        <td className="p-4 text-center">{item.orderedQty}</td>
                                                        <td className="p-4 text-center text-green-600">{item.previouslyDeliveredQty}</td>
                                                    </>
                                                )}
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={item.currentDeliveryQty}
                                                        onChange={e => updateQty(item.id, parseInt(e.target.value) || 0)}
                                                        className={`input w-full text-center font-bold ${isOverDelivery || isOutOfStock ? 'border-red-500 text-red-600' : 'border-brand-500 text-brand-600'}`}
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={item.stock < item.currentDeliveryQty ? 'text-red-500 font-bold' : 'text-neutral-500'}>
                                                        {item.stock}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Transport & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50">
                        <h3 className="font-bold text-sm text-neutral-500 uppercase mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Transport Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Mode</label>
                                <select
                                    className="select w-full"
                                    value={transportMode}
                                    onChange={e => setTransportMode(e.target.value)}
                                >
                                    <option>Road</option>
                                    <option>Courier</option>
                                    <option>Pickup</option>
                                    <option>Third-party Logistics</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Vehicle No</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. TN-01-AB-1234"
                                    value={vehicleNo}
                                    onChange={e => setVehicleNo(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Driver Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Driver Name"
                                    value={driverName}
                                    onChange={e => setDriverName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="font-bold text-sm text-neutral-500 mb-2 block">Delivery Notes</label>
                            <textarea
                                className="input w-full min-h-[100px]"
                                placeholder="Add notes for the delivery team..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <div className="text-sm text-neutral-500">Total Items</div>
                                <div className="text-xl font-bold">{totalItems}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-neutral-500">Total Quantity</div>
                                <div className="text-xl font-bold text-brand-600">{totalQty}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryChallanCreator;
