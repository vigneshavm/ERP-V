import React from 'react';
import Modal from '../Overlay/Modal';

interface SupplierSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (supplier: any) => void;
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Supplier">
            <div className="p-4">
                <p className="text-sm text-slate-500 mb-4">Select a supplier from the list.</p>
                <div className="space-y-2">
                    <button
                        onClick={() => onSelect({ _id: 'sup1', name: 'Sample Supplier', phone: '123' })}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 rounded border border-slate-200"
                    >
                        Sample Supplier
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierSelectionModal;
