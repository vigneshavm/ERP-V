import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

interface LabelPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: any[];
    onPrintComplete?: () => void;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, products, onPrintComplete }) => {
    const _printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

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
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Download Labels PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
