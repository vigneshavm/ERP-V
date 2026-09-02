import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getDeliveryChallanById, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { 
    ArrowLeft, 
    Printer, 
    Truck, 
    Phone, 
    Mail,
    CheckCircle2,
    Clock,
    Download,
    User,
    Layers,
    ChevronRight,
    Navigation,
    Info,
    Receipt
} from 'lucide-react';
import { RootState } from "../../../redux/store";
import { formatDate } from '../../../utils/helpers';

const DeliveryChallanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challan, isLoading, isError, message } = useSelector((state: RootState) => state.deliveryChallan);
    const [convertConfirm, setConvertConfirm] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(getDeliveryChallanById(id) as any);
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handlePrint = () => {
        window.print();
    };

    const handleConvert = async () => {
        if (!id) return;
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(false);

        if (result.type.includes('fulfilled')) {
            toast.success('Protocol transitioned to Fiscal Invoice');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    const lifecycleStages = useMemo(() => {
        const stages = ['Draft', 'Delivered', 'Converted'];
        const currentStatus = challan?.status || 'Draft';
        const currentIndex = stages.indexOf(currentStatus);

        return stages.map((stage, index) => ({
            name: stage === 'Converted' ? 'Invoiced' : stage,
            completed: index < currentIndex || (index === currentIndex && currentStatus === 'Converted'),
            current: index === currentIndex && currentStatus !== 'Converted',
            upcoming: index > currentIndex
        }));
    }, [challan]);

    if (isLoading || !challan) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-warning/20 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-warning uppercase tracking-[0.2em] animate-pulse">Syncing Dispatch Node...</p>
            </div>
        );
    }

    const totalQuantity = (challan?.items || []).reduce((sum: number, item: any) => sum + (item.deliveredQty || 0), 0);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Modern Header - Hidden on print */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/sales/challans')}
                            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:scale-110 transition-transform text-neutral-500 hover:text-warning shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                {challan.challanNumber}
                                <span className={`px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs font-bold uppercase tracking-widest`}>
                                    {challan.status === 'Converted' ? 'Fiscal Finalized' : 'Dispatch Protocol'}
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Protocol Active // Log Date: {formatDate(challan.challanDate)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handlePrint}
                            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:text-warning transition-colors shadow-sm group"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        {challan.status !== 'Converted' && (
                            <button 
                                onClick={() => setConvertConfirm(true)}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Receipt className="w-4 h-4 inline-block mr-2" /> Transition to Invoice
                            </button>
                        )}
                        <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                            <Download className="w-4 h-4" /> Export Manifest
                        </button>
                    </div>
                </header>

                {/* Progress Timeline - Hidden on print */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm print:hidden">
                    <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                        {lifecycleStages.map((stage, index) => (
                            <div key={stage.name} className="flex-1 flex items-center gap-4 last:flex-none">
                                <div className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all ${stage.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : stage.current ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                        {stage.completed ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black">{index + 1}</span>}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest absolute -bottom-6 whitespace-nowrap ${stage.current ? 'text-warning' : 'text-neutral-400'}`}>
                                        {stage.name}
                                    </span>
                                </div>
                                {index < 2 && (
                                    <div className={`h-1 flex-1 rounded-full ${stage.completed ? 'bg-emerald-500' : 'bg-neutral-100 dark:bg-neutral-800'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Print Layout Header (Visible only on print) */}
                <div className="hidden print:block border-b-4 border-neutral-900 pb-8 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase">Delivery Challan</h2>
                            <p className="text-lg font-bold text-neutral-500 mt-1">Registry: {challan.challanNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Date of Dispatch</p>
                            <p className="text-xl font-black">{formatDate(challan.challanDate)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Entity Mapping */}
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <User className="w-4 h-4 text-warning" /> Consignee Entity
                                    </h3>
                                </div>
                                <div className="p-8 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-sm bg-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-500/20">
                                        {challan.customer?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">{challan.customer?.name}</p>
                                        <div className="space-y-1 mt-2">
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> {challan.customer?.phone}</p>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> {challan.customer?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Params */}
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-warning" /> Logistics Matrix
                                    </h3>
                                </div>
                                <div className="p-8 grid grid-cols-2 gap-6">
                                    {[
                                        { label: 'Transport Mode', value: challan.transportMode || 'ROAD', icon: Navigation },
                                        { label: 'Vehicle Node', value: challan.vehicleNo || 'LOCAL', icon: Truck },
                                        { label: 'Carrier/Driver', value: challan.driverName || 'INTERNAL', icon: User },
                                        { label: 'Expected Node', value: challan.deliveryDate ? formatDate(challan.deliveryDate) : 'N/A', icon: Clock },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-xs font-black uppercase tracking-tight text-neutral-900 dark:text-white">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Manifest Table */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Dispatch Manifest</h3>
                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{(challan.items || []).length} Nodes</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-950/50">
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-16 text-center">Node</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Product Specification</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-center">Quantity</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Unit</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Directives</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {(challan.items || []).map((item: any, index: number) => (
                                            <tr key={index} className="group hover:bg-amber-500/[0.01] transition-colors">
                                                <td className="px-8 py-6 text-center text-[10px] font-black text-neutral-400">{(index + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.item?.name || 'Unknown Item'}</span>
                                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">SKU: {item.item?.sku || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-sm font-mono font-black text-neutral-900 dark:text-white">{item.deliveredQty}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.unit || 'PCS'}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-tight italic">{item.description || '-'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Directives */}
                        {challan.notes && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-warning" /> Operational Directives
                                </h3>
                                <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50/50 dark:bg-neutral-950/50 p-6 rounded-sm border border-neutral-100 dark:border-neutral-800 shadow-inner">
                                    {challan.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Financials & History */}
                    <div className="space-y-8 sticky top-8 print:hidden">
                        {/* Fulfillment Summary */}
                        <div className="bg-neutral-900 dark:bg-white rounded-[40px] p-8 text-white dark:text-neutral-900 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-bl-[100px]" />
                            <h3 className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-8">Dispatch Summary</h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { label: 'Manifest Nodes', value: (challan.items || []).length, color: 'text-white dark:text-neutral-900' },
                                    { label: 'Logistics Protocol', value: (challan.transportMode || 'ROAD').toUpperCase(), color: 'text-warning dark:text-amber-600' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                        <span>{item.label}</span>
                                        <span className={`font-mono ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                                <div className="pt-6 border-t border-white/10 dark:border-neutral-200 mt-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Gross Dispatch Quantity</p>
                                    <div className="text-4xl font-display font-black tracking-tighter flex items-center gap-2">
                                        <Layers className="w-8 h-8 text-warning" />
                                        {totalQuantity}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Linked Fiscal Node */}
                        {challan.convertedToInvoice && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Fiscal Link</h3>
                                </div>
                                <div className="p-8">
                                    <div 
                                        onClick={() => navigate(`/sales/invoice/${challan.convertedToInvoice._id}`)}
                                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-100 dark:border-neutral-800 group cursor-pointer hover:border-success/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Receipt className="w-4 h-4 text-success" />
                                            <span className="text-xs font-black uppercase tracking-tight group-hover:text-success">{challan.convertedToInvoice.invoiceNo}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Audit Log (Simulated) */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Registry Audit</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-1 bg-emerald-500 rounded-full" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Protocol Created</p>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{new Date(challan.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                {challan.status === 'Converted' && (
                                    <div className="flex gap-4">
                                        <div className="w-1 bg-amber-500 rounded-full" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Fiscal Transition</p>
                                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Status: FINALIZED</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Convert Confirmation Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px]" />
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-success/10 text-success rounded-sm flex items-center justify-center mx-auto mb-6">
                                <Receipt className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-2">Transition Protocol?</h3>
                            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Transition this dispatch protocol to a Fiscal Invoice? This will lock the logistical matrix and initiate billing.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setConvertConfirm(false)}
                                    className="px-6 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConvert}
                                    className="px-6 py-4 bg-emerald-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    Transition
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 20mm; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    main { padding: 0 !important; max-width: 100% !important; }
                    .lg\\:grid-cols-3 { grid-template-columns: 1fr !important; }
                    .lg\\:col-span-2 { grid-column: span 3 / span 3 !important; }
                    .bg-white, .dark\\:bg-neutral-900, .bg-neutral-50, .dark\\:bg-neutral-950 { background: transparent !important; }
                    .border, .border-b, .border-t { border-color: #e5e7eb !important; }
                    .text-neutral-400, .text-neutral-500 { color: #6b7280 !important; }
                    .shadow-sm, .shadow-2xl, .shadow-lg { shadow: none !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
};

export default DeliveryChallanDetail;
