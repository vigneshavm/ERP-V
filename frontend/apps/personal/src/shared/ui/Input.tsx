"use client";

import React, { useId, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BaseProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
export type TextAreaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
export type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & {
    options: Array<{ value: string; label: string }>;
};

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    style,
    id,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '16px' }} className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        fontSize: '13px',
                        color: 'var(--label-text)',
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 500
                    }}
                >
                    {label}
                </label>
            )}
            <div style={{ position: 'relative', width: '100%' }}>
                {icon && (
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    style={{
                        width: '100%',
                        padding: `14px 16px 14px ${icon ? '44px' : '16px'}`,
                        borderRadius: '16px',
                        background: 'var(--surface-overlay-subtle)',
                        border: error ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        ...style
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--surface-border)'}
                    className="custom-input"
                    {...props}
                />
            </div>
            {error && <span style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '4px' }}>{error}</span>}
        </div>
    );
};

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    className = '',
    style,
    id,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '16px' }} className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        fontSize: '13px',
                        color: 'var(--label-text)',
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 500
                    }}
                >
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'var(--surface-overlay-subtle)',
                    border: error ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    ...style
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--surface-border)'}
                className="custom-textarea"
                {...props}
            />
            {error && <span style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '4px' }}>{error}</span>}
        </div>
    );
};

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    options,
    className = '',
    style,
    id,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '16px' }} className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        fontSize: '13px',
                        color: 'var(--label-text)',
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 500
                    }}
                >
                    {label}
                </label>
            )}
            <select
                id={inputId}
                style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'var(--surface-overlay-subtle)',
                    border: error ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    appearance: 'none',
                    ...style
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--surface-border)'}
                className="custom-select"
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-color)', color: 'white' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '4px' }}>{error}</span>}
        </div>
    );
};
