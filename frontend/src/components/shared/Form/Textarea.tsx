/**
 * TEXTAREA COMPONENT
 * 
 * Multi-line text input with:
 * - 3 sizes (sm, md, lg)
 * - 4 status states (default, success, error, warning)
 * - Character counter with max length
 * - Auto-resize height
 * - Validation icons and messages
 * - Helper text and required indicator
 * - Full dark mode support
 * - Accessibility features
 * 
 * Import: import { Textarea } from '@/components/shared'
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Eye } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type TextareaSize = 'sm' | 'md' | 'lg';

export type TextareaStatus = 'default' | 'success' | 'error' | 'warning';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual size of textarea */
  size?: TextareaSize;

  /** Status state (success/error/warning auto-resolved from props) */
  status?: TextareaStatus;

  /** Show success state */
  success?: boolean;

  /** Show error state and message */
  error?: boolean;
  errorMessage?: string;

  /** Show warning state and message */
  warning?: boolean;
  warningMessage?: string;

  /** Helper text shown below textarea */
  helperText?: string;

  /** Label above textarea */
  label?: string;

  /** Show required indicator (*) */
  required?: boolean;

  /** Show character counter (max = maxLength prop) */
  showCharCounter?: boolean;

  /** Auto-grow height as user types */
  autoResize?: boolean;

  /** Minimum rows when autoResize is false */
  minRows?: number;

  /** Icon on the left side */
  leftIcon?: React.ReactNode;

  /** Icon on the right side (overrides status icons) */
  rightIcon?: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      status: statusProp,
      success,
      error,
      errorMessage,
      warning,
      warningMessage,
      helperText,
      label,
      required,
      showCharCounter,
      autoResize = true,
      minRows = 3,
      leftIcon,
      rightIcon,
      disabled,
      maxLength,
      value,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(
      typeof value === 'string' ? value : ''
    );
    const [height, setHeight] = useState<string | number>('auto');

    // Resolve status from explicit props
    const resolvedStatus: TextareaStatus = statusProp || (
      error ? 'error' : warning ? 'warning' : success ? 'success' : 'default'
    );

    // Size-specific classes
    const sizeClasses: Record<TextareaSize, string> = {
      sm: 'px-2 py-1.5 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // Status-specific classes for border and focus ring
    const statusClasses: Record<TextareaStatus, string> = {
      default: 'border-slate-300 dark:border-slate-600 focus:ring-primary/50 focus:border-primary',
      success: 'border-success text-success dark:border-success focus:ring-success/50 focus:border-success',
      error: 'border-error text-error dark:border-error focus:ring-error/50 focus:border-error',
      warning: 'border-warning text-warning dark:border-warning focus:ring-warning/50 focus:border-warning',
    };

    // Background tint for status
    const statusBgClasses: Record<TextareaStatus, string> = {
      default: 'bg-white dark:bg-slate-800',
      success: 'bg-success/5 dark:bg-success/10',
      error: 'bg-error/5 dark:bg-error/10',
      warning: 'bg-warning/5 dark:bg-warning/10',
    };

    // Base textarea classes
    const baseClasses = `w-full rounded-lg border-2 transition-all resize-none appearance-none font-sans placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2`;

    const textareaClasses = `${baseClasses} ${sizeClasses[size]} ${statusClasses[resolvedStatus]} ${statusBgClasses[resolvedStatus]} ${disabled ? '' : 'hover:border-slate-400 dark:hover:border-slate-500'} ${className}`;

    // Handle textarea change with auto-resize
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);

        // Auto-resize height
        if (autoResize) {
          e.target.style.height = 'auto';
          const scrollHeight = e.target.scrollHeight;
          setHeight(scrollHeight);
        }

        onChange?.(e);
      },
      [onChange, autoResize]
    );

    // Get current character count
    const currentValue = value !== undefined ? value : internalValue;
    const charCount = typeof currentValue === 'string' ? currentValue.length : 0;

    // Status icon
    const statusIcon = resolvedStatus === 'success' ? (
      <CheckCircle size={16} className="flex-shrink-0" />
    ) : resolvedStatus === 'error' ? (
      <AlertCircle size={16} className="flex-shrink-0" />
    ) : resolvedStatus === 'warning' ? (
      <AlertCircle size={16} className="flex-shrink-0" />
    ) : null;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Textarea container with icons */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-2 top-2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={ref}
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            className={`${textareaClasses} ${
              leftIcon ? 'pl-8' : ''
            } ${rightIcon || statusIcon ? 'pr-8' : ''}`}
            style={{
              height: autoResize ? height : undefined,
              minHeight: autoResize ? 'auto' : `calc(${minRows} * 1.5em)`,
            }}
            {...props}
          />

          {/* Right icon (status icon or custom) */}
          {(rightIcon || statusIcon) && (
            <div className="absolute right-2 top-2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              {rightIcon || statusIcon}
            </div>
          )}
        </div>

        {/* Status message */}
        {resolvedStatus !== 'default' && (
          <div
            className={`mt-1 text-xs font-medium ${
              resolvedStatus === 'success'
                ? 'text-success'
                : resolvedStatus === 'error'
                  ? 'text-error'
                  : 'text-warning'
            }`}
          >
            {resolvedStatus === 'success' && 'Valid input'}
            {resolvedStatus === 'error' && errorMessage}
            {resolvedStatus === 'warning' && warningMessage}
          </div>
        )}

        {/* Helper text and character counter */}
        <div
          className={`mt-1 flex items-center justify-between text-xs ${
            resolvedStatus !== 'default'
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>{helperText}</span>

          {showCharCounter && maxLength && (
            <span className={charCount > maxLength * 0.9 ? 'text-warning font-bold' : ''}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
