import React, { useState, useRef, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Settings, Layout, Type, Copy, AlertTriangle } from 'lucide-react';
import { Product } from '../../types/product';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useConfig } from '../ConfigContext'; // Verify path
import BarcodeGenerator from '../BarcodeGenerator';

interface LabelPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[]; // Selected products
    onPrintComplete?: () => void; // Callback after printing
}

interface PrintConfig {
    width: number; // mm
    height: number; // mm
    type: 'THERMAL' | 'A4_GRID';
    cols: number; // Labels per row
    // copies: number; // Removed global copies in favor of per-product
    showName: boolean;
    showPrice: boolean;
    showSku: boolean;
    showVariant: boolean; // Size/Color
    gap: number; // mm (for thermal)
}

const DEFAULT_CONFIG: PrintConfig = {
    width: 50,
    height: 30,
    type: 'THERMAL',
    cols: 1,
    showName: true,
    showPrice: true,
    showSku: true,
    showVariant: true,
    gap: 2
};

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, products = [], onPrintComplete }) => {
    const [config, setConfig] = useState<PrintConfig>(() => {
        const saved = localStorage.getItem('labelPrintConfig');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    const handleCancel = () => {
        setConfig(DEFAULT_CONFIG);
        onClose();
    };



    const { tenantId } = useConfig();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const currentTenant = tenants.find(t => t.id === tenantId);

    // Header Info
    const tenantName = currentTenant?.name || 'Store Name';
    const tenantPhone = currentTenant?.companyDetails?.phone || '';

    useEffect(() => {
    }, [config]);



    // Auto-resize width when columns change
    useEffect(() => {
        // Only auto-resize if we have a valid column count
        if (config.cols < 1) return;

        const gap = config.gap;
        const pageContentWidth = config.type === 'A4_GRID' ? 190 : (config.width * config.cols); // A4: 210-20mm margin. Thermal: current total width? 
        // Actually for thermal, if they increase cols, they probably mean on the same roll width. 
        // Let's assume standard A4 auto-calc logic mainly.

        if (config.type === 'A4_GRID') {
            const availableWidth = 210 - 20; // 10mm margin each side
            const newWidth = Math.floor((availableWidth - ((config.cols - 1) * gap)) / config.cols);
            if (newWidth !== config.width) {
                setConfig(c => ({ ...c, width: newWidth }));
            }
        }
    }, [config.cols, config.type]); // Depend on cols/type to trigger resize

    // Per-product quantity state
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Initialize quantities when products change
    useEffect(() => {
        const initialQuantities: Record<string, number> = {};
        (products || []).forEach(p => {
            // Use stock if available and > 0, else 1
            initialQuantities[p.id] = (p.stock && p.stock > 0) ? p.stock : 1;
        });
        setQuantities(initialQuantities);
    }, [products]);

    const handleQuantityChange = (id: string, val: number) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(0, val)
        }));
    };

    const printRef = useRef<HTMLDivElement>(null);

    const itemsToPrint = useMemo(() => {
        return (products || []).flatMap(p => {
            const qty = quantities[p.id] || 0;
            return Array(qty).fill(p);
        });
    }, [products, quantities]);

    const totalLabels = itemsToPrint.length;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey && itemsToPrint.length > 0) {
                e.preventDefault();
                handlePrint();
            }
            if (e.key === 'Escape') {
                handleCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, itemsToPrint.length]);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;

        const printWindow = window.open('', '_blank', `width=800,height=800`);
        if (!printWindow) return;

        // Dynamic CSS based on config
        const pageSize = config.type === 'THERMAL'
            ? `@page { size: ${config.width}mm ${config.height}mm; margin: 0; }`
            : `@page { size: A4; margin: 10mm; }`;

        const itemStyle = `
                width: 100%; /* Let Grid control width */
                height: ${config.height}mm;
                border: ${config.type === 'A4_GRID' ? '1px dashed #ddd' : 'none'};
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-sizing: border-box;
                padding: 1mm;
                font-size: 8px; /* Base font size */
                /* Avoid breaking inside label */
                page-break-inside: avoid; 
                break-inside: avoid;
                background: white;
            `;

        const containerStyle = `
            display: grid;
            grid-template-columns: repeat(${config.cols}, 1fr);
            gap: ${config.gap}mm;
            width: 100%;
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Labels</title>
                    <style>
                        ${pageSize}
                        body { margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .label-container { ${containerStyle} }
                        .label-item { ${itemStyle} }
                        
                        /* Internal Layout Classes */
                        /* Internal Layout Classes */
                        .active-area { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; overflow: hidden; }
                        
                        /* Text Utilities */
                        .t-name { font-weight: bold; text-transform: uppercase; font-size: 10px; line-height: 1.1; max-height: 2.2em; overflow: hidden; text-align: center; }
                        .t-price { font-weight: bold; font-size: 14px; margin: 1mm 0; text-align: center; }
                        .t-sku { font-size: 8px; color: #000; text-align: center; font-family: monospace; }
                        
                        h3 { margin: 0; }
                        
                        /* Text Utilities */
                        .t-name { font-weight: bold; text-transform: uppercase; font-size: 9px; line-height: 1.1; max-height: 2.2em; overflow: hidden; }
                        .t-meta { font-size: 7px; color: #444; }
                        .t-price { font-weight: bold; font-size: 11px; margin-top: 1mm; }
                        .t-small { font-size: 6px; color: #666; }
                        
                        h3 { margin: 0; }
                        p { margin: 0; line-height: 1.2; }
                        
                        @media print {
                            .label-item { border: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        ${content}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        // Call completion handler if provided
        if (onPrintComplete) {
            onPrintComplete();
        }
    };

    if (!isOpen) return null;

    // Expanded itemsToPrint is now memoized above

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-5xl h-[85vh] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl flex overflow-hidden">

                {/* Left Sidebar: Controls */}
                <div className="w-80 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                            <Settings size={18} /> Configuration
                        </h3>
                    </div>

                    {products.length === 0 ? (
                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-neutral-500">
                            <AlertTriangle size={32} className="mb-2 text-warning" />
                            <p className="font-medium">No Products Selected</p>
                            <p className="text-xs mt-1">Please select products from the inventory list to print labels.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Layout */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Layout size={12} /> Layout Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setConfig(c => ({ ...c, type: 'THERMAL' }))}
                                        className={`p-2 text-sm rounded border ${config.type === 'THERMAL' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'}`}
                                    >
                                        Thermal Roll
                                    </button>
                                    <button
                                        onClick={() => setConfig(c => ({ ...c, type: 'A4_GRID' }))}
                                        className={`p-2 text-sm rounded border ${config.type === 'A4_GRID' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'}`}
                                    >
                                        A4 Sheet
                                    </button>
                                </div>
                            </div>



                            {/* Columns */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Layout size={12} /> Columns per Row</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setConfig(c => ({ ...c, cols: n }))}
                                            className={`w-8 h-8 flex items-center justify-center text-sm rounded border ${config.cols === n ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Layout size={12} /> Size (mm)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-xs text-neutral-400">Width</span>
                                        <input type="number" value={config.width} onChange={e => setConfig(c => ({ ...c, width: Number(e.target.value) }))} className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-neutral-400">Height</span>
                                        <input type="number" value={config.height} onChange={e => setConfig(c => ({ ...c, height: Number(e.target.value) }))} className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { w: 30, h: 30, l: '3x3cm' },
                                        { w: 40, h: 60, l: '4x6cm' },
                                        { w: 50, h: 25, l: '5x2.5cm' }
                                    ].map(s => (
                                        <button key={s.l} onClick={() => setConfig(c => ({ ...c, width: s.w, height: s.h }))} className="px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">
                                            {s.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Type size={12} /> Content</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={config.showName} onChange={e => setConfig(c => ({ ...c, showName: e.target.checked }))} className="rounded text-primary focus:ring-primary" />
                                        <span>Product Name</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={config.showPrice} onChange={e => setConfig(c => ({ ...c, showPrice: e.target.checked }))} className="rounded text-primary focus:ring-primary" />
                                        <span>Price</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={config.showSku} onChange={e => setConfig(c => ({ ...c, showSku: e.target.checked }))} className="rounded text-primary focus:ring-primary" />
                                        <span>SKU / Barcode</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={config.showVariant} onChange={e => setConfig(c => ({ ...c, showVariant: e.target.checked }))} className="rounded text-primary focus:ring-primary" />
                                        <span>Size / Color</span>
                                    </label>
                                </div>
                            </div>

                            {/* Product Quantities List */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Copy size={12} /> Quantities</label>
                                <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-700 bg-white dark:bg-neutral-800">
                                    {products.map(p => (
                                        <div key={p.id} className="p-2 flex items-center justify-between text-sm">
                                            <div className="truncate flex-1 pr-2">
                                                <div className="font-medium text-neutral-700 dark:text-neutral-300 truncate" title={p.name}>{p.name}</div>
                                                <div className="text-xs text-neutral-500">Stock: {p.stock}</div>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                value={quantities[p.id] ?? 0}
                                                onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 0)}
                                                className="w-16 p-1 text-right border rounded bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {/* Summary */}
                                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold">
                                    <span>Total Labels:</span>
                                    <span>{totalLabels}</span>
                                </div>
                            </div>

                        </div>
                    )}

                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-3">
                        <button
                            onClick={handlePrint}
                            disabled={totalLabels === 0}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                        >
                            <Printer size={18} /> Print {totalLabels} Labels
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-full py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg font-bold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Right Area: Preview */}
                <div className="flex-1 flex flex-col bg-neutral-100 dark:bg-neutral-950">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                        <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Live Preview</h3>
                        <button onClick={handleCancel} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-auto p-8 flex justify-center">
                        <div
                            className="bg-white shadow-lg transition-all duration-300"
                            style={{
                                width: config.type === 'THERMAL' ? `${config.width}mm` : '210mm',
                                minHeight: config.type === 'THERMAL' ? `${config.height}mm` : '297mm',
                                padding: config.type === 'THERMAL' ? '0' : '10mm',
                                display: config.type === 'THERMAL' ? 'flex' : 'block', // Thermal shows one example or list? Let's show list but column for thermal
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            {/* Hidden Print Container - This is what actually gets printed (rendered hidden or cloned, but here we render live) */}
                            {/* We render THE ACTUAL CONTENT here for preview logic */}

                            <div
                                ref={printRef}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                                    gap: `${config.gap}mm`,
                                    width: '100%'
                                }}
                            >
                                {itemsToPrint.map((p, i) => {
                                    // Logic for dynamic fields
                                    const fabric = p.composition || p.material || '';
                                    const grn = (p.variantData as any)?.grn || 'N/A';
                                    const sn = p.sku;
                                    const qrData = JSON.stringify({
                                        sku: p.sku,
                                        grn: grn,
                                        cat: p.category,
                                        type: p.productType
                                    });

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                width: '100%', // Grid controls width
                                                height: `${config.height}mm`,
                                                border: config.type === 'A4_GRID' ? '1px dashed #eee' : 'none',
                                                padding: '2mm',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                overflow: 'hidden',
                                                backgroundColor: '#fff',
                                                color: '#000',
                                                position: 'relative',
                                                fontSize: '10px',
                                                pageBreakInside: 'avoid',
                                                breakInside: 'avoid'
                                            }}
                                            className="label-item"
                                        >
                                            {/* Simplified Content: Name -> Price -> QR -> SKU Text */}
                                            <div className="active-area">

                                                {/* Product Name */}
                                                <div className="t-name">{p.name}</div>

                                                {/* Price */}
                                                <div className="t-price">₹{p.mrp || p.price}</div>

                                                {/* QR Code (using SKU value) */}
                                                <div className="bg-white p-[1px] my-1">
                                                    <QRCodeSVG
                                                        value={p.sku || p.barcode || 'N/A'}
                                                        size={config.height * 0.45}
                                                        level="M"
                                                        style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                                                    />
                                                </div>

                                                {/* SKU Text */}
                                                <div className="t-sku">{p.sku || p.barcode}</div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
};
