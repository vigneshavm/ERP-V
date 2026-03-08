import React from 'react';
import Modal from '../Overlay/Modal';

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: any) => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Customer">
            <div className="p-4">
                <p className="text-sm text-slate-500 mb-4">Select a customer from the list below.</p>
                {/* Simplified list for now */}
                <div className="space-y-2">
                    <button
                        onClick={() => onSelect({ _id: '1', name: 'Walk-in Customer', phone: '0000000000', address: { line1: 'Main St', city: 'City' } })}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 rounded border border-slate-200"
                    >
                        Walk-in Customer
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CustomerSelectionModal;
