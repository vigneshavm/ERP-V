import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    FileText, Search, Plus, Trash2, Printer, Mail, MessageCircle,
    Calendar, User, Phone, MapPin, Building2, Hash, ChevronDown,
    CheckCircle, Clock, XCircle, ArrowRight, Save, RefreshCw
} from 'lucide-react';
import { RootState } from '../../store';
import { useFilteredProducts, useFilteredCustomers, searchProducts, searchCustomers, FilteredProduct } from '../../utils/tenantFilters';

// Types
interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string;
}

interface CartItem {
    id: string;
    name: string;
    sku: string;
    qty: number;
    rate: number;
    discount: number;
    taxRate: number;
    amount: number;
}

interface Estimate {
    id: string;
    estimateNo: string;
    date: string;
    validUntil: string;
    customer: Customer | null;
    items: CartItem[];
    notes: string;
    terms: string;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
    createdBy: string;
    createdAt: string;
    convertedToInvoice?: string;
}

const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    EXPIRED: { label: 'Expired', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    CONVERTED: { label: 'Converted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const EstimateCreator: React.FC = () => {
    // Use reusable tenant filter hooks
    const availableProducts = useFilteredProducts({ includeOutOfStock: true });
    const tenantCustomers = useFilteredCustomers();

    // Map customers to local format
    const availableCustomers: Customer[] = useMemo(() => {
        return tenantCustomers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email
        }));
    }, [tenantCustomers]);

    // Generate estimate number
    const generateEstimateNo = () => `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;

    // State
    const [estimateNo] = useState(generateEstimateNo);
    const [estimateDate, setEstimateDate] = useState(new Date().toISOString().split('T')[0]);
    const [validUntil, setValidUntil] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        return d.toISOString().split('T')[0];
    });

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '' });

    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('1. Prices valid for 15 days.\n2. GST extra as applicable.\n3. Delivery within 3-5 business days.');

    const [status, setStatus] = useState<Estimate['status']>('DRAFT');

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return availableCustomers;
        const q = customerSearch.toLowerCase();
        return availableCustomers.filter(c =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q)
        );
    }, [customerSearch, availableCustomers]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        if (!productSearch) return availableProducts;
        const q = productSearch.toLowerCase();
        return availableProducts.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        );
    }, [productSearch, availableProducts]);

    // Add product to cart
    const addToCart = (product: { id: string; name: string; sku: string; price: number; taxRate: number }) => {
        const existing = cartItems.find(i => i.id === product.id);
        if (existing) {
            setCartItems(items => items.map(i =>
                i.id === product.id
                    ? { ...i, qty: i.qty + 1, amount: (i.qty + 1) * i.rate * (1 - i.discount / 100) }
                    : i
            ));
        } else {
            const newItem: CartItem = {
                id: product.id,
                name: product.name,
                sku: product.sku,
                qty: 1,
                rate: product.price,
                discount: 0,
                taxRate: product.taxRate,
                amount: product.price
            };
            setCartItems([...cartItems, newItem]);
        }
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Update cart item
    const updateCartItem = (id: string, field: keyof CartItem, value: number) => {
        setCartItems(items => items.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            updated.amount = updated.qty * updated.rate * (1 - updated.discount / 100);
            return updated;
        }));
    };

    // Remove from cart
    const removeFromCart = (id: string) => {
        setCartItems(items => items.filter(i => i.id !== id));
    };

    // Summary calculations
    const summary = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const totalDiscount = cartItems.reduce((sum, item) => sum + (item.qty * item.rate * item.discount / 100), 0);
        const taxableAmount = subtotal - totalDiscount;
        const cgst = taxableAmount * 0.09;
        const sgst = taxableAmount * 0.09;
        const total = taxableAmount + cgst + sgst;
        const roundOff = Math.round(total) - total;

        return { subtotal, totalDiscount, taxableAmount, cgst, sgst, total: Math.round(total), roundOff };
    }, [cartItems]);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    // Add new customer
    const handleAddCustomer = () => {
        if (newCustomer.name && newCustomer.phone) {
            const c: Customer = {
                id: `C${Date.now()}`,
                name: newCustomer.name,
                phone: newCustomer.phone,
                email: newCustomer.email,
                address: newCustomer.address,
                gstin: newCustomer.gstin
            };
            setCustomer(c);
            setShowNewCustomer(false);
            setNewCustomer({ name: '', phone: '' });
        }
    };

    // Clear all
    const handleClear = () => {
        setCartItems([]);
        setCustomer(null);
        setNotes('');
        setStatus('DRAFT');
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-600" />
                            <span className="font-bold text-lg">{estimateNo}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig[status].color}`}>
                            {statusConfig[status].label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={estimateDate}
                                onChange={e => setEstimateDate(e.target.value)}
                                className="input text-sm w-36"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Valid Until:</span>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                                className="input text-sm w-36"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Customer Section */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer
                        </h3>
                        {customer && (
                            <button onClick={() => setCustomer(null)} className="text-xs text-red-500 hover:underline">
                                Change
                            </button>
                        )}
                    </div>

                    {customer ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                                <span className="text-xs text-neutral-500">Name</span>
                                <p className="font-medium">{customer.name}</p>
                            </div>
                            <div>
                                <span className="text-xs text-neutral-500">Phone</span>
                                <p className="font-medium">{customer.phone}</p>
                            </div>
                            {customer.email && (
                                <div>
                                    <span className="text-xs text-neutral-500">Email</span>
                                    <p className="font-medium">{customer.email}</p>
                                </div>
                            )}
                            {customer.gstin && (
                                <div>
                                    <span className="text-xs text-neutral-500">GSTIN</span>
                                    <p className="font-medium">{customer.gstin}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="input pl-10"
                                    />
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 max-h-48 overflow-auto z-20">
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { setCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                                                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center"
                                                >
                                                    <span className="font-medium">{c.name}</span>
                                                    <span className="text-xs text-neutral-500">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setCustomer({ id: 'WALKIN', name: 'Walk-in Customer', phone: '' }); }}
                                    className="btn btn-secondary"
                                >
                                    Walk-in
                                </button>
                                <button
                                    onClick={() => setShowNewCustomer(!showNewCustomer)}
                                    className="btn btn-primary"
                                >
                                    <Plus className="w-4 h-4" /> New
                                </button>
                            </div>

                            {showNewCustomer && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <input placeholder="Name *" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="input" />
                                    <input placeholder="Phone *" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="input" />
                                    <input placeholder="Email" value={newCustomer.email || ''} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="input" />
                                    <input placeholder="GSTIN" value={newCustomer.gstin || ''} onChange={e => setNewCustomer({ ...newCustomer, gstin: e.target.value })} className="input" />
                                    <button onClick={handleAddCustomer} className="btn btn-primary">Add</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Product Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search products by name, SKU, or barcode..."
                        value={productSearch}
                        onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="input pl-10"
                    />
                    {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 max-h-60 overflow-auto z-20">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                >
                                    <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-neutral-500">{p.sku}</p>
                                    </div>
                                    <span className="font-bold text-brand-600">{formatCurrency(p.price)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Grid */}
                {cartItems.length > 0 ? (
                    <div className="overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800">
                                <tr className="text-left text-xs font-bold text-neutral-500 uppercase">
                                    <th className="p-3">Item</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3 w-20">Qty</th>
                                    <th className="p-3 w-28">Rate</th>
                                    <th className="p-3 w-20">Disc %</th>
                                    <th className="p-3">Tax</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {cartItems.map(item => (
                                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 text-neutral-500">{item.sku}</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={e => updateCartItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                                className="input text-center w-16"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.rate}
                                                onChange={e => updateCartItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                className="input text-right w-24"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.discount}
                                                onChange={e => updateCartItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                className="input text-center w-16"
                                            />
                                        </td>
                                        <td className="p-3 text-neutral-500">{item.taxRate}%</td>
                                        <td className="p-3 text-right font-bold">{formatCurrency(item.amount)}</td>
                                        <td className="p-3">
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-neutral-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Add products to create estimate</p>
                    </div>
                )}

                {/* Summary & Notes */}
                {cartItems.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Notes & Terms */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Customer Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any special instructions..."
                                    className="input min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1 block">Terms & Conditions</label>
                                <textarea
                                    value={terms}
                                    onChange={e => setTerms(e.target.value)}
                                    className="input min-h-[80px] text-xs"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span>{formatCurrency(summary.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Item Discounts</span>
                                <span>-{formatCurrency(summary.totalDiscount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Taxable Amount</span>
                                <span>{formatCurrency(summary.taxableAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>CGST (9%)</span>
                                <span>{formatCurrency(summary.cgst)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>SGST (9%)</span>
                                <span>{formatCurrency(summary.sgst)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>Round Off</span>
                                <span>{summary.roundOff >= 0 ? '+' : ''}{summary.roundOff.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Estimated Total</span>
                                    <span className="text-brand-600">{formatCurrency(summary.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-3 justify-between">
                <div className="flex gap-2">
                    <button onClick={handleClear} className="btn btn-ghost text-red-500">
                        <RefreshCw className="w-4 h-4" /> Clear
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary">
                        <Printer className="w-4 h-4" /> Print / PDF
                    </button>
                    <button className="btn btn-secondary">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button className="btn btn-secondary">
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button className="btn btn-primary">
                        <Save className="w-4 h-4" /> Save Estimate
                    </button>
                    <button className="btn btn-primary bg-emerald-600 hover:bg-emerald-700" disabled={cartItems.length === 0}>
                        <ArrowRight className="w-4 h-4" /> Convert to Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EstimateCreator;
