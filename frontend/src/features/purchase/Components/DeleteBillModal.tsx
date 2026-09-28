import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Modal } from '../../../components/shared';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteBillModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Bill?"
            size="sm"
            footer={
                <div className="flex gap-3">
                    <Button variant="danger" size="md" onClick={onConfirm} fullWidth>
                        Confirm Delete
                    </Button>
                    <Button variant="secondary" size="md" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                </div>
            }
        >
            <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <p className="text-slate-500 text-sm">Are you sure you want to delete this bill? This action cannot be undone.</p>
        </Modal>
    );
};

export default DeleteBillModal;
