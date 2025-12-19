
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseInvoiceWithGemini } from '../services/geminiService';
import { processPurchaseApproval, RootState, AppDispatch, addOrder, addStockBulk, addTransaction } from '../store';
import { Upload, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { ScannedInvoice, Branch, Sector } from '../types';
import InvoiceResult from './InvoiceResult';

const PurchaseManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.purchase);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedInvoice | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [targetBranch, setTargetBranch] = useState<Branch>('Alpha');

  // Filter orders by current sector and branch (if specific branch selected)
  const sectorOrders = orders.filter(o => 
      o.sector === currentSector && (currentBranch === 'All' || o.branch === currentBranch)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);
    setScannedData(null);

    try {
      const data = await parseInvoiceWithGemini(file);
      setScannedData(data);
      // Default to current branch if specific, else Alpha
      if (currentBranch !== 'All') setTargetBranch(currentBranch);
    } catch (err) {
      setError("Failed to process invoice. Ensure the image is clear.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitInventory = (items: any[]) => {
      // 1. Create Purchase Order Record (Approved automatically as we just reviewed it)
      const orderTotal = items.reduce((sum, item) => sum + (item.cost * item.qty), 0);
      
      const newOrder = {
        id: Math.random().toString(36).substr(2, 9),
        vendor: scannedData?.vendor || "Unknown Vendor",
        date: scannedData?.date || new Date().toISOString(),
        items: items.map(i => ({ name: i.name, qty: i.qty, cost: i.cost, sku: i.sku })), // Simplified for PO record
        total: orderTotal,
        status: 'APPROVED' as const,
        sector: currentSector,
        branch: targetBranch
      };
      
      dispatch(addOrder(newOrder));

      // 2. Commit to Inventory (Add Stock Bulk)
      dispatch(addStockBulk(items.map(item => ({
          sku: item.sku,
          qty: item.qty,
          cost: item.cost,
          price: item.sellingPrice,
          name: item.name,
          category: item.category,
          sector: currentSector,
          branch: targetBranch,
          barcode: item.barcode
      }))));

      // 3. Record Expense
      dispatch(addTransaction({
          id: Math.random().toString(36).substr(2, 9),
          type: 'EXPENSE',
          category: 'Inventory Restock',
          amount: orderTotal,
          date: new Date().toISOString(),
          description: `Invoice Payment - ${newOrder.vendor} (${targetBranch})`,
          sector: currentSector,
          branch: targetBranch
      }));

      // Cleanup
      setScannedData(null);
      setUploadedFile(null);
  };

  if (scannedData) {
      // Show the Review Component
      return (
          <div className="h-[calc(100vh-8rem)]">
              <InvoiceResult 
                  initialData={scannedData}
                  file={uploadedFile}
                  sector={currentSector}
                  branch={targetBranch}
                  onSave={handleCommitInventory}
                  onCancel={() => { setScannedData(null); setUploadedFile(null); }}
              />
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upload Section */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed text-center transition-colors">
          <input 
            type="file" 
            id="invoiceUpload" 
            className="hidden" 
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
          />
          <label htmlFor="invoiceUpload" className="cursor-pointer flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-500 rounded-full flex items-center justify-center">
               {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Upload Supplier Invoice</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Supports IMG, PDF. Powered by Gemini AI.</p>
            </div>
            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Select File</span>
          </label>
        </div>

        {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        )}
        
        {/* Branch Selection for Upload (Pre-scan) */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Target Branch for this Upload</label>
            <div className="flex gap-4">
                {['Alpha', 'Beta', 'Gamma'].map(b => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="targetBranch" 
                            value={b} 
                            checked={targetBranch === b}
                            onChange={() => setTargetBranch(b as Branch)}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 text-sm">{b}</span>
                    </label>
                ))}
            </div>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-indigo-800 dark:text-indigo-200 text-sm transition-colors">
            <p className="font-bold mb-1">AI Processing</p>
            <p>The system will automatically extract items, quantities, and costs. You will review and set selling prices/margins in the next step.</p>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[calc(100vh-8rem)] transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Purchase Orders</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sectorOrders.length === 0 && <p className="text-slate-500 text-center mt-10">No purchase orders found for this branch.</p>}
            {sectorOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded">{order.branch}</span>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{order.vendor}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
                            {order.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{order.items.length} items</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 dark:text-white">₹{order.total.toFixed(2)}</span>
                            {order.status === 'PENDING' && (
                                <button 
                                    onClick={() => dispatch(processPurchaseApproval(order))}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                                    title="Approve & Update Inventory"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PurchaseManager;
    