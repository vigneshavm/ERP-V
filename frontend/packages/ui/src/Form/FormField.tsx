import React from 'react';

interface FormFieldProps {
    label: string;
    children: React.ReactNode;
    error?: string;
    required?: boolean;
    className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, children, error, required, className = "" }) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
};

export default FormField;
