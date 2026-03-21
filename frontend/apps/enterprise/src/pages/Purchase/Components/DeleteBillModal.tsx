import React from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteBillModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl w-full max-w-sm p-6 shadow-2xl border dark:border-default">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Delete Bill?</h3>
                <p className="text-neutral-500 text-sm mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
                    >
                        Confirm Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-1 px-4 bg-[var(--erp-bg-sunken)] hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteBillModal;
