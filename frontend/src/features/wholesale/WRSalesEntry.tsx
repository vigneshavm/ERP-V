import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Trash2, Save, Loader2, Building2, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';
import { RootState } from '../../redux/store';
import { getAllCustomers } from '../../redux/slices/customerSlice';
import { getAllItems } from '../../redux/slices/inventorySlice';
import { buildPosInvoicePayload } from '../../services/posInvoiceMapper';
import { Sale } from '../../types/sales';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface WRCartRow {
    id: string; // temp row id
    productId?: string;
    name: string;
    sku?: string;
    brand?: string;
    design?: string;
    unit?: string;
    qty: number;
    price: number; // defaults to the product's wholesaleRate
    gstPercentage: number;
}

const emptyRow = (): WRCartRow => ({
    id: Math.random().toString(36).slice(2, 10),
    name: '',
    qty: 1,
    price: 0,
    gstPercentage: 0
});

/**
 * Wholesale/Retail (WR) Billing: wholesale sales entry.
 *
 * Deliberately posts to the SAME endpoint POS checkout uses (POST /api/pos/invoice ->
 * PosController.createInvoice) with saleChannel: 'WHOLESALE', instead of a parallel
 * sale-creation path -- that one function already owns stock deduction (FIFO batches +
 * StockLog), the tenant's discount policy, customer dues/loyalty, and cashbank posting, and
 * duplicating ~300 lines of that to get a "WR sale model" would only let the two drift apart.
 * What's actually WR-specific here is the item grid (brand/design, defaulting to each item's
 * wholesaleRate instead of sellingPrice) and the counter/invoice-series tagging.
 */
const WRSalesEntry: React.FC = () => {
    const dispatch = useDispatch<any>();
    const [searchParams] = useSearchParams();
    const counterName = searchParams.get('counterName') || '';

    const { customers } = useSelector((state: RootState) => state.customers);
    const { items: products } = useSelector((state: RootState) => state.inventory);

    const [customerSearch, setCustomerSearch] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [rows, setRows] = useState<WRCartRow[]>([emptyRow()]);
    const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
    const [isSaving, setIsSaving] = useState(false);

    // Run once on mount only -- same guarded-fetch-if-empty pattern PurchaseEntry.tsx uses for
    // suppliers/products.
    useEffect(() => {
        if (!customers || customers.length === 0) dispatch(getAllCustomers());
        if (!products || products.length === 0) dispatch(getAllItems());
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateRow = (idx: number, patch: Partial<WRCartRow>) => {
        setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const selectProduct = (idx: number, product: any) => {
        updateRow(idx, {
            productId: product.id || product._id,
            name: product.name,
            sku: product.sku,
            brand: product.brand,
            design: product.design,
            unit: product.unit,
            // Wholesale rate first -- falls back to sellingPrice/price if the item was never
            // given one (see Item.wholesaleRate / ProductModal.tsx).
            price: product.wholesaleRate ?? product.sellingPrice ?? product.price ?? 0,
            gstPercentage: product.gstPercentage ?? 0
        });
        setActiveSearchRow(null);
    };

    const filteredProducts = (query: string) => {
        const q = query.trim().toLowerCase();
        if (!q) return products.slice(0, 20);
        return products.filter((p: any) =>
            p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
        ).slice(0, 20);
    };

    const addRow = () => setRows(prev => [...prev, emptyRow()]);
    const removeRow = (idx: number) => setRows(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const { subtotal, taxTotal, grandTotal } = useMemo(() => {
        let sub = 0;
        let tax = 0;
        rows.forEach(r => {
            const lineBase = (r.qty || 0) * (r.price || 0);
            sub += lineBase;
            tax += (lineBase * (r.gstPercentage || 0)) / 100;
        });
        return { subtotal: sub, taxTotal: tax, grandTotal: sub + tax - discountAmount };
    }, [rows, discountAmount]);

    const resetForm = () => {
        setRows([emptyRow()]);
        setCustomerId('');
        setCustomerName('');
        setCustomerSearch('');
        setDiscountAmount(0);
        setPaymentMethod('CASH');
    };

    const handleSave = async () => {
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (validRows.length === 0) {
            toast.error('Add at least one item with a valid product and quantity.');
            return;
        }

        setIsSaving(true);
        try {
            const sale: Sale = {
                id: `wr-${Date.now()}`,
                date: new Date().toISOString(),
                items: validRows.map(r => ({
                    id: r.productId,
                    name: r.name,
                    unit: r.unit,
                    qty: r.qty,
                    price: r.price,
                    gstPercentage: r.gstPercentage
                })),
                total: grandTotal,
                customerId: customerId || undefined,
                sector: 'General',
                paymentMethod,
                status: 'COMPLETED',
                paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
                discountAmount,
                saleChannel: 'WHOLESALE',
                counterName: counterName || undefined
            };

            const payload = buildPosInvoicePayload(sale);
            const { data } = await api.post('/api/pos/invoice', payload);
            toast.success(`Wholesale bill ${data?.invoice?.invoiceNo || ''} created successfully!`);
            resetForm();
        } catch (err: any) {
            toast.error('Error creating wholesale bill: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Wholesale Sales Entry"
                    description={counterName ? `Wholesale/Retail Billing / Counter: ${counterName}` : 'Wholesale/Retail Billing'}
                    actions={
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Save Bill</span>
                        </button>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <Building2 className="w-4 h-4 text-primary" /> Customer
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search wholesale customer..."
                                value={customerName || customerSearch}
                                onChange={e => {
                                    setCustomerName('');
                                    setCustomerId('');
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            {showCustomerDropdown && (customerSearch || customers.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 z-50 max-h-60 overflow-y-auto">
                                    {customers
                                        .filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                                        .map((c: any) => (
                                            <div
                                                key={c._id || c.id}
                                                onClick={() => {
                                                    setCustomerId(c._id || c.id);
                                                    setCustomerName(c.name);
                                                    setCustomerSearch('');
                                                    setShowCustomerDropdown(false);
                                                }}
                                                className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                                            >
                                                <div className="font-semibold text-sm">{c.name}</div>
                                                <div className="text-xs text-neutral-400">{c.phone}</div>
                                            </div>
                                        ))}
                                    {customers.length === 0 && <div className="p-4 text-center text-xs text-neutral-400">No customers found</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">Payment</h3>
                        <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${paymentMethod === 'CASH' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-500'}`}
                            >
                                Cash / Paid
                            </button>
                            <button
                                onClick={() => setPaymentMethod('CREDIT')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${paymentMethod === 'CREDIT' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-500'}`}
                            >
                                On Credit
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
                        <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Items List</h3>
                        <button
                            onClick={addRow}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>
                    <div className="overflow-x-auto min-h-[240px]">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
                                    <th className="px-6 py-4 font-semibold w-16">#</th>
                                    <th className="px-6 py-4 font-semibold min-w-[250px]">Product</th>
                                    <th className="px-6 py-4 font-semibold text-right w-24">Qty</th>
                                    <th className="px-6 py-4 font-semibold text-right w-32">Wholesale Rate (₹)</th>
                                    <th className="px-6 py-4 font-semibold text-right w-24">GST %</th>
                                    <th className="px-6 py-4 font-semibold text-right w-32">Total</th>
                                    <th className="px-4 py-4 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                {rows.map((row, idx) => {
                                    const lineTotal = (row.qty || 0) * (row.price || 0) * (1 + (row.gstPercentage || 0) / 100);
                                    return (
                                        <tr key={row.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                            <td className="px-6 py-4 text-neutral-400 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-4 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search item..."
                                                    value={row.name}
                                                    onFocus={() => setActiveSearchRow(idx)}
                                                    onChange={e => {
                                                        updateRow(idx, { name: e.target.value, productId: undefined });
                                                        setActiveSearchRow(idx);
                                                    }}
                                                    className="w-full bg-transparent border-none outline-none font-medium placeholder:text-neutral-300 text-neutral-900 dark:text-neutral-100"
                                                />
                                                <div className="text-[10px] text-neutral-400 mt-1 flex gap-2">
                                                    {row.brand && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">{row.brand}</span>}
                                                    {row.design && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">{row.design}</span>}
                                                    {row.sku && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">SKU: {row.sku}</span>}
                                                </div>
                                                {activeSearchRow === idx && (
                                                    <div
                                                        className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 w-[320px] max-h-64 overflow-y-auto"
                                                        onMouseDown={e => e.preventDefault()}
                                                    >
                                                        {filteredProducts(row.name).map((p: any) => (
                                                            <div
                                                                key={p.id || p._id}
                                                                onClick={() => selectProduct(idx, p)}
                                                                className="px-4 py-2.5 hover:bg-primary/5 cursor-pointer border-b border-neutral-50 dark:border-neutral-800 last:border-0 flex justify-between items-center gap-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-sm truncate">{p.name}</div>
                                                                    <div className="text-[10px] text-neutral-400">SKU: {p.sku} · Stock: {p.stockQty}</div>
                                                                </div>
                                                                <div className="text-xs font-bold text-primary flex-shrink-0">
                                                                    ₹{p.wholesaleRate ?? p.sellingPrice ?? p.price ?? 0}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {filteredProducts(row.name).length === 0 && (
                                                            <div className="p-3 text-center text-xs text-neutral-400">No matching items</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={row.qty}
                                                    onFocus={e => e.target.select()}
                                                    onChange={e => updateRow(idx, { qty: parseFloat(e.target.value) || 0 })}
                                                    className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none font-medium"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={row.price}
                                                    onFocus={e => e.target.select()}
                                                    onChange={e => updateRow(idx, { price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full text-right bg-violet-50 dark:bg-violet-900/10 rounded px-1 outline-none font-medium text-violet-700 dark:text-violet-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={row.gstPercentage}
                                                    onFocus={e => e.target.select()}
                                                    onChange={e => updateRow(idx, { gstPercentage: parseFloat(e.target.value) || 0 })}
                                                    className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-neutral-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white">
                                                ₹{lineTotal.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => removeRow(idx)}
                                                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <ShoppingBag className="w-8 h-8 text-neutral-300" />
                                                <p className="text-neutral-500 font-medium">No items added yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500">Tax Total</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">₹{taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500">Discount</span>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-5 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-black text-white">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium opacity-80">Grand Total</span>
                                <span className="text-2xl font-bold tracking-tight">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WRSalesEntry;
