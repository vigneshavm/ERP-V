import React, { useState, useEffect, useMemo } from 'react';
import { ScannedInvoice, Sector, Branch } from '../types';
import { LayoutTemplate, Table, FileText, Save, CheckCircle2, AlertOctagon, RotateCcw, X, IndianRupee } from 'lucide-react';

interface InvoiceResultProps {
  initialData: ScannedInvoice;
  file: File | null;
  sector: Sector;
  branch: Branch;
  onSave: (items: any[]) => void;
  onCancel: () => void;
}

interface EditableItem {
  id: string; // Internal UUID
  sku: string;
  name: string;
  category: string;
  qty: number;
  cost: number;
  margin: number;
  sellingPrice: number;
  barcode: string | null;
}

const CATEGORIES_BY_SECTOR: Record<Sector, string[]> = {
  General: ['Stationery', 'Snacks', 'Gifts', 'Beverages', 'Household'],
  Textile: ['Saree', 'Kurta', 'Shirt', 'Trousers', 'Fabric', 'Accessories'],
  Electronics: ['Mobile', 'Laptop', 'Accessories', 'Cables', 'Audio', 'Appliances']
};

const InvoiceResult: React.FC<InvoiceResultProps> = ({ initialData, file, sector, branch, onSave, onCancel }) => {
  // --- State ---
  const [viewMode, setViewMode] = useState<'SPLIT' | 'DETAILS' | 'PREVIEW'>('SPLIT');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    // Transform initial data
    const transformed: EditableItem[] = initialData.items.map(i => {
       const cost = i.cost || 0;
       const defaultMargin = 20; // 20% default
       const sellingPrice = Math.round(cost * (1 + defaultMargin / 100));

       return {
         id: crypto.randomUUID(),
         sku: i.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
         name: i.name,
         category: CATEGORIES_BY_SECTOR[sector][0] || 'Uncategorized',
         qty: i.qty,
         cost: cost,
         margin: defaultMargin,
         sellingPrice: sellingPrice,
         barcode: null // Generated on save
       };
    });
    setItems(transformed);
  }, [initialData, sector]);

  // --- Logic ---
  const handleItemChange = (id: string, field: keyof EditableItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };

      // Bidirectional Pricing
      if (field === 'margin') {
        // Recalculate Price: Cost * (1 + Margin/100)
        // Keep precise for calc, but round for display in UI logic is handled by input value usually.
        // Spec says "Round the Selling Price to the nearest integer for UI display"
        const rawPrice = updated.cost * (1 + Number(value) / 100);
        updated.sellingPrice = Math.round(rawPrice);
      } else if (field === 'sellingPrice') {
        // Recalculate Margin: ((Price / Cost) - 1) * 100
        if (updated.cost > 0) {
            const rawMargin = ((Number(value) / updated.cost) - 1) * 100;
            updated.margin = parseFloat(rawMargin.toFixed(2));
        }
      }

      return updated;
    }));
  };

  const handleSave = () => {
    // Generate barcodes and prepare final data
    const finalItems = items.map(item => ({
      ...item,
      barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() // 12 digit random
    }));
    
    setItems(finalItems); // Update state to show generated barcodes if needed, or just lock UI
    setIsSaved(true);
    
    // Trigger callback after short delay for visual feedback
    setTimeout(() => {
        onSave(finalItems);
    }, 1000);
  };

  // --- Renderers ---

  const Previewer = () => {
    if (!file) return <div className="flex items-center justify-center h-full text-slate-500">No file uploaded</div>;
    
    if (file.type.startsWith('image/')) {
        return (
            <div className="h-full w-full overflow-auto bg-slate-900 rounded-lg border border-slate-700 p-2">
                <img src={fileUrl!} alt="Invoice Preview" className="max-w-full h-auto mx-auto" />
            </div>
        );
    } else if (file.type === 'application/pdf') {
        return (
            <iframe src={fileUrl!} className="w-full h-full rounded-lg border border-slate-700 bg-white" title="Invoice PDF" />
        );
    }
    return <div className="flex items-center justify-center h-full text-slate-500">Preview not supported for this file type</div>;
  };

  const DataGrid = () => (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-800 text-slate-400 uppercase font-bold sticky top-0 z-10 shadow-md">
          <tr>
            <th className="p-3">SKU</th>
            <th className="p-3">Product Name</th>
            <th className="p-3">Category</th>
            <th className="p-3 w-20">Qty</th>
            <th className="p-3 w-28">Cost</th>
            <th className="p-3 w-24">Margin %</th>
            <th className="p-3 w-32">Sell Price</th>
            <th className="p-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="p-2">
                <input 
                    type="text" 
                    value={item.sku} 
                    onChange={(e) => handleItemChange(item.id, 'sku', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-28 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </td>
              <td className="p-2">
                 <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-full min-w-[200px] text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </td>
              <td className="p-2">
                 <div className="relative">
                    <input 
                        list={`cat-${item.id}`} 
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-32 text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="Select..."
                    />
                    <datalist id={`cat-${item.id}`}>
                        {CATEGORIES_BY_SECTOR[sector].map(c => <option key={c} value={c} />)}
                    </datalist>
                 </div>
              </td>
              <td className="p-2">
                <input 
                    type="number" 
                    value={item.qty} 
                    onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16 text-center text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </td>
              <td className="p-2 text-slate-400">
                <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded px-2 py-1 cursor-not-allowed opacity-80">
                    <IndianRupee className="w-3 h-3" />
                    {item.cost.toFixed(2)}
                </div>
              </td>
              <td className="p-2">
                <div className="relative flex items-center">
                    <input 
                        type="number"
                        step="0.1" 
                        value={item.margin} 
                        onChange={(e) => handleItemChange(item.id, 'margin', parseFloat(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-20 pr-6 text-right text-emerald-400 font-medium focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2 text-xs text-slate-500">%</span>
                </div>
              </td>
              <td className="p-2">
                <div className="relative flex items-center">
                    <span className="absolute left-2 text-slate-500"><IndianRupee className="w-3 h-3" /></span>
                    <input 
                        type="number" 
                        value={item.sellingPrice} 
                        onChange={(e) => handleItemChange(item.id, 'sellingPrice', parseFloat(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded pl-6 pr-2 py-1 w-24 text-right text-indigo-400 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                </div>
              </td>
              <td className="p-2">
                  <button 
                    onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                    className="p-1 hover:bg-red-900/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in relative">
      {/* Loading Overlay Post-Save */}
      {isSaved && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-white">Data Committed</h3>
              <p className="text-slate-400">Inventory updated successfully.</p>
          </div>
      )}

      {/* Header */}
      <div className="h-16 px-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
         <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Review Invoice <span className="text-slate-500 text-sm font-normal">({items.length} items)</span>
            </h2>
            <div className="text-xs text-slate-400 flex gap-2">
                <span className="bg-slate-700 px-1.5 rounded">{sector}</span>
                <span className="bg-slate-700 px-1.5 rounded">{branch}</span>
            </div>
         </div>

         {/* Layout Switcher */}
         <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => setViewMode('SPLIT')}
                className={`p-2 rounded ${viewMode === 'SPLIT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                title="Split View"
            >
                <LayoutTemplate className="w-4 h-4 rotate-90" />
            </button>
            <button 
                onClick={() => setViewMode('DETAILS')}
                className={`p-2 rounded ${viewMode === 'DETAILS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                title="Grid Only"
            >
                <Table className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setViewMode('PREVIEW')}
                className={`p-2 rounded ${viewMode === 'PREVIEW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                title="Document Only"
            >
                <FileText className="w-4 h-4" />
            </button>
         </div>

         {/* Actions */}
         <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
             >
                 <RotateCcw className="w-4 h-4" /> Discard
             </button>
             <button 
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2 font-bold"
             >
                 <Save className="w-4 h-4" /> Save to Inventory
             </button>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
          {viewMode === 'SPLIT' && (
              <div className="grid grid-cols-2 h-full divide-x divide-slate-700">
                  <div className="h-full overflow-hidden bg-slate-950/50">
                      <DataGrid />
                  </div>
                  <div className="h-full p-4 bg-slate-900">
                      <Previewer />
                  </div>
              </div>
          )}
          {viewMode === 'DETAILS' && (
              <div className="h-full bg-slate-950/50">
                   <DataGrid />
              </div>
          )}
          {viewMode === 'PREVIEW' && (
              <div className="h-full p-4 bg-slate-900">
                  <Previewer />
              </div>
          )}
      </div>
    </div>
  );
};

export default InvoiceResult;