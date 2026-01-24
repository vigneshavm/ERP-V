import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../../services/api';
import { toast } from "react-toastify";
import Layout from "../../../components/Layout";
import PageHeader from "../../../components/PageHeader";
import FormInput from "../../../components/FormInput";
import CustomerSelectionModal from "../../../components/CustomerSelectionModal";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const PaymentIn = () => {
  const navigate = useNavigate();

  // Get token from user object in localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [formData, setFormData] = useState({
    receiptNo: "RCP-" + Date.now(),
    receiptDate: new Date().toISOString().split("T")[0],
    customer: null,
    paymentMethods: [
      {
        method: "cash",
        amount: 0,
        reference: "",
        bankAccount: "",
        cardType: "",
        chequeNumber: "",
        chequeDate: "",
        chequeBank: "",
      },
    ],
    depositAccount: "cash",
    notes: "",
  });

  const [customerInfo, setCustomerInfo] = useState({
    outstandingDue: 0,
    availableCredit: 0,
    outstandingInvoices: [],
  });

  const [invoiceAllocations, setInvoiceAllocations] = useState({});
  const [creditApplied, setCreditApplied] = useState(0);

  const paymentMethodOptions = [
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "upi", label: "UPI", icon: "📱" },
    { value: "card", label: "Card", icon: "💳" },
    { value: "cheque", label: "Cheque", icon: "🏦" },
    { value: "bank_transfer", label: "Bank Transfer", icon: "🏧" },
  ];

  // Fetch bank accounts on mount
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Fetch customer info when customer is selected
  useEffect(() => {
    if (formData.customer) {
      fetchCustomerInfo(formData.customer._id);
    } else {
      setCustomerInfo({
        outstandingDue: 0,
        availableCredit: 0,
        outstandingInvoices: [],
      });
      setInvoiceAllocations({});
      setCreditApplied(0);
    }
  }, [formData.customer]);

  // Auto-adjust deposit account when payment methods change
  useEffect(() => {
    const hasNonCashMethod = formData.paymentMethods.some(
      (pm) => pm.method !== "cash"
    );

    // If user switches to UPI or Bank Transfer and deposit account is still "cash",
    // and there are bank accounts available, suggest the first one
    if (
      hasNonCashMethod &&
      formData.depositAccount === "cash" &&
      bankAccounts.length > 0
    ) {
      setFormData({
        ...formData,
        depositAccount: bankAccounts[0]._id,
      });
    }
  }, [formData.paymentMethods]);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get(`${API_URL}/api/cashbank/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBankAccounts(response.data);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  };

  const fetchCustomerInfo = async (customerId) => {
    try {
      const response = await api.get(
        `${API_URL}/api/payment-in/customer/${customerId}/info`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCustomerInfo(response.data);
    } catch (error) {
      console.error("Error fetching customer info:", error);
      toast.error("Failed to fetch customer information");
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customer });
    setShowCustomerModal(false);
  };

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      paymentMethods: [
        ...formData.paymentMethods,
        {
          method: "cash",
          amount: 0,
          reference: "",
          bankAccount: "",
          cardType: "",
          chequeNumber: "",
          chequeDate: "",
          chequeBank: "",
        },
      ],
    });
  };

  const removePaymentMethod = (index) => {
    const newMethods = formData.paymentMethods.filter((_, i) => i !== index);
    setFormData({ ...formData, paymentMethods: newMethods });
  };

  const updatePaymentMethod = (index, field, value) => {
    const newMethods = [...formData.paymentMethods];
    newMethods[index][field] = value;
    setFormData({ ...formData, paymentMethods: newMethods });
  };

  const handleInvoiceAllocation = (invoiceId, amount) => {
    setInvoiceAllocations({
      ...invoiceAllocations,
      [invoiceId]: parseFloat(amount) || 0,
    });
  };

  // Calculate totals
  const totalPayment = formData.paymentMethods.reduce(
    (sum, pm) => sum + (parseFloat(pm.amount) || 0),
    0
  );
  const totalAllocated = Object.values(invoiceAllocations).reduce(
    (sum, amt) => sum + amt,
    0
  );
  const effectivePayment = totalPayment + creditApplied;
  const remainingAmount = effectivePayment - totalAllocated;

  const handleSave = async () => {
    // Validation
    if (!formData.customer) {
      toast.error("Please select a customer");
      return;
    }

    if (totalPayment <= 0) {
      toast.error("Total payment must be greater than zero");
      return;
    }

    if (!formData.depositAccount) {
      toast.error("Please select a deposit account");
      return;
    }

    if (creditApplied > customerInfo.availableCredit) {
      toast.error(
        `Credit applied (₹${creditApplied}) exceeds available credit (₹${customerInfo.availableCredit})`
      );
      return;
    }

    if (totalAllocated > effectivePayment) {
      toast.error("Total allocated amount exceeds total payment");
      return;
    }

    // Validate each invoice allocation
    for (const invoice of customerInfo.outstandingInvoices) {
      const allocated = invoiceAllocations[invoice._id] || 0;
      if (allocated > invoice.balance) {
        toast.error(
          `Allocated amount for ${invoice.invoiceNo} exceeds invoice balance`
        );
        return;
      }
    }

    // Prepare payload
    const allocatedInvoices = Object.entries(invoiceAllocations)
      .filter(([_, amount]) => amount > 0)
      .map(([invoiceId, amount]) => ({
        invoice: invoiceId,
        allocatedAmount: parseFloat(amount),
      }));

    // Ensure all payment method amounts are numbers and remove empty fields
    const cleanedPaymentMethods = formData.paymentMethods
      .filter((pm) => parseFloat(pm.amount) > 0)
      .map((pm) => {
        const cleaned = {
          method: pm.method,
          amount: parseFloat(pm.amount),
        };

        // Only add optional fields if they have values
        if (pm.reference && pm.reference.trim())
          cleaned.reference = pm.reference.trim();
        if (pm.bankAccount && pm.bankAccount.trim())
          cleaned.bankAccount = pm.bankAccount.trim();
        if (pm.cardType && pm.cardType.trim())
          cleaned.cardType = pm.cardType.trim();
        if (pm.chequeNumber && pm.chequeNumber.trim())
          cleaned.chequeNumber = pm.chequeNumber.trim();
        if (pm.chequeDate && pm.chequeDate.trim())
          cleaned.chequeDate = pm.chequeDate.trim();
        if (pm.chequeBank && pm.chequeBank.trim())
          cleaned.chequeBank = pm.chequeBank.trim();

        return cleaned;
      });

    const payload = {
      customerId: formData.customer._id,
      paymentDate: formData.receiptDate,
      paymentMethods: cleanedPaymentMethods,
      allocatedInvoices,
      creditApplied: parseFloat(creditApplied) || 0,
      depositAccount: formData.depositAccount,
      notes: formData.notes,
    };

    try {
      setLoading(true);
      const response = await api.post(`${API_URL}/api/payment-in`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Payment recorded successfully!");

      // Reset form
      setFormData({
        receiptNo: "RCP-" + Date.now(),
        receiptDate: new Date().toISOString().split("T")[0],
        customer: null,
        paymentMethods: [
          {
            method: "cash",
            amount: 0,
            reference: "",
            bankAccount: "",
            cardType: "",
            chequeNumber: "",
            chequeDate: "",
            chequeBank: "",
          },
        ],
        depositAccount: "cash",
        notes: "",
      });
      setInvoiceAllocations({});
      setCreditApplied(0);
    } catch (error) {
      console.error("Error saving payment:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save payment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    // Validate form first
    const totalPayment = formData.paymentMethods.reduce(
      (sum, pm) => sum + parseFloat(pm.amount || 0),
      0
    );
    const totalAllocated = Object.values(invoiceAllocations).reduce(
      (sum, amount) => sum + parseFloat(amount || 0),
      0
    );
    const effectivePayment = totalPayment + parseFloat(creditApplied || 0);

    if (!formData.customer) {
      toast.error("Please select a customer");
      return;
    }

    if (totalPayment <= 0) {
      toast.error("Total payment must be greater than zero");
      return;
    }

    if (!formData.depositAccount) {
      toast.error("Please select a deposit account");
      return;
    }

    // Save payment first
    try {
      setLoading(true);

      // Prepare payload (same as handleSave)
      const allocatedInvoices = Object.entries(invoiceAllocations)
        .filter(([_, amount]) => amount > 0)
        .map(([invoiceId, amount]) => ({
          invoice: invoiceId,
          allocatedAmount: parseFloat(amount),
        }));

      const cleanedPaymentMethods = formData.paymentMethods
        .filter((pm) => parseFloat(pm.amount) > 0)
        .map((pm) => {
          const cleaned = {
            method: pm.method,
            amount: parseFloat(pm.amount),
          };

          if (pm.reference && pm.reference.trim())
            cleaned.reference = pm.reference.trim();
          if (pm.bankAccount && pm.bankAccount.trim())
            cleaned.bankAccount = pm.bankAccount.trim();
          if (pm.cardType && pm.cardType.trim())
            cleaned.cardType = pm.cardType.trim();
          if (pm.chequeNumber && pm.chequeNumber.trim())
            cleaned.chequeNumber = pm.chequeNumber.trim();
          if (pm.chequeDate && pm.chequeDate.trim())
            cleaned.chequeDate = pm.chequeDate.trim();
          if (pm.chequeBank && pm.chequeBank.trim())
            cleaned.chequeBank = pm.chequeBank.trim();

          return cleaned;
        });

      const payload = {
        customerId: formData.customer._id,
        paymentDate: formData.receiptDate,
        paymentMethods: cleanedPaymentMethods,
        allocatedInvoices,
        creditApplied: parseFloat(creditApplied) || 0,
        depositAccount: formData.depositAccount,
        notes: formData.notes,
      };

      const response = await api.post(`${API_URL}/api/payment-in`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Payment saved! Opening print preview...");

      // Navigate to receipt detail page and trigger print
      const paymentId = response.data.payment._id;
      navigate(`/sales/payment-in/${paymentId}`);

      // Trigger print after a short delay to allow page to load
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (error) {
      console.error("Error saving payment for print:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save payment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-50 animate-fade-in">
        {/* Sticky Action Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payment In</h1>
            <p className="text-sm text-slate-500 mt-0.5">Record customer payments and receipts</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sales/payment-in-list")}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {loading ? "Saving..." : "Save Payment"}
            </button>
            <button
              onClick={handlePrint}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Left Column (Details & Customer) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Payment Details Card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Receipt Number</label>
                    <input
                      type="text"
                      value={formData.receiptNo}
                      disabled
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Receipt Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={formData.receiptDate}
                      onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Selection Card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Details</h2>
                </div>
                <div className="p-6">
                  {formData.customer ? (
                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{formData.customer.name}</p>
                          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            {formData.customer.phone}
                          </p>
                          <div className="flex gap-4 mt-4">
                            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                              <p className="text-[10px] uppercase font-bold text-slate-400">Outstanding</p>
                              <p className="text-sm font-bold text-rose-600">₹{customerInfo.outstandingDue.toFixed(2)}</p>
                            </div>
                            {customerInfo.availableCredit > 0 && (
                              <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-emerald-600">Available Credit</p>
                                <p className="text-sm font-bold text-emerald-700">₹{customerInfo.availableCredit.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setFormData({ ...formData, customer: null })}
                          className="text-red-600 hover:text-red-700 text-xs font-medium border border-red-200 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <span className="font-bold text-slate-600 group-hover:text-indigo-600">Select Customer</span>
                      <span className="text-xs text-slate-400">Search by name, phone or email</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outstanding Invoices (Allocation) */}
              {formData.customer && customerInfo.outstandingInvoices.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Invoices</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Invoice No</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Total</th>
                          <th className="px-6 py-3 text-right">Balance</th>
                          <th className="px-6 py-3 text-right w-40">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerInfo.outstandingInvoices.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-indigo-600 text-sm">
                              {invoice.invoiceNo}
                            </td>
                            <td className="px-6 py-3 text-xs text-slate-500">
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-right text-slate-700">
                              ₹{invoice.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-sm font-bold text-right text-rose-600">
                              ₹{invoice.balance.toFixed(2)}
                            </td>
                            <td className="px-6 py-2 text-right">
                              <input
                                type="number"
                                value={invoiceAllocations[invoice._id] || 0}
                                onChange={(e) => handleInvoiceAllocation(invoice._id, e.target.value)}
                                className="w-full px-2 py-1.5 text-right text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                                placeholder="0.00"
                                max={invoice.balance}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Payment Methods & Summary) */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Methods</h2>
                  <button
                    onClick={addPaymentMethod}
                    className="text-xs bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded shadow-sm transition-colors font-bold uppercase tracking-wider"
                  >
                    + Add
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {formData.paymentMethods.map((pm, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50/30 relative">
                      {formData.paymentMethods.length > 1 && (
                        <button
                          onClick={() => removePaymentMethod(index)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}

                      <div className="space-y-3">
                        {/* Method Select */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Method</label>
                          <select
                            value={pm.method}
                            onChange={(e) => updatePaymentMethod(index, "method", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                          >
                            {paymentMethodOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.icon} {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount Input */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                            <input
                              type="number"
                              value={pm.amount}
                              onChange={(e) => updatePaymentMethod(index, "amount", parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Dynamic Fields based on Method */}
                        {pm.method === "upi" && (
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Transaction Ref</label>
                            <input
                              type="text"
                              value={pm.reference}
                              onChange={(e) => updatePaymentMethod(index, "reference", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="UPI ID / Ref No"
                            />
                          </div>
                        )}

                        {(pm.method === "bank_transfer" || pm.method === "cheque") && (
                          <div className="space-y-3 pt-2 border-t border-slate-200 mt-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Deposit To Bank</label>
                              <select
                                value={pm.bankAccount}
                                onChange={(e) => updatePaymentMethod(index, "bankAccount", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              >
                                <option value="">Select Bank Account</option>
                                {bankAccounts.map((acc) => (
                                  <option key={acc._id} value={acc._id}>{acc.bankName} - {acc.accountNumber.slice(-4)}</option>
                                ))}
                              </select>
                            </div>
                            {pm.method === "cheque" && (
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={pm.chequeNumber}
                                  onChange={(e) => updatePaymentMethod(index, "chequeNumber", e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                  placeholder="Cheque No"
                                />
                                <input
                                  type="date"
                                  value={pm.chequeDate}
                                  onChange={(e) => updatePaymentMethod(index, "chequeDate", e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposit To (Global) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Deposit Verification</h2>
                {(() => {
                  const hasNonCashMethod = formData.paymentMethods.some((pm) => pm.method !== "cash");
                  if (hasNonCashMethod) {
                    return (
                      <select
                        value={formData.depositAccount}
                        onChange={(e) => setFormData({ ...formData, depositAccount: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                      >
                        <option value="">Select Bank Account</option>
                        {bankAccounts.map((acc) => (
                          <option key={acc._id} value={acc._id}>🏦 {acc.bankName} - {acc.accountNumber.slice(-4)}</option>
                        ))}
                      </select>
                    );
                  }
                  return (
                    <select
                      value={formData.depositAccount}
                      onChange={(e) => setFormData({ ...formData, depositAccount: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                    >
                      <option value="cash">💵 Cash in Hand</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>🏦 {acc.bankName} - {acc.accountNumber.slice(-4)}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              {/* Summary Card */}
              <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100">
                  <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Payment Summary</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Received</span>
                    <span className="font-bold text-slate-800">₹{totalPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-slate-100 pb-3">
                    <span className="text-slate-500 font-medium">Used from Credit</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">(Available: ₹{customerInfo.availableCredit})</span>
                      <input
                        type="number"
                        value={creditApplied}
                        onChange={(e) => setCreditApplied(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        max={Math.min(customerInfo.availableCredit, totalAllocated)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Allocated to Invoices</span>
                    <span className="font-bold text-indigo-600">₹{totalAllocated.toFixed(2)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-sm font-bold text-slate-600">Unallocated / Excess</span>
                      <span className={`text-lg font-bold ${remainingAmount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {remainingAmount < 0 ? '-' : '+'}₹{Math.abs(remainingAmount).toFixed(2)}
                      </span>
                    </div>
                    {remainingAmount > 0 && (
                      <p className="text-[10px] text-center text-slate-400 mt-2">
                        Positive amount will be added to customer credit
                      </p>
                    )}
                    {remainingAmount < 0 && (
                      <p className="text-[10px] text-center text-red-400 mt-2 font-bold">
                        Allocation exceeds payment amount!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Add remarks..."
                />
              </div>

            </div>
          </div>
        </div>

        <CustomerSelectionModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={handleCustomerSelect}
        />
      </div>
    </Layout>
  );
};

export default PaymentIn;
