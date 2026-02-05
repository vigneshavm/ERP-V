import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Save, Printer, FileText, Search, Plus, Trash2,
    Calendar, User, Truck, CreditCard, ChevronLeft, Loader2, ShoppingBag,
    Paperclip, FileCheck, ClipboardList
} from 'lucide-react';
import { RootState } from "../../redux/store";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import { useNavigate } from 'react-router-dom';
import { usePurchaseItems } from "../../hooks/usePurchaseItems";
import api from "../../services/api";
import { printBarcodeLabels } from "../../utils/labelPrinter";
import Layout from "../../components/shared/Layout";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Supplier {
    _id: string;
    businessName: string;
    contactNo: string;
    shortCode?: string;
}

interface Category {
    id: string;
    name: string;
    shortCode?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    cost: number;
    gstPercentage: number;
    stockQty: number;
}

interface PurchaseItem {
    id?: string; // temp id
    productId?: string;
    productName?: string;
    sku?: string;
    unitId?: string;
    quantity: number;
    rate: number; // cost price
    taxPercent?: number; // legacy from component, often unused in favor of tax_percent or synced
    taxAmount?: number;
    amount?: number; // line total

    // Properties required by usePurchaseItems
    line_total: number;
    product_name: string;
    product_id?: string;
    tax_percent: number;
    discount_amount: number;

    // Optional fields
    category_name?: string;
    category_code?: string;
    margin?: number;
    sellingPrice?: number;
    color?: string;
    size?: string;
    washingInstructions?: string;
    washing_instructions?: string;
}


const PurchaseEntry: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId;
    const branchId = user?.branchId; // Default to user branch

    // Header State
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Items Hook
    const { items, setItems, removeItem, totals } = usePurchaseItems([]);
    const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
    const { items: products } = useSelector((state: RootState) => state.inventory);

    const [shippingAmount, setShippingAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // New Enhanced Fields
    const [receiptStatus, setReceiptStatus] = useState<'Received' | 'Pending'>('Received');
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [referenceDoc, setReferenceDoc] = useState('');
    const [attachments, setAttachments] = useState<{ name: string; type: string }[]>([]);

    const [showDesignSetModal, setShowDesignSetModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Design Set Temp State
    const [designSet, setDesignSet] = useState({
        name: '',
        category: null as Category | null,
        colors: [''],
        sizes: [''],
        rate: 0,
        margin: 0,
        sellingPrice: 0,
        taxPercent: 0,
        washingInstructions: ''
    });

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/api/inventory/categories');
                // The API returns { success: true, data: [...] }
                const list = data.data || data;
                setCategories(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Derived Totals from hook
    const { subtotal, tax: totalTax, discount: discountTotal, total: grandTotalRaw } = totals;
    const grandTotal = grandTotalRaw + shippingAmount - discountAmount; // Apply extra shipping/global discount


    // Fetch Suppliers
    // Fetch Suppliers via Redux to ensure consistency
    const dispatch = useDispatch<any>();
    const { suppliers: reduxSuppliers } = useSelector((state: RootState) => state.suppliers);

    useEffect(() => {
        // Dispatch action to fetch suppliers if not loaded
        // We check length 0, effectively caching it. 
        // If real-time update needed, we might want to force fetch or rely on socket/revalidation.
        if (!reduxSuppliers || reduxSuppliers.length === 0) {
            dispatch(getAllSuppliers());
        }
    }, [dispatch]);

    // Update local state when redux changes
    useEffect(() => {
        if (reduxSuppliers && reduxSuppliers.length > 0) {
            setSuppliers(reduxSuppliers);
        }
    }, [reduxSuppliers]);

    // Add Empty Row
    const addEmptyRow = () => {
        setItems((prev: PurchaseItem[]) => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            product_id: '',
            product_name: '',
            sku: '',
            quantity: 1,
            rate: 0,
            tax_percent: 0,
            discount_amount: 0,
            line_total: 0,
            margin: 0,
            sellingPrice: 0
        }]);
    };

    // Expand Design Set
    const expandDesignSet = () => {
        if (!designSet.name || !designSet.category) return toast.error('Name and Category are required');
        const category = designSet.category;

        const newExpandedItems: any[] = [];
        designSet.colors.filter(c => c.trim()).forEach(color => {
            designSet.sizes.filter(s => s.trim()).forEach(size => {
                newExpandedItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    product_id: 'new', // Flag for backend to create item
                    product_name: `${designSet.name} - ${color} / ${size}`,
                    category_name: category.name,
                    category_code: category.shortCode || 'CAT',
                    sku: '', // Backend will generate SUP-CAT-PRICE
                    quantity: 1,
                    rate: designSet.rate,
                    tax_percent: designSet.taxPercent,
                    discount_amount: 0,
                    margin: designSet.margin,
                    sellingPrice: designSet.sellingPrice,
                    color,
                    size,
                    line_total: designSet.rate + (designSet.rate * designSet.taxPercent / 100)
                });
            });
        });

        // Filter out empty rows before adding
        setItems(prev => [...prev.filter(i => i.product_name), ...newExpandedItems]);
        setShowDesignSetModal(false);
        // Reset modal
        setDesignSet({
            name: '',
            category: null,
            colors: [''],
            sizes: [''],
            rate: 0,
            margin: 0,
            sellingPrice: 0,
            taxPercent: 0,
            washingInstructions: ''
        });
    };

    // Initialize with one row or load PO conversion data
    useEffect(() => {
        const storedPo = localStorage.getItem('pending_po_conversion');
        if (storedPo) {
            try {
                const poData = JSON.parse(storedPo);
                setSupplierId(poData.vendor_id);
                // Fetch supplier name via API if not in list yet
                api.get(`/api/purchases/suppliers/${poData.vendor_id}`)
                    .then(({ data }) => {
                        const sup = data.data || data;
                        if (sup) setSupplierName(sup.businessName);
                    })
                    .catch(console.error);

                const mappedItems = poData.items.map((i: any) => {
                    const basic = i.quantity * i.rate;
                    const taxAmount = (basic * i.tax) / 100;
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        productId: i.productId,
                        productName: 'Loading...',
                        product_name: 'Loading...', // Sync legacy prop
                        sku: '',
                        quantity: i.quantity,
                        rate: i.rate,
                        taxPercent: i.tax,
                        tax_percent: i.tax, // Sync legacy prop
                        discount_amount: i.discount || 0,
                        amount: basic + taxAmount - (i.discount || 0),
                        line_total: basic + taxAmount - (i.discount || 0)
                    };
                });

                // Fetch product details
                // Ideally backend should handle bulk fetch, for now we map individually or simple lookup
                // We'll trust inventory loaded in Redux or fetch specific

                setItems(mappedItems);
                localStorage.removeItem('pending_po_conversion');
            } catch (e) {
                console.error('Failed to parse PO conversion data', e);
                if (items.length === 0) addEmptyRow();
            }
        } else if (items.length === 0) {
            addEmptyRow();
        }
    }, []);

    const handleProductSelect = (index: number, product: Product) => {
        const newItems = [...items];
        const item = newItems[index];

        item.productId = product.id;
        item.productName = product.name;
        item.sku = product.sku;
        item.unitId = product.unit || 'Piece';
        item.rate = product.cost || 0;
        item.taxPercent = product.gstPercentage || 0;

        const basic = item.quantity * item.rate;
        item.taxAmount = (basic * item.taxPercent) / 100;
        item.amount = basic + item.taxAmount;

        newItems[index] = item;
        setItems(newItems);
        setActiveSearchRow(null);
    };

    // Handle Item Change
    const updateItem = (index: number, field: keyof PurchaseItem, value: PurchaseItem[keyof PurchaseItem]) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'productName' && item.productId) {
            item.productId = '';
        }

        // Recalculate
        if (field === 'quantity' || field === 'rate' || field === 'taxPercent') {
            const basic = item.quantity * item.rate;
            item.taxAmount = (basic * item.taxPercent) / 100;
            item.amount = basic + item.taxAmount;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const getFilteredProducts = (query: string) => {
        if (!query || query.length < 2) return [];
        const lower = query.toLowerCase();
        return (products as Product[]).filter(p =>
            p.name.toLowerCase().includes(lower) ||
            (p.sku && p.sku.toLowerCase().includes(lower))
        ).slice(0, 50);
    };

    const generatePDF = (orderData: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('PURCHASE INWARD RECORD', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Invoice No: ${orderData.invoice_no}`, 14, 25);
        doc.text(`Date: ${orderData.date}`, 14, 30);
        doc.text(`Supplier: ${supplierName}`, 14, 35);
        doc.text(`Ref Doc: ${referenceDoc || 'N/A'}`, 14, 40);

        doc.text(`Payment Terms: ${paymentTerms}`, 150, 25);
        doc.text(`Receipt Status: ${receiptStatus}`, 150, 30);
        doc.text(`Branch: ${user?.branchId || 'Main'}`, 150, 35);

        // Items Table
        const tableData = items.filter(i => i.product_name || i.productName).map((i, idx) => [
            idx + 1,
            i.product_name || i.productName,
            i.sku || 'N/A',
            i.quantity,
            `Rs. ${i.rate}`,
            `${i.tax_percent || i.taxPercent}%`,
            `Rs. ${i.amount || i.line_total}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['#', 'Description', 'SKU', 'Qty', 'Rate', 'Tax', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 140, finalY);
        doc.text(`Tax: Rs. ${totalTax.toFixed(2)}`, 140, finalY + 5);
        doc.text(`Discount: Rs. ${(discountAmount + discountTotal).toFixed(2)}`, 140, finalY + 10);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, 140, finalY + 18);

        // Notes
        if (notes) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Notes:', 14, finalY + 30);
            doc.text(notes, 14, finalY + 35);
        }

        doc.save(`Purchase_${orderData.invoice_no || orderData.purchase_number}.pdf`);
    };

    const handleSave = async (status: 'DRAFT' | 'COMPLETED', overrideOptions: any = {}) => {
        if (!supplierId) return alert('Please select a supplier');
        if (items.filter((i: any) => i.product_id || i.product_name).length === 0) return alert('Please add at least one item');

        setIsProcessing(true);
        try {
            const payload = {
                details: {
                    invoice_no: invoiceNo,
                    date: purchaseDate,
                    subtotal,
                    tax_amount: totalTax,
                    discount_amount: discountAmount + discountTotal, // Global + Line discounts
                    shipping_amount: shippingAmount,
                    round_off: 0,
                    total_amount: grandTotal,
                    notes
                },
                items: items.filter((i: PurchaseItem) => i.product_id || i.product_name).map((i: PurchaseItem) => ({
                    product_id: i.product_id,
                    product_name: i.product_name,
                    category_name: i.category_name,
                    category_code: i.category_code,
                    unit_id: 'Piece', // Default or fetch
                    quantity: i.quantity,
                    rate: i.rate,
                    tax_percent: i.tax_percent || i.taxPercent,
                    tax_amount: (i.quantity * i.rate * (i.tax_percent || i.taxPercent || 0)) / 100,
                    amount: i.amount,
                    margin: i.margin || 0,
                    selling_price: i.sellingPrice || 0,
                    color: i.color,
                    size: i.size,
                    sku: i.sku
                })),
                p_vendor_id: supplierId,
                status, // Pass status to backend
                receipt_status: receiptStatus,
                payment_terms: paymentTerms,
                reference_doc: referenceDoc,
                attachments: attachments.map(a => a.name),
                ...overrideOptions
            };

            const { data } = await api.post('/purchases', payload);

            toast.success(`Purchase ${status === 'DRAFT' ? 'Saved as Draft' : 'Completed Successfully'}! #${data.purchase_number}`);

            if (status === 'COMPLETED') {
                generatePDF({ ...payload.details, purchase_number: data.purchase_number });
            }

            navigate('/tenant/purchase'); // Go back to list
        } catch (err: any) {
            console.error(err);
            const code = err.response?.data?.code;
            if (code === 'CREDIT_LIMIT_EXCEEDED' || code === 'CREDIT_PERIOD_EXCEEDED') {
                const reason = err.response?.data?.message || 'Supplier Limit Reached';
                const promiseDate = prompt(`⚠️ SUPPLIER CREDIT LOCKOUT\n\n${reason}\n\nMANAGER ACTION: Enter Payment Promise Date (YYYY-MM-DD) to bypass:`);
                if (promiseDate) {
                    setIsProcessing(false);
                    await handleSave(status, { paymentPromiseDate: promiseDate });
                    return;
                }
            }
            toast.error('Error saving purchase: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-500" onClick={() => setActiveSearchRow(null)}>

                {/* Design Set Modal - Kept functionally same but styled */}
                {showDesignSetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Design Set</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Generates variants (Size/Color) automatically</p>
                                </div>
                                <button onClick={() => setShowDesignSetModal(false)} className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500">&times;</button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Name</label>
                                        <input
                                            type="text"
                                            value={designSet.name}
                                            onChange={e => setDesignSet({ ...designSet, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Silk Saree"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                        <div className="relative">
                                            <select
                                                onChange={e => {
                                                    const cat = categories.find(c => c.id === e.target.value);
                                                    setDesignSet({ ...designSet, category: cat || null });
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colors <span className="font-normal text-slate-400 normal-case">(Comma separated)</span></label>
                                        <input
                                            type="text"
                                            value={designSet.colors.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, colors: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Red, Blue, Green"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sizes <span className="font-normal text-slate-400 normal-case">(Comma separated)</span></label>
                                        <input
                                            type="text"
                                            value={designSet.sizes.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, sizes: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="S, M, L, XL"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                value={designSet.rate}
                                                onChange={e => setDesignSet({ ...designSet, rate: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margin %</label>
                                        <input
                                            type="number"
                                            value={designSet.margin}
                                            onChange={e => {
                                                const margin = parseFloat(e.target.value) || 0;
                                                setDesignSet({ ...designSet, margin, sellingPrice: designSet.rate * (1 + margin / 100) });
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selling Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={designSet.sellingPrice}
                                                onChange={e => {
                                                    const sp = parseFloat(e.target.value) || 0;
                                                    setDesignSet({ ...designSet, sellingPrice: sp, margin: designSet.rate > 0 ? ((sp / designSet.rate) - 1) * 100 : 0 });
                                                }}
                                                className="w-full pl-8 pr-3 py-3 rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-700 font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax %</label>
                                        <input
                                            type="number"
                                            value={designSet.taxPercent}
                                            onChange={e => setDesignSet({ ...designSet, taxPercent: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Washing Instructions</label>
                                    <input
                                        type="text"
                                        value={designSet.washingInstructions}
                                        onChange={e => setDesignSet({ ...designSet, washingInstructions: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Dry Clean Only, Hand Wash"
                                    />
                                </div>
                            </div>
                            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                <button onClick={() => setShowDesignSetModal(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Cancel</button>
                                <button
                                    onClick={expandDesignSet}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-95"
                                >
                                    Generate {designSet.colors.filter(c => c.trim()).length * designSet.sizes.filter(s => s.trim()).length} Items
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header - Glassmorphism */}
                <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-full px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400 group">
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Purchase Entry
                                </h1>
                                <p className="text-xs font-medium text-slate-500">Inventory Management / New Inward</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    /* Existing Print Logic */
                                    const labelItems = items
                                        .filter(i => i.product_name || i.productName)
                                        .map(i => {
                                            const supplier = suppliers.find(s => s._id === supplierId);
                                            const supCode = supplier?.shortCode || 'SUP';
                                            const catCode = i.category_code || 'CAT';
                                            const sku = i.sku || `${supCode}-${catCode}-${i.sellingPrice || 0}`;
                                            return {
                                                productName: i.product_name || i.productName,
                                                sku: sku,
                                                sellingPrice: i.sellingPrice || 0,
                                                size: i.size,
                                                color: i.color,
                                                washingInstructions: i.washingInstructions || i.washing_instructions
                                            };
                                        });
                                    if (labelItems.length === 0) return toast.info('No items to print');
                                    printBarcodeLabels(labelItems);
                                }}
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Labels</span>
                            </button>
                            <button
                                onClick={() => handleSave('DRAFT')}
                                disabled={isProcessing}
                                className="items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition-all active:scale-95 hidden sm:flex"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Save Draft</span>
                            </button>
                            <button
                                onClick={() => handleSave('COMPLETED')}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 transform"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Complete Purchase</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 space-y-8 pb-32">

                    {/* Top Section: Supplier Selection & Meta Data */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Supplier Card */}
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" /> Supplier Details
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Supplier</label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Type to search..."
                                            value={supplierName || supplierSearch}
                                            onChange={e => {
                                                setSupplierName('');
                                                setSupplierId('');
                                                setSupplierSearch(e.target.value);
                                                setShowSupplierDropdown(true);
                                            }}
                                            onFocus={() => setShowSupplierDropdown(true)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                        />
                                        {/* Dropdown */}
                                        {showSupplierDropdown && (supplierSearch || suppliers.length > 0) && (
                                            <div className="absolute top-full text-slate-900 left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                                {suppliers.filter(s => s.businessName.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                                                    <div
                                                        key={s._id}
                                                        onClick={() => {
                                                            setSupplierId(s._id);
                                                            setSupplierName(s.businessName);
                                                            setSupplierSearch('');
                                                            setShowSupplierDropdown(false);
                                                        }}
                                                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0"
                                                    >
                                                        <div className="font-semibold text-sm">{s.businessName}</div>
                                                        <div className="text-xs text-slate-400">{s.contactNo}</div>
                                                    </div>
                                                ))}
                                                {suppliers.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No suppliers found</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Credit Check Badge could go here */}
                                {supplierId && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-green-700 dark:text-green-400">Supplier Selected</p>
                                            <p className="text-[10px] text-green-600/80">{supplierName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice & Meta */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-violet-500" /> Invoice Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Invoice Number</label>
                                    <input
                                        type="text"
                                        value={invoiceNo}
                                        onChange={e => setInvoiceNo(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all uppercase placeholder:normal-case"
                                        placeholder="e.g. INV-8823"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Details</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="date"
                                                value={purchaseDate}
                                                onChange={e => setPurchaseDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Remarks / Terms</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                                        placeholder="Add payment terms or delivery notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Entry Options Card */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-emerald-500" /> Entry Options
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Receipt Mode</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                                        <button
                                            onClick={() => setReceiptStatus('Received')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${receiptStatus === 'Received' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                        >
                                            Immediate
                                        </button>
                                        <button
                                            onClick={() => setReceiptStatus('Pending')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${receiptStatus === 'Pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                        >
                                            Pending
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Terms</label>
                                    <select
                                        value={paymentTerms}
                                        onChange={e => setPaymentTerms(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                    >
                                        <option value="COD">COD (Cash on Delivery)</option>
                                        <option value="Net 15">Net 15 Days</option>
                                        <option value="Net 30">Net 30 Days</option>
                                        <option value="Net 60">Net 60 Days</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ref Document</label>
                                    <div className="relative">
                                        <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={referenceDoc}
                                            onChange={e => setReferenceDoc(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                            placeholder="PO#, Email Date..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attachments</label>
                                    <div className="flex gap-2">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer transition-all group">
                                            <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                            <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">Upload</span>
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={e => {
                                                    const files = Array.from(e.target.files || []);
                                                    setAttachments(prev => [...prev, ...files.map(f => ({ name: f.name, type: f.type }))]);
                                                }}
                                            />
                                        </label>
                                        {attachments.length > 0 && (
                                            <div className="flex items-center gap-1 px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                                <span className="text-xs font-bold">{attachments.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {attachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-[10px] text-slate-500 max-w-[120px] truncate">
                                                    <Paperclip className="w-3 h-3" /> {file.name}
                                                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="ml-1 hover:text-red-500">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300">Items List</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDesignSetModal(true)}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Design Set
                                </button>
                                <button
                                    onClick={addEmptyRow}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                                        <th className="px-6 py-4 font-semibold w-16">#</th>
                                        <th className="px-6 py-4 font-semibold min-w-[250px]">Product / Description</th>
                                        <th className="px-6 py-4 font-semibold text-right w-24">Qty</th>
                                        <th className="px-6 py-4 font-semibold text-right w-32">Rate (₹)</th>
                                        <th className="px-6 py-4 font-semibold text-right w-24">Tax %</th>
                                        <th className="px-6 py-4 font-semibold text-center w-40">Pricing (₹)</th>
                                        <th className="px-6 py-4 font-semibold text-right w-32">Total</th>
                                        <th className="px-4 py-4 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {items.map((item, idx) => (
                                        <tr key={item.id || idx} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-4 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search item..."
                                                    value={item.product_name}
                                                    onFocus={() => setActiveSearchRow(idx)}
                                                    onChange={e => {
                                                        updateItem(idx, 'product_name', e.target.value);
                                                        setActiveSearchRow(idx);
                                                    }}
                                                    className="w-full bg-transparent border-none outline-none font-medium placeholder:text-slate-300 focus:placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                                                />
                                                <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                                    {item.sku && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">SKU: {item.sku}</span>}
                                                    {item.color && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.color}</span>}
                                                    {item.size && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.size}</span>}
                                                </div>

                                                {/* Product Search Dropdown */}
                                                {activeSearchRow === idx && item.product_name && !item.product_id && (
                                                    <div className="absolute top-12 left-6 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 max-h-52 overflow-auto w-[400px]">
                                                        {getFilteredProducts(item.product_name).length > 0 ? (
                                                            getFilteredProducts(item.product_name).map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleProductSelect(idx, p);
                                                                    }}
                                                                >
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                                                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                                        <span>SKU: {p.sku}</span>
                                                                        <span className={p.stockQty < 10 ? 'text-amber-500' : 'text-green-500'}>Stock: {p.stockQty}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-400">No match found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-medium text-slate-700 dark:text-slate-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-medium text-slate-700 dark:text-slate-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={item.tax_percent}
                                                    onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-slate-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <span className="text-[10px] text-slate-400 uppercase">Margin %</span>
                                                        <input
                                                            type="number"
                                                            value={item.margin || 0}
                                                            onChange={e => {
                                                                const margin = parseFloat(e.target.value) || 0;
                                                                const sellingPrice = item.rate * (1 + margin / 100);
                                                                const newItems = [...items];
                                                                newItems[idx] = { ...item, margin, sellingPrice };
                                                                setItems(newItems);
                                                            }}
                                                            className="w-12 text-right text-xs bg-slate-100 dark:bg-slate-700 rounded px-1 py-0.5 outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <span className="text-[10px] text-green-600 font-bold">SP ₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.sellingPrice || 0}
                                                            onChange={e => {
                                                                const sellingPrice = parseFloat(e.target.value) || 0;
                                                                const margin = item.rate > 0 ? ((sellingPrice / item.rate) - 1) * 100 : 0;
                                                                const newItems = [...items];
                                                                newItems[idx] = { ...item, sellingPrice, margin };
                                                                setItems(newItems);
                                                            }}
                                                            className="w-16 text-right font-bold text-green-600 outline-none bg-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                ₹{item.line_total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-slate-500 font-medium">No items added yet</p>
                                                    <button onClick={addEmptyRow} className="text-indigo-600 text-sm font-bold hover:underline">Start adding items</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer / Calculations */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Tax Total</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₹{totalTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center gap-2"><Truck className="w-3 h-3" /> Shipping</span>
                                    <input
                                        type="number"
                                        value={shippingAmount}
                                        onChange={e => setShippingAmount(parseFloat(e.target.value) || 0)}
                                        className="w-24 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Discount</span>
                                    <input
                                        type="number"
                                        value={discountAmount}
                                        onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                        className="w-24 text-right bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-red-500"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-5 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-black text-white">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium opacity-80">Grand Total</span>
                                    <span className="text-2xl font-bold tracking-tight">₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default PurchaseEntry;
