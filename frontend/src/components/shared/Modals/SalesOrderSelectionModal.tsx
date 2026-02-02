import React from 'react';
import Modal from '../Overlay/Modal';

interface SalesOrderSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (order: any) => void;
}

const SalesOrderSelectionModal: React.FC<SalesOrderSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Sales Order">
            <div className="p-4">
                <p className="text-sm text-slate-500 mb-4">Select a sales order to link.</p>
                <div className="space-y-2">
                    <button
                        onClick={() => onSelect({
                            _id: 'so1',
                            orderNumber: 'SO-001',
                            customer: { _id: '1', name: 'Sample Customer', phone: '123', email: 'a@b.com' },
                            items: [
                                { item: { _id: 'item1', name: 'Sample Item', sku: 'SKU001', unit: 'pcs', stock: 100 }, quantity: 10, deliveredQty: 0, rate: 50 }
                            ]
                        })}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 rounded border border-slate-200"
                    >
                        SO-001 (Sample Customer)
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SalesOrderSelectionModal;
