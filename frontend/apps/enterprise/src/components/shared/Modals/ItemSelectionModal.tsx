import React from 'react';
import Modal from '../Overlay/Modal';

interface ItemSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Item">
            <div className="p-4">
                <p className="text-sm text-slate-500 mb-4">Select an item from inventory.</p>
                <div className="space-y-2">
                    <button
                        onClick={() => onSelect({ _id: 'item1', name: 'Sample Item', sku: 'SKU001', stockQty: 100, unit: 'pcs', sellingPrice: 50, reservedStock: 0 })}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 rounded border border-slate-200"
                    >
                        Sample Item (SKU001)
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ItemSelectionModal;
