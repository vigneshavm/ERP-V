import React from 'react';
import { Plus, Search, Image as ImageIcon, X, Pencil, Clock, List, Printer, CheckSquare, Square, Copy } from 'lucide-react';
import { useInventoryLogic } from '../../hooks/useInventoryLogic';
import { Sector } from '../../types/common';
import BarcodeGenerator from '../BarcodeGenerator';

type InventoryLogic = ReturnType<typeof useInventoryLogic>;

export const InventoryGenericTemplate: React.FC<InventoryLogic> = ({
    products,
    displayedProducts,
    currentSector,
    currentBranch,
    role,
    isFormOpen,
    editingId,
    searchTerm,
    activeTab,
    bulkFormData,
    selectedProductIds,
    isPrintMode,
    isPrintModalOpen,
    setIsFormOpen,
    setSearchTerm,
    setActiveTab,
    setIsPrintMode,
    setIsPrintModalOpen,
    handleImageUpload,
    handleEdit,
    resetForm,
    handleRowChange,
    addRow,
    copyRow,
    removeRow,
    handleSave,
    toggleProductSelection,
    selectAll,
    getBranchName,
    handlePrintLabels
}) => {
    const isOwner = role === 'Owner';

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

    return (
        <div className="hidden md:block space-y-6 animate-fade-in">
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
                            <div id="barcode-print-area" className="bg-white p-8 shadow-sm grid grid-cols-3 gap-4 max-w-[210mm] mx-auto min-h-[297mm]">
                                {products
                                    .filter(p => selectedProductIds.has(p.id))
                                    .flatMap(p => {
                                        const count = Math.max(1, p.stock);
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
            )}

            {isFormOpen && (
                <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in shadow-lg overflow-x-auto">
                    <div className="flex justify-between items-center mb-4 sticky left-0">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{editingId ? 'Edit Product' : 'Bulk Add Products'}</h3>
                        <div className="flex gap-2">
                            {!editingId && (
                                <button type="button" onClick={addRow} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Row
                                </button>
                            )}
                            <button type="button" onClick={resetForm} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                    </div>

                    <table className="w-full text-sm min-w-[1200px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-2 w-32">SKU</th>
                                <th className="p-2 w-48">Name</th>
                                <th className="p-2 w-32">Brand</th>
                                <th className="p-2 w-32">Category</th>
                                <th className="p-2 w-20">Type</th>
                                <th className="p-2 w-20">Unit</th>
                                {currentSector === Sector.TEXTILE && (
                                    <>
                                        <th className="p-2 w-24">Sub Cat</th>
                                        <th className="p-2 w-20">Size</th>
                                        <th className="p-2 w-20">Color</th>
                                        <th className="p-2 w-24">Material</th>
                                    </>
                                )}
                                {(currentSector === Sector.PHARMACY || currentSector === Sector.GROCERY) && (
                                    <th className="p-2 w-24">Expiry</th>
                                )}
                                {currentSector === Sector.ELECTRONICS && (
                                    <th className="p-2 w-24">Warranty</th>
                                )}
                                <th className="p-2 w-16">Stock</th>
                                <th className="p-2 w-20">Cost</th>
                                <th className="p-2 w-20">Price</th>
                                <th className="p-2 w-20">Loc</th>
                                <th className="p-2 w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {bulkFormData.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                    <td className="p-2"><input className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 text-slate-500 text-xs" value={row.sku} disabled placeholder="(Auto)" /></td>
                                    <td className="p-2"><input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.name} onChange={e => handleRowChange(idx, 'name', e.target.value)} placeholder="Prod Name" /></td>
                                    <td className="p-2"><input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.brand} onChange={e => handleRowChange(idx, 'brand', e.target.value)} placeholder="Brand" /></td>
                                    <td className="p-2"><input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.category} onChange={e => handleRowChange(idx, 'category', e.target.value)} placeholder="Cat" /></td>
                                    <td className="p-2"><input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.productType} onChange={e => handleRowChange(idx, 'productType', e.target.value)} placeholder="Type" /></td>
                                    <td className="p-2">
                                        <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-1 text-slate-900 dark:text-white text-xs" value={row.unit} onChange={e => handleRowChange(idx, 'unit', e.target.value)}>
                                            <option value="Piece">Pcs</option>
                                            <option value="Meter">Mtr</option>
                                            <option value="Set">Set</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Ltr">Ltr</option>
                                            <option value="Box">Box</option>
                                        </select>
                                    </td>
                                    {currentSector === Sector.TEXTILE && (
                                        <>
                                            <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.subCategory} onChange={e => handleRowChange(idx, 'subCategory', e.target.value)} placeholder="Sub" /></td>
                                            <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.size} onChange={e => handleRowChange(idx, 'size', e.target.value)} placeholder="Size" /></td>
                                            <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.color} onChange={e => handleRowChange(idx, 'color', e.target.value)} placeholder="Col" /></td>
                                            <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.material} onChange={e => handleRowChange(idx, 'material', e.target.value)} placeholder="Mat" /></td>
                                        </>
                                    )}
                                    {(currentSector === Sector.PHARMACY || currentSector === Sector.GROCERY) && (
                                        <td className="p-2"><input type="date" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white text-xs" value={row.expiryDate} onChange={e => handleRowChange(idx, 'expiryDate', e.target.value)} /></td>
                                    )}
                                    {currentSector === Sector.ELECTRONICS && (
                                        <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.warrantyPeriod} onChange={e => handleRowChange(idx, 'warrantyPeriod', e.target.value)} placeholder="1 Year" /></td>
                                    )}
                                    <td className="p-2"><input required type="number" step="any" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.stock} onChange={e => handleRowChange(idx, 'stock', e.target.value)} /></td>
                                    <td className="p-2"><input required type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.cost} onChange={e => handleRowChange(idx, 'cost', e.target.value)} /></td>
                                    <td className="p-2"><input required type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.price} onChange={e => handleRowChange(idx, 'price', e.target.value)} /></td>
                                    <td className="p-2"><input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white" value={row.location} onChange={e => handleRowChange(idx, 'location', e.target.value)} placeholder="Loc" /></td>
                                    <td className="p-2 flex gap-1">
                                        {!editingId && (
                                            <>
                                                <button type="button" onClick={() => copyRow(idx)} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded" title="Duplicate Row"><Copy className="w-4 h-4" /></button>
                                                <button type="button" onClick={() => removeRow(idx)} className="p-1 hover:bg-red-50 text-red-500 rounded" title="Remove Row"><X className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 sticky left-0">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
                            {editingId ? 'Update Product' : `Save ${bulkFormData.length} Products`}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg transition-colors">
                <div className="block overflow-x-auto">
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
                                {currentSector === Sector.PHARMACY && <th className="p-4">Expiry</th>}
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
                                    {currentSector === Sector.PHARMACY && (
                                        <td className="p-4 text-xs font-mono text-slate-500">{product.expiryDate || '-'}</td>
                                    )}
                                    <td className="p-4">
                                        <span className={`font-bold ${product.stock < 10 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {product.stock} {product.unit === 'Meter' ? 'm' : ''}
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
