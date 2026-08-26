import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Save, Printer, FileText, Search, Plus, Trash2,
    Calendar, User, Truck, CreditCard, Loader2, ShoppingBag,
    Paperclip, FileCheck, ClipboardList, Info, Upload, FileUp, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { RootState } from "../../redux/store";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import { getAllItems } from "../../redux/slices/inventorySlice";
import { useNavigate } from 'react-router-dom';
import { usePurchaseItems } from "../../hooks/usePurchaseItems";
import api from "../../services/api";
import { printBarcodeLabels } from "../../utils/labelPrinter";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import inventoryData from '../../mockData/inventoryData.json';

interface Supplier {
    _id: string;
    businessName: string;
    contactNo: string;
    shortCode?: string;
    state?: string;
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
    const dispatch = useDispatch<any>();
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
    const [dropdownHighlightIndex, setDropdownHighlightIndex] = useState<number>(-1);
    const [searchCategoryFilter, setSearchCategoryFilter] = useState<string | null>(null);
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
    const [manualTotalAmount, setManualTotalAmount] = useState<number | ''>('');

    const [showDesignSetModal, setShowDesignSetModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // PDF Import State
    const [showPdfPanel, setShowPdfPanel] = useState(false);
    const [isPdfParsing, setIsPdfParsing] = useState(false);
    const [pdfFileName, setPdfFileName] = useState('');
    const [pdfExtractedText, setPdfExtractedText] = useState('');
    const [pdfParseResult, setPdfParseResult] = useState<{ items: any[], raw: string } | null>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

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

    // Fetch Tenant Profile for Tax Calculation
    const [tenantState, setTenantState] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/api/business/profile');
                if (data.success && data.data.tenantAddress && data.data.tenantAddress.state) {
                    setTenantState(data.data.tenantAddress.state);
                }
            } catch (err) {
                console.error("Failed to fetch business profile", err);
            }
        };
        fetchProfile();

        // Fetch products if empty
        if (products.length === 0) {
            dispatch(getAllItems() as any);
        }

        // Close dropdown on click outside
        const handleClickOutside = () => {
            setActiveSearchRow(null);
            setSearchCategoryFilter(null);
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [dispatch, products.length]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/api/inventory/categories');
                // The API returns { success: true, data: [...] }
                const list = data.data || data;
                let parsedList = Array.isArray(list) ? list : [];
                
                // Fallback to mock data if API returns empty
                if (parsedList.length === 0) {
                    parsedList = inventoryData.MOCK_CATEGORIES;
                }
                
                setCategories(parsedList);
            } catch (err) {
                console.error("Failed to fetch categories", err);
                setCategories(inventoryData.MOCK_CATEGORIES as Category[]);
            }
        };
        fetchCategories();
    }, []);

    // Derived Totals from hook
    const { subtotal, tax: totalTax, discount: discountTotal, total: grandTotalRaw } = totals;

    const computedGrandTotal = grandTotalRaw + shippingAmount - discountAmount;
    const grandTotal = manualTotalAmount !== '' ? Number(manualTotalAmount) : computedGrandTotal;


    // Fetch Suppliers
    // Fetch Suppliers via Redux to ensure consistency
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

    // Load pdfjs UMD via <script> tag — sets window.pdfjsLib global (correct for UMD bundles)
    const loadPdfJs = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            const PDFJS_VERSION = '3.11.174';
            const src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`;

            // Already loaded — reuse global
            if ((window as any).pdfjsLib) {
                resolve((window as any).pdfjsLib);
                return;
            }

            // Already injected but not yet loaded
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve((window as any).pdfjsLib));
                existing.addEventListener('error', reject);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve((window as any).pdfjsLib);
            script.onerror = () => reject(new Error('Failed to load pdfjs-dist from CDN'));
            document.head.appendChild(script);
        });
    };

    // PDF Upload & Parse Logic
    const parsePdfItems = async (file: File) => {
        setIsPdfParsing(true);
        setPdfFileName(file.name);
        setPdfParseResult(null);
        try {
            const PDFJS_VERSION = '3.11.174';
            const pdfjs = await loadPdfJs();
            pdfjs.GlobalWorkerOptions.workerSrc =
                `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
            console.log('[PDF] pdfjs loaded, version:', pdfjs.version);

            const arrayBuffer = await file.arrayBuffer();
            console.log('[PDF] ArrayBuffer size:', arrayBuffer.byteLength);
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            console.log('[PDF] Loaded. Pages:', pdf.numPages);

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();

                // Group text fragments by Y-position into line buckets.
                // PDF Y-coordinates increase bottom→top, so we sort Y descending
                // to read top→bottom. Items in same bucket are sorted left→right by X.
                const lineMap = new Map<number, Array<{ x: number; str: string }>>();

                for (const item of content.items as any[]) {
                    const str = ((item as any).str ?? '').trim();
                    if (!str) continue;
                    const transform = (item as any).transform;
                    const rawY = transform ? transform[5] : 0;
                    const x    = transform ? transform[4] : 0;
                    // Bucket Y into 3pt slots to merge items on the same visual line
                    const bucketY = Math.round(rawY / 3) * 3;

                    if (!lineMap.has(bucketY)) lineMap.set(bucketY, []);
                    lineMap.get(bucketY)!.push({ x, str });
                }

                // Sort buckets top→bottom (higher Y = higher on page → descending)
                const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
                const pageLines: string[] = [];

                for (const y of sortedYs) {
                    const frags = lineMap.get(y)!.sort((a, b) => a.x - b.x);
                    const line  = frags.map(f => f.str).join(' ').trim();
                    if (line) pageLines.push(line);
                }

                fullText += pageLines.join('\n') + '\n';
                if (i === 1) console.log('[PDF] Page 1 lines (first 20):', pageLines.slice(0, 20));
            }

            console.log('[PDF] Extracted text length:', fullText.length);
            console.log('[PDF] First 500 chars:', fullText.substring(0, 500));

            setPdfExtractedText(fullText);


            // ─── Token-based item parser ───
            // Handles any column order (Indian GST invoices vary widely in layout).
            // For each line: extract all numbers → clean text name → infer qty+rate.

            const SKIP_LINE = /^(total|sub.?total|grand|tax|gst|igst|cgst|sgst|cess|discount|freight|shipping|invoice|date|gstin|hsn|sac|description|amount|rate|qty|quantity|buyer|seller|address|state|code|email|ph |phone|bill to|ship|balance|advance|due|terms|bank|account|ifsc|eway|way.bill|s\.?\s*no|sl\.?\s*no|sr\.?\s*no|particular|goods|narration|we |thank|cheque|upi|neft|rtgs|pan|cin|subject|authoris|signator|original|duplicate|certified|rupees|rs\.)/i;

            const lines = fullText.split(/[\n\r]+/).filter(l => l.trim().length > 3);
            const parsedItems: any[] = [];

            for (const line of lines) {
                const clean = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                if (!clean) continue;

                // Extract all numeric values (support Indian comma format: 10,032.00)
                const numTokens = clean.match(/\d+(?:,\d{2,3})*(?:\.\d+)?/g) || [];
                const nums = numTokens.map(n => parseFloat(n.replace(/,/g, '')));
                if (nums.length === 0) continue;

                // Build clean item name: remove numbers, units, ₹ signs
                const nameRaw = clean
                    .replace(/\d+(?:,\d{2,3})*(?:\.\d+)?/g, '')
                    .replace(/\b(nos?|pcs?|kgs?|gms?|mtrs?|mts?|units?|box|bxs?|ltrs?|sets?|pair|pkt|packets?)\b/gi, '')
                    .replace(/[₹$%@#^&*()_+=\[\]{};':"\\|<>/?]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (nameRaw.length < 3) continue;
                if (SKIP_LINE.test(nameRaw)) continue;
                // Skip lines that are mostly numbers (< 4 alpha chars)
                if ((nameRaw.match(/[a-zA-Z]/g) || []).length < 4) continue;

                // ─── Infer qty and rate ───
                let qty = 1;
                let rate = 0;

                if (nums.length === 1) {
                    rate = nums[0];
                } else {
                    // Smallest integer ≤ 1000 is the best qty candidate
                    const intCandidates = nums.filter(n => Number.isInteger(n) && n >= 1 && n <= 1000);
                    const qtyGuess = intCandidates.length > 0 ? Math.min(...intCandidates) : null;

                    if (qtyGuess) {
                        qty = qtyGuess;
                        // Find rate: n where n*qty ≈ another number (the total), 2% tolerance
                        const others = nums.filter(n => n !== qty);
                        let found = false;
                        for (const n of others) {
                            const expectedTotal = n * qty;
                            if (others.some(t => t !== n && Math.abs(t - expectedTotal) / (t || 1) < 0.02)) {
                                rate = n;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            // No qty×rate=total match → use second-smallest as rate
                            const sorted = [...others].sort((a, b) => a - b);
                            rate = sorted[0] ?? nums[0];
                        }
                    } else {
                        // No integer ≤ 1000 → qty=1, rate = second-largest (largest is total)
                        const sorted = [...nums].sort((a, b) => b - a);
                        rate = sorted.length > 1 ? sorted[1] : sorted[0];
                    }
                }

                if (rate <= 0) continue;

                parsedItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    product_id: '',
                    product_name: nameRaw,
                    sku: '',
                    quantity: qty,
                    rate: Math.round(rate * 100) / 100,
                    tax_percent: 0,
                    discount_amount: 0,
                    line_total: Math.round(qty * rate * 100) / 100,
                    margin: 0,
                    sellingPrice: 0
                });
            }


            console.log('[PDF] Full extracted text length:', fullText.length);
            setPdfParseResult({ items: parsedItems, raw: fullText });
            toast.success(`PDF parsed: found ${parsedItems.length} potential items`);
        } catch (err: any) {
            console.error('[PDF] Parse error:', err?.message || err, err);
            if (err?.message?.includes('worker')) {
                toast.error('PDF worker failed to load. Check your network connection.');
            } else if (err?.message?.includes('Invalid PDF')) {
                toast.error('Invalid or corrupted PDF file.');
            } else {
                toast.error('Could not parse PDF. Try a text-based (digital) PDF, not a scanned image.');
            }
        } finally {
            setIsPdfParsing(false);
        }
    };

    const applyPdfItems = () => {
        if (!pdfParseResult || pdfParseResult.items.length === 0) return;
        setItems(prev => {
            const existingWithData = prev.filter(i => i.product_name);
            return [...existingWithData, ...pdfParseResult.items];
        });
        setPdfParseResult(null);
        setPdfFileName('');
        setShowPdfPanel(false);
        toast.success('Items imported from PDF!');
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
                const vId = typeof poData.vendor_id === 'object' ? (poData.vendor_id as any)._id || (poData.vendor_id as any).id : poData.vendor_id;
                setSupplierId(vId);
                // Fetch supplier name via API if not in list yet
                api.get(`/api/purchases/suppliers/${vId}`)
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

    const handleCategorySelect = (index: number, cat: Category) => {
        setItems((prevItems: PurchaseItem[]) => {
            const newItems = [...prevItems];
            const item = { ...newItems[index] };

            // We are adding a new product, so no product_id
            item.product_id = '';
            item.productId = '';
            item.category_name = cat.name;
            item.category_code = cat.shortCode || '';
            
            // Auto-fill product name if left blank
            if (!item.product_name || item.product_name.trim() === '') {
                item.product_name = cat.name;
                item.productName = cat.name;
            }
            
            newItems[index] = item;
            return newItems;
        });
        setActiveSearchRow(null);
    };

    // Handle Item Change
    const updateItem = (index: number, field: keyof PurchaseItem, value: PurchaseItem[keyof PurchaseItem]) => {
        setItems((prevItems: PurchaseItem[]) => {
            const newItems = [...prevItems];
            const item = { ...newItems[index], [field]: value };

            // Keep legacy camelCase and snake_case fields in sync
            if (field === 'productName' || field === 'product_name') {
                item.productName = value as string;
                item.product_name = value as string;
                if (item.productId || item.product_id) {
                    item.productId = '';
                    item.product_id = '';
                }
            }
            
            if (field === 'taxPercent' || field === 'tax_percent') {
                item.taxPercent = value as number;
                item.tax_percent = value as number;
            }

            // Recalculate
            if (field === 'quantity' || field === 'rate' || field === 'taxPercent' || field === 'tax_percent') {
                const basic = item.quantity * item.rate;
                item.taxAmount = (basic * (item.taxPercent || 0)) / 100;
                item.amount = basic + (item.taxAmount || 0);
                item.line_total = item.amount;
            }

            newItems[index] = item;
            return newItems;
        });
    };

    const getFilteredCategories = (query: string) => {
        const lower = (query || '').toLowerCase().trim();
        if (!lower) return categories;
        return categories.filter(c => c.name.toLowerCase().includes(lower));
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
        const currentSupplier = suppliers.find(s => s._id === supplierId);
        const supplierState = currentSupplier?.state || '';
        const isInterState = tenantState && supplierState && tenantState.toLowerCase() !== supplierState.toLowerCase();

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 140, finalY);

        if (totalTax > 0) {
            if (isInterState) {
                doc.text(`IGST: Rs. ${totalTax.toFixed(2)}`, 140, finalY + 5);
            } else {
                doc.text(`CGST: Rs. ${(totalTax / 2).toFixed(2)}`, 140, finalY + 5);
                doc.text(`SGST: Rs. ${(totalTax / 2).toFixed(2)}`, 140, finalY + 10);
            }
        } else {
            doc.text(`Tax: Rs. 0.00`, 140, finalY + 5);
        }

        doc.text(`Discount: Rs. ${(discountAmount + discountTotal).toFixed(2)}`, 140, finalY + 15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, 140, finalY + 23);

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
        console.log("=== VALIDATION CHECK ===");
        console.log("Supplier ID:", supplierId);
        console.log("Items Array:", items);
        
        if (!supplierId) return toast.error('Please select a supplier from the list first.');
        
        // Strengthened check to ensure we catch both naming conventions and avoid whitespace bypass
        const validItems = items.filter((i: any) => 
            (i.product_id && i.product_id.trim() !== '') || 
            (i.product_name && i.product_name.trim() !== '') || 
            (i.productName && i.productName.trim() !== '')
        );
        
        console.log("Valid Items Count:", validItems.length);
        const hasItems = validItems.length > 0;
        const hasManualTotal = manualTotalAmount !== '' && Number(manualTotalAmount) > 0;

        if (!hasItems && !hasManualTotal) {
            console.warn("Validation failed: No valid items and no manual total.");
            return toast.error('Please add at least one item with a valid Product Name, or enter a manual total purchase amount.');
        }

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

            console.log("=== PURCHASE API PAYLOAD ===", JSON.stringify(payload, null, 2));

            const { data } = await api.post('/api/purchases', payload);

            toast.success(`Purchase ${status === 'DRAFT' ? 'Saved as Draft' : 'Completed Successfully'}! #${data.purchase_number}`);

            // Removed automatic PDF download
            // if (status === 'COMPLETED') {
            //     generatePDF({ ...payload.details, purchase_number: data.purchase_number });
            // }

            // Enhanced Workflow: Reset Form instead of navigating
            resetForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error(err);
            const code = err.response?.data?.code;
            if (code === 'CREDIT_LIMIT_EXCEEDED') {
                const { currentOutstanding, limit, shortage } = err.response?.data?.data || {};
                const confirmOverride = window.confirm(
                    `⚠️ CREDIT LIMIT EXCEEDED\n\n` +
                    `Outstanding: Rs. ${currentOutstanding?.toLocaleString()}\n` +
                    `Limit: Rs. ${limit?.toLocaleString()}\n` +
                    `Shortage: Rs. ${shortage?.toLocaleString()}\n\n` +
                    `Do you want to AUTHORIZE this purchase and override the limit?`
                );

                if (confirmOverride) {
                    setIsProcessing(false);
                    // Retry with override flag
                    await handleSave(status, { overrideCreditLimit: true });
                    return;
                }
            } else if (code === 'CREDIT_PERIOD_EXCEEDED') {
                const reason = err.response?.data?.message || 'Supplier Limit Reached';
                const promiseDate = prompt(`⚠️ SUPPLIER LOCKOUT (Overdue Bills)\n\n${reason}\n\nMANAGER ACTION: Enter Payment Promise Date (YYYY-MM-DD) to bypass:`);
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
    }

    const resetForm = () => {
        // Reset all state variables explicitly
        setInvoiceNo('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setSupplierId('');
        setSupplierName('');
        setSupplierSearch('');

        // atomic reset for items
        setItems([{
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

        setShippingAmount(0);
        setDiscountAmount(0);
        setNotes('');
        setReceiptStatus('Received');
        setPaymentTerms('Net 30');
        setReferenceDoc('');
        setAttachments([]);
        setManualTotalAmount('');

        // Ensure no query params linger
        window.history.replaceState(null, '', window.location.pathname);
    };


    // Calculate Tax Split for UI
    const currentSupplier = suppliers.find(s => s._id === supplierId);
    const supplierState = currentSupplier?.state || '';
    const isInterState = tenantState && supplierState && tenantState.toLowerCase() !== supplierState.toLowerCase();

    // Derived Tax Components
    const cgst = totalTax > 0 && !isInterState ? totalTax / 2 : 0;
    const sgst = totalTax > 0 && !isInterState ? totalTax / 2 : 0;
    const igst = totalTax > 0 && isInterState ? totalTax : 0;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10" onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave('COMPLETED'); } }}>



                {/* Design Set Modal - Updated UI */}
                {showDesignSetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                        <div className="bg-white dark:bg-neutral-800 rounded-sm shadow-2xl w-full max-w-3xl overflow-hidden border border-neutral-100 dark:border-neutral-700" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Add Design Set</h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Generates variants (Size/Color) automatically</p>
                                </div>
                                <button onClick={() => setShowDesignSetModal(false)} className="p-2 hover:bg-white/50 rounded-full transition-colors text-neutral-500">&times;</button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Base Name</label>
                                        <input
                                            type="text"
                                            value={designSet.name}
                                            onChange={e => setDesignSet({ ...designSet, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Silk Saree"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Category</label>
                                        <div className="relative">
                                            <select
                                                onChange={e => {
                                                    const cat = categories.find(c => c.id === e.target.value);
                                                    setDesignSet({ ...designSet, category: cat || null });
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 appearance-none focus:ring-2 focus:ring-primary outline-none transition-all"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">▼</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Colors <span className="font-normal text-neutral-400 normal-case">(Comma separated)</span></label>
                                        <input
                                            type="text"
                                            value={designSet.colors.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, colors: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            placeholder="Red, Blue, Green"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Sizes <span className="font-normal text-neutral-400 normal-case">(Comma separated)</span></label>
                                        <input
                                            type="text"
                                            value={designSet.sizes.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, sizes: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            placeholder="S, M, L, XL"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Cost Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">₹</span>
                                            <input
                                                type="number"
                                                value={designSet.rate}
                                                onChange={e => setDesignSet({ ...designSet, rate: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-8 pr-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Margin %</label>
                                        <input
                                            type="number"
                                            value={designSet.margin}
                                            onChange={e => {
                                                const margin = parseFloat(e.target.value) || 0;
                                                setDesignSet({ ...designSet, margin, sellingPrice: designSet.rate * (1 + margin / 100) });
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Selling Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={designSet.sellingPrice}
                                                onChange={e => {
                                                    const sp = parseFloat(e.target.value) || 0;
                                                    setDesignSet({ ...designSet, sellingPrice: sp, margin: designSet.rate > 0 ? ((sp / designSet.rate) - 1) * 100 : 0 });
                                                }}
                                                className="w-full pl-8 pr-3 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Tax %</label>
                                        <input
                                            type="number"
                                            value={designSet.taxPercent}
                                            onChange={e => setDesignSet({ ...designSet, taxPercent: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Washing Instructions</label>
                                    <input
                                        type="text"
                                        value={designSet.washingInstructions}
                                        onChange={e => setDesignSet({ ...designSet, washingInstructions: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="e.g. Dry Clean Only, Hand Wash"
                                    />
                                </div>
                            </div>
                            <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3">
                                <button onClick={() => setShowDesignSetModal(false)} className="px-6 py-2.5 rounded-xl text-neutral-600 font-medium hover:bg-neutral-200 transition-colors">Cancel</button>
                                <button
                                    onClick={expandDesignSet}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    Generate {designSet.colors.filter(c => c.trim()).length * designSet.sizes.filter(s => s.trim()).length} Items
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <PageHeader
                    title="Purchase Entry"
                    description="Inventory Management / New Inward"
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
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
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Labels</span>
                            </button>
                            <button
                                onClick={() => handleSave('DRAFT')}
                                disabled={isProcessing}
                                className="items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground transition-all active:scale-95 hidden sm:flex"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Save Draft</span>
                            </button>
                            <button
                                onClick={() => handleSave('COMPLETED')}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 transform"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Complete Purchase</span>
                            </button>
                        </div>
                    }
                />



                {/* Top Section: Supplier Selection & Meta Data */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Supplier Card */}
                    <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-primary/50 transition-colors group">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <User className="w-4 h-4 text-primary" /> Supplier Details
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Select Supplier</label>
                                <div className="relative group/input">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within/input:text-primary transition-colors">
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
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    />
                                    {/* Dropdown */}
                                    {showSupplierDropdown && (supplierSearch || suppliers.length > 0) && (
                                        <div className="absolute top-full text-neutral-900 left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                            {suppliers.filter(s => s.businessName.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => {
                                                        setSupplierId(s._id);
                                                        setSupplierName(s.businessName);
                                                        setSupplierSearch('');
                                                        setShowSupplierDropdown(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                                                >
                                                    <div className="font-semibold text-sm">{s.businessName}</div>
                                                    <div className="text-xs text-neutral-400">{s.contactNo}</div>
                                                </div>
                                            ))}
                                            {suppliers.length === 0 && <div className="p-4 text-center text-xs text-neutral-400">No suppliers found</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Credit Check Badge could go here */}
                            {supplierId && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 dark:text-success">Supplier Selected</p>
                                        <p className="text-[10px] text-emerald-600/80">{supplierName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice & Meta */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-primary/50 transition-colors">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-primary" /> Invoice Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Invoice Number</label>
                                <input
                                    type="text"
                                    value={invoiceNo}
                                    onChange={e => setInvoiceNo(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all uppercase placeholder:normal-case"
                                    placeholder="e.g. INV-8823"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Date</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1 group/date">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within/date:text-primary transition-colors" />
                                        <input
                                            type="date"
                                            value={purchaseDate}
                                            onChange={e => setPurchaseDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Remarks / Terms</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    placeholder="Add payment terms or delivery notes..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Manual Total Amount</label>
                                <div className="relative group/manual">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold group-focus-within/manual:text-primary transition-colors">₹</span>
                                    <input
                                        type="number"
                                        value={manualTotalAmount}
                                        onChange={e => setManualTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="Auto-calculated if empty"
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400">Overrides calculated total if set</p>
                            </div>
                        </div>
                    </div>

                    {/* Entry Options Card */}
                    <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-primary/50 transition-colors">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <ClipboardList className="w-4 h-4 text-success" /> Entry Options
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Receipt Mode</label>
                                <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-xl">
                                    <button
                                        onClick={() => setReceiptStatus('Received')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${receiptStatus === 'Received' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-500'}`}
                                    >
                                        Immediate
                                    </button>
                                    <button
                                        onClick={() => setReceiptStatus('Pending')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${receiptStatus === 'Pending' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-500'}`}
                                    >
                                        Pending
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Payment Terms</label>
                                <select
                                    value={paymentTerms}
                                    onChange={e => setPaymentTerms(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                >
                                    <option value="COD">COD (Cash on Delivery)</option>
                                    <option value="Net 15">Net 15 Days</option>
                                    <option value="Net 30">Net 30 Days</option>
                                    <option value="Net 60">Net 60 Days</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Ref Document</label>
                                <div className="relative group/ref">
                                    <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within/ref:text-success transition-colors" />
                                    <input
                                        type="text"
                                        value={referenceDoc}
                                        onChange={e => setReferenceDoc(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                        placeholder="PO#, Email Date..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Attachments</label>
                                <div className="flex gap-2">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-primary dark:hover:border-primary cursor-pointer transition-all group">
                                        <Paperclip className="w-4 h-4 text-neutral-400 group-hover:text-primary" />
                                        <span className="text-xs font-bold text-neutral-500 group-hover:text-primary">Upload</span>
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
                                        <div className="flex items-center gap-1 px-3 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl">
                                            <span className="text-xs font-bold">{attachments.length}</span>
                                        </div>
                                    )}
                                </div>
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-[10px] text-neutral-500 max-w-[120px] truncate">
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
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Items List</h3>
                            <div className="flex bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setShowPdfPanel(false)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        !showPdfPanel ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                                >
                                    Manual Entry
                                </button>
                                <button
                                    onClick={() => setShowPdfPanel(true)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                                        showPdfPanel ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                                >
                                    <FileUp className="w-3 h-3" /> PDF Import
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDesignSetModal(true)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Design Set
                            </button>
                            <button
                                onClick={addEmptyRow}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                    </div>

                    {/* PDF Import Panel */}
                    {showPdfPanel && (
                        <div className="border-b border-neutral-100 dark:border-neutral-700 p-6 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-start gap-6">
                                {/* Drop Zone */}
                                <label
                                    className="flex-shrink-0 w-56 h-36 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-sm cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type === 'application/pdf') parsePdfItems(file);
                                        else toast.error('Please drop a PDF file');
                                    }}
                                >
                                    <input
                                        ref={pdfInputRef}
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) parsePdfItems(file);
                                        }}
                                    />
                                    {isPdfParsing ? (
                                        <><Loader2 className="w-8 h-8 text-primary animate-spin" /><span className="text-xs font-bold text-primary">Parsing PDF...</span></>
                                    ) : pdfFileName ? (
                                        <><CheckCircle2 className="w-8 h-8 text-success" /><span className="text-xs font-bold text-emerald-600 text-center px-2 truncate max-w-[200px]">{pdfFileName}</span></>
                                    ) : (
                                        <><Upload className="w-8 h-8 text-primary group-hover:text-primary transition-colors" /><span className="text-xs font-bold text-primary group-hover:text-primary">Drop PDF here</span><span className="text-[10px] text-neutral-400">or click to browse</span></>
                                    )}
                                </label>

                                {/* Parse Results */}
                                <div className="flex-1">
                                    {!pdfParseResult && !isPdfParsing && (
                                        <div className="h-36 flex flex-col justify-center">
                                            <h4 className="font-bold text-neutral-700 dark:text-neutral-300 text-sm mb-1 flex items-center gap-2"><FileUp className="w-4 h-4 text-primary" /> PDF Items Import</h4>
                                            <p className="text-xs text-neutral-500 leading-relaxed">Upload a supplier <strong>invoice or packing list</strong> PDF. The system will automatically extract item names, quantities, and rates into the items table.</p>
                                            <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Works best with text-based PDFs. Scanned images are not supported.</p>
                                        </div>
                                    )}
                                    {pdfParseResult && (
                                        <div className="h-36 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                    Found <span className="text-primary">{pdfParseResult.items.length}</span> items in PDF
                                                </span>
                                                <button onClick={() => { setPdfParseResult(null); setPdfFileName(''); if (pdfInputRef.current) pdfInputRef.current.value = ''; }} className="text-[10px] text-neutral-400 hover:text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                                                {pdfParseResult.items.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-lg px-3 py-1.5 border border-neutral-100 dark:border-neutral-700 text-xs">
                                                        <span className="flex-1 font-medium text-neutral-700 dark:text-neutral-300 truncate">{item.product_name}</span>
                                                        <span className="text-neutral-400">Qty: <strong>{item.quantity}</strong></span>
                                                        <span className="text-neutral-400">₹<strong>{item.rate}</strong></span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={applyPdfItems}
                                                className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Import {pdfParseResult.items.length} Items into Table
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
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
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                {items.map((item, idx) => (
                                    <tr key={item.id || idx} className={`group hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors ${activeSearchRow === idx ? 'relative z-50' : ''}`}>
                                        <td className="px-6 py-4 text-neutral-400 font-medium">{idx + 1}</td>
                                        <td className={`px-6 py-4 relative ${activeSearchRow === idx ? 'z-50' : ''}`}>
                                            <input
                                                type="text"
                                                placeholder="Search item..."
                                                value={item.product_name}
                                                onFocus={() => { setActiveSearchRow(idx); setDropdownHighlightIndex(-1); }}
                                                onChange={e => {
                                                    updateItem(idx, 'product_name', e.target.value);
                                                    setActiveSearchRow(idx);
                                                    setDropdownHighlightIndex(-1);
                                                }}
                                                onKeyDown={e => {
                                                    if (activeSearchRow === idx && categories.length > 0) {
                                                        if (e.key === 'ArrowDown') {
                                                            e.preventDefault();
                                                            setDropdownHighlightIndex(prev => Math.min(prev + 1, categories.length - 1));
                                                        } else if (e.key === 'ArrowUp') {
                                                            e.preventDefault();
                                                            setDropdownHighlightIndex(prev => Math.max(prev - 1, 0));
                                                        } else if (e.key === 'Enter' && dropdownHighlightIndex >= 0) {
                                                            e.preventDefault();
                                                            handleCategorySelect(idx, categories[dropdownHighlightIndex]);
                                                        }
                                                    }
                                                }}
                                                className="w-full bg-transparent border-none outline-none font-medium placeholder:text-neutral-300 focus:placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100"
                                            />
                                            <div className="text-[10px] text-neutral-400 mt-1 flex gap-2">
                                                {item.category_name && (
                                                    <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-accent px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                                                        {item.category_name}
                                                    </span>
                                                )}
                                                {item.sku && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">SKU: {item.sku}</span>}
                                                {item.color && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">{item.color}</span>}
                                                {item.size && <span className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">{item.size}</span>}
                                            </div>

                                            {/* ─── Category Selection Dropdown for New Products ─── */}
                                            {activeSearchRow === idx && (
                                                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 rounded-sm shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 w-[300px] overflow-hidden"
                                                    onMouseDown={e => {
                                                        e.preventDefault(); // prevent input blur
                                                        e.stopPropagation(); // prevent window click-outside from firing
                                                    }}
                                                >
                                                    {/* Search hint */}
                                                    <div className="px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Search className="w-3.5 h-3.5 text-neutral-400" />
                                                            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                                                                Select Category for New Product
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Category list */}
                                                    <div className="max-h-56 overflow-y-auto p-2">
                                                        {categories.length > 0 ? (
                                                            categories.map((cat, catIdx) => (
                                                                <div
                                                                    key={cat.id}
                                                                    className={`px-3 py-2 cursor-pointer rounded-xl transition-colors flex items-center justify-between group ${dropdownHighlightIndex === catIdx ? 'bg-violet-100 dark:bg-violet-900/40' : 'hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCategorySelect(idx, cat);
                                                                    }}
                                                                >
                                                                    <div className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-violet-700 dark:group-hover:text-accent">{cat.name}</div>
                                                                    {cat.shortCode && <div className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">{cat.shortCode}</div>}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-center">
                                                                <p className="text-xs text-neutral-400">No category matched</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onFocus={e => e.target.select()}
                                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none font-medium text-neutral-700 dark:text-neutral-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onFocus={e => e.target.select()}
                                                onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none font-medium text-neutral-700 dark:text-neutral-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={item.tax_percent}
                                                onFocus={e => e.target.select()}
                                                onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-neutral-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col gap-1 items-end">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <span className="text-[10px] text-neutral-400 uppercase">Margin %</span>
                                                    <input
                                                        type="number"
                                                        value={item.margin || 0}
                                                        onFocus={e => e.target.select()}
                                                        onChange={e => {
                                                            const margin = parseFloat(e.target.value) || 0;
                                                            const sellingPrice = item.rate * (1 + margin / 100);
                                                            const newItems = [...items];
                                                            newItems[idx] = { ...item, margin, sellingPrice };
                                                            setItems(newItems);
                                                        }}
                                                        className="w-12 text-right text-xs bg-neutral-100 dark:bg-neutral-700 rounded px-1 py-0.5 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 justify-end">
                                                    <span className="text-[10px] text-green-600 font-bold">SP ₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.sellingPrice || 0}
                                                        onFocus={e => e.target.select()}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Tab' && !e.shiftKey && idx === items.length - 1) {
                                                                e.preventDefault();
                                                                addEmptyRow();
                                                                setTimeout(() => {
                                                                    const inputs = document.querySelectorAll('input[placeholder="Search item..."]');
                                                                    if (inputs && inputs.length > 0) {
                                                                        (inputs[inputs.length - 1] as HTMLElement).focus();
                                                                    }
                                                                }, 50);
                                                            }
                                                        }}
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
                                        <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white">
                                            ₹{item.line_total.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                                                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400">
                                                    <ShoppingBag className="w-6 h-6" />
                                                </div>
                                                <p className="text-neutral-500 font-medium">No items added yet</p>
                                                <button onClick={addEmptyRow} className="text-primary text-sm font-bold hover:underline">Start adding items</button>
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
                    <div className="w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                            </div>
                            {totalTax > 0 ? (
                                <>
                                    {isInterState ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-neutral-500">IGST Output</span>
                                            <span className="font-semibold text-neutral-900 dark:text-white">₹{igst.toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-neutral-500">CGST Output</span>
                                                <span className="font-semibold text-neutral-900 dark:text-white">₹{cgst.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-neutral-500">SGST Output</span>
                                                <span className="font-semibold text-neutral-900 dark:text-white">₹{sgst.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-500">Tax Total</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">₹{totalTax.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500 flex items-center gap-2"><Truck className="w-3 h-3" /> Shipping</span>
                                <input
                                    type="number"
                                    value={shippingAmount}
                                    onChange={e => setShippingAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                                />
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

export default PurchaseEntry;
