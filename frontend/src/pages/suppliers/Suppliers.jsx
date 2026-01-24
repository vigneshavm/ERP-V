import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllSuppliers, deleteSupplier, reset } from '../../redux/slices/supplierSlice';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  RefreshCcw,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

const Suppliers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { suppliers, isLoading, isError, message } = useSelector(
    (state) => state.suppliers
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(getAllSuppliers());
    return () => {
      if (window.location.pathname === "/suppliers")
        dispatch(reset());
    };
  }, [dispatch]);

  const handleDelete = async (id) => {
    await dispatch(deleteSupplier(id));
    setDeleteConfirm(null);
    dispatch(getAllSuppliers());
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactNo.includes(searchTerm) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = [
    { label: 'Total Suppliers', value: suppliers.length, icon: Users, color: 'indigo', trend: '+12%' },
    { label: 'Active Partners', value: suppliers.filter(s => s.status === 'active').length, icon: ShieldCheck, color: 'emerald', trend: '98%' },
    { label: 'Pending Dues', value: '₹4.2L', icon: TrendingUp, color: 'amber', trend: 'High' }
  ];

  return (
    <Layout>
      <PageHeader
        title="Supplier Directory"
        description="Manage your enterprise supply chain and procurement partners"
        breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers' }]}
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => navigate('/suppliers/add')}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add New Supplier
            </button>
          </>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-24 h-24 text-${stat.color}-600`} />
              </div>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <span className={`text-xs font-black px-2 py-1 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative w-full sm:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter by name, contact or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">
                  <th className="px-8 py-5">Supplier Profile</th>
                  <th className="px-8 py-5">Contact Node</th>
                  <th className="px-8 py-5">Classification</th>
                  <th className="px-8 py-5">Operational Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">Synchronizing Supplier Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50 grayscale">
                        <Users className="w-16 h-16 text-slate-300" />
                        <p className="text-base font-bold text-slate-500 uppercase tracking-widest">No Supplier Records Found</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                          {supplier.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">{supplier.businessName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{supplier.supplierId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{supplier.contactNo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-[11px] truncate max-w-[150px]">{supplier.email || 'no-email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {supplier.supplierType}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {supplier.status === 'active' ? (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Inactive</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/suppliers/${supplier._id}`)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(supplier._id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="System Authorization Required"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">Decommission Supplier?</p>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Terminating this supplier record will affect historical procurement data. This action is irreversible within the current session audit.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-transparent"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all"
            >
              Confirm Termination
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Suppliers;