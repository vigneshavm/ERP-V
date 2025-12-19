
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addProduct } from '../store';
import { Plus, Search } from 'lucide-react';
import { Sector, Branch } from '../types';

const InventoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({ name: '', sku: '', price: '', cost: '', stock: '', category: '', branch: 'Alpha' });

  // Filter based on context and search
  const sectorProducts = products.filter(p => 
    p.sector === currentSector && 
    (currentBranch === 'All' || p.branch === currentBranch) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addProduct({
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      sku: newItem.sku,
      price: parseFloat(newItem.price),
      cost: parseFloat(newItem.cost),
      stock: parseInt(newItem.stock),
      category: newItem.category,
      sector: currentSector as Sector,
      branch: newItem.branch as Branch // Default or selected
    }));
    setIsAdding(false);
    setNewItem({ name: '', sku: '', price: '', cost: '', stock: '', category: '', branch: 'Alpha' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Inventory <span className="text-slate-500 text-base font-normal">/ {currentBranch}</span>
        </h2>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <input 
                    type="text" 
                    placeholder="Search SKU or Name..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            </div>
            <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap"
            >
            <Plus className="w-4 h-4" /> Add Product
            </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="md:col-span-4 mb-2">
              <h3 className="text-lg font-bold text-slate-200">New Product Details</h3>
              <p className="text-sm text-slate-500">Adding to Sector: {currentSector}</p>
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">Branch</label>
              <select 
                className="bg-slate-700 border-none rounded p-2 text-white"
                value={newItem.branch}
                onChange={e => setNewItem({...newItem, branch: e.target.value})}
              >
                  <option value="Alpha">Alpha</option>
                  <option value="Beta">Beta</option>
                  <option value="Gamma">Gamma</option>
              </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-slate-400 font-bold uppercase">Product Name</label>
              <input required placeholder="E.g. Cotton T-Shirt" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">SKU</label>
              <input required placeholder="Unique ID" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">Category</label>
              <input required placeholder="E.g. Apparel" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">Sale Price</label>
              <input required type="number" step="0.01" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">Cost Price</label>
              <input required type="number" step="0.01" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-bold uppercase">Stock Qty</label>
              <input required type="number" className="bg-slate-700 border-none rounded p-2 text-white" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
          </div>

          <div className="md:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Save Product</button>
          </div>
        </form>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 uppercase font-medium">
              <tr>
                <th className="p-4">SKU</th>
                <th className="p-4">Name</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-200">
              {sectorProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 font-mono text-slate-400">{product.sku}</td>
                  <td className="p-4 font-bold">{product.name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-indigo-300">{product.branch}</span></td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-700 rounded text-xs">{product.category}</span></td>
                  <td className="p-4">
                    <span className={`font-bold ${product.stock < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">${product.cost.toFixed(2)}</td>
                  <td className="p-4 font-medium text-indigo-400">${product.price.toFixed(2)}</td>
                  <td className="p-4 text-right font-bold">${(product.price * product.stock).toFixed(2)}</td>
                </tr>
              ))}
              {sectorProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">No products found matching criteria.</td>
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
