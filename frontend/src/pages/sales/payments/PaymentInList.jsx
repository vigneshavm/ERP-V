import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../../components/Layout';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PaymentInList = () => {
    const navigate = useNavigate();

    // Get token from user object in localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${API_URL}/api/payment-in`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to fetch payment records');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Dashboard Metrics
    const totalCollections = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalCount = payments.length;
    // Assuming 'today' is relevant for recent activity, but for now we'll just show total count
    // or maybe count of payments with non-zero excess/credit
    const creditPayments = payments.filter(p => p.excessAmount > 0).length;

    // Filter payments based on search query
    const filteredPayments = payments.filter(payment => {
        const query = searchQuery.toLowerCase();
        return (
            payment.receiptNumber.toLowerCase().includes(query) ||
            payment.customer?.name?.toLowerCase().includes(query) ||
            payment.customer?.phone?.includes(query)
        );
    });

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payment In</h1>
                        <p className="text-sm text-slate-500 mt-1">Track and manage customer payments</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                            title="Print List"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigate('/sales/payment-in')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-all font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Record Payment</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard / Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collections</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{totalCollections.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-emerald-600 font-medium">
                            <span className="flex items-center">
                                Total received amount
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transactions</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">With Credit/Excess</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{creditPayments}</h3>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            Payments with carry-forward balance
                        </div>
                    </div>
                </div>

                {/* Main Content Island */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Advanced Filter Bar */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:max-w-md group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search receipt #, customer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-sm"
                                />
                            </div>

                            {/* Clear Filter */}
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-sm text-slate-500 hover:text-indigo-600 font-medium px-2 transition-colors"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Display */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Loading payments...</p>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No records found</h3>
                            <p className="text-slate-500 mt-1 max-w-sm">
                                Try adjusting your search or record a new payment.
                            </p>
                            <button
                                onClick={() => navigate('/sales/payment-in')}
                                className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
                            >
                                Record Payment
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt No</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Allocation</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Methods</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredPayments.map((payment) => (
                                            <tr
                                                key={payment._id}
                                                onClick={() => navigate(`/sales/payment-in/${payment._id}`)}
                                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-indigo-600">{payment.receiptNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {new Date(payment.paymentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{payment.customer?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{payment.customer?.phone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        {payment.allocatedInvoices && payment.allocatedInvoices.length > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                                {payment.allocatedInvoices.length} Inv
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                                Advance
                                                            </span>
                                                        )}
                                                        {payment.excessAmount > 0 && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                                +Credit
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {payment.paymentMethods.map((pm, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] uppercase font-bold rounded">
                                                                {pm.method}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="font-bold text-slate-800">₹{payment.totalAmount.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/sales/payment-in/${payment._id}`);
                                                            }}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                            title="View"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/sales/payment-in/${payment._id}`);
                                                                setTimeout(() => window.print(), 500);
                                                            }}
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                                                            title="Print"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Stack View */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {filteredPayments.map((payment) => (
                                    <div
                                        key={payment._id}
                                        onClick={() => navigate(`/sales/payment-in/${payment._id}`)}
                                        className="p-4 active:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-slate-800">{payment.receiptNumber}</div>
                                                <div className="text-sm text-slate-600">{payment.customer?.name}</div>
                                            </div>
                                            <span className="font-bold text-slate-800">₹{payment.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="text-xs text-slate-500">
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-1">
                                                {payment.paymentMethods.map((pm, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold rounded">
                                                        {pm.method}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PaymentInList;
