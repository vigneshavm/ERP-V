import React from 'react';
import ChangePasswordModal from '../Auth/ChangePasswordModal';

interface GlobalModalsProps {
    isChangePasswordOpen: boolean;
    setIsChangePasswordOpen: (open: boolean) => void;
    confirmDialog: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    };
    setConfirmDialog: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>>;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    confirmDialog,
    setConfirmDialog
}) => {
    const handleConfirm = () => {
        confirmDialog.onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <>
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            {/* Confirmation Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-display font-bold text-main mb-2">{confirmDialog.title}</h3>
                        <p className="text-secondary mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 text-secondary hover:bg-white/5 rounded-lg font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="btn-cyber-primary bg-error hover:bg-error/90"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalModals;
