import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    footer = null
}) => {
    if (!isOpen) return null;

    const sizeClasses: Record<string, string> = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    return (
        <div className="ui-modal-backdrop dark:bg-black/70">
            <div className={`ui-panel ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col shadow-2xl`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-default">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-[rgb(var(--color-text))]">{title}</h3>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 dark:text-[rgb(var(--color-text-muted))] hover:text-slate-600 dark:hover:text-[rgb(var(--color-text))] transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="border-t border-slate-200 dark:border-[rgb(var(--color-border))] p-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
