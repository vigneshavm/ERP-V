import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset } from "../../redux/slices/supplierSlice";
import { AppDispatch, RootState } from "../../redux/store";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
  Building2,
  User,
  Phone,
  MapPin,
  History,
  Package,
  Edit3,
  ShieldCheck,
  Briefcase,
  Globe,
  ArrowUpRight
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { supplier, isLoading, isError, message } = useSelector(
    (state: RootState) => state.suppliers
  );

  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedBranch, setSelectedBranch] = React.useState<string>(user?.branchId || '');

  // Edit Financials Logic
  const [editingField, setEditingField] = React.useState<'invoiced' | 'paid' | 'outstanding' | null>(null);

  const handleSaveFinancial = (newValue: number) => {
    if (isNaN(newValue)) return;
    if (!supplier) return;

    const updatePayload: any = {};

    if (editingField === 'invoiced') {
      // New Total = Real Bills + Manual
      // Manual = New Total - Real Bills
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
      // Net Balance = Opening + Invoiced - Paid - DebitNotes
      // New Opening = New Outstanding - (Invoiced - Paid - DebitNotes)
      // We must use values EXCLUDING the opening balance component
      const currentOutstanding = supplier.netBalance ?? 0;
      const currentOpening = supplier.openingBalance || 0;

      // The "Activity" component of balance
      const activityBalance = currentOutstanding - currentOpening;

      updatePayload.openingBalance = newValue - activityBalance;
    }

    dispatch(import('../../redux/slices/supplierSlice').then(mod => mod.updateSupplier({
      id: supplier._id,
      supplierData: updatePayload
    })) as any).then(() => {
      setEditingField(null);
      // Refresh to see updated calculation
      dispatch(getSupplierById({ id: supplier._id, branchId: selectedBranch }) as any);
    });
  };

  useEffect(() => {
    if (id) {
      // We'll need to modify the slice to accept params, or just dispatch generic and filter locally?
      // Actually, the slice usually fetches the static profile.
      // The analytics (Outstanding info) is fetched via separate call or part of getSupplierById?
      // Checking getSupplierById implementation... it seems it fetches the whole aggregated object.
      // We should update the slice thunk to accept query params.
      dispatch(getSupplierById({ id, branchId: selectedBranch }) as any);
    }
    return () => {
      dispatch(reset() as any);
    };
  }, [dispatch, id, selectedBranch]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">Loading supplier...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !supplier) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-10">
          <PageHeader
            title="Profile Error"
            description={message || "The requested supplier profile could not be retrieved from the terminal."}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={supplier.businessName}
        description={supplier.supplierId}
        actions={
          <div className="flex gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-4 py-2.5 outline-none"
            >
              <option value="">All Branches</option>
              {/* Ideally fetch branches dynamically, hardcoding for demo/MVP */}
              <option value="Main">Main Branch</option>
              <option value="B1">Branch 1</option>
              <option value="B2">Branch 2</option>
            </select>
            <button
              onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        }
      />

      <SupplierSubNav />

      {/* Summary Cards - Matching Directory Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Invoiced */}
        <div
          onClick={() => setEditingField('invoiced')}
          className="bg-white dark:bg-neutral-800 border-2 border-indigo-200 dark:border-primary/30 rounded-sm p-5 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 bg-indigo-50 rounded-md text-primary">
              <Edit3 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-primary/10 text-primary dark:text-primary">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-primary dark:text-primary uppercase tracking-wide">Total Invoiced</span>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            ₹ {(supplier.totalAmount || 0).toLocaleString('en-IN')}
          </span>
          {supplier.manualTotalInvoiced ? <span className="text-[10px] text-slate-400 block mt-1">(Includes manual adj.)</span> : null}
        </div>

        {/* Total Paid */}
        <div
          onClick={() => setEditingField('paid')}
          className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-sm p-5 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 bg-emerald-50 rounded-md text-emerald-600">
              <Edit3 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-success/10 text-emerald-600 dark:text-success">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-success uppercase tracking-wide">Total Paid</span>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            ₹ {(supplier.totalPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Net Balance */}
        <div
          onClick={() => setEditingField('outstanding')}
          className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-sm p-5 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 bg-rose-50 rounded-md text-rose-600">
              <Edit3 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-danger/10 text-rose-600 dark:text-danger">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-danger uppercase tracking-wide">Outstanding Balance</span>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            ₹ {(supplier.netBalance ?? supplier.openingBalance ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Edit Financials Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Edit {editingField === 'invoiced' ? 'Total Invoiced' : editingField === 'paid' ? 'Total Paid' : 'Outstanding Balance'}
              </h3>
              <button onClick={() => setEditingField(null)} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Value</label>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹ {
                    editingField === 'invoiced' ? (supplier.totalAmount || 0).toLocaleString() :
                      editingField === 'paid' ? (supplier.totalPaid || 0).toLocaleString() :
                        (supplier.netBalance ?? supplier.openingBalance ?? 0).toLocaleString()
                  }
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase">New TOTAL Value</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full text-xl font-bold p-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all"
                  placeholder="Enter new total..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFinancial(parseFloat((e.target as HTMLInputElement).value));
                    }
                  }}
                />
                <p className="text-[10px] text-slate-400">
                  {editingField === 'outstanding'
                    ? "This will adjust the supplier's Opening Balance."
                    : "This will add a manual adjustment to account for historical data."}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement);
                    handleSaveFinancial(parseFloat(input.value));
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Core Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-neutral-700 shadow-sm overflow-hidden p-8 relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Building2 className="w-48 h-48 text-primary" />
            </div>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-sm bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-200 dark:shadow-none">
                {(supplier.businessName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{supplier.businessName}</h2>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${supplier.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                    {supplier.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mt-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Contact Person</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <User className="w-3.5 h-3.5 text-primary" /> {supplier.contactPersonName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand Affiliation</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-primary" /> {supplier.supplierGroup || 'Independent'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Type</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> {supplier.supplierType}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tax Identity (GST)</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {supplier.gstNo || 'Not Registered'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Communication Channel</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Globe className="w-3.5 h-3.5 text-primary" /> {supplier.email || 'offline-only'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reachability & Logistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-neutral-700 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Physical Presence</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                {supplier.physicalAddress || "No registered facility address provided."}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-neutral-700 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Tele-Response</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Line</span>
                  <span className="text-xs font-black text-primary">{supplier.contactNo}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Node</span>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{supplier.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory/Items History */}
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-neutral-700 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">Catalog Intelligence</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Items regularly sourced</p>
                </div>
              </div>
              <button className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-widest hover:underline">View History</button>
            </div>
            {supplier.itemsSupplied && supplier.itemsSupplied.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {supplier.itemsSupplied.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-sm border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No procurement history detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats Area */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Health - Metrics Grid */}
          {/* Credit & Terms Sidebar */}
          <div className="grid grid-cols-2 gap-4">
            {/* Credit Limit */}
            <div className="bg-[#F8FBFF] dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20 p-4 rounded-sm shadow-sm flex flex-col justify-center text-center">
              <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Credit Limit</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">₹{(supplier.creditLimit || 0).toLocaleString()}</p>
            </div>

            {/* Credit Days */}
            <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 p-4 rounded-sm shadow-sm flex flex-col justify-center text-center">
              <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Term</p>
              <p className="text-lg font-black text-slate-700 dark:text-slate-200">{supplier.creditPeriod || 0} Days</p>
            </div>
          </div>

          {/* Operational Insights - Checklist Style */}
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 dark:border-neutral-700">
              <h3 className="font-bold text-slate-800 dark:text-neutral-100">Performance Check</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Reliability Widget */}
              <div className="p-4 bg-emerald-50 dark:bg-success/10 border border-emerald-100/50 dark:border-success/20 rounded-xl group hover:bg-emerald-100/30 dark:hover:bg-emerald-500/15 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Reliability Score</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className={`text-2xl font-black ${(supplier.performanceMetrics?.reliabilityScore || 100) >= 80 ? 'text-success' : 'text-warning'}`}>
                    {supplier.performanceMetrics?.reliabilityScore || 100}/100
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Excellent</span>
                </div>
                {/* Mini Progress Bar */}
                <div className="mt-3 w-full h-1 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${supplier.performanceMetrics?.reliabilityScore || 100}%` }}
                  />
                </div>
              </div>

              {/* Last Update Widget */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Last Interaction</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Initial Seed'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/suppliers/${supplier._id}/ledger`)}
                className="w-full py-3 mt-2 bg-indigo-50 dark:bg-primary/10 text-primary dark:text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-primary/20 hover:bg-indigo-100 dark:hover:bg-primary/20 transition-all"
              >
                Generate Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetail;
