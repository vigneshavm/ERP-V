import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const ItemSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.error('No user found. Please login again.');
                alert('No authentication found. Please login again.');
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            const token = user?.token;

            if (!token) {
                console.error('No token found in user object. Please login again.');
                alert('Authentication token missing. Please login again.');
                setLoading(false);
                return;
            }

            console.log('Fetching items from:', `/api/inventory`);
            const response = await api.get(`/api/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Items fetched successfully:', response.data);
            console.log('Number of items:', response.data.length);
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
            console.error('Error details:', error.response);
            if (error.response?.status === 401) {
                console.error('Authentication failed. Please logout and login again.');
                alert('Your session has expired. Please logout and login again.');
            } else {
                alert(`Failed to load items: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = () => {
        if (selectedItem && quantity > 0) {
            onSelect({ ...selectedItem, quantity });
            setSelectedItem(null);
            setQuantity(1);
            setSearchTerm('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in ring-1 ring-slate-900/5">
                {/* Sticky Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur shrink-0 z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Select Item</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Search and add products to your order</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by product name, SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Scrollable Item List */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                            <p className="text-sm text-slate-500 font-medium">Loading inventory...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-slate-900 font-medium">No items found</h3>
                            <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const availableStock = item.stockQty - (item.reservedStock || 0);
                            const isOutOfStock = availableStock <= 0;
                            const isLowStock = availableStock > 0 && availableStock <= item.lowStockLimit;
                            const isSelected = selectedItem?._id === item._id;

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => !isOutOfStock && setSelectedItem(item)}
                                    className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${isSelected
                                        ? 'bg-indigo-50 border-indigo-500 shadow-sm z-10'
                                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                        } ${isOutOfStock ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="absolute left-0 inset-y-0 w-1 bg-indigo-500"></div>
                                    )}

                                    <div className="flex-1 min-w-0 pr-4 pl-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {item.name}
                                            </h3>
                                            {item.sku && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    {item.sku}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-500 font-medium">
                                                Stock: <span className="text-slate-700">{item.stockQty}</span>
                                            </span>
                                            {item.reservedStock > 0 && (
                                                <span className="text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                                                    Reserved: {item.reservedStock}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Price & Status */}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                            ₹{item.sellingPrice.toFixed(2)}
                                        </span>

                                        {isOutOfStock ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                                                Out of Stock
                                            </span>
                                        ) : isLowStock ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                                Low Stock: {availableStock}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                Available: {availableStock}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Selection Panel */}
                {selectedItem && (
                    <div className="p-4 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Quantity
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedItem.stockQty - (selectedItem.reservedStock || 0)}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <div className="absolute right-0 inset-y-0 flex items-center pr-3 pointer-events-none text-xs text-slate-400 font-medium">
                                        Max: {selectedItem.stockQty - (selectedItem.reservedStock || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSelect}
                                    className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95"
                                >
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

ItemSelectionModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default ItemSelectionModal;
