import React from 'react';

interface FormSectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    color?: 'indigo' | 'violet';
}

export const FormSection: React.FC<FormSectionProps> = ({
    title,
    icon: Icon,
    children,
    color = 'indigo'
}) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600'
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">{title}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    );
};

interface InputFieldProps {
    label: string;
    id: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    pattern?: string;
    maxLength?: number;
    title?: string;
    color?: 'indigo' | 'violet';
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    id,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    pattern,
    maxLength,
    title,
    color = 'indigo'
}) => {
    const focusClasses = {
        indigo: 'focus:ring-indigo-500/10 focus:border-indigo-500',
        violet: 'focus:ring-violet-500/10 focus:border-violet-500'
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                pattern={pattern}
                maxLength={maxLength}
                title={title}
                placeholder={placeholder}
                className={`w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 ${focusClasses[color]} transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600`}
            />
        </div>
    );
};

interface TextareaFieldProps {
    label: string;
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    color?: 'indigo' | 'violet';
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
    label,
    id,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    rows = 3,
    color = 'indigo'
}) => {
    const focusClasses = {
        indigo: 'focus:ring-indigo-500/10 focus:border-indigo-500',
        violet: 'focus:ring-violet-500/10 focus:border-violet-500'
    };

    return (
        <div className="md:col-span-2 space-y-2">
            <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                rows={rows}
                className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-4 ${focusClasses[color]} transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600`}
                placeholder={placeholder}
            />
        </div>
    );
};

interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: SelectOption[];
    color?: 'indigo' | 'violet';
}

export const SelectField: React.FC<SelectFieldProps> = ({
    label,
    id,
    name,
    value,
    onChange,
    options,
    color = 'indigo'
}) => {
    const focusClasses = {
        indigo: 'focus:ring-indigo-500/10 focus:border-indigo-500',
        violet: 'focus:ring-violet-500/10 focus:border-violet-500'
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {label}
            </label>
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 ${focusClasses[color]} transition-all font-bold text-sm text-slate-700 dark:text-slate-200`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};
