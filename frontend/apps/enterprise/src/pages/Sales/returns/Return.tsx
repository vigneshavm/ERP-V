import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/api/api";
import { toast } from "react-toastify";
import Layout from "@/shared/ui/Layout/Layout";
import {
  RotateCcw,
  FileText,
  User,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  Building2,
  X,
  Save,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Return = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchInvoice, setSearchInvoice] = useState("");

  // Load draft from localStorage on mount
  const [formData, setFormData] = useState<any>(() => {
    const savedDraft = localStorage.getItem("returnDraft");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error: any) {
        console.error("Error loading return draft:", error);
      }
    }
    return {
      selectedInvoice: null,
      customer: null,
      items: [],
      refundMethod: "",
      originalPaymentInfo: null, // NEW: Store original payment details
      notes: "",
    };
  });

  // Get token from user object in localStorage
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const token = user?.token;
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Debug: Check if token exists
  if (!token) {
    console.warn("⚠️ Auth token missing. User object:", user);
  }

  // Save draft to localStorage whenever formData changes
  useEffect(() => {
    if (formData.selectedInvoice || formData.items.length > 0) {
      localStorage.setItem("returnDraft", JSON.stringify(formData));
    }
  }, [formData]);

  // Fetch invoices when modal opens
  useEffect(() => {
    if (showInvoiceModal) {
      fetchInvoices();
    }
  }, [showInvoiceModal]);

  const fetchInvoices = async () => {
    if (!token) {
      toast.error("Authentication error: Token missing. Please log in again.");
      console.error("Token is missing:", { user, token });
      return;
    }
    try {
      const response = await api.get(`${API_URL}/api/pos/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(response.data);
      toast.success("Invoices loaded successfully");
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("user");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch invoices");
      }
    }
  };

  const handleInvoiceSelect = async (invoice: any) => {
    try {
      // Fetch full invoice details with populated items
      const response = await api.get(
        `${API_URL}/api/pos/invoice/${invoice._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fullInvoice = response.data || {};
      if (!fullInvoice.items || !Array.isArray(fullInvoice.items)) {
        throw new Error("Invalid invoice data: items missing");
      }

      // Fetch existing returns for this invoice
      let existingReturns: any[] = [];
      try {
        const returnsResponse = await api.get(`${API_URL}/api/returns`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        existingReturns = returnsResponse.data.filter(
          (ret: any) => ret.invoice._id === invoice._id
        );
      } catch (error: any) {
        console.error("Error fetching existing returns:", error);
      }

      // Calculate already returned quantities per product
      const returnedQuantities: any = {};
      existingReturns.forEach((returnRecord) => {
        (returnRecord.items || []).forEach((item: any) => {
          const productId =
            typeof item.product === "object" && item.product?._id
              ? item.product._id
              : item.product;
          if (!productId) return;
          if (!returnedQuantities[productId]) {
            returnedQuantities[productId] = 0;
          }
          returnedQuantities[productId] += Number(item.returnedQty) || 0;
        });
      });

      // Populate items with return fields and remaining quantities
      const returnItems = fullInvoice.items
        .map((item: any) => {
          // Handle both populated and non-populated item references
          const itemData = item.item;
          const itemName =
            typeof itemData === "object" ? itemData.name : "Item";
          const itemId = typeof itemData === "object" ? itemData._id : itemData;

          const alreadyReturned = Number(returnedQuantities[itemId]) || 0;
          const remainingQty = Number(item.quantity || 0) - alreadyReturned;

          return {
            productId: itemId,
            productName: itemName,
            originalQty: item.quantity,
            alreadyReturned: alreadyReturned,
            remainingQty: remainingQty,
            returnedQty: Math.min(Math.max(remainingQty, 0), Number(item.quantity || 0)), // Default to remaining quantity, clamped
            rate: item.price,
            taxPercent: 0,
            condition: "not_damaged",
            reason: "",
          };
        })
        .filter((item: any) => item.remainingQty > 0); // Only show items that can still be returned

      if (returnItems.length === 0) {
        toast.warning("All items from this invoice have already been returned.");
        return;
      }

      // NEW: Capture original payment information
      const originalPaymentInfo = {
        method: fullInvoice.paymentMethod,
        paidVia: fullInvoice.paidViaMethod,
        creditApplied: fullInvoice.creditApplied || 0,
        paidAmount: fullInvoice.paidAmount || 0,
        bankAccount: fullInvoice.bankAccount,
        splitDetails: fullInvoice.splitPaymentDetails || [],
      };

      setFormData({
        selectedInvoice: fullInvoice,
        customer: fullInvoice.customer,
        items: returnItems,
        refundMethod: "", // User must select
        originalPaymentInfo, // Store detected info
        notes: "",
      });

      setShowInvoiceModal(false);
      toast.success("Invoice selected successfully");
    } catch (error: any) {
      console.error("Error fetching invoice details:", error);
      const msg =
        (error.response?.data?.message || error.message || "Failed to fetch invoice details");
      toast.error(msg);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum: number, item: any) => {
      return sum + item.returnedQty * item.rate;
    }, 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum: number, item: any) => {
      const lineSubtotal = item.returnedQty * item.rate;
      return sum + (lineSubtotal * item.taxPercent) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const validateForm = () => {
    if (!formData.selectedInvoice) {
      toast.warning("Please select an invoice");
      return false;
    }

    const itemsWithQty = formData.items.filter((item: any) => item.returnedQty > 0);
    if (itemsWithQty.length === 0) {
      toast.warning("Please add at least one item with quantity greater than 0");
      return false;
    }

    for (const item of itemsWithQty) {
      if (item.returnedQty > item.remainingQty) {
        toast.error(
          `Return quantity for ${item.productName
          } cannot exceed remaining quantity (${item.remainingQty
          }). Already returned: ${item.alreadyReturned || 0}`
        );
        return false;
      }

      if (!item.condition) {
        toast.warning(`Please select condition for ${item.productName}`);
        return false;
      }

      if (!item.reason) {
        toast.warning(`Please select reason for ${item.productName}`);
        return false;
      }
    }

    // Validate refund method is selected
    if (!formData.refundMethod) {
      toast.warning("Please select a refund method before completing the return");
      return false;
    }

    // Validate original_payment has detected info
    if (formData.refundMethod === 'original_payment' && !formData.originalPaymentInfo) {
      toast.error("Cannot detect original payment method from invoice. Please select a refund method manually.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const itemsToReturn = formData.items.filter(
        (item: any) => item.returnedQty > 0
      );

      const returnData = {
        invoiceId: formData.selectedInvoice._id,
        items: itemsToReturn,
        refundMethod: formData.refundMethod,
        discountAmount: 0,
        notes: formData.notes,
      };

      const response = await api.post(`${API_URL}/api/returns`, returnData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear draft from localStorage on successful completion
      localStorage.removeItem("returnDraft");

      toast.success("Items returned successfully!");
      setTimeout(() => {
        navigate("/sales/returned-items");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating return:", error);
      toast.error(error.response?.data?.message || "Failed to create return");
    } finally {
      setLoading(false);
    }
  };

  // Function to clear draft
  const clearDraft = () => {
    if (confirm("Are you sure you want to clear this return draft?")) {
      localStorage.removeItem("returnDraft");
      setFormData({
        selectedInvoice: null,
        customer: null,
        items: [],
        refundMethod: "",
        originalPaymentInfo: null,
        notes: "",
      });
      toast.info("Return draft cleared");
    }
  };

  // Separate reasons based on condition
  const damagedReasons = [
    "Damaged Product",
    "Quality Issue",
    "Expired Product",
    "Defective Item",
    "Other",
  ];

  const notDamagedReasons = [
    "Wrong Item",
    "Customer Changed Mind",
    "Duplicate Order",
    "No Longer Needed",
    "Other",
  ];

  // Get appropriate reasons based on condition
  const getReasonsForCondition = (condition: string) => {
    return condition === "damaged" ? damagedReasons : notDamagedReasons;
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      (inv.customer?.name || "")
        .toLowerCase()
        .includes(searchInvoice.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-indigo-600" />
              Process Return
            </h1>
            <p className="text-sm text-slate-500 mt-1">Create a new customer return and issue credits</p>
          </div>
          <div className="flex gap-3">
            {formData.selectedInvoice && (
              <button
                onClick={clearDraft}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                <Trash2 className="w-4 h-4" /> Clear Draft
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? "Processing..." : "Save Return"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Select Invoice
                </h2>
              </div>
              <div className="p-6">
                {formData.selectedInvoice ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-indigo-800">
                          {formData.selectedInvoice.invoiceNo}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(formData.selectedInvoice.createdAt).toLocaleDateString('en-IN')} • ₹{formData.selectedInvoice.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <button
                        onClick={() => setFormData({
                          selectedInvoice: null, customer: null, items: [],
                          refundMethod: "credit", originalPaymentInfo: null, notes: "",
                        })}
                        className="text-red-600 hover:text-red-700 text-sm font-bold"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" /> Click to select invoice
                  </button>
                )}
              </div>
            </div>

            {/* Customer Info */}
            {formData.customer && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                      {formData.customer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-slate-800">{formData.customer.name}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                        {formData.customer.phone && (
                          <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {formData.customer.phone}</span>
                        )}
                        {formData.customer.email && (
                          <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {formData.customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Credit Balance Display */}
                  {formData.customer?.dues < 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Available Credit
                      </span>
                      <span className="text-lg font-bold text-emerald-600">₹{Math.abs(formData.customer.dues).toFixed(2)}</span>
                    </div>
                  )}
                  {/* Pending Dues Display */}
                  {formData.customer?.dues > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Pending Dues
                      </span>
                      <span className="text-lg font-bold text-red-600">₹{formData.customer.dues?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Return Items */}
            {formData.items.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-right">Original</th>
                        <th className="px-4 py-3 text-right">Returned</th>
                        <th className="px-4 py-3 text-right">Remaining</th>
                        <th className="px-4 py-3 text-center">Return Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3">Condition</th>
                        <th className="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-main">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {item.originalQty}
                          </td>
                          <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-medium">
                            {item.alreadyReturned || 0}
                          </td>
                          <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                            {item.remainingQty}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.returnedQty}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "returnedQty",
                                  Math.min(
                                    parseFloat(e.target.value) || 0,
                                    item.remainingQty
                                  )
                                )
                              }
                              className="w-20 px-2 py-1 border border-default rounded bg-card text-main focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              min="0"
                              max={item.remainingQty}
                            />
                          </td>
                          <td className="px-4 py-3 text-main">
                            ₹{item.rate.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.condition}
                              onChange={(e) => {
                                const newCondition = e.target.value;
                                updateItem(index, "condition", newCondition);
                                // Clear reason when condition changes to prevent invalid combinations
                                updateItem(index, "reason", "");
                              }}
                              className="w-32 px-2 py-1 border border-default rounded bg-card text-main focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="not_damaged">Not Damaged</option>
                              <option value="damaged">Damaged</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.reason}
                              onChange={(e) =>
                                updateItem(index, "reason", e.target.value)
                              }
                              className="w-40 px-2 py-1 border border-default rounded bg-card text-main focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">Select reason</option>
                              {getReasonsForCondition(item.condition).map(
                                (reason) => (
                                  <option key={reason} value={reason}>
                                    {reason}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Refund Details */}
            {formData.items.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-main mb-4">
                  Refund Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Refund Method <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["cash", "original_payment"].map(
                        (method) => (
                          <button
                            key={method}
                            onClick={() =>
                              setFormData({ ...formData, refundMethod: method })
                            }
                            className={`p-3 border-2 rounded-lg transition ${formData.refundMethod === method
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40"
                              : "border-default hover:border-indigo-300"
                              }`}
                          >
                            <div className="text-sm font-medium text-main capitalize">
                              {method.replace("_", " ")}
                            </div>
                          </button>
                        )
                      )}
                    </div>

                    {/* Display Original Payment Info if 'original_payment' selected */}
                    {formData.refundMethod === 'original_payment' && formData.originalPaymentInfo && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Detected Original Payment Method</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 dark:text-blue-300">Payment Method:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100 capitalize">
                              {formData.originalPaymentInfo.method.replace('_', ' ')}
                            </span>
                          </div>

                          {formData.originalPaymentInfo.method === 'split' && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded">
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                ⚠️ Split payment detected. Refund will be processed as customer credit.
                              </p>
                            </div>
                          )}

                          {formData.originalPaymentInfo.method === 'bank_transfer' && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded">
                              <p className="text-xs text-green-800 dark:text-green-200">
                                ✓ Bank refund will be processed to the same account used for payment.
                              </p>
                            </div>
                          )}

                          {(formData.originalPaymentInfo.method === 'upi' || formData.originalPaymentInfo.method === 'card') && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded">
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                ℹ️ {formData.originalPaymentInfo.method.toUpperCase()} payments cannot be directly refunded.
                                Refund will be processed as customer credit.
                              </p>
                            </div>
                          )}

                          {formData.originalPaymentInfo.method === 'cash' && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded">
                              <p className="text-xs text-green-800 dark:text-green-200">
                                ✓ Cash refund will be processed.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Validation message if original_payment selected without info */}
                    {formData.refundMethod === 'original_payment' && !formData.originalPaymentInfo && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          ⚠️ Cannot detect original payment method. Please select an invoice first.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-default rounded-lg bg-card text-main focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Add notes about the return..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden sticky top-4">
              <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100">
                <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Return Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-800">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Tax</span>
                  <span className="font-bold text-slate-800">₹{calculateTax().toFixed(2)}</span>
                </div>
              </div>
              <div className="px-6 py-5 bg-rose-600 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold tracking-tight">Refund Amount</span>
                  <span className="text-2xl font-bold tracking-tight">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <strong>Note:</strong> This amount will be credited or refunded via the selected method.
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" /> {loading ? "Processing..." : "Save Return"}
                </button>
                <button
                  onClick={() => navigate("/sales/returned-items")}
                  className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all"
                >
                  View Returned Items
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Selection Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-main">Select Invoice</h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-muted hover:text-secondary"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="w-full px-4 py-2 border border-default rounded-lg bg-card text-main placeholder:text-muted focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="overflow-y-auto max-h-96 p-6">
              {filteredInvoices.length === 0 ? (
                <p className="text-center text-muted py-8">No invoices found</p>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      onClick={() => handleInvoiceSelect(invoice)}
                      className="p-4 border border-default rounded-lg hover:bg-surface hover:border-indigo-500 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-main">
                            {invoice.invoiceNo}
                          </p>
                          <p className="text-sm text-secondary">
                            {invoice.customer?.name || "Walk-in Customer"}
                          </p>
                          <p className="text-sm text-muted">
                            {new Date(invoice.createdAt).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-main">
                            ₹{invoice.totalAmount.toFixed(2)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${invoice.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : invoice.paymentStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                          >
                            {invoice.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Return;
