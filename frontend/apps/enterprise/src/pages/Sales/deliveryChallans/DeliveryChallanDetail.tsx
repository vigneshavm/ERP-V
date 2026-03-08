import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/Layout";
import { getDeliveryChallanById, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { 
  ArrowLeft, 
  Printer, 
  Truck, 
  ArrowRightCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ChevronLeft, 
  Activity, 
  Zap, 
  Box, 
  Navigation, 
  User, 
  FileText 
} from 'lucide-react';
import { RootState } from "../../../redux/store";

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
            toast.error(message || "Protocol decryption failure");
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
            toast.success('Protocol Conversion Successful: Invoice Generated');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
        >
            {title && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
                        {title}
                    </h3>
                </div>
            )}
            <div className="p-6">{children}</div>
        </motion.div>
    );

    if (isLoading || !challan) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Decoding Manifest...</p>
                </div>
            </Layout>
        );
    }

    const totalQuantity = (challan?.items || []).reduce((sum: number, item: any) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>

                <div className="max-w-5xl mx-auto relative z-10 space-y-8">
                    {/* Tactical Header - Hidden on print */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/sales/delivery-challan-list')}
                                className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest hover:text-emerald-500 transition-colors group"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Logistics Registry
                            </button>
                            
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                    <Truck className="w-4 h-4" />
                                    Manifest ID: {challan.challanNumber}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                    Fulfillment <span className="text-emerald-500 italic">Certificate</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                             {challan.status !== 'Converted' && (
                                <button
                                    onClick={() => setConvertConfirm(true)}
                                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-4 focus:ring-4 focus:ring-emerald-500/10"
                                >
                                    <ArrowRightCircle className="w-5 h-5" />
                                    Convert to Revenue
                                </button>
                            )}
                            <button 
                                onClick={handlePrint}
                                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4"
                            >
                                <Printer className="w-5 h-5" />
                                Capture Schema
                            </button>
                        </div>
                    </div>

                    {/* Operational Highlights */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                        {[
                            { label: 'Movement Status', value: challan.status, icon: Activity, color: 'emerald' },
                            { label: 'Asset Magnitude', value: `${totalQuantity} Units`, icon: Box, color: 'emerald' },
                            { label: 'Integrity', value: 'Verified', icon: ShieldCheck, color: 'emerald' },
                            { label: 'Network Latency', value: '1.2ms', icon: Zap, color: 'emerald' }
                        ].map((stat, idx) => (
                            <GlassPanel key={idx} className="p-4">
                                <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <stat.icon className={`w-3 h-3 text-${stat.color}-500`} />
                                    {stat.label}
                                </div>
                                <div className="text-xs font-black text-main uppercase tracking-tight">{stat.value}</div>
                            </GlassPanel>
                        ))}
                    </div>

                    {/* Fulfillment Manifest Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-12 shadow-2xl relative overflow-hidden font-sans text-slate-900 border border-slate-100 rounded-[3rem] print:rounded-none print:shadow-none print:border-0"
                    >
                         {/* Header Section */}
                        <div className="flex justify-between items-start mb-16 px-4">
                            <div>
                                <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4">
                                    <ShieldCheck className="w-4 h-4" />
                                    Official Resolution: 2036.LOG
                                </div>
                                <h1 className="text-6xl font-display font-black tracking-tighter uppercase text-slate-900 border-l-8 border-emerald-600 pl-8 leading-none">
                                    Fulfillment <br />
                                    <span className="text-emerald-600 italic">Manifest</span>
                                </h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6 bg-slate-100 inline-block px-4 py-1 rounded-full">
                                    ID # {challan.challanNumber}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-white font-black text-3xl mb-6 shadow-2xl shadow-slate-900/20 ml-auto">
                                    F
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Mark</div>
                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                            {new Date(challan.challanDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    {challan.deliveryDate && (
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Arrival Projection</div>
                                            <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                {new Date(challan.deliveryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-20 mb-16 px-4">
                            {/* Counterparty Identification */}
                            <div className="space-y-6">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Receiving Counterparty
                                </div>
                                <div className="space-y-4 border-l border-slate-200 pl-6">
                                    <div>
                                        <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">{challan.customer.name}</p>
                                        <div className="flex flex-col gap-2 mt-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Phone className="w-3 h-3 text-emerald-500" />
                                                {challan.customer.phone}
                                            </div>
                                            {challan.customer.email && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Mail className="w-3 h-3 text-emerald-500" />
                                                    {challan.customer.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Resolution */}
                            <div className="space-y-6 text-right">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center justify-end gap-2">
                                    Resolution Status
                                    <Activity className="w-3 h-3" />
                                </div>
                                <div className="space-y-3">
                                    <div className={`px-6 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest inline-block ${
                                        challan.status === 'Converted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                                    }`}>
                                        Protocol: {challan.status}
                                    </div>
                                    {challan.convertedToInvoice && (
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            Synchronized with Revenue Manifest: {challan.convertedToInvoice.invoiceNo}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Asset Matrix */}
                        <div className="mb-12 px-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-4 border-slate-900">
                                        <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Index</th>
                                        <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fulfillment Qty</th>
                                        <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unit Vector</th>
                                        <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Annotations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(challan?.items || []).map((item: any, index: number) => (
                                        <tr key={index} className="group">
                                            <td className="py-6 pr-8">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.item?.name || 'Asset Null'}</p>
                                                {item.item?.sku && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">ID: {item.item.sku}</p>}
                                            </td>
                                            <td className="py-6 text-center text-sm font-black text-slate-900 font-mono">{item.deliveredQty}</td>
                                            <td className="py-6 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{item.unit || 'UNITS'}</td>
                                            <td className="py-6 text-right text-[10px] font-medium text-slate-400 italic font-display">{item.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Logistics Vector Analysis */}
                         {(challan.vehicleNo || challan.driverName || challan.transportMode) && (
                            <div className="grid grid-cols-3 gap-8 px-8 py-8 bg-slate-50 rounded-3xl mb-12 border border-slate-100">
                                {[{ label: 'Transport Vector', value: challan.transportMode, icon: Navigation },
                                  { label: 'Asset Carrier ID', value: challan.vehicleNo, icon: Box },
                                  { label: 'Pilot Designation', value: challan.driverName, icon: User }
                                ].map((log, i) => log.value && (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <log.icon className="w-3 h-3 text-emerald-500" />
                                            {log.label}
                                        </div>
                                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary Footer */}
                        <div className="flex justify-between items-end pt-8 border-t border-slate-100 px-4">
                            <div className="space-y-4 max-w-md">
                                {challan.notes && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Remarks</p>
                                        <p className="text-xs text-slate-600 leading-relaxed italic">{challan.notes}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 py-4 border-t border-slate-100">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">E</div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Enterprise Logistics</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Authenticated Manifest</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-[300px] p-6 bg-slate-900 rounded-[2rem] text-right group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/30 transition-all"></div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Aggregated Magnitude</p>
                                <p className="text-4xl font-display font-black text-white tracking-tighter relative z-10">{totalQuantity} <span className="text-xs text-emerald-500">UNITS</span></p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Convert Confirmation Modal */}
            <AnimatePresence>
                {convertConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConvertConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-panel border border-emerald-500/20 p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ArrowRightCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Synchronize Revenue?</h2>
                            <p className="text-xs text-secondary opacity-60 mb-8 lowercase tracking-wide">This action will convert this fulfillment manifest into a finalized revenue certificate permanently.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setConvertConfirm(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest hover:text-main transition-all">Abort</button>
                                <button onClick={handleConvert} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all">Synchronize</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @media print {
                  body * { visibility: hidden; }
                  .rounded-\\[3rem\\], .rounded-\\[3rem\\] * { visibility: visible; }
                  .rounded-\\[3rem\\] { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; margin: 0 !important; padding: 40px !important; }
                  .print\\:hidden { display: none !important; }
                }
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
            `}</style>
        </Layout>
    );
};

export default DeliveryChallanDetail;
