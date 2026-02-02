import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import JsBarcode from 'jsbarcode';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import Layout from "../../../components/shared/Layout/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { getAllItems } from "../../../redux/slices/inventorySlice";
import { Product } from "../../../types/product";
import { RootState, AppDispatch } from "../../../redux/store";

interface BarcodeFormData {
    itemName: string;
    sku: string;
    price: string | number;
    barcodeType: string;
    quantity: number;
    paperSize: string;
    includePrice: boolean;
    includeName: boolean;
}

const BarcodeGenerator = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items: inventoryItems } = useSelector((state: RootState) => state.inventory);

    const [formData, setFormData] = useState<BarcodeFormData>({
        itemName: '',
        sku: '',
        price: '',
        barcodeType: 'CODE128',
        quantity: 1,
        paperSize: 'A4',
        includePrice: true,
        includeName: true
    });

    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState('');
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [selectedInventoryItems, setSelectedInventoryItems] = useState<Product[]>([]);
    const [bulkGenerated, setBulkGenerated] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Updated refs to be more specific
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const bulkBarcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

    const barcodeTypes = ['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR Code'];
    const paperSizes = ['A4', 'Letter', 'Label 40x20mm', 'Label 50x25mm', 'Label 60x30mm'];

    // Fetch inventory items on mount
    useEffect(() => {
        dispatch(getAllItems());
    }, [dispatch]);

    // Helpers: EAN13 and UPC-A checksum
    const computeEAN13CheckDigit = (digits12: string) => {
        const nums = digits12.split('').map((d) => parseInt(d, 10));
        const sum = nums.reduce((acc, n, idx) => acc + n * (idx % 2 === 0 ? 1 : 3), 0);
        const cd = (10 - (sum % 10)) % 10;
        return String(cd);
    };

    const computeUPCACheckDigit = (digits11: string) => {
        const nums = digits11.split('').map((d) => parseInt(d, 10));
        const oddSum = nums.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0); // positions 1,3,5,...
        const evenSum = nums.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0); // positions 2,4,6,...
        const total = oddSum * 3 + evenSum;
        const cd = (10 - (total % 10)) % 10;
        return String(cd);
    };

    // Ensure preview renders whenever generated data changes
    useEffect(() => {
        if (!generated) return;
        if (formData.barcodeType === 'QR Code') return; // QR renders via component
        if (!barcodeRef.current) return;

        try {
            // Prepare value per type
            let format = formData.barcodeType === 'UPC' ? 'UPC' : formData.barcodeType;
            let value = (formData.sku || '').replace(/\s/g, '');
            if (!value) return;

            if (format === 'CODE39') {
                value = value.toUpperCase();
            } else if (format === 'EAN13') {
                if (/^\d{12}$/.test(value)) {
                    value = value + computeEAN13CheckDigit(value);
                } else if (/^\d{13}$/.test(value)) {
                    const cd = computeEAN13CheckDigit(value.slice(0, 12));
                    if (cd !== value[12]) {
                        throw new Error('Invalid EAN13 checksum');
                    }
                }
            } else if (format === 'UPC') {
                if (/^\d{11}$/.test(value)) {
                    value = value + computeUPCACheckDigit(value);
                } else if (/^\d{12}$/.test(value)) {
                    const cd = computeUPCACheckDigit(value.slice(0, 11));
                    if (cd !== value[11]) {
                        throw new Error('Invalid UPC checksum');
                    }
                }
            }

            // Clear and redraw
            if (barcodeRef.current) {
                barcodeRef.current.innerHTML = '';
                JsBarcode(barcodeRef.current, value, {
                    format,
                    width: 2,
                    height: 100,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                });
            }
        } catch (e: any) {
            console.error('Preview render error:', e);
            setError(e.message);
        }
    }, [generated, formData.sku, formData.barcodeType]);

    // Validation functions
    const validateBarcode = (value: string, type: string) => {
        if (!value || value.trim() === '') {
            return 'Please enter a SKU/Barcode value';
        }

        switch (type) {
            case 'CODE39':
                // CODE39 will auto-uppercase, so just check for valid characters after conversion
                {
                    const upperValue = value.toUpperCase();
                    // Allow A-Z, 0-9, space, and - . $ / + % characters
                    const code39Allowed = /^[A-Z0-9 \-.$/+%]+$/;
                    if (!code39Allowed.test(upperValue)) {
                        return 'CODE39 only supports letters, numbers, spaces and - . $ / + %';
                    }
                }
                break;
            case 'EAN13':
                {
                    const ean = value.replace(/\s/g, '');
                    if (!/^\d{12,13}$/.test(ean)) {
                        return 'EAN13 requires 12 or 13 digits';
                    }
                }
                break;
            case 'UPC':
                {
                    const upc = value.replace(/\s/g, '');
                    if (!/^\d{11,12}$/.test(upc)) {
                        return 'UPC requires 11 or 12 digits';
                    }
                }
                break;
            case 'CODE128':
                // CODE128 supports ASCII characters
                if (value.length > 80) {
                    return 'CODE128 maximum length is 80 characters';
                }
                break;
            case 'QR Code':
                if (value.length > 2953) {
                    return 'QR Code maximum length is 2953 characters';
                }
                break;
        }
        return null;
    };

    // Generate barcode when SKU or type changes (single mode)
    const generateBarcode = () => {
        console.log('Generate button clicked!', { sku: formData.sku, type: formData.barcodeType });

        const validationError = validateBarcode(formData.sku, formData.barcodeType);
        if (validationError) {
            console.log('Validation error:', validationError);
            setError(validationError);
            setGenerated(false);
            return;
        }

        setError('');
        setBulkGenerated(false); // Clear bulk mode when generating single

        try {
            // Flip preview to generated state first so the SVG exists
            setGenerated(true);

            if (formData.barcodeType === 'QR Code') {
                console.log('Generating QR Code');
                // QR renders via component; nothing else to do
            } else {
                // Actual drawing is handled by the preview useEffect after state update
                let format = formData.barcodeType === 'UPC' ? 'UPC' : formData.barcodeType;
                let value = (formData.sku || '').replace(/\s/g, '');
                if (format === 'CODE39') value = value.toUpperCase();
                if (format === 'EAN13' && /^\d{12}$/.test(value)) value = value + computeEAN13CheckDigit(value);
                if (format === 'UPC' && /^\d{11}$/.test(value)) value = value + computeUPCACheckDigit(value);
                console.log('Generating barcode (deferred draw):', { format, value });
            }
        } catch (err: any) {
            console.error('Barcode generation error:', err);
            setError(`Failed to generate barcode: ${err.message}`);
            setGenerated(false);
        }
    };

    // Generate barcodes from selected inventory items
    const handleGenerateBulkBarcodes = () => {
        if (selectedInventoryItems.length === 0) {
            setError('Please select at least one item');
            return;
        }

        setError('');
        setShowInventoryModal(false);

        // Reset refs and mark bulk as generated so preview mounts immediately
        bulkBarcodeRefs.current = [];
        setBulkGenerated(true);

        // QR bulk preview auto-renders via QRCodeCanvas; nothing else needed
        if (formData.barcodeType === 'QR Code') return;

        // For 1D barcodes, draw after DOM paints
        requestAnimationFrame(() => {
            try {
                selectedInventoryItems.forEach((item, index) => {
                    const ref = bulkBarcodeRefs.current[index];
                    if (ref && item.sku) {
                        const format = formData.barcodeType === 'UPC' ? 'UPC' : formData.barcodeType || 'CODE128';
                        let value = String(item.sku).replace(/\s/g, '');
                        if (format === 'CODE39') value = value.toUpperCase();
                        if (format === 'EAN13' && /^\d{12}$/.test(value)) value += computeEAN13CheckDigit(value);
                        if (format === 'UPC' && /^\d{11}$/.test(value)) value += computeUPCACheckDigit(value);
                        JsBarcode(ref, value, {
                            format,
                            width: 2,
                            height: 80,
                            displayValue: true,
                            fontSize: 12,
                            margin: 5,
                        });
                    }
                });
            } catch (err: any) {
                setError(`Failed to generate bulk barcodes: ${err.message}`);
            }
        });
    };

    // Unified generate handler: single if no bulk selection, else bulk
    const handleGenerateClick = () => {
        if (selectedInventoryItems.length > 0) {
            handleGenerateBulkBarcodes();
        } else {
            generateBarcode();
        }
    };

    // Handle inventory item selection
    const handleInventoryItemToggle = (item: Product) => {
        setSelectedInventoryItems(prev => {
            const exists = prev.find(i => i._id === item._id);
            if (exists) {
                return prev.filter(i => i._id !== item._id);
            } else {
                return [...prev, item];
            }
        });
    };

    // Filter inventory items
    const filteredInventoryItems = inventoryItems.filter((item: Product) => {
        const nameMatch = item.name ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const skuMatch = item.sku ? item.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return nameMatch || skuMatch;
    });

    // Handle print (use same grid as PDF and open print dialog)
    const handlePrint = () => {
        if (!generated && !bulkGenerated) {
            setError('Please generate a barcode first');
            return;
        }

        try {
            // @ts-ignore - jsPDF types might mismatch depending on version/types installed
            const pdf = new jsPDF({ unit: 'mm', format: formData.paperSize === 'Letter' ? 'letter' : 'a4' });

            const getLabelSpec = () => {
                const margin = { x: 8, y: 10 };
                const gap = { x: 4, y: 6 };
                if (formData.paperSize.startsWith('Label')) {
                    const parts = formData.paperSize.match(/(\d+)x(\d+)/);
                    const w = parts ? parseInt(parts[1], 10) : 50;
                    const h = parts ? parseInt(parts[2], 10) : 25;
                    return { labelW: w, labelH: h, margin, gap };
                }
                return { labelW: 65, labelH: 35, margin, gap };
            };

            const spec = getLabelSpec();
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const cols = Math.max(1, Math.floor((pageW - 2 * spec.margin.x + spec.gap.x) / (spec.labelW + spec.gap.x)));
            const rows = Math.max(1, Math.floor((pageH - 2 * spec.margin.y + spec.gap.y) / (spec.labelH + spec.gap.y)));

            const drawLabel = (x: number, y: number, price: string | number | undefined, name: string | undefined, value: string | undefined, type: string, qrCanvasOverride?: HTMLCanvasElement) => {
                if (formData.includePrice && price) {
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(String(price), x + spec.labelW / 2, y + 6, { align: 'center' });
                }

                if (type === 'QR Code') {
                    const qrCanvas = qrCanvasOverride || qrRef.current?.querySelector('canvas');
                    if (!qrCanvas) throw new Error('QR preview not available. Click Generate first.');
                    const imgData = qrCanvas.toDataURL('image/png');
                    const availH = spec.labelH - (formData.includePrice ? 14 : 6) - (formData.includeName ? 10 : 0);
                    const side = Math.min(spec.labelW - 10, Math.max(16, availH));
                    const qx = x + (spec.labelW - side) / 2;
                    const qy = y + (formData.includePrice ? 8 : 4);
                    pdf.addImage(imgData, 'PNG', qx, qy, side, side);
                } else {
                    const canvas = document.createElement('canvas');
                    let format = type === 'UPC' ? 'UPC' : type;
                    let codeVal = (value || '').replace(/\s/g, '');
                    if (format === 'CODE39') codeVal = codeVal.toUpperCase();
                    if (format === 'EAN13' && /^\d{12}$/.test(codeVal)) codeVal += computeEAN13CheckDigit(codeVal);
                    if (format === 'UPC' && /^\d{11}$/.test(codeVal)) codeVal += computeUPCACheckDigit(codeVal);
                    JsBarcode(canvas, codeVal, { format, width: 2, height: 70, displayValue: true, fontSize: 12, margin: 6 });
                    const imgData = canvas.toDataURL('image/png');
                    const barcodeWmm = spec.labelW - 10;
                    const barcodeHmm = spec.labelH - (formData.includePrice ? 16 : 8) - (formData.includeName ? 10 : 0);
                    const bx = x + (spec.labelW - barcodeWmm) / 2;
                    const by = y + (formData.includePrice ? 8 : 4);
                    pdf.addImage(imgData, 'PNG', bx, by, barcodeWmm, Math.max(12, barcodeHmm));
                }

                if (formData.includeName && name) {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(String(name), x + spec.labelW / 2, y + spec.labelH - 2, { align: 'center' });
                }
            };

            const placeLabels = (items: any[], qrCanvases?: (HTMLCanvasElement | undefined)[]) => {
                let col = 0, row = 0;
                const qrCount = qrCanvases ? qrCanvases.length : 0;
                items.forEach((it, idx) => {
                    const x = spec.margin.x + col * (spec.labelW + spec.gap.x);
                    const y = spec.margin.y + row * (spec.labelH + spec.gap.y);
                    const qrCanvas = qrCount ? qrCanvases![idx % qrCount] : undefined;
                    drawLabel(x, y, it.price, it.name, it.code, it.type, qrCanvas);
                    col++;
                    if (col >= cols) { col = 0; row++; }
                    if (row >= rows) { pdf.addPage(); row = 0; col = 0; }
                });
            };

            if (bulkGenerated && selectedInventoryItems.length > 0) {
                const copies = Math.max(1, Number(formData.quantity) || 1);
                const baseItems = selectedInventoryItems.filter(i => !!i.sku).map((item) => ({
                    price: item.sellingPrice,
                    name: item.name,
                    code: item.sku,
                    type: formData.barcodeType,
                }));
                const items = Array.from({ length: copies }, () => baseItems).flat();
                const qrNodes = printRef.current?.querySelectorAll('.bulk-qr-canvas');
                const qrCanvases = formData.barcodeType === 'QR Code'
                    ? Array.from(qrNodes || []) as HTMLCanvasElement[]
                    : undefined;
                placeLabels(items, qrCanvases);
            } else {
                const items = Array.from({ length: Math.max(1, Number(formData.quantity) || 1) }, () => ({
                    price: formData.price,
                    name: formData.itemName,
                    code: formData.sku,
                    type: formData.barcodeType,
                }));
                placeLabels(items);
            }

            pdf.autoPrint();
            pdf.output('dataurlnewwindow');
        } catch (err: any) {
            console.error('Print generation error:', err);
            setError(`Failed to prepare print: ${err.message}`);
        }
    };

    // Handle PDF download (grid-aware)
    const handleDownloadPDF = () => {
        if (!generated && !bulkGenerated) {
            setError('Please generate a barcode first');
            return;
        }

        try {
            // @ts-ignore
            const pdf = new jsPDF({ unit: 'mm', format: formData.paperSize === 'Letter' ? 'letter' : 'a4' });

            const getLabelSpec = () => {
                const margin = { x: 8, y: 10 };
                const gap = { x: 4, y: 6 };
                if (formData.paperSize.startsWith('Label')) {
                    const parts = formData.paperSize.match(/(\d+)x(\d+)/);
                    const w = parts ? parseInt(parts[1], 10) : 50;
                    const h = parts ? parseInt(parts[2], 10) : 25;
                    return { labelW: w, labelH: h, margin, gap };
                }
                return { labelW: 65, labelH: 35, margin, gap };
            };

            const spec = getLabelSpec();
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const cols = Math.max(1, Math.floor((pageW - 2 * spec.margin.x + spec.gap.x) / (spec.labelW + spec.gap.x)));
            const rows = Math.max(1, Math.floor((pageH - 2 * spec.margin.y + spec.gap.y) / (spec.labelH + spec.gap.y)));

            const drawLabel = (x: number, y: number, price: string | number | undefined, name: string | undefined, value: string | undefined, type: string, qrCanvasOverride?: HTMLCanvasElement) => {
                if (formData.includePrice && price) {
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(String(price), x + spec.labelW / 2, y + 6, { align: 'center' });
                }

                if (type === 'QR Code') {
                    const qrCanvas = qrCanvasOverride || qrRef.current?.querySelector('canvas');
                    if (!qrCanvas) throw new Error('QR preview not available. Click Generate first.');
                    const imgData = qrCanvas.toDataURL('image/png');
                    const availH = spec.labelH - (formData.includePrice ? 14 : 6) - (formData.includeName ? 10 : 0);
                    const side = Math.min(spec.labelW - 10, Math.max(16, availH));
                    const qx = x + (spec.labelW - side) / 2;
                    const qy = y + (formData.includePrice ? 8 : 4);
                    pdf.addImage(imgData, 'PNG', qx, qy, side, side);
                } else {
                    const canvas = document.createElement('canvas');
                    let format = type === 'UPC' ? 'UPC' : type;
                    let codeVal = (value || '').replace(/\s/g, '');
                    if (format === 'CODE39') codeVal = codeVal.toUpperCase();
                    if (format === 'EAN13' && /^\d{12}$/.test(codeVal)) codeVal += computeEAN13CheckDigit(codeVal);
                    if (format === 'UPC' && /^\d{11}$/.test(codeVal)) codeVal += computeUPCACheckDigit(codeVal);
                    JsBarcode(canvas, codeVal, { format, width: 2, height: 70, displayValue: true, fontSize: 12, margin: 6 });
                    const imgData = canvas.toDataURL('image/png');
                    const barcodeWmm = spec.labelW - 10;
                    const barcodeHmm = spec.labelH - (formData.includePrice ? 16 : 8) - (formData.includeName ? 10 : 0);
                    const bx = x + (spec.labelW - barcodeWmm) / 2;
                    const by = y + (formData.includePrice ? 8 : 4);
                    pdf.addImage(imgData, 'PNG', bx, by, barcodeWmm, Math.max(12, barcodeHmm));
                }

                if (formData.includeName && name) {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(String(name), x + spec.labelW / 2, y + spec.labelH - 2, { align: 'center' });
                }
            };

            const placeLabels = (items: any[], qrCanvases?: (HTMLCanvasElement | undefined)[]) => {
                let col = 0, row = 0;
                const qrCount = qrCanvases ? qrCanvases.length : 0;
                items.forEach((it, idx) => {
                    const x = spec.margin.x + col * (spec.labelW + spec.gap.x);
                    const y = spec.margin.y + row * (spec.labelH + spec.gap.y);
                    const qrCanvas = qrCount ? qrCanvases![idx % qrCount] : undefined;
                    drawLabel(x, y, it.price, it.name, it.code, it.type, qrCanvas);
                    col++;
                    if (col >= cols) { col = 0; row++; }
                    if (row >= rows) { pdf.addPage(); row = 0; col = 0; }
                });
            };

            if (bulkGenerated && selectedInventoryItems.length > 0) {
                const copies = Math.max(1, Number(formData.quantity) || 1);
                const baseItems = selectedInventoryItems.filter(i => !!i.sku).map((item) => ({
                    price: item.sellingPrice,
                    name: item.name,
                    code: item.sku,
                    type: formData.barcodeType,
                }));
                const items = Array.from({ length: copies }, () => baseItems).flat();
                const qrNodes = printRef.current?.querySelectorAll('.bulk-qr-canvas');
                const qrCanvases = formData.barcodeType === 'QR Code'
                    ? Array.from(qrNodes || []) as HTMLCanvasElement[]
                    : undefined;
                placeLabels(items, qrCanvases);
                pdf.save(`barcodes_bulk_${items.length}_labels.pdf`);
            } else {
                const items = Array.from({ length: Math.max(1, Number(formData.quantity) || 1) }, () => ({
                    price: formData.price,
                    name: formData.itemName,
                    code: formData.sku,
                    type: formData.barcodeType,
                }));
                placeLabels(items);
                pdf.save(`barcode_${formData.sku || 'output'}.pdf`);
            }
        } catch (err: any) {
            console.error('PDF generation error:', err);
            setError(`Failed to generate PDF: ${err.message}`);
        }
    };

    return (
        <Layout>
            <PageHeader
                title="Barcode Generator"
                description="Generate and print barcodes for your products"
                actions={[
                    <button
                        key="print"
                        onClick={handlePrint}
                        disabled={!generated && !bulkGenerated}
                        className="btn-interactive px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Print Barcodes
                    </button>
                ]}
            />

            {error && (
                <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-lg text-rose-700 dark:text-rose-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Barcode Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Item Name</label>
                                <input
                                    type="text"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                    placeholder="Enter item name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">SKU / Barcode Number *</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => {
                                        setFormData({ ...formData, sku: e.target.value });
                                        setGenerated(false);
                                    }}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                    placeholder="Enter SKU"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Price</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Barcode Type</label>
                                <select
                                    value={formData.barcodeType}
                                    onChange={(e) => {
                                        setFormData({ ...formData, barcodeType: e.target.value });
                                        setGenerated(false);
                                        setBulkGenerated(false);
                                    }}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                >
                                    {barcodeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Paper Size</label>
                                <select
                                    value={formData.paperSize}
                                    onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
                                    className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main"
                                >
                                    {paperSizes.map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Print Options</h2>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includeName}
                                    onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                    className="w-5 h-5 text-primary rounded border-default focus:ring-primary"
                                />
                                <span className="text-secondary">Include Item Name</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includePrice}
                                    onChange={(e) => setFormData({ ...formData, includePrice: e.target.checked })}
                                    className="w-5 h-5 text-primary rounded border-default focus:ring-primary"
                                />
                                <span className="text-secondary">Include Price</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Bulk Generate from Items</h2>
                        <p className="text-secondary mb-4">Generate barcodes for multiple items at once</p>
                        <button
                            onClick={() => setShowInventoryModal(true)}
                            className="btn-interactive px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Select Items from Inventory
                        </button>

                        {selectedInventoryItems.length > 0 && (
                            <div className="mt-4 p-3 bg-primary-soft rounded-lg">
                                <p className="text-sm text-primary font-medium">
                                    <strong>{selectedInventoryItems.length}</strong> items selected
                                </p>
                                {bulkGenerated && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ Barcodes generated successfully</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Preview</h2>
                        <div className="border-2 border-dashed border-default rounded-lg p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
                            {bulkGenerated ? (
                                <div className="w-full max-h-[400px] overflow-y-auto" ref={printRef}>
                                    <div className="barcode-container grid grid-cols-1 gap-4">
                                        {selectedInventoryItems.map((item, index) => (
                                            <div key={item._id} className="barcode-item border border-default p-3 rounded bg-surface">
                                                {item.sku ? (
                                                    formData.barcodeType === 'QR Code' ? (
                                                        <QRCodeCanvas
                                                            className="bulk-qr-canvas"
                                                            value={String(item.sku)}
                                                            size={160}
                                                            includeMargin
                                                            level="M"
                                                        />
                                                    ) : (
                                                        <svg ref={el => { bulkBarcodeRefs.current[index] = el; }}></svg>
                                                    )
                                                ) : (
                                                    <p className="text-xs text-error">No SKU</p>
                                                )}
                                                {formData.includeName && (
                                                    <p className="text-xs font-medium text-main mt-2">{item.name}</p>
                                                )}
                                                {formData.includePrice && (
                                                    <p className="text-sm font-bold text-main">₹{item.sellingPrice}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : generated ? (
                                <div className="w-full" ref={printRef}>
                                    <div className="barcode-container">
                                        <div className="barcode-item">
                                            {formData.barcodeType === 'QR Code' ? (
                                                <div ref={qrRef}>
                                                    <QRCodeCanvas
                                                        value={formData.sku}
                                                        size={192}
                                                        level="M"
                                                        includeMargin={true}
                                                    />
                                                </div>
                                            ) : (
                                                <svg ref={barcodeRef}></svg>
                                            )}
                                            {formData.includeName && formData.itemName && (
                                                <p className="text-sm font-medium text-main mt-2">{formData.itemName}</p>
                                            )}
                                            {formData.includePrice && formData.price && (
                                                <p className="text-lg font-bold text-main">₹{formData.price}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="inline-block bg-card p-4 border-2 border-default rounded-lg mb-4">
                                        <svg className="w-48 h-24 mx-auto" viewBox="0 0 200 100">
                                            <rect x="10" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="18" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="24" y="20" width="6" height="60" fill="#ccc" />
                                            <rect x="34" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="40" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="48" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="54" y="20" width="6" height="60" fill="#ccc" />
                                            <rect x="64" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="72" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="78" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="86" y="20" width="6" height="60" fill="#ccc" />
                                            <rect x="96" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="102" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="110" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="116" y="20" width="6" height="60" fill="#ccc" />
                                            <rect x="126" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="134" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="140" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="148" y="20" width="6" height="60" fill="#ccc" />
                                            <rect x="158" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="164" y="20" width="4" height="60" fill="#ccc" />
                                            <rect x="172" y="20" width="2" height="60" fill="#ccc" />
                                            <rect x="178" y="20" width="6" height="60" fill="#ccc" />
                                            <text x="100" y="95" textAnchor="middle" fontSize="12" fill="#999">Sample</text>
                                        </svg>
                                    </div>
                                    <p className="text-sm text-muted">Enter SKU and click Generate</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleGenerateClick}
                                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed transition-colors"
                                disabled={!formData.sku && selectedInventoryItems.length === 0}
                            >
                                Generate Barcode
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!generated && !bulkGenerated}
                                className="w-full py-3 border border-default text-secondary rounded-lg hover:bg-surface disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Download as PDF
                            </button>
                            {bulkGenerated && (
                                <button
                                    onClick={() => {
                                        setSelectedInventoryItems([]);
                                        setBulkGenerated(false);
                                    }}
                                    className="w-full py-3 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                    Clear Bulk Selection
                                </button>
                            )}
                        </div>

                        {/* Format hints */}
                        {!bulkGenerated && (
                            <div className="mt-6 p-4 bg-primary-soft rounded-lg border border-primary/10">
                                <p className="text-xs text-primary font-bold mb-2 uppercase tracking-wider">Format Guidelines:</p>
                                <ul className="text-xs text-secondary space-y-1">
                                    {formData.barcodeType === 'CODE128' && <li>• Any text up to 80 chars</li>}
                                    {formData.barcodeType === 'CODE39' && <li>• Letters, numbers, -.$/ +% (auto-uppercase)</li>}
                                    {formData.barcodeType === 'EAN13' && <li>• 12 or 13 digits only</li>}
                                    {formData.barcodeType === 'UPC' && <li>• 11 or 12 digits only</li>}
                                    {formData.barcodeType === 'QR Code' && <li>• Any text up to 2953 chars</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inventory Selection Modal */}
            {showInventoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-default">
                        <div className="p-6 border-b border-default flex justify-between items-center bg-surface">
                            <div>
                                <h2 className="text-xl font-black text-main tracking-tight">Select Items from Inventory</h2>
                                <p className="text-sm text-secondary mt-1 font-medium">Choose items to generate barcodes</p>
                            </div>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="text-secondary hover:text-main text-2xl transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 border-b border-default">
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-input border border-default rounded-xl focus:ring-2 focus:ring-primary text-main transition-all"
                            />
                        </div>

                        <div className="overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredInventoryItems.map((item: Product) => (
                                    <div
                                        key={item._id}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedInventoryItems.find(i => i._id === item._id)
                                            ? 'border-primary bg-primary-soft ring-1 ring-primary/20'
                                            : 'border-default bg-card hover:border-primary/50 hover:shadow-md'
                                            }`}
                                        onClick={() => handleInventoryItemToggle(item)}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                checked={!!selectedInventoryItems.find(i => i._id === item._id)}
                                                readOnly
                                                className="w-5 h-5 text-primary rounded border-default"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-main">{item.name}</p>
                                                <p className="text-xs text-secondary font-medium mt-0.5">SKU: {item.sku || 'N/A'}</p>
                                                <p className="text-sm font-black text-primary mt-1">₹{item.sellingPrice}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredInventoryItems.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-muted">
                                        No items found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-default bg-surface flex justify-end items-center space-x-4">
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="px-6 py-2 text-secondary hover:text-main font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateBulkBarcodes}
                                className="btn-interactive px-8 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25"
                            >
                                Generate for {selectedInventoryItems.length} Items
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BarcodeGenerator;
