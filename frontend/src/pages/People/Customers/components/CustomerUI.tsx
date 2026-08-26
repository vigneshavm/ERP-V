import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-sm shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[rgb(var(--color-border))]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))] mt-1">{description}</p>
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
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))] flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary dark:text-[rgb(var(--color-primary-light))]" />
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group">
            {children}
        </div>
        {error && (
            <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                <span>⚠</span> {error}
            </p>
        )}
    </div>
);

interface DetailCardProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

export const DetailCard: React.FC<DetailCardProps> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-sm shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[rgb(var(--color-border))] flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Icon className="w-5 h-5 text-primary dark:text-[rgb(var(--color-primary))]" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{title}</h3>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

interface DataPointProps {
    label: string;
    value: string | number;
    subLabel?: string;
}

export const DataPoint: React.FC<DataPointProps> = ({ label, value, subLabel }) => (
    <div className="group">
        <p className="text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase tracking-wider mb-1">
            {label}
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-[rgb(var(--color-text))] break-words">
            {value || 'N/A'}
        </p>
        {subLabel && (
            <p className="text-xs text-gray-400 dark:text-[rgb(var(--color-text-muted))] mt-0.5">
                {subLabel}
            </p>
        )}
    </div>
);
