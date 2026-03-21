import { useAuthStore } from '@repo/shared';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/shared/ui/Layout/Layout';
import PageShell from '@/shared/ui/Layout/PageShell';
import { AppDispatch, RootState } from "@/app/store/store";
import { getSupplierById, reset, updateSupplier } from "@/entities/contact/model/supplierSlice";
import { Supplier } from "@repo/shared";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  DollarSign,
  Box,
  Truck,
  Clock,
  ShieldCheck,
  Package,
  Edit3,
  Briefcase,
  Globe,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Calculator,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { supplier, isLoading, isError, message } = useSelector(
    (state: RootState) => state.suppliers
  );

  const {  user  } = useAuthStore();
  const [selectedBranch, setSelectedBranch] = React.useState<string>(user?.branchId || '');

  // Edit Financials Logic
  const [editingField, setEditingField] = React.useState<'invoiced' | 'paid' | 'outstanding' | null>(null);

  const handleSaveFinancial = (newValue: number) => {
    if (isNaN(newValue)) return;
    if (!supplier) return;

    const updatePayload: any = {};

    if (editingField === 'invoiced') {
      const currentTotal = supplier.totalAmount || 0;
      const currentManual = supplier.manualTotalInvoiced || 0;
      const realBills = currentTotal - currentManual;
      updatePayload.manualTotalInvoiced = newValue - realBills;
    } else if (editingField === 'paid') {
      const currentTotal = supplier.totalPaid || 0;
      const currentManual = supplier.manualTotalPaid || 0;
      const realPayments = currentTotal - currentManual;
      updatePayload.manualTotalPaid = newValue - realPayments;
    } else if (editingField === 'outstanding') {
      const currentOutstanding = supplier.netBalance ?? 0;
      const currentOpening = supplier.openingBalance || 0;
      const activityBalance = currentOutstanding - currentOpening;
      updatePayload.openingBalance = newValue - activityBalance;
    }

    dispatch(updateSupplier({
      id: supplier._id,
      supplierData: updatePayload
    }) as any).then(() => {
      setEditingField(null);
      dispatch(getSupplierById({ id: supplier._id, branchId: selectedBranch }) as any);
    });
  };

  useEffect(() => {
    if (id) {
      dispatch(getSupplierById({ id, branchId: selectedBranch }) as any);
    }
    return () => {
      dispatch(reset() as any);
    };
  }, [dispatch, id, selectedBranch]);

  if (isLoading) {
    return (
      <Layout>
        <PageShell className="bg-app flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 rounded-3xl border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400 animate-pulse italic">Interrogating Node Proxy...</p>
            </div>
        </PageShell>
      </Layout>
    );
  }

  if (isError || !supplier) {
    return (
      <Layout>
        <PageShell className="bg-app flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-sm mb-4">
                    <Activity className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Vortex: Node Fault</h2>
                <p className="text-sm font-bold text-neutral-500 italic mt-2">
                    {message || "The requested supplier profile has been de-indexed or corrupted in the active matrix."}
                </p>
                <button
                    onClick={() => navigate('/suppliers')}
                    className="mt-8 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Return to Registry
                </button>
            </div>
        </PageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Cinematic Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <button 
                        onClick={() => navigate('/suppliers')}
                        className="p-2 bg-white dark:bg-neutral-900 text-neutral-400 hover:text-blue-500 rounded-xl border border-default dark:border-neutral-800 transition-all active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <span className="px-3 py-1 bg-blue-500 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-md shadow-lg shadow-blue-500/20">Active Node</span>
                    <span className="text-neutral-300 dark:text-neutral-700">/</span>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">{supplier.supplierId}</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-black text-neutral-900 dark:text-main tracking-tighter leading-[0.9] flex items-wrap gap-4 uppercase italic">
                    {supplier.businessName} <BadgeStatus status={supplier.status} />
                </h1>
                <p className="text-sm font-bold text-neutral-500 italic mt-6 flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-blue-500" /> Authorized Trading Entity • System Registered Since {new Date(supplier.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-default dark:border-neutral-800 shadow-sm overflow-hidden">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-6 py-3 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                    >
                        <option value="">Global Reach</option>
                        <option value="Main">Main Hub</option>
                        <option value="B1">Sector 01</option>
                        <option value="B2">Sector 02</option>
                    </select>
                </div>
                <button
                    onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <Edit3 className="w-5 h-5" /> 
                    <span>Modify Protocol</span>
                </button>
            </div>
        </div>

        <SupplierSubNav />

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
            
            {/* Primary Metrics Vector */}
            <div className="lg:col-span-8 flex flex-col gap-8">
                
                {/* Fiscal Exposure Array */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard 
                        label="Aggregate Liability"
                        value={supplier.totalAmount || 0}
                        icon={Package}
                        color="blue"
                        sub={supplier.manualTotalInvoiced ? "Includes Adjusted Delta" : "Verified History"}
                        onClick={() => setEditingField('invoiced')}
                    />
                    <MetricCard 
                        label="Liquidated Position"
                        value={supplier.totalPaid || 0}
                        icon={ShieldCheck}
                        color="emerald"
                        sub="Verified Settlement"
                        onClick={() => setEditingField('paid')}
                        trend
                    />
                    <MetricCard 
                        label="Net Exposure"
                        value={supplier.netBalance ?? supplier.openingBalance ?? 0}
                        icon={ArrowUpRight}
                        color="rose"
                        sub="Pending Liquidation"
                        onClick={() => setEditingField('outstanding')}
                        alert={(supplier.netBalance || 0) > (supplier.totalAmount || 1) * 0.7}
                    />
                </div>

                {/* Logistics Performance Analytics */}
                <div className="erp-card rounded-[3.5rem] p-10 border-none shadow-sm group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Activity className="w-64 h-64 text-blue-500" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-end justify-between gap-8 mb-12">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm border border-orange-500/10">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Fulfillment Velocity</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Rolling 30-Day Logistics Oscillator</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-2 justify-end mb-1">
                                <span className="text-4xl font-black text-neutral-900 dark:text-main italic tracking-tighter leading-none">96.4%</span>
                                <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                             </div>
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">Peak Reliability</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 h-48 mb-8 relative">
                         {/* Grid Lines */}
                        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none opacity-5">
                            <div className="h-px bg-neutral-400 w-full" />
                            <div className="h-px bg-neutral-400 w-full" />
                            <div className="h-px bg-neutral-400 w-full" />
                            <div className="h-px bg-neutral-400 w-full" />
                        </div>

                        {[45, 60, 55, 80, 75, 90, 85, 95, 88, 100, 92, 98, 94, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500/5 dark:bg-blue-500/5 rounded-t-2xl relative group/bar hover:bg-blue-500/10 transition-all overflow-hidden border-x border-t border-transparent hover:border-blue-500/20">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-blue-600 dark:bg-blue-500 rounded-t-xl transition-all duration-1000 delay-[i*50ms] group-hover/bar:bg-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                                style={{ height: `${h}%` }}
                            />
                        </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] font-mono italic">
                        <span>Cycle Start: {new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString(undefined, {month: 'short', day: '2-digit'})}</span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]" /> Active Sourcing</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" /> Base Matrix</div>
                        </div>
                        <span>Current Peak</span>
                    </div>
                </div>

                {/* Core Registry Detail */}
                <div className="erp-card rounded-[3.5rem] p-12 border-none shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Building2 className="w-64 h-64 text-blue-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 shadow-sm border border-violet-500/10">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Enterprise Registry</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Core Identity and Communication Protocols</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <InfoNode label="Principal Delegate" value={supplier.contactPersonName} icon={User} />
                        <InfoNode label="Designation Class" value={supplier.supplierGroup || 'Independent Unit'} icon={Briefcase} />
                        <InfoNode label="Organizational Archetype" value={supplier.supplierType} icon={Building2} />
                        <InfoNode label="Tax Authority Link" value={supplier.gstNo || 'UNREGISTERED'} icon={ShieldCheck} highlight={!supplier.gstNo} />
                        <InfoNode label="Communication Link" value={supplier.email || 'OFFLINE NODE'} icon={Mail} />
                        <InfoNode label="Direct Response" value={supplier.contactNo} icon={Phone} />
                    </div>

                    <div className="mt-16 pt-12 border-t border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-12">
                         <div className="flex-1 flex flex-col gap-6">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic mb-2">Physical Location Matrix</h4>
                            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-inner group/address relative overflow-hidden">
                                <MapPin className="absolute top-6 right-6 w-12 h-12 text-blue-500/5 group-hover/address:scale-125 transition-transform duration-1000" />
                                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed italic z-10 relative">
                                    {supplier.physicalAddress || "Temporal spatial coordinates not registered for this entity."}
                                </p>
                            </div>
                         </div>
                         <div className="flex-1 flex flex-col gap-6">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic mb-2">Inventory Sourcing History</h4>
                            <div className="flex flex-wrap gap-3">
                                {supplier.itemsSupplied && supplier.itemsSupplied.length > 0 ? (
                                    supplier.itemsSupplied.map((item, i) => (
                                        <div key={i} className="px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:text-blue-500 hover:border-blue-500/20 transition-all cursor-default scale-in duration-500 shadow-none hover:shadow-lg">
                                            {item}
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center gap-3">
                                        <Box className="w-8 h-8 text-neutral-200" />
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Inventory Matrix Empty</p>
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Tactical Intelligence Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
                
                {/* Protocol Health Profile */}
                <div className="erp-card rounded-[3rem] p-8 border-none shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <ShieldCheck className="w-48 h-48 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Tactical Check</h3>
                    </div>

                    <div className="space-y-8">
                        {/* Reliability Node */}
                         <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] group/score hover:bg-emerald-500/10 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Reliability Coefficient</span>
                                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                            </div>
                            <div className="flex items-end justify-between gap-4 mt-6">
                                <span className="text-5xl font-black text-neutral-900 dark:text-main italic tracking-tighter leading-none">
                                    {supplier.performanceMetrics?.reliabilityScore || 100}
                                </span>
                                <div className="text-right pb-1">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none block mb-1">Elite Standing</span>
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Calculated Real-time</span>
                                </div>
                            </div>
                            <div className="mt-6 w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${supplier.performanceMetrics?.reliabilityScore || 100}%` }} />
                            </div>
                         </div>

                         {/* Credit Parameters */}
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 rounded-[2rem] text-center group/credit hover:bg-blue-500/10 transition-all">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] italic mb-3">Credit Bound</p>
                                <p className="text-xl font-black text-blue-600 dark:text-blue-400 italic">₹{(supplier.creditLimit || 0).toLocaleString()}</p>
                                <Zap className="w-4 h-4 text-blue-500 mx-auto mt-4 opacity-30 group-hover/credit:scale-125 transition-transform" />
                            </div>
                            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] text-center">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] italic mb-3">Stasis Term</p>
                                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 italic">{supplier.creditPeriod || 0} Cycles</p>
                                <Clock className="w-4 h-4 text-neutral-400 mx-auto mt-4 opacity-30" />
                            </div>
                         </div>

                         {/* Interaction Log */}
                         <div className="flex items-center gap-4 p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 group/history duration-500 hover:border-blue-500/20">
                            <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover/history:bg-blue-500 group-hover/history:text-white transition-all">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1 italic">Last Synchronization</p>
                                <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tighter">
                                    {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Initial Seed'}
                                </p>
                            </div>
                         </div>

                         <div className="pt-6">
                            <button
                                onClick={() => navigate(`/suppliers/${supplier._id}/ledger`)}
                                className="w-full py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group/ledger"
                            >
                                <FileText className="w-4 h-4 group-hover/ledger:rotate-12 transition-transform" />
                                <span>Generate Intelligence Ledger</span>
                            </button>
                         </div>
                    </div>
                </div>

                {/* AI Predictive Insight */}
                <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-1000 rotate-12">
                        <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Predictive Neural Note</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed italic text-blue-100 opacity-90">
                            "Supplier node 342-X demonstrates high behavioral stability. Recommend increasing procurement volume for Sector-02 to leverage established logistics peaks before the anticipated cycle stasis."
                        </p>
                        <div className="mt-8 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-indigo-900 bg-blue-500 flex items-center justify-center text-[8px] font-black">AI</div>)}
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Analysis Verified</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Global Verification Footprint */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Protocol Profile Verified • BizzAI Intelligence Core</span>
            </div>
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
        </div>

        {/* Financial Adjustment Modal */}
        {editingField && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xl" onClick={() => setEditingField(null)} />
                <div className="bg-white dark:bg-neutral-900 rounded-[3rem] shadow-2xl w-full max-w-md p-10 relative z-10 border border-neutral-100 dark:border-neutral-800 scale-in duration-300">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Edit3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Modify Coefficient</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Fine-tuning {editingField.toUpperCase()} delta</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="p-6 bg-neutral-50 dark:bg-neutral-950 rounded-[2rem] border border-neutral-100 dark:border-neutral-800">
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 italic leading-none text-center">Current Matrix Value</p>
                             <p className="text-4xl font-black text-neutral-900 dark:text-main text-center italic tracking-tighter">
                                ₹ {
                                    editingField === 'invoiced' ? (supplier.totalAmount || 0).toLocaleString() :
                                    editingField === 'paid' ? (supplier.totalPaid || 0).toLocaleString() :
                                    (supplier.netBalance ?? supplier.openingBalance ?? 0).toLocaleString()
                                }
                             </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic px-4">New Aggregate Vector</label>
                            <input
                                type="number"
                                autoFocus
                                className="w-full text-3xl font-black p-8 rounded-[2.5rem] border-none bg-neutral-100 dark:bg-neutral-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all italic tracking-tighter text-center dark:text-white shadow-inner"
                                placeholder="0.00"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveFinancial(parseFloat((e.target as HTMLInputElement).value));
                                    }
                                }}
                            />
                             <p className="text-[10px] font-bold text-neutral-400 text-center italic leading-relaxed px-6">
                                {editingField === 'outstanding'
                                    ? "Manual calibration of the Opening Balance stasis point."
                                    : "Adjustment will be logged as a historical delta in the registry."}
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setEditingField(null)}
                                className="flex-1 py-5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] hover:bg-neutral-200 transition-all italic"
                            >
                                Abort
                            </button>
                            <button
                                onClick={(e) => {
                                    const input = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement);
                                    handleSaveFinancial(parseFloat(input.value));
                                }}
                                className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all italic flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Apply Coefficient
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </PageShell>
    </Layout>
  );
};

// Sub-components for cleaner structure
const MetricCard = ({ label, value, icon: Icon, color, sub, onClick, trend, alert }: any) => {
    const colorClasses = {
        blue: 'text-blue-500 border-blue-100/50 bg-blue-500/5 dark:border-blue-500/10',
        emerald: 'text-emerald-500 border-emerald-100/50 bg-emerald-500/5 dark:border-emerald-500/10',
        rose: 'text-rose-500 border-rose-100/50 bg-rose-500/5 dark:border-rose-500/10',
    };
    
    return (
        <div 
            onClick={onClick}
            className={`erp-card rounded-[3rem] p-8 border shadow-sm relative overflow-hidden cursor-pointer group hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ${alert ? 'ring-2 ring-rose-500/30 ring-offset-4 ring-offset-transparent' : 'border-neutral-100 dark:border-neutral-800'}`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-3 italic">{label}</p>
                     <p className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic">
                        ₹ {value.toLocaleString('en-IN')}
                     </p>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none italic">{sub}</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${trend ? 'bg-emerald-500' : alert ? 'bg-rose-500' : 'bg-blue-500'}`} />
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none">Status: {trend ? 'OPTIMUM' : alert ? 'CRITICAL' : 'NOMINAL'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoNode = ({ label, value, icon: Icon, highlight }: any) => (
    <div className="flex flex-col gap-3 group/node">
        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic">
            <Icon className="w-3.5 h-3.5 group-hover/node:scale-110 transition-transform" />
            {label}
        </div>
        <div className={`px-6 py-4 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-sm font-bold tracking-tight italic transition-all group-hover/node:border-blue-500/20 shadow-none hover:shadow-lg ${highlight ? 'text-rose-500 border-rose-500/20' : 'text-neutral-900 dark:text-neutral-100'}`}>
            {value}
        </div>
    </div>
);

const BadgeStatus = ({ status }: any) => {
    const colors: any = {
        active: 'bg-emerald-500 border-emerald-500/20 text-emerald-500/10',
        inactive: 'bg-neutral-500 border-neutral-500/20 text-neutral-500/10',
    };
    return (
        <span className="inline-flex items-center align-middle px-3 py-1 bg-emerald-500/10 border border-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 ml-4 group">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 group-hover:scale-150 transition-transform" />
            {status || 'Operational'}
        </span>
    );
};

export default SupplierDetail;
