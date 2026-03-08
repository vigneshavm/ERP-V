import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    name: string;
    value: string | number;
    error?: string;
    icon?: React.ReactNode;
}

interface IconWrapperProps {
    children: React.ReactNode;
    className?: string;
}

const FormInput: React.FC<FormInputProps> & { IconWrapper: React.FC<IconWrapperProps> } = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder = '',
    required = false,
    error = '',
    disabled = false,
    className = '',
    icon = null,
    ...props
}) => {
    return (
        <div className={`${className}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-bold text-secondary mb-2 uppercase tracking-wide">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border ${error ? 'border-rose-500' : 'border-default'
                        } bg-input text-main placeholder:text-muted rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed transition-all`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-rose-600 font-medium">{error}</p>}
        </div>
    );
};

FormInput.IconWrapper = ({ children, className = '' }) => (
    <div className={`p-2 bg-surface rounded-lg transition-colors ${className}`}>
        {children}
    </div>
);

export default FormInput;
