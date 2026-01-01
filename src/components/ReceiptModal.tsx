import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Sale } from '../types/sales';
import { Tenant } from '../types/tenant';
import { X, Printer, CheckCircle } from 'lucide-react';
import { useConfig } from './ConfigContext';
import { printSaleReceipt } from '../utils/printService';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { tenantId } = useConfig();

  const tenants = useSelector((state: RootState) => state.tenant.tenants);

  const tenant = tenants.find((t: Tenant) => t.id === tenantId);
  const tenantName = tenant ? tenant.name : 'Enterprise Mgr';

  const handlePrint = () => {
    const branchName = sale.branchId ? (sale as any).branch : 'Main Branch'; // Fallback if Sale object has branch name injected
    // Since Sale interface has branchId, but POSModule passes branchName usually or we resolver it
    // For now, if we call it from Modal, we need to be sure we have the name.
    // In ReceiptModal, the resolver isn't here, but we can use the tenants list.
    const branch = tenant?.locations?.flatMap(l => l.branches).find(b => b.id === sale.branchId || b.name === sale.branchId);
    const bName = branch ? branch.name : (sale.branchId || 'Main Branch');

    printSaleReceipt(sale, tenantName, bName);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="receipt-modal-root bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-6 h-6" />
            <h3 className="font-bold text-lg">Sale Completed</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Printable Content Area */}
        <div id="receipt-content" className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 font-mono text-sm leading-relaxed">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1 text-black">{tenantName}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">{sale.sector} &bull; {sale.branch}</p>
            <div className="border-b-2 border-dashed border-slate-300 w-full my-4"></div>
          </div>

          <div className="flex justify-between mb-4 text-xs">
            <div>
              <p className="text-slate-500">Bill No.</p>
              <p className="font-bold text-black">#{sale.id}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Date</p>
              <p className="font-bold text-black">{new Date(sale.date).toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-600">{new Date(sale.date).toLocaleTimeString()}</p>
            </div>
          </div>

          <table className="w-full mb-6 text-xs">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-2 text-slate-600">Item</th>
                <th className="text-center py-2 text-slate-600">Qty</th>
                <th className="text-right py-2 text-slate-600">Price</th>
                <th className="text-right py-2 text-slate-600">Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <span className="font-bold block text-black">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.sku}</span>
                  </td>
                  <td className="py-2 text-center align-top text-black">{item.qty}</td>
                  <td className="py-2 text-right align-top text-black">{item.price.toFixed(2)}</td>
                  <td className="py-2 text-right font-bold align-top text-black">{(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-slate-800 pt-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-black">{(sale.total / (sale.taxMode === 'EXCLUSIVE' ? 1.18 : 1)).toFixed(2)}</span>
            </div>
            {sale.taxMode === 'EXCLUSIVE' && (
              <div className="flex justify-between text-slate-500">
                <span>Tax (18%)</span>
                <span>{(sale.total - (sale.total / 1.18)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-slate-200">
              <span className="text-black">TOTAL</span>
              <span className="text-black">₹{sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Payment Mode</span>
              <span className="uppercase font-bold text-black">{sale.paymentMethod}</span>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-500">
            <p>Thank you for your business!</p>
            <p>No returns without invoice.</p>
          </div>

          <div className="mt-8 text-center no-print">
            <p className="text-[10px] text-slate-300">Generated by EnterpriseMgr</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Printer className="w-5 h-5" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
