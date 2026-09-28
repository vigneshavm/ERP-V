import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    secondary: 'border border-default text-secondary hover:bg-surface',
    danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
    ghost: 'text-secondary hover:bg-surface hover:text-main',
    icon: 'text-secondary hover:bg-surface hover:text-main'
};

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    className = '',
    type = 'button',
    ...props
}) => (
    <button
        type={type}
        className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'icon' ? 'p-2' : 'px-4 py-2'} ${variantClasses[variant]} ${className}`}
        {...props}
    />
);

export default Button;
