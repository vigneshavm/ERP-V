import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Printer, Download, Share2, MoreHorizontal, 
    CheckCircle2, Clock, AlertCircle, FileText, User, 
    MapPin, Calendar, Hash, Package, IndianRupee, CreditCard
} from 'lucide-react';
import { salesInvoices, customers, inventory, MockSalesInvoice, MockProduct, MockCustomer } from '../../../data';
import Layout from '../../../components/shared/Layout';

const SalesInvoiceDetailMockUI: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const invoice = useMemo<MockSalesInvoice>(() => {
        return (salesInvoices.find(inv => inv.invoice_no === id) || salesInvoices[0]) as MockSalesInvoice;
    }, [id]);

    const customer = useMemo<MockCustomer>(() => {
        return (customers.find(c => c.name === invoice?.customer_name) || customers[0]) as MockCustomer;
    }, [invoice]);

    const lineItems = useMemo(() => {
        // Simulated line items based on invoice total
        const firstProduct = inventory[0] as MockProduct;
        return [
            { id: firstProduct.id, name: firstProduct.name, qty: 1, rate: invoice.total / 1.18 },
        ];
    }, [invoice]);

    const subtotal = invoice.total / 1.18;
    const tax = invoice.total - subtotal;

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 transition-all text-neutral-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                Invoice <span className="text-primary">#{invoice.invoice_no}</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                Document Integrity Verified // Protocol SI-V4
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Printer className="w-4 h-4 text-primary" /> Print
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                        <button className="h-12 w-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 rounded-sm hover:bg-neutral-50 flex items-center justify-center transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Invoice Body */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Summary Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-sm text-primary">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Issuance Date</p>
                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase">{invoice.date}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
                                <div className={`p-3 rounded-sm ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {invoice.status === 'Paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Settlement Status</p>
                                    <p className={`text-sm font-black uppercase ${invoice.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{invoice.status}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-sm text-indigo-500">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Payment Method</p>
                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase">Electronic Fund Transfer</p>
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800">
                                <div className="p-8 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" /> Billed To
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-neutral-900 dark:text-white uppercase">{customer.name}</p>
                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Institutional Client // {customer.id}</p>
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase leading-relaxed">
                                            122 Business Park, North Wing<br />
                                            Corporate Sector 4, Silicon Valley<br />
                                            GSTIN: 27AAACR1234Z1Z5
                                        </p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" /> Logistics Path
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase">Primary Distribution Node</p>
                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Warehouse ID: WH-01-A</p>
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase leading-relaxed italic">
                                            Delivery Status: VERIFIED & SEALED<br />
                                            Tracking Protocol: ACTIVE
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
                                    <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                        <th className="px-8 py-5">Product identifier</th>
                                        <th className="px-8 py-5 text-center w-32">Quantity</th>
                                        <th className="px-8 py-5 text-right w-40">Unit value</th>
                                        <th className="px-8 py-5 text-right w-40">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {lineItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-neutral-900 dark:text-white uppercase">{item.name}</div>
                                                <div className="text-[9px] font-mono text-neutral-400 mt-1 uppercase">SKU: {item.id}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-black text-neutral-700 dark:text-neutral-300 tabular-nums">{item.qty.toString().padStart(2, '0')} UNITS</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1 font-mono text-xs font-black text-neutral-400">
                                                    <IndianRupee className="w-3 h-3" />
                                                    {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1 font-mono text-xs font-black text-neutral-900 dark:text-white">
                                                    <IndianRupee className="w-3 h-3" />
                                                    {(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar Totals */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                <FileText className="w-4 h-4 text-primary" /> Financial Audit
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                    <span>Base Amount</span>
                                    <span className="font-mono text-xs text-neutral-900 dark:text-white tabular-nums">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                    <span>Tax aggregate (18%)</span>
                                    <span className="font-mono text-xs text-neutral-900 dark:text-white tabular-nums">₹{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-4" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white">Net Settlement</span>
                                    <span className="text-2xl font-display font-black text-primary tabular-nums">₹{invoice.total.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-100 dark:border-neutral-800">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Institutional Verification Node Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm space-y-4 relative overflow-hidden group">
                            <Share2 className="w-12 h-12 absolute -right-4 -bottom-4 text-primary/10 group-hover:scale-110 transition-transform" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Compliance Node SI-V4</h4>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                This document is digitally signed and cryptographically verified. Any modification will invalidate the signature.
                            </p>
                        </div>

                        <button className="w-full h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black uppercase tracking-widest text-xs rounded-sm transition-all hover:opacity-90 flex items-center justify-center gap-3 shadow-lg">
                            <Printer className="w-4 h-4" /> Print Pro-Forma
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesInvoiceDetailMockUI;
