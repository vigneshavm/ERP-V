
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfig } from './ConfigContext';
import { useBranchResolver } from '../hooks/useBranchResolver';
import { RootState, AppDispatch, addProduct, editProduct } from '../store';

import { Plus, Search, Image as ImageIcon, X, Pencil, Clock, List, Printer, CheckSquare, Square } from 'lucide-react';
import { Sector, Branch } from '../types/common';
import { Product } from '../types/product';
import BarcodeGenerator from './BarcodeGenerator';

const InventoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch, role } = useSelector((state: RootState) => state.auth);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECENT'>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', cost: '', stock: '', category: '', productType: '', branch: 'Alpha', brand: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Barcode Printing State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { tenantId } = useConfig();
  const { tenants, branches: dbBranches } = useSelector((state: RootState) => state.tenant);
  const { getBranchName } = useBranchResolver();

  // Get valid branch IDs for the current tenant
  const currentTenant = tenants.find(t => t.id === tenantId);
  const tenantBranchIds = currentTenant
    ? currentTenant.locations.flatMap(loc => loc.branches.map(b => b.id))
    : [];

  // Filter based on context and search
  const sectorProducts = products.filter(p => {
    // 1. Sector Check
    if (p.sector !== currentSector) return false;

    // 2. Branch Check
    // If 'All', restrict to ANY branch belonging to this tenant
    // If specific branch, must match exactly
    const matchesBranch = currentBranch === 'All'
      ? tenantBranchIds.includes(p.branchId || '')
      : p.branchId === currentBranch;

    if (!matchesBranch) return false;

    // 3. Search Check
    return (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.productType.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Determine displayed products based on tab
  // If RECENT, we reverse the array to show newest first and slice it
  const displayedProducts = activeTab === 'RECENT'
    ? [...sectorProducts].reverse().slice(0, 50)
    : sectorProducts;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      category: product.category,
      productType: product.productType || '',
      branch: product.branchId || '',
      brand: product.brand || ''
    });
    setImagePreview(product.image || null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = role === 'Owner';

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '', sku: '', price: '', cost: '', stock: '', category: '', productType: '',
      branch: currentBranch === 'All' ? '' : currentBranch,
      brand: ''
    });
    setImagePreview(null);
    setIsFormOpen(false);
  };



  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: parseInt(formData.stock),
      category: formData.category,
      productType: formData.productType,
      brand: formData.brand,
      sector: currentSector as Sector,
      branchId: formData.branch as Branch,
      image: imagePreview || undefined,
      // Generate barcode if not present (using SKU or Random) if not editing existing
      barcode: !editingId ? (formData.sku || Math.random().toString().slice(2, 14)) : undefined
    };

    if (editingId) {
      // Edit Mode
      dispatch(editProduct({
        ...productData,
        id: editingId,
        // Preserve existing barcode if not changing (or add field to form if needed)
        barcode: products.find(p => p.id === editingId)?.barcode
      }));
    } else {
      // Add Mode
      dispatch(addProduct({
        ...productData,
        id: Math.random().toString(36).substr(2, 9),
      }));
    }

    resetForm();
  };

  // Auto-generate SKU when Brand changes (only for new products)
  React.useEffect(() => {
    if (!editingId && formData.brand) {
      const prefix = formData.brand.substring(0, 3).toUpperCase();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
      setFormData(prev => ({ ...prev, sku: `${prefix}-${timestamp}` }));
    }
  }, [formData.brand, editingId]);

  // --- Barcode Printing Handlers ---
  const toggleProductSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProductIds(newSet);
  };

  const selectAll = () => {
    if (selectedProductIds.size === displayedProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(displayedProducts.map(p => p.id)));
    }
  };

  const handlePrintLabels = () => {
    if (selectedProductIds.size === 0) return;
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    const content = document.getElementById('barcode-print-area');
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) {
      alert("Please allow popups to print labels.");
      return;
    }

    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Labels</title>
                    <style>
                        body { background: white; margin: 0; padding: 20px; font-family: sans-serif; }
                        .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                        .label-item { border: 1px dashed #ccc; padding: 10px; text-align: center; page-break-inside: avoid; border-radius: 8px; }
                        h3 { font-size: 14px; margin: 0 0 5px 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
                        p { font-size: 12px; margin: 0; }
                        .price { font-weight: bold; font-size: 16px; margin-top: 5px; }
                        svg { max-width: 100%; height: 50px; }
                        @media print {
                            .label-item { border: none; outline: 1px solid #eee; }
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="label-grid">
                        ${content.innerHTML}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 800);
                    </script>
                </body>
            </html>
        `);
    printWindow.document.close();
  };

  const isOwner = role === 'Owner';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Inventory <span className="text-slate-500 text-base font-normal">/ {currentBranch}</span>
          </h2>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <List className="w-3 h-3" /> All Items
            </button>
            <button
              onClick={() => setActiveTab('RECENT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'RECENT' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <Clock className="w-3 h-3" /> Recently Added
            </button>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search SKU, Name or Type..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>
          <button
            onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button
            onClick={() => setIsPrintMode(!isPrintMode)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors whitespace-nowrap border ${isPrintMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'}`}
          >
            <Printer className="w-4 h-4" /> {isPrintMode ? 'Done Printing' : 'Print Labels'}
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-500" /> Print Preview ({selectedProductIds.size} Items)
              </h3>
              <div className="flex gap-2">
                <button onClick={executePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-900">
              <div id="barcode-print-area" className="bg-white p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[210mm] mx-auto min-h-[297mm]">
                <div id="barcode-print-area" className="bg-white p-8 shadow-sm grid grid-cols-3 gap-4 max-w-[210mm] mx-auto min-h-[297mm]">
                  {products
                    .filter(p => selectedProductIds.has(p.id))
                    .flatMap(p => {
                      const count = Math.max(1, p.stock); // Ensure at least 1 label
                      return Array(count).fill(p).map((_, i) => ({ ...p, uniqueKey: `${p.id}-${i}` }));
                    })
                    .map(p => (
                      <div key={p.uniqueKey} className="border border-dashed border-slate-300 p-4 rounded-lg flex flex-col items-center justify-center text-center h-48 bg-white break-inside-avoid">
                        <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{p.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{p.sku}</p>
                        <BarcodeGenerator
                          value={p.barcode || p.sku}
                          width={1.5}
                          height={40}
                          fontSize={12}
                          className="mb-2"
                        />
                        <p className="font-bold text-lg text-slate-900">₹{p.price.toFixed(2)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in shadow-lg relative">
          <div className="md:col-span-4 mb-2 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{editingId ? 'Edit Product' : 'New Product'}</h3>
              <p className="text-sm text-slate-500">Sector: {currentSector}</p>
            </div>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
          </div>

          {/* Image Upload Section */}
          <div className="md:col-span-4 mb-2 flex items-center gap-4">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative overflow-hidden group">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <label htmlFor="prod-img" className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors inline-block">
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
              <input id="prod-img" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-xs text-slate-500 mt-1">Optional. Max 2MB recommended.</p>
            </div>
          </div>


          {isAdmin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Branch</label>
              <select
                className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white"
                value={formData.branch}
                onChange={e => setFormData({ ...formData, branch: e.target.value })}
              >
                <option value="">Select Branch</option>
                {dbBranches
                  .filter(b => b.tenantId === currentTenant?.id)
                  .map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Dynamic Placeholders Helper */}
          {(() => {
            const placeholders: Record<string, { name: string, type: string, category: string }> = {
              'Pharmacy': { name: 'E.g. Dolo 650', type: 'Tablet, Syrup', category: 'Medicine' },
              'Grocery': { name: 'E.g. Aashirvaad Atta', type: 'Flour, Oil', category: 'Staples' },
              'Electronics': { name: 'E.g. Samsung TV', type: 'LED, Mobile', category: 'Home Appliance' },
              'Textile': { name: 'E.g. Cotton Shirt', type: 'Shirt, Saree', category: 'Menswear' },
              'Supermarket': { name: 'E.g. Britania Biscuit', type: 'Snacks', category: 'Food' },
              'General': { name: 'E.g. Product Name', type: 'Type', category: 'Category' }
            };
            const ph = placeholders[currentSector] || placeholders['General'];

            return (
              <>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Product Name</label>
                  <input required placeholder={ph.name} className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Brand (Vendor)</label>
                  <input
                    required
                    placeholder="E.g. Samsung"
                    className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">SKU (Auto-Generated)</label>
                  <input
                    required
                    readOnly
                    disabled
                    placeholder="Auto-generated ID"
                    className="bg-slate-200 dark:bg-slate-800 border-none rounded p-2 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    value={formData.sku}
                  // No onChange handler needed as it's read-only
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Product Type</label>
                  <input required placeholder={ph.type} className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.productType} onChange={e => setFormData({ ...formData, productType: e.target.value })} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Category</label>
                  <input required placeholder={ph.category} className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </>
            );
          })()}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Sale Price</label>
            <input required type="number" step="0.01" className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
          </div>

          {isOwner && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Cost Price</label>
              <input required type="number" step="0.01" className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Stock Qty</label>
            <input required type="number" className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
          </div>

          <div className="md:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
              {editingId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {isPrintMode && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center border-b border-indigo-100 dark:border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <button onClick={selectAll} className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:underline">
                    {selectedProductIds.size === displayedProducts.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {selectedProductIds.size === displayedProducts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">
                    {selectedProductIds.size} Selected
                  </span>
                </div>
                <button
                  onClick={handlePrintLabels}
                  disabled={selectedProductIds.size === 0}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
                >
                  Preview & Print
                </button>
              </div>
            )}

            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
              <tr>
                {isPrintMode && <th className="p-4 w-10"></th>}
                <th className="p-4 w-16">Img</th>
                <th className="p-4 hidden md:table-cell">SKU</th>
                <th className="p-4 hidden lg:table-cell">Barcode</th>
                <th className="p-4">Name</th>
                <th className="p-4 hidden xl:table-cell">Type</th>
                <th className="p-4 hidden xl:table-cell">Branch</th>
                <th className="p-4 hidden lg:table-cell">Category</th>
                <th className="p-4">Stock</th>
                {isOwner && <th className="p-4 hidden md:table-cell">Cost</th>}
                <th className="p-4">Price</th>
                <th className="p-4 text-right hidden lg:table-cell">Value</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {displayedProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  {isPrintMode && (
                    <td className="p-4">
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {selectedProductIds.has(product.id) ?
                          <CheckSquare className="w-5 h-5 text-indigo-600" /> :
                          <Square className="w-5 h-5" />
                        }
                      </button>
                    </td>
                  )}
                  <td className="p-4">
                    {product.image ? (
                      <img src={product.image} alt="Prod" className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-600" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 hidden md:table-cell font-mono text-slate-500 dark:text-slate-400">{product.sku}</td>
                  <td className="p-4 hidden lg:table-cell font-mono text-xs text-slate-500 dark:text-slate-400 break-all">{product.barcode || '-'}</td>
                  <td className="p-4 font-bold">{product.name}</td>
                  <td className="p-4 hidden xl:table-cell"><span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-800">{product.productType}</span></td>
                  <td className="p-4 hidden xl:table-cell"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-600 dark:text-slate-400">{getBranchName(product.branchId)}</span></td>
                  <td className="p-4 hidden lg:table-cell"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{product.category}</span></td>
                  <td className="p-4">
                    <span className={`font-bold ${product.stock < 10 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  {isOwner && <td className="p-4 hidden md:table-cell text-slate-500 dark:text-slate-400">₹{product.cost.toFixed(2)}</td>}
                  <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">₹{product.price.toFixed(2)}</td>
                  <td className="p-4 text-right font-bold hidden lg:table-cell">₹{(product.price * product.stock).toFixed(2)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayedProducts.length === 0 && (
                <tr>
                  <td colSpan={isOwner ? 12 : 10} className="p-8 text-center text-slate-500">No products found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
