import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-neutral-800">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-neutral-500 mt-1 uppercase tracking-widest">{description}</p>
        </div>
        <div className="p-6 space-y-6">
            {children}
        </div>
    </div>
);

interface InputWrapperProps {
    label: string;
    icon: LucideIcon;
    children: React.ReactNode;
    error?: string;
    required?: boolean;
}

export const InputWrapper: React.FC<InputWrapperProps> = ({ label, icon: Icon, children, error, required }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-1">
            <Icon className="w-3.5 h-3.5 text-indigo-500" />
            {label}
            {required && <span className="text-rose-500 ms-0.5">*</span>}
        </label>
        <div className="relative">
            {children}
        </div>
        {error && (
            <p className="text-[10px] font-bold text-rose-500 mt-1 px-1 uppercase tracking-widest flex items-center gap-1">
                <span>⚠</span> {error}
            </p>
        )}
    </div>
);
