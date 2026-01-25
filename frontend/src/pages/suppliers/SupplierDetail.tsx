import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset, Supplier } from '../../redux/slices/supplierSlice';
import { AppDispatch, RootState } from '../../redux/store';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  History,
  Package,
  Edit3,
  ShieldCheck,
  Briefcase,
  Globe,
  FileText
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { supplier, isLoading, isError, message } = useSelector(
    (state: RootState) => state.suppliers
  );

  useEffect(() => {
    dispatch(getSupplierById(id) as any);
    return () => {
      dispatch(reset() as any);
    };
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">Fetching Partner Profile...</p>
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
            breadcrumbs={[{ label: 'Suppliers', link: '/suppliers' }, { label: 'Detail' }]}
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
        breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Directory', link: '/suppliers' }, { label: 'Supplier Profile' }]}
        actions={
          <button
            onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        }
      />

      <SupplierSubNav />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Core Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Building2 className="w-48 h-48 text-indigo-500" />
            </div>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-200 dark:shadow-none">
                {supplier.businessName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{supplier.businessName}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${supplier.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {supplier.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Contact Person</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <User className="w-3.5 h-3.5 text-indigo-500" /> {supplier.contactPersonName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Type</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> {supplier.supplierType}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Identity (GST)</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> {supplier.gstNo || 'Not Registered'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication Channel</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" /> {supplier.email || 'offline-only'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reachability & Logistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
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
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Tele-Response</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Direct Line</span>
                  <span className="text-xs font-black text-indigo-600">{supplier.contactNo}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Email Node</span>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{supplier.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory/Items History */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">Catalog Intelligence</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Items regularly sourced</p>
                </div>
              </div>
              <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">View History</button>
            </div>
            {supplier.itemsSupplied && supplier.itemsSupplied.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {supplier.itemsSupplied.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No procurement history detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats Area */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial health card */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <CreditCard className="w-32 h-32 text-white" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-70">Financial Pulse</h3>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Current Liabilities</p>
                <p className="text-4xl font-black">₹{supplier.openingBalance?.toLocaleString('en-IN') || '0.00'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Exposure</p>
                  <p className="text-sm font-black uppercase leading-none mt-1">{supplier.balanceType}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Credit Days</p>
                  <p className="text-sm font-black leading-none mt-1">{supplier.creditPeriod || 0} Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Insights */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Partner Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Update</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">
                    {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Initial Seed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Contract Status</p>
                  <p className="text-xs font-bold text-emerald-500 leading-none mt-1 uppercase tracking-widest">Active Agreement</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vetting Score</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mt-1 uppercase tracking-widest tracking-[0.2em]">Verified</p>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all">
              Generate Ledger
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetail;