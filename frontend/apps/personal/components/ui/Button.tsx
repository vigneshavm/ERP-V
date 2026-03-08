"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "disabled" | "variant"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

const getVariantStyles = (variant: ButtonProps['variant']) => {
    switch (variant) {
        case 'primary':
            return {
                background: 'var(--primary-color)',
                color: 'var(--text-on-primary)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(var(--primary-color-rgb), 0.3)'
            };
        case 'secondary':
            return {
                background: 'var(--surface-overlay-strong)',
                color: 'var(--text-primary)',
                border: '1px solid var(--surface-border)'
            };
        case 'danger':
            return {
                background: 'rgba(var(--danger-color-rgb), 0.1)',
                color: 'var(--danger-color)',
                border: '1px solid rgba(var(--danger-color-rgb), 0.2)'
            };
        case 'ghost':
            return {
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                padding: '8px 12px'
            };
        case 'icon':
            return {
                background: 'var(--surface-overlay)',
                color: 'var(--text-primary)',
                border: 'none',
                padding: '8px',
                borderRadius: '50%'
            };
        default:
            return {};
    }
};

const getSizeStyles = (size: ButtonProps['size']) => {
    switch (size) {
        case 'small':
            return { padding: '8px 16px', fontSize: '14px', borderRadius: '12px' };
        case 'large':
            return { padding: '16px 24px', fontSize: '18px', borderRadius: '20px' };
        case 'medium':
        default:
            return { padding: '14px 20px', fontSize: '16px', borderRadius: '16px' };
    }
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    icon,
    style,
    className = '',
    ...props
}) => {
    const isInteractive = !disabled && !isLoading;

    const baseStyle: HTMLMotionProps<"button">['style'] = {
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        opacity: isInteractive ? 1 : 0.6,
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        ...getVariantStyles(variant),
        ...(variant !== 'icon' && variant !== 'ghost' ? getSizeStyles(size) : {}),
        ...style
    };

    return (
        <motion.button
            whileHover={isInteractive ? { scale: 1.02, filter: 'brightness(1.1)' } : undefined}
            whileTap={isInteractive ? { scale: 0.98 } : undefined}
            style={baseStyle}
            disabled={disabled || isLoading}
            className={`custom-button ${className}`}
            {...props}
        >
            {icon && !isLoading && <span>{icon}</span>}
            {isLoading ? <span>Loading...</span> : children}
        </motion.button>
    );
};
