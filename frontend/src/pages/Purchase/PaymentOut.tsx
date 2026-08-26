
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    CreditCard, ArrowLeft, Save, Search, DollarSign,
    Calendar, Building, Tag, FileText, CheckCircle2,
    Calculator, Info, Download, Send, Percent
} from 'lucide-react';
import api from "../../services/api";
import { PurchasePayment, PurchasePaymentMethod as PaymentMethod, PaymentBillAllocation, PurchaseBill } from "../../types/purchase";
import { toast } from 'react-toastify';

const PaymentOut: React.FC = () => {
    const navigate = useNavigate();
    const { vendorId } = useParams<{ vendorId?: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [outstandingBills, setOutstandingBills] = useState<PurchaseBill[]>([]);

    // Form State
    const [paymentData, setPaymentData] = useState<Partial<PurchasePayment>>({
        payment_date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        status: 'Pending',
        currency: 'INR',
        exchange_rate: 1,
        allocations: [],
        total_amount: 0,
        attachments: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: vendorData } = await api.get('/api/vendors');
                setVendors(vendorData || []);

                if (vendorId) {
                    const vendor = vendorData.find((v: any) => v.id === vendorId || v._id === vendorId);
                    if (vendor) {
                        setPaymentData(prev => ({
                            ...prev,
                            vendor_id: vendorId,
                            vendor_name: vendor.name
                        }));
                        fetchBills(vendorId);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch vendors", err);
            }
        };
        fetchData();
    }, [vendorId]);

    const fetchBills = async (vId: string) => {
        try {
            // In a real app: const { data } = await api.get(`/api/bills/outstanding?vendorId=${vId}`);
            // Mocking outstanding bills
            setOutstandingBills([
                {
                    id: 'b1', bill_number: 'BILL-1001', bill_date: '2024-03-01',
                    total_amount: 50000, status: 'Approved', due_date: '2024-03-31',
                    vendor_id: vId, vendor_name: 'Mock Vendor', amount: 50000, tax_breakdown: {} as any,
                    payment_terms: 'Net 30', created_at: '', attachments: [], items: []
                },
                {
                    id: 'b2', bill_number: 'BILL-1005', bill_date: '2024-03-10',
                    total_amount: 25000, status: 'Approved', due_date: '2024-04-10',
                    vendor_id: vId, vendor_name: 'Mock Vendor', amount: 25000, tax_breakdown: {} as any,
                    payment_terms: 'Net 30', created_at: '', attachments: [], items: []
                }
            ]);
        } catch (err) {
            toast.error("Failed to fetch outstanding bills");
        }
    };

    const handleVendorChange = (id: string) => {
        const vendor = vendors.find(v => v.id === id || v._id === id);
        if (vendor) {
            setPaymentData(prev => ({
                ...prev,
                vendor_id: id,
                vendor_name: vendor.name,
                allocations: []
            }));
            fetchBills(id);
        }
    };

    const toggleBillSelection = (bill: PurchaseBill) => {
        const isSelected = paymentData.allocations?.find(a => a.bill_id === bill.id);
        if (isSelected) {
            setPaymentData(prev => ({
                ...prev,
                allocations: prev.allocations?.filter(a => a.bill_id !== bill.id)
            }));
        } else {
            const newAllocation: PaymentBillAllocation = {
                bill_id: bill.id,
                bill_number: bill.bill_number,
                amount_paid: bill.total_amount, // Default to full payment
                discount_applied: 0
            };
            setPaymentData(prev => ({
                ...prev,
                allocations: [...(prev.allocations || []), newAllocation]
            }));
        }
    };

    const updateAllocation = (index: number, field: keyof PaymentBillAllocation, value: any) => {
        const newAllocations = [...(paymentData.allocations || [])];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        setPaymentData(prev => ({ ...prev, allocations: newAllocations }));
    };

    const totalToPay = useMemo(() => {
        return (paymentData.allocations || []).reduce((sum, a) => sum + (Number(a.amount_paid) || 0), 0);
    }, [paymentData.allocations]);

    const handleSave = async () => {
        if (!paymentData.vendor_id) return toast.warning("Please select a vendor");
        if ((paymentData.allocations || []).length === 0) return toast.warning("Please select at least one bill to pay");

        setIsLoading(true);
        try {
            const payload = { ...paymentData, total_amount: totalToPay };
            console.log("Saving Payment:", payload);
            // In a real app: await api.post('/api/payments', payload);
            toast.success("Payment recorded successfully");
            navigate('/purchase/payments');
        } catch (err) {
            toast.error("Failed to save payment");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-brand-600" />
                                Record Supplier Payment
                            </h1>
                            <p className="text-sm text-neutral-500 font-medium">Clear outstanding balances and settle multi-bill invoices.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/20 px-8"
                        >
                            {isLoading ? 'Processing...' : <><Save className="w-4 h-4 mr-2" /> Save Payment</>}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-neutral-400" />
                                Payment Header
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Supplier</label>
                                    <select
                                        value={paymentData.vendor_id || ''}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    >
                                        <option value="">Select Supplier</option>
                                        {vendors.map(v => (
                                            <option key={v.id || v._id} value={v.id || v._id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentData.payment_date}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Payment Method</label>
                                    <select
                                        value={paymentData.method}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value as PaymentMethod }))}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="cash">Cash</option>
                                        <option value="credit_card">Credit Card</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reference ID / Cheque #</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={paymentData.reference_id || ''}
                                            onChange={(e) => setPaymentData(prev => ({ ...prev, reference_id: e.target.value }))}
                                            placeholder="Enter Transaction Ref"
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        />
                                        <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill Allocation Section */}
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden text-neutral-900 dark:text-neutral-100">
                            <div className="p-4 border-b dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-brand-600" />
                                    Bill Allocation
                                </h3>
                                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-bold uppercase">
                                    {outstandingBills.length} Outstanding Bills
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                        <tr>
                                            <th className="px-6 py-3 w-10"></th>
                                            <th className="px-6 py-3 font-bold text-neutral-500 uppercase text-[10px]">Bill Details</th>
                                            <th className="px-6 py-3 font-bold text-neutral-500 uppercase text-[10px]">Due Date</th>
                                            <th className="px-6 py-3 font-bold text-neutral-500 uppercase text-[10px] text-right">Balance</th>
                                            <th className="px-6 py-3 font-bold text-neutral-500 uppercase text-[10px] text-right w-40">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {outstandingBills.map((bill) => {
                                            const allocation = paymentData.allocations?.find(a => a.bill_id === bill.id);
                                            const isSelected = !!allocation;

                                            return (
                                                <tr key={bill.id} className={`${isSelected ? 'bg-brand-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleBillSelection(bill)}
                                                            className="w-4 h-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-neutral-900 dark:text-white">{bill.bill_number}</span>
                                                            <span className="text-[10px] text-neutral-500">{bill.bill_date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-neutral-600 font-medium">{bill.due_date}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-bold">{formatCurrency(bill.total_amount)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isSelected ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    value={allocation.amount_paid}
                                                                    onChange={(e) => {
                                                                        const idx = paymentData.allocations?.findIndex(a => a.bill_id === bill.id);
                                                                        if (idx !== undefined && idx !== -1) updateAllocation(idx, 'amount_paid', e.target.value);
                                                                    }}
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-neutral-950 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-right font-bold focus:ring-2 focus:ring-brand-500/20 outline-none"
                                                                />
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">₹</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-neutral-300 text-[10px] italic">Select to pay</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {outstandingBills.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                                                    Select a vendor to see outstanding bills.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="space-y-6">
                        <div className="bg-brand-600 rounded-sm p-6 text-white shadow-xl shadow-brand-600/20 sticky top-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Settlement Summary
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-brand-500/30">
                                    <span className="text-sm font-medium opacity-80">Total Bills Selected</span>
                                    <span className="font-bold">{(paymentData.allocations || []).length}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-brand-500/30">
                                    <span className="text-sm font-medium opacity-80">Payment Method</span>
                                    <span className="font-bold">{paymentData.method}</span>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Total Payout</span>
                                        <span className="text-2xl font-black">{formatCurrency(totalToPay)}</span>
                                    </div>
                                    <p className="text-[10px] opacity-60 italic text-right">This amount will be debited from selected bank account.</p>
                                </div>

                                <div className="pt-6 space-y-3">
                                    <button
                                        onClick={handleSave}
                                        className="w-full py-3 bg-white text-brand-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Complete Payment
                                    </button>
                                    <button className="w-full py-3 bg-brand-700/50 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                        <Send className="w-4 h-4" />
                                        Save & Email Advice
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Extra Notes */}
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-neutral-400" />
                                Private Notes
                            </h3>
                            <textarea
                                value={paymentData.notes || ''}
                                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add internal notes about this payment..."
                                className="w-full h-32 px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentOut;
