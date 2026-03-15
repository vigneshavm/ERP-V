import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputWrapperProps {
    label: string;
    icon?: LucideIcon;
    children: React.ReactNode;
}

const CashBankInput: React.FC<InputWrapperProps> = ({ label, icon: Icon, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative group">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />}
            {children}
        </div>
    </div>
);

export default CashBankInput;
