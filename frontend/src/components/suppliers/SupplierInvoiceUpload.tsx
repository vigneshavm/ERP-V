import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Quote } from 'lucide-react';
import api from '../../services/api';

interface SupplierInvoiceUploadProps {
    onDataExtracted: (data: any) => void;
}

const SupplierInvoiceUpload: React.FC<SupplierInvoiceUploadProps> = ({ onDataExtracted }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [showPasteArea, setShowPasteArea] = useState(false);
    const [pastedText, setPastedText] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsAnalyzing(true);
        setStatus('idle');
        setShowPasteArea(false);

        try {
            const formData = new FormData();
            formData.append('invoice', file);

            // Use the centralized api service instead of raw axios
            const response = await api.post('/api/purchases/extraction/invoice', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setStatus('success');
                onDataExtracted(response.data.data);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Invoice extraction failed:', error);
            setStatus('error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTextExtraction = async () => {
        if (!pastedText.trim()) return;

        setIsAnalyzing(true);
        setStatus('idle');

        try {
            const response = await api.post('/api/purchases/extraction/text', { text: pastedText });

            if (response.data.success) {
                setStatus('success');
                onDataExtracted(response.data.data);
                setShowPasteArea(false);
                setPastedText('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Text extraction failed:', error);
            setStatus('error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                <input
                    type="file"
                    id="invoice-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                />

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-all ${isAnalyzing ? 'bg-emerald-600 animate-pulse' :
                    status === 'success' ? 'bg-emerald-500' :
                        status === 'error' ? 'bg-rose-500' : 'bg-white dark:bg-slate-800 group-hover:scale-110'
                    }`}>
                    {isAnalyzing ? (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                    ) : status === 'success' ? (
                        <CheckCircle2 className="w-7 h-7 text-white" />
                    ) : status === 'error' ? (
                        <AlertCircle className="w-7 h-7 text-white" />
                    ) : (
                        <Upload className="w-7 h-7 text-emerald-600" />
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-0.5">
                        {isAnalyzing ? 'Analyzing Smart Invoice...' :
                            status === 'success' ? 'Extraction Complete!' :
                                status === 'error' ? 'Analysis Failed' : 'AI-Powered Onboarding'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAnalyzing ? `Extracting data...` :
                            status === 'success' ? 'Details have been mapped to the form below.' :
                                status === 'error' ? 'Could not read details. Please fill manually.' :
                                    'Drop an invoice or paste details to auto-populate supplier fields.'}
                    </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    {!isAnalyzing && status !== 'success' && (
                        <>
                            <label
                                htmlFor="invoice-upload"
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer hover:bg-emerald-700 transition-colors shadow-emerald-200 shadow-md active:scale-95"
                            >
                                Browse Files
                            </label>
                            <button
                                onClick={() => setShowPasteArea(!showPasteArea)}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer hover:bg-emerald-50 transition-colors shadow-sm active:scale-95"
                            >
                                {showPasteArea ? 'Cancel Paste' : 'Paste Text'}
                            </button>
                        </>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={() => { setStatus('idle'); setFileName(null); }}
                            className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:underline"
                        >
                            Try Another
                        </button>
                    )}
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <FileText className="w-24 h-24 text-emerald-900" />
                </div>
            </div>

            {showPasteArea && (
                <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste supplier details here from another system... (e.g. Name, Address, GST, Email)"
                        className="w-full h-32 p-4 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none dark:text-white"
                        disabled={isAnalyzing}
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleTextExtraction}
                            disabled={isAnalyzing || !pastedText.trim()}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 active:scale-95"
                        >
                            {isAnalyzing ? 'Processing...' : 'Auto-Extract Details'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierInvoiceUpload;

