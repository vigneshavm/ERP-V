import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from "@/components/shared/Layout/PageHeader";
import api from "@/services/api";
import { toast } from 'react-toastify';

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
        { id: 'inventory', name: 'Inventory Master', icon: '📦', description: 'HSN, Price lists, and Stock levels' },
        { id: 'sales', name: 'Sales Vouchers', icon: '🛒', description: 'B2B/B2C Invoices for GST filing' },
        { id: 'purchase', name: 'Purchase Entry', icon: '📥', description: 'Inward supplies and ITC tracking' },
        { id: 'customers', name: 'Customer Database', icon: '👥', description: 'Profiles, Contact info and Ledger' },
        { id: 'suppliers', name: 'Supplier Database', icon: '🏢', description: 'Vendor info and Purchase history' },
        { id: 'ledger', name: 'General Ledger', icon: '📖', description: 'Complete accounting audit trail' }
    ];

    const handleExport = async () => {
        try {
            setExporting(true);
            toast.info(`Preparing ${selectedModule} export...`);

            // Fetch data based on module
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

            // In a real app, we'd add date filters to the query
            const response = await api.get(endpoint);
            const data = response.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                toast.error('No data found for the selected module and range');
                return;
            }

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
                doc.text(`${selectedModule.toUpperCase()} REPORT`, 14, 15);
                doc.setFontSize(10);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

                // autoTable handles nested data better if we flatten it, but for demo:
                const headers = Object.keys(data[0]);
                const body = data.map((row: any) => headers.map(h => String(row[h] || '')));

                autoTable(doc, {
                    head: [headers],
                    body: body,
                    startY: 30,
                    styles: { fontSize: 8 }
                });

                doc.save(`${selectedModule}_report_${new Date().getTime()}.pdf`);
            }

            toast.success('Data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data. Please try again later.');
        } finally {
            setExporting(false);
        }
    };

    const recentExports = [
        { id: 1, name: 'Inventory_Jan24.xlsx', date: '2024-01-28', size: '1.2 MB', status: 'completed' },
        { id: 2, name: 'Sales_Q4.zip', date: '2024-01-15', size: '4.5 MB', status: 'completed' },
        { id: 3, name: 'Tax_Returns_2023.pdf', date: '2024-01-05', size: '850 KB', status: 'completed' }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Data Export"
                description="Securely export your business data in multiple formats"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Select Module</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modules.map((mod) => (
                                <button
                                    key={mod.id}
                                    onClick={() => setSelectedModule(mod.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedModule === mod.id
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{mod.icon}</div>
                                    <p className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">{mod.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2">{mod.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Export Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Export Format</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['xlsx', 'csv', 'pdf'].map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setExportFormat(fmt)}
                                                className={`py-2 px-3 rounded-lg border-2 font-black text-[10px] uppercase transition-all ${exportFormat === fmt
                                                        ? 'border-indigo-600 bg-indigo-50 text-primary'
                                                        : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                                    }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Configurations</label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={includeHeaders}
                                            onChange={(e) => setIncludeHeaders(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Include column headers</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={compressFile}
                                            onChange={(e) => setCompressFile(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Compress as .zip</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={splitMonthly}
                                            onChange={(e) => setSplitMonthly(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Split data by month</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:bg-slate-300"
                            >
                                {exporting ? 'Processing Export...' : 'Generate and Download Export'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-xl shadow-indigo-600/20">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Storage Usage</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black">2.4</span>
                            <span className="text-xl font-bold opacity-70 mb-1">GB</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                            <div className="w-[48%] h-full bg-white rounded-full"></div>
                        </div>
                        <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">48% of 5GB Tier Used</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Exports</h3>
                            <button className="text-[10px] font-black text-primary uppercase">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentExports.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors uppercase truncate pr-4">{item.name}</p>
                                        <span className="text-[10px] font-black text-primary">{item.size}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{item.date}</p>
                                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded uppercase tracking-tighter">SUCCESS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;
