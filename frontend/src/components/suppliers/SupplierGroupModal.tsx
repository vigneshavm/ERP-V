import React from 'react';
import Modal from '../shared/Overlay/Modal';

interface SupplierGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupplierGroupModal: React.FC<SupplierGroupModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Supplier Group">
            <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">Group management functionality coming soon.</p>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                        Close
                    </button>
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierGroupModal;
