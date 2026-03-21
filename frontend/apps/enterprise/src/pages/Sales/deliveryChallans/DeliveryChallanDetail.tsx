import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import { getDeliveryChallanById, convertToInvoice, reset } from "@/entities/sales/model/deliveryChallanSlice";
import { 
    ArrowLeft, 
    Printer, 
    Truck, 
    ArrowRightCircle, 
    Phone, 
    Mail,
    User,
    Calendar,
    Sparkles,
    ShieldCheck,
    Boxes,
    Package,
    Navigation,
    Clock,
    UserCheck,
    CheckCircle,
    FileText
} from 'lucide-react';
import { RootState } from "@/app/store/store";

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
            toast.success('Converted to Invoice successfully!');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    if (isLoading || !challan) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Navigation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Calculating Logistic Vector...</p>
                </PageShell>
            </Layout>
        );
    }

    const totalQuantity = (challan?.items || []).reduce((sum: number, item: any) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto w-full">
                {/* Immersive Header - Hidden on print */}
                <div className="erp-card rounded-[3rem] p-10 bg-neutral-900 text-white shadow-2xl relative overflow-hidden print:hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                        <Truck className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => navigate('/sales/delivery-challan-list')}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 backdrop-blur-md rounded-lg border border-blue-500/20">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Logistics Artifact</span>
                                </div>
                            </div>
                            
                            <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-baseline gap-4">
                                {challan.challanNumber}
                                <span className="text-lg font-bold text-white/50 tracking-normal italic font-serif">Relocation Ledger</span>
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <User className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Lead Consignee</p>
                                        <p className="text-sm font-black uppercase tracking-tight leading-none text-white">
                                            {challan.customer.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Issuance Cycle</p>
                                        <p className="text-sm font-black uppercase tracking-tight leading-none text-white">
                                            {new Date(challan.challanDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-3 self-end lg:self-center">
                            {challan.status !== 'Converted' && (
                                <button
                                    onClick={() => setConvertConfirm(true)}
                                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <ArrowRightCircle className="w-5 h-5" /> 
                                    <span>Sync with Invoicing</span>
                                </button>
                            )}
                            <button
                                onClick={handlePrint}
                                className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3 overflow-hidden shadow-2xl"
                            >
                                <Printer className="w-5 h-5" /> 
                                <span>Materialize Copy</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 mb-20">
                    {/* Metrics Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        {/* Status Node */}
                        <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group ${challan.status === 'Converted' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                {challan.status === 'Converted' ? <CheckCircle className="w-40 h-40" /> : <Clock className="w-40 h-40" />}
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Operational State</p>
                                    <h2 className="text-4xl font-black mt-4 uppercase tracking-tighter italic">{challan.status}</h2>
                                    {challan.convertedToInvoice && (
                                        <p className="text-xs font-bold opacity-80 mt-2 flex items-center gap-1.5 border-l-2 border-white/20 pl-3">
                                            Linked to {challan.convertedToInvoice.invoiceNo}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1.5">Load Factor</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{totalQuantity} Units</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1.5">Line Items</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{(challan.items || []).length} SKUs</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consignee Identity */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group">
                            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2 italic">
                                <UserCheck className="w-4 h-4 text-blue-500/50" /> Consignee Identity Node
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-2xl border border-default dark:border-neutral-800">
                                    <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-2 italic">Entity Name</p>
                                    <p className="text-base font-black text-neutral-900 dark:text-main uppercase tracking-tight leading-none italic">{challan.customer.name}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                                        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-black font-mono tracking-tight">{challan.customer.phone}</p>
                                    </div>
                                    {challan.customer.email && (
                                        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-black font-mono tracking-tight italic lowercase">{challan.customer.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dispatch Intelligence */}
                        {(challan.vehicleNo || challan.driverName || challan.transportMode) && (
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group bg-indigo-500/[0.03]">
                                <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2 italic">
                                    <Navigation className="w-4 h-4 text-indigo-500/50" /> Dispatch Intelligence
                                </h3>
                                <div className="space-y-4">
                                    {challan.transportMode && (
                                        <div className="flex justify-between items-center py-3 border-b border-default dark:border-neutral-800 last:border-0">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Vector Mode</span>
                                            <span className="text-xs font-black text-neutral-900 dark:text-main uppercase tracking-tight">{challan.transportMode}</span>
                                        </div>
                                    )}
                                    {challan.vehicleNo && (
                                        <div className="flex justify-between items-center py-3 border-b border-default dark:border-neutral-800 last:border-0">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Unit Identification</span>
                                            <span className="text-xs font-black text-neutral-900 dark:text-main uppercase tracking-tight font-mono">{challan.vehicleNo}</span>
                                        </div>
                                    )}
                                    {challan.driverName && (
                                        <div className="flex justify-between items-center py-3 border-b border-default dark:border-neutral-800 last:border-0">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Lead Handler</span>
                                            <span className="text-xs font-black text-neutral-900 dark:text-main uppercase tracking-tight">{challan.driverName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* Items Matrix */}
                        <div className="erp-card rounded-[3.5rem] p-1 shadow-2xl border-none overflow-hidden bg-white dark:bg-neutral-900 relative group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-10 px-2">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Boxes className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Payload Configuration</h3>
                                </div>

                                <div className="overflow-x-auto px-1">
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                                                <th className="px-8 py-2">Catalog item</th>
                                                <th className="px-8 py-2 text-center">Protocol Qty</th>
                                                <th className="px-8 py-2">Allocation Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(challan?.items || []).map((item: any, index: number) => (
                                                <tr key={index} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500">
                                                    <td className="px-2 py-1">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                                            <p className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight italic mb-1">{item.item?.name || 'Unknown SKU'}</p>
                                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">{item.item?.sku || 'NO CODE'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-center font-mono font-black text-blue-500 italic text-2xl">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                            {item.deliveredQty} <span className="text-[9px] text-neutral-400 ml-1">{item.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                            <p className="text-[10px] font-medium text-neutral-500 italic max-w-xs leading-relaxed uppercase tracking-tight">
                                                                {item.description || 'Verified redistribution without supplemental notes.'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Location Reachability */}
                        <div className="erp-card rounded-[2.5rem] p-10 shadow-sm border-none group relative overflow-hidden bg-neutral-50 dark:bg-neutral-950/20">
                            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                                <Navigation className="w-4 h-4 text-blue-500/50" /> Consignee Reachability Trace
                            </h3>
                            <div className="flex flex-col md:flex-row gap-10 items-center">
                                <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2rem] border border-default dark:border-neutral-800 flex-1 w-full flex items-center gap-6 group/loc">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover/loc:scale-110 transition-transform">
                                        <Navigation className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 italic">Destination Matrix Address</p>
                                        <p className="text-sm font-black text-neutral-900 dark:text-neutral-200 uppercase tracking-tight italic leading-relaxed">
                                            "{challan.customer.address || 'Operational reachability data not established.'}"
                                        </p>
                                    </div>
                                </div>
                                {challan.deliveryDate && (
                                    <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2rem] border border-default dark:border-neutral-800 w-full md:w-64 flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 italic">Est. Relocation</p>
                                            <p className="text-base font-black text-neutral-900 dark:text-neutral-200 uppercase tracking-tight italic">
                                                {new Date(challan.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Supplemental Observations */}
                        {challan.notes && (
                            <div className="erp-card rounded-[2.5rem] p-10 shadow-sm border-none bg-neutral-900 text-white relative overflow-hidden group/notes">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/notes:scale-110 transition-transform">
                                    <FileText className="w-40 h-40" />
                                </div>
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2 italic relative z-10 font-sans">
                                    Supplemental Observations Ledger
                                </h3>
                                <p className="text-sm font-medium text-white/70 leading-relaxed italic relative z-10 border-l-2 border-white/10 pl-6 uppercase tracking-tight">
                                    {challan.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Branded Verification Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-20 print:hidden">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Logistics Integrity Verified • Payload Immutable</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>

            {/* Protocol Shift Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-2xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[3.5rem] p-12 max-w-lg w-full mx-4 shadow-[0_0_100px_rgba(16,185,129,0.1)] border border-emerald-500/20 group/modal">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-8 group-hover/modal:scale-110 group-hover/modal:rotate-12 transition-all duration-700 shadow-xl shadow-emerald-500/5">
                            <ArrowRightCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter uppercase mb-6 italic">Fiscal Protocol Shift</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-10 text-lg leading-relaxed italic">
                            Instructing the system to transition this Logistics Artifact into a validated Fiscal Invoice. This action is terminal and finalizes the asset relocation in the global ledger.
                        </p>
                        <div className="flex gap-6">
                            <button
                                onClick={() => setConvertConfirm(false)}
                                className="flex-1 px-8 py-5 border border-default rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-400"
                            >
                                Abort Sequence
                            </button>
                            <button
                                onClick={handleConvert}
                                className="flex-1 px-8 py-5 bg-emerald-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/30 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Confirm Transition
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; }
                    body * { visibility: hidden !important; }
                    .page-shell, .page-shell * { visibility: visible !important; }
                    .bg-app { background: white !important; }
                    .erp-card { border: none !important; box-shadow: none !important; border-radius: 0 !important; color: black !important; }
                    .dark .erp-card { background: white !important; color: black !important; border: 1px solid #eee !important; min-height: auto !important; }
                    .dark h1, .dark h2, .dark h3, .dark span, .dark p, .dark td, .dark th { color: black !important; }
                    .page-shell { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; display: block !important; }
                    .print\\:hidden, button, .sparkles, footer, .opacity-30 { display: none !important; }
                }
            `}</style>
        </Layout>
    );
};

export default DeliveryChallanDetail;
