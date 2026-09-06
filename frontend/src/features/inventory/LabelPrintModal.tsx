import React, { useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import { PRINTER_PROFILES, PrinterBrand, generateBatchCommands, printFileExtension } from '@/utils/labelPrinterFormats';

interface LabelPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: any[];
    onPrintComplete?: () => void;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, products, onPrintComplete }) => {
    const _printRef = useRef<HTMLDivElement>(null);
    const [printerBrand, setPrinterBrand] = useState<PrinterBrand>('CITIZEN_GENERIC');
    const [labelWidthMm, setLabelWidthMm] = useState(50);
    const [labelHeightMm, setLabelHeightMm] = useState(25);

    if (!isOpen) return null;

    const profile = PRINTER_PROFILES[printerBrand];

    const handleDownloadPrintFile = () => {
        const items = products
            .filter((p) => p.sku || p.barcode)
            .map((p) => ({ name: p.name, code: String(p.sku || p.barcode), price: p.sellingPrice || p.price }));

        if (items.length === 0) {
            toast.error('None of the selected products have a SKU/barcode to print');
            return;
        }

        const commandText = generateBatchCommands(profile, items, { widthMm: labelWidthMm, heightMm: labelHeightMm });
        const blob = new Blob([commandText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `labels-${profile.brand.toLowerCase()}-${Date.now()}.${printFileExtension(profile)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`${profile.label.split('(')[0].trim()} print file generated`);
        if (onPrintComplete) onPrintComplete();
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Product Labels", 10, 10);

        let y = 30;
        products.forEach((p, __index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(12);
            doc.text(`${p.name} (${p.sku})`, 10, y);
            doc.setFontSize(10);
            doc.text(`Price: ₹${p.sellingPrice || p.price}`, 10, y + 5);
            y += 20;
        });

        doc.save(`labels-${new Date().toISOString()}.pdf`);
        toast.success("PDF Generated");
        if (onPrintComplete) onPrintComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-6 h-6 text-success" />
                        Print Labels ({products.length})
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Label Printer</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Brand / Protocol</label>
                                <select
                                    value={printerBrand}
                                    onChange={(e) => setPrinterBrand(e.target.value as PrinterBrand)}
                                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                                >
                                    {Object.values(PRINTER_PROFILES).map((p) => (
                                        <option key={p.brand} value={p.brand}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            {profile.protocol !== 'pdf' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Label Width (mm)</label>
                                        <input
                                            type="number"
                                            min={10}
                                            value={labelWidthMm}
                                            onChange={(e) => setLabelWidthMm(parseInt(e.target.value, 10) || 50)}
                                            className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Label Height (mm)</label>
                                        <input
                                            type="number"
                                            min={10}
                                            value={labelHeightMm}
                                            onChange={(e) => setLabelHeightMm(parseInt(e.target.value, 10) || 25)}
                                            className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        {profile.protocol !== 'pdf' && (
                            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                                Generates raw {profile.protocol} commands as a downloadable file. Send it to the printer via its
                                network port (9100) or USB print utility — a browser can't talk to the printer directly.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map((p, idx) => (
                            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                <p className="font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                                <p className="mt-2 font-bold text-emerald-600">₹{p.sellingPrice || p.price}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {profile.protocol === 'pdf' ? (
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            Download Labels PDF
                        </button>
                    ) : (
                        <button
                            onClick={handleDownloadPrintFile}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            Download {profile.protocol} Print File
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
