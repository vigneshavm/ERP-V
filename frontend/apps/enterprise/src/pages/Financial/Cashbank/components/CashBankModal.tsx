import React from 'react';
import { X, LucideIcon } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

const CashBankModal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    children,
    footer,
    maxWidth = 'max-w-2xl'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className={`bg-white dark:bg-slate-900 w-full ${maxWidth} rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up`}>
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                <Icon className="w-6 h-6" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h2>
                            {subtitle && <p className="text-xs font-medium text-slate-400">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {footer && (
                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashBankModal;
