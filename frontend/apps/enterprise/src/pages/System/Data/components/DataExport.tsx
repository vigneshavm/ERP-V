import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from "@/services/api";
import { toast } from 'react-toastify';
import { 
    Download, FileText, Database, 
    Table, Archive, PieChart, 
    Layers, Zap, Calendar, 
    CheckCircle2, Loader2, Info,
    CloudDownload, TrendingUp
} from 'lucide-react';

const DataExport = () => {
    const [selectedModule, setSelectedModule] = useState('inventory');
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [exporting, setExporting] = useState(false);
    const [includeHeaders, setIncludeHeaders] = useState(true);
    const [compressFile, setCompressFile] = useState(false);
    const [splitMonthly, setSplitMonthly] = useState(false);

    const modules = [
        { id: 'inventory', name: 'Inventory Master', icon: Database, description: 'HSN, Price lists, and Stock levels', color: 'indigo' },
        { id: 'sales', name: 'Sales Vouchers', icon: Zap, description: 'B2B/B2C Invoices for GST filing', color: 'emerald' },
        { id: 'purchase', name: 'Purchase Entry', icon: TrendingUp, description: 'Inward supplies and ITC tracking', color: 'amber' },
        { id: 'customers', name: 'Customer Database', icon: Layers, description: 'Profiles, Contact info and Ledger', color: 'blue' },
        { id: 'suppliers', name: 'Supplier Database', icon: Archive, description: 'Vendor info and Purchase history', color: 'violet' },
        { id: 'ledger', name: 'General Ledger', icon: PieChart, description: 'Complete accounting audit trail', color: 'rose' }
    ];

    const handleExport = async () => {
        try {
            setExporting(true);
            toast.info(`Initializing ${selectedModule} siphon protocol...`);

            let endpoint = '';
            switch (selectedModule) {
                case 'inventory': endpoint = '/api/inventory'; break;
                case 'sales': endpoint = '/api/sales'; break;
                case 'purchase': endpoint = '/api/purchase'; break;
                case 'customers': endpoint = '/api/customers'; break;
                case 'suppliers': endpoint = '/api/suppliers'; break;
                case 'ledger': endpoint = '/api/accounting/ledger'; break;
                default: endpoint = '/api/inventory';
            }

            const response = await api.get(endpoint);
            const data = response.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                toast.error('No viable data detected for export parameters.');
                return;
            }

            // Simulate siphon delay for UX
            await new Promise(r => setTimeout(r, 1500));

            if (exportFormat === 'xlsx' || exportFormat === 'csv') {
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, selectedModule.toUpperCase());

                if (exportFormat === 'xlsx') {
                    XLSX.writeFile(workbook, `${selectedModule}_export_${new Date().getTime()}.xlsx`);
                } else {
                    XLSX.writeFile(workbook, `${selectedModule}_export_${new Date().getTime()}.csv`, { bookType: 'csv' });
                }
            } else if (exportFormat === 'pdf') {
                const doc = new jsPDF();
                doc.text(`${selectedModule.toUpperCase()} SECURE REPORT`, 14, 15);
                doc.setFontSize(8);
                doc.text(`Protocol Generated: ${new Date().toLocaleString()}`, 14, 22);

                const headers = Object.keys(data[0]);
                const body = data.map((row: any) => headers.map(h => String(row[h] || '')));

                autoTable(doc, {
                    head: [headers],
                    body: body,
                    startY: 30,
                    styles: { fontSize: 7, font: 'helvetica' },
                    headStyles: { fillStyle: 'DF', fillColor: [79, 70, 229] }
                });

                doc.save(`${selectedModule}_secure_${new Date().getTime()}.pdf`);
            }

            toast.success('Data Siphon Completed Successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Siphon Failure: Protocol Interrupted');
        } finally {
            setExporting(false);
        }
    };

    const recentExports = [
        { id: 1, name: 'Warehouse_Sync_0x24.xlsx', date: '2026-03-05', size: '1.2 MB', format: 'XLSX' },
        { id: 2, name: 'Sales_Audit_Q1_26.zip', date: '2026-02-28', size: '4.5 MB', format: 'ZIP' },
        { id: 3, name: 'Tax_Compliance_FY25.pdf', date: '2026-02-15', size: '850 KB', format: 'PDF' }
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tactical Header Overlay */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-950 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                                <CloudDownload className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-2">Data <span className="text-indigo-600">Siphon</span></h1>
                                <p className="text-slate-500 font-medium text-lg max-w-xl">Autonomous extraction and serialization of enterprise metadata. Standard multi-format propagation enabled.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tunnel Status</p>
                                <p className="text-sm font-black text-emerald-500 uppercase tracking-tight">Active Connection</p>
                            </div>
                            <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden`}>
                                        <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500">Node</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Matrix */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Domain Selection Matrix */}
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Zap className="w-4 h-4 text-amber-500" /> Archway Selection
                            </h2>
                            <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">6 Clusters Online</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modules.map((mod) => {
                                const Icon = mod.icon;
                                const isSelected = selectedModule === mod.id;
                                return (
                                    <button
                                        key={mod.id}
                                        onClick={() => setSelectedModule(mod.id)}
                                        className={`group relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
                                            isSelected
                                                ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/5 -translate-y-1'
                                                : 'border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-2xl w-fit mb-6 transition-all duration-500 ${
                                            isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:scale-110'
                                        }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <p className={`font-black text-xs uppercase tracking-widest mb-2 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{mod.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase tracking-tight">{mod.description}</p>
                                        
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Serialization Parameters */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
                                <FileText className="w-4 h-4 text-indigo-500" /> Format Protocol
                            </h3>
                            <div className="flex gap-4">
                                {['xlsx', 'csv', 'pdf'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`flex-1 py-5 rounded-[1.5rem] border-2 font-black text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                                            exportFormat === fmt
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-105'
                                                : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-100'
                                        }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Epoch Start</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-900 dark:text-white uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Epoch End</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-900 dark:text-white uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3 mb-8">
                                <Layers className="w-4 h-4 text-emerald-500" /> Aggregation Rules
                            </h3>
                            <div className="space-y-5">
                                {[
                                    { label: 'Append Siphon Headers', state: includeHeaders, setter: setIncludeHeaders },
                                    { label: 'Compress Output (.ZIP)', state: compressFile, setter: setCompressFile },
                                    { label: 'Segment Monthly Cycles', state: splitMonthly, setter: setSplitMonthly }
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl group cursor-pointer" onClick={() => row.setter(!row.state)}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">{row.label}</span>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${row.state ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-800'}`}>
                                            {row.state && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full mt-8 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden relative group"
                            >
                                {exporting ? (
                                    <div className="flex items-center justify-center gap-4">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>SIPHONING...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-4">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                        <span>INITIATE EXTRACTION</span>
                                    </div>
                                )}
                                <div className={`absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-[1.5s] ease-out ${exporting ? 'w-full' : 'w-0'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Intelligence Sidecar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Storage HUD */}
                    <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-110 transition-transform duration-1000">
                            <CloudDownload className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 italic opacity-80">Vault Allocation</h3>
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-6xl font-black italic tracking-tighter">2.4</span>
                                <span className="text-2xl font-black opacity-40 mb-2 underline decoration-4 decoration-indigo-400">GB</span>
                            </div>
                            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-4 border border-white/5 p-1">
                                <div className="w-[48%] h-full bg-white rounded-full relative">
                                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-white animate-ping"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-70">
                                <span>48% Utilized</span>
                                <span>5GB Apex Tier</span>
                            </div>
                        </div>
                    </div>

                    {/* Ledger History */}
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-800/10 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archival Logs</h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="p-4 space-y-4">
                            {recentExports.map((item) => (
                                <div key={item.id} className="p-6 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate pr-4">{item.name}</p>
                                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-600 dark:text-slate-400">{item.format}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{item.date}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-500/80 leading-none">{item.size}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-6 border-t border-slate-50 dark:border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            Access Full Repository
                        </button>
                    </div>

                    {/* Tactical Advisory */}
                    <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-start gap-4">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase italic">
                            All extracted payloads are <span className="text-white underline decoration-indigo-500/30">AES-256 compliant</span>. Siphon tunnels remain isolated from public mesh networks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;
