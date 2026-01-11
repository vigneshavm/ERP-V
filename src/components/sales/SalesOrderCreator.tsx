import React, { useState, useMemo } from 'react';
import {
    ShoppingCart, Search, Plus, Trash2, Save, CheckCircle,
    Calendar, User, Package, ChevronLeft, Clock, AlertTriangle,
    ArrowRight, FileText
} from 'lucide-react';

// Types
interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    loyaltyPoints: number;
    outstandingBalance: number;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
    taxRate: number;
}

interface OrderItem {
    id: string;
    productId: string;
    name: string;
    sku: string;
    qty: number;
    price: number;
    discount: number;
    taxRate: number;
    amount: number;
}

// Demo Data
const demoCustomers: Customer[] = [
    { id: 'C001', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', loyaltyPoints: 150, outstandingBalance: 45000 },
    { id: 'C002', name: 'Priya Sharma', phone: '9876543211', email: 'priya@example.com', loyaltyPoints: 50, outstandingBalance: 12500 },
];

const demoProducts: Product[] = [
    { id: 'P001', name: 'Samsung Galaxy A54', sku: 'SAM-A54-128', price: 32999, stock: 15, category: 'Mobiles', taxRate: 18 },
    { id: 'P002', name: 'iPhone 15 Pro Max', sku: 'APP-15PM-256', price: 159900, stock: 5, category: 'Mobiles', taxRate: 18 },
    { id: 'P003', name: 'Sony WH-1000XM5', sku: 'SNY-WH5', price: 29990, stock: 0, category: 'Audio', taxRate: 18 }, // Out of stock
];

const SalesOrderCreator: React.FC = () => {
    // Generate Order No
    const [orderNo] = useState(`SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`);

    // State
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
    });

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [items, setItems] = useState<OrderItem[]>([]);

    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED' | 'DELIVERED'>('DRAFT');

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return demoCustomers;
        const q = customerSearch.toLowerCase();
        return demoCustomers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }, [customerSearch]);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!productSearch) return demoProducts;
        const q = productSearch.toLowerCase();
        return demoProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }, [productSearch]);

    // Add Item
    const addItem = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? {
                    ...i,
                    qty: i.qty + 1,
                    amount: (i.qty + 1) * i.price * (1 - i.discount / 100)
                } : i);
            }
            return [...prev, {
                id: `Item${Date.now()}`,
                productId: product.id,
                name: product.name,
                sku: product.sku,
                qty: 1,
                price: product.price,
                discount: 0,
                taxRate: product.taxRate,
                amount: product.price
            }];
        });
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Update Item
    const updateItem = (id: string, field: keyof OrderItem, value: number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            updated.amount = updated.qty * updated.price * (1 - updated.discount / 100);
            return updated;
        }));
    };

    // Remove Item
    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    // Summary Calculations
    const summary = useMemo(() => {
        const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
        const totalDiscount = items.reduce((sum, i) => sum + (i.qty * i.price * i.discount / 100), 0);
        const taxable = subtotal - totalDiscount;
        const tax = taxable * 0.18; // Simplified 18% tax for demo
        const total = taxable + tax;

        return { subtotal, totalDiscount, tax, total };
    }, [items]);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-brand-600" />
                        Sales Order
                    </h1>
                    <p className="text-sm text-neutral-500">Create and manage sales orders</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary">
                        <FileText className="w-4 h-4" /> View Orders
                    </button>
                    {status === 'DRAFT' && (
                        <>
                            <button className="btn btn-secondary">
                                <Save className="w-4 h-4" /> Save as Draft
                            </button>
                            <button
                                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setStatus('CONFIRMED')}
                                disabled={items.length === 0}
                            >
                                <CheckCircle className="w-4 h-4" /> Confirm Order
                            </button>
                        </>
                    )}
                    {status === 'CONFIRMED' && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5" /> Order Confirmed
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Order Details & Customer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50">
                        <h3 className="font-bold text-sm text-neutral-500 uppercase mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer Details
                        </h3>

                        {!customer ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search customer by name, phone, or email..."
                                    className="input pl-10"
                                    value={customerSearch}
                                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && filteredCustomers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 z-20">
                                        {filteredCustomers.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setCustomer(c); setShowCustomerDropdown(false); }}
                                                className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                            >
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-xs text-neutral-500">{c.phone}</div>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => {
                                                setCustomer({ id: 'WALKIN', name: 'Walk-in Customer', phone: '', loyaltyPoints: 0, outstandingBalance: 0 });
                                                setShowCustomerDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-600 font-medium"
                                        >
                                            + Walk-in Customer
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xl font-bold">{customer.name}</div>
                                    <div className="text-neutral-500">{customer.phone}</div>
                                    {customer.email && <div className="text-sm text-neutral-500">{customer.email}</div>}
                                </div>
                                <div className="text-right space-y-2">
                                    <button onClick={() => setCustomer(null)} className="text-sm text-red-500 hover:underline block ml-auto">
                                        Change
                                    </button>
                                    <div className="flex gap-3">
                                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded text-xs font-bold">
                                            Pts: {customer.loyaltyPoints}
                                        </div>
                                        {customer.outstandingBalance > 0 && (
                                            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded text-xs font-bold">
                                                Due: {formatCurrency(customer.outstandingBalance)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50">
                        <h3 className="font-bold text-sm text-neutral-500 uppercase mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Order Info
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Order #</label>
                                <div className="font-mono font-bold text-lg">{orderNo}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 mb-1 block">Order Date</label>
                                    <input
                                        type="date"
                                        className="input text-sm"
                                        value={orderDate}
                                        onChange={e => setOrderDate(e.target.value)}
                                        disabled={status !== 'DRAFT'}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 mb-1 block">Delivery Date</label>
                                    <input
                                        type="date"
                                        className="input text-sm"
                                        value={deliveryDate}
                                        onChange={e => setDeliveryDate(e.target.value)}
                                        disabled={status !== 'DRAFT'}
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
                            <Package className="w-5 h-5" /> Items
                        </h2>
                    </div>

                    {status === 'DRAFT' && (
                        <div className="relative max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search inventory by name, SKU, or category..."
                                className="input pl-10"
                                value={productSearch}
                                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                onFocus={() => setShowProductDropdown(true)}
                            />
                            {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 z-20 max-h-60 overflow-auto">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0 flex justify-between items-center"
                                            disabled={p.stock === 0}
                                        >
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-xs text-neutral-500">SKU: {p.sku} • {p.category}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">{formatCurrency(p.price)}</div>
                                                <div className={`text-xs ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                                                </div>
                                            </div>
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
                            <p className="text-sm text-neutral-400">Search for products above to add them to the order.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800 text-left">
                                    <tr>
                                        <th className="p-4 font-bold text-neutral-500">Product</th>
                                        <th className="p-4 font-bold text-neutral-500 w-24">Qty</th>
                                        <th className="p-4 font-bold text-neutral-500 w-32 text-right">Price</th>
                                        <th className="p-4 font-bold text-neutral-500 w-24 text-center">Disc %</th>
                                        <th className="p-4 font-bold text-neutral-500 w-24 text-center">Tax %</th>
                                        <th className="p-4 font-bold text-neutral-500 w-32 text-right">Amount</th>
                                        {status === 'DRAFT' && <th className="p-4 w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <td className="p-4">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-neutral-500">{item.sku}</div>
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                                    className="input w-full text-center"
                                                    min="1"
                                                    disabled={status !== 'DRAFT'}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className="input w-full text-right"
                                                    min="0"
                                                    disabled={status !== 'DRAFT'}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    value={item.discount}
                                                    onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                    className="input w-full text-center"
                                                    min="0"
                                                    disabled={status !== 'DRAFT'}
                                                />
                                            </td>
                                            <td className="p-4 text-center text-neutral-500">
                                                {item.taxRate}%
                                            </td>
                                            <td className="p-4 text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            {status === 'DRAFT' && (
                                                <td className="p-4 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Section: Notes & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div>
                        <label className="font-bold text-sm text-neutral-500 mb-2 block">Order Notes</label>
                        <textarea
                            className="input w-full min-h-[120px]"
                            placeholder="Add notes about delivery, packaging, etc..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={status !== 'DRAFT'}
                        ></textarea>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/50 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Subtotal</span>
                            <span className="font-medium">{formatCurrency(summary.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Item Discount</span>
                            <span>-{formatCurrency(summary.totalDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Tax</span>
                            <span className="font-medium">{formatCurrency(summary.tax)}</span>
                        </div>
                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between items-center">
                            <span className="font-bold text-lg">Grand Total</span>
                            <span className="font-bold text-2xl text-brand-600">{formatCurrency(summary.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOrderCreator;
