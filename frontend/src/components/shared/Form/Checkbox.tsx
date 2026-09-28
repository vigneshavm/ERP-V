/**
 * CHECKBOX COMPONENT
 * 
 * Checkbox input with:
 * - 3 sizes (sm, md, lg)
 * - 4 status states (default, success, error, warning)
 * - Indeterminate state for "select all" patterns
 * - Label and description
 * - Disabled state
 * - Validation states
 * - Helper text
 * - Full dark mode support
 * - Accessibility features
 * 
 * Import: import { Checkbox, CheckboxGroup } from '@/components/shared'
 */

import React, { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type CheckboxSize = 'sm' | 'md' | 'lg';

export type CheckboxStatus = 'default' | 'success' | 'error' | 'warning';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Visual size */
  size?: CheckboxSize;

  /** Status state (auto-resolved from error/success/warning props) */
  status?: CheckboxStatus;

  /** Show error state */
  error?: boolean;
  errorMessage?: string;

  /** Show success state */
  success?: boolean;

  /** Show warning state */
  warning?: boolean;
  warningMessage?: string;

  /** Label text */
  label?: string;

  /** Description or additional info */
  description?: string;

  /** Helper text below checkbox */
  helperText?: string;

  /** Indeterminate state (for select-all) */
  indeterminate?: boolean;

  /** Custom class for wrapper */
  wrapperClassName?: string;
}

// ============================================
// CHECKBOX COMPONENT
// ============================================

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      status: statusProp,
      error,
      errorMessage,
      success,
      warning,
      warningMessage,
      label,
      description,
      helperText,
      indeterminate = false,
      disabled,
      wrapperClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    // Resolve status
    const resolvedStatus: CheckboxStatus = statusProp || (
      error ? 'error' : warning ? 'warning' : success ? 'success' : 'default'
    );

    // Size classes
    const sizeClasses: Record<CheckboxSize, { checkbox: string; label: string }> = {
      sm: { checkbox: 'w-4 h-4', label: 'text-xs' },
      md: { checkbox: 'w-5 h-5', label: 'text-sm' },
      lg: { checkbox: 'w-6 h-6', label: 'text-base' },
    };

    // Status classes
    const statusClasses: Record<CheckboxStatus, string> = {
      default: 'border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary focus:ring-primary/50',
      success: 'border-success dark:border-success checked:bg-success checked:border-success focus:ring-success/50',
      error: 'border-error dark:border-error checked:bg-error checked:border-error focus:ring-error/50',
      warning: 'border-warning dark:border-warning checked:bg-warning checked:border-warning focus:ring-warning/50',
    };

    // Base checkbox classes
    const baseCheckboxClasses = `appearance-none cursor-pointer border-2 rounded transition-all focus:outline-none focus:ring-2 dark:bg-slate-700 dark:checked:bg-current disabled:opacity-50 disabled:cursor-not-allowed`;

    const checkboxClasses = `${baseCheckboxClasses} ${sizeClasses[size].checkbox} ${statusClasses[resolvedStatus]} ${className}`;

    // Status icon
    const statusIcon = resolvedStatus === 'success' ? (
      <CheckCircle size={14} className="flex-shrink-0 -mt-0.5" />
    ) : resolvedStatus === 'error' ? (
      <AlertCircle size={14} className="flex-shrink-0 -mt-0.5" />
    ) : resolvedStatus === 'warning' ? (
      <AlertCircle size={14} className="flex-shrink-0 -mt-0.5" />
    ) : null;

    return (
      <div className={wrapperClassName}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={checkboxClasses}
            {...props}
            // Handle indeterminate state
            style={{
              ...(indeterminate && {
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3e%3cpath fill=%27%23fff%27 d=%27M2 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z%27/%3e%3c/svg%3e")',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                borderColor: resolvedStatus === 'success' ? '#10b981' : 
                             resolvedStatus === 'error' ? '#ef4444' :
                             resolvedStatus === 'warning' ? '#f59e0b' : '#4f46e5',
                backgroundColor: resolvedStatus === 'success' ? '#10b981' : 
                                 resolvedStatus === 'error' ? '#ef4444' :
                                 resolvedStatus === 'warning' ? '#f59e0b' : '#4f46e5',
              }),
            }}
          />

          {/* Label and description */}
          {label && (
            <div className="flex-1 min-w-0">
              <label className={`font-medium text-slate-900 dark:text-white ${sizeClasses[size].label} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {label}
              </label>

              {description && (
                <p className={`text-slate-600 dark:text-slate-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}`}>
                  {description}
                </p>
              )}

              {/* Status message */}
              {resolvedStatus !== 'default' && (
                <div
                  className={`mt-1 text-xs font-medium flex items-center gap-1 ${
                    resolvedStatus === 'success'
                      ? 'text-success'
                      : resolvedStatus === 'error'
                        ? 'text-error'
                        : 'text-warning'
                  }`}
                >
                  {statusIcon}
                  <span>
                    {resolvedStatus === 'success' && 'Valid'}
                    {resolvedStatus === 'error' && errorMessage}
                    {resolvedStatus === 'warning' && warningMessage}
                  </span>
                </div>
              )}

              {/* Helper text */}
              {helperText && (
                <p className={`mt-1 text-slate-500 dark:text-slate-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}`}>
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ============================================
// CHECKBOX GROUP COMPONENT
// ============================================

export interface CheckboxGroupProps {
  /** Group label */
  label?: string;

  /** Group items */
  items: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;

  /** Selected values */
  value?: string[];

  /** Change callback */
  onChange?: (values: string[]) => void;

  /** Visual size */
  size?: CheckboxSize;

  /** Status state */
  status?: CheckboxStatus;

  /** Error state */
  error?: boolean;
  errorMessage?: string;

  /** Success state */
  success?: boolean;

  /** Warning state */
  warning?: boolean;
  warningMessage?: string;

  /** Helper text */
  helperText?: string;

  /** Required indicator */
  required?: boolean;

  /** Disable entire group */
  disabled?: boolean;

  /** Show "Select All" option */
  selectAllOption?: boolean;
  selectAllLabel?: string;

  /** Vertical or horizontal layout */
  layout?: 'vertical' | 'horizontal';

  /** Custom class for wrapper */
  wrapperClassName?: string;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      label,
      items = [],
      value = [],
      onChange,
      size = 'md',
      status,
      error,
      errorMessage,
      success,
      warning,
      warningMessage,
      helperText,
      required,
      disabled,
      selectAllOption = false,
      selectAllLabel = 'Select All',
      layout = 'vertical',
      wrapperClassName = '',
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] = React.useState(value);

    // Sync external value changes
    React.useEffect(() => {
      setSelectedValues(value);
    }, [value]);

    // Handle checkbox change
    const handleChange = (itemValue: string, checked: boolean) => {
      const newValues = checked
        ? [...selectedValues, itemValue]
        : selectedValues.filter((v) => v !== itemValue);

      setSelectedValues(newValues);
      onChange?.(newValues);
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
      const newValues = checked ? items.map((item) => item.value) : [];
      setSelectedValues(newValues);
      onChange?.(newValues);
    };

    // Check if all selected
    const allSelected = items.length > 0 && selectedValues.length === items.length;
    const someSelected = selectedValues.length > 0 && selectedValues.length < items.length;
    const isIndeterminate = someSelected;

    return (
      <div ref={ref} className={wrapperClassName}>
        {/* Group label */}
        {label && (
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Select all option */}
        {selectAllOption && (
          <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Checkbox
              size={size}
              label={selectAllLabel}
              checked={allSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              disabled={disabled}
              status={status}
              error={error}
              success={success}
              warning={warning}
            />
          </div>
        )}

        {/* Checkbox items */}
        <div
          className={`space-y-2 ${layout === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}
        >
          {items.map((item) => (
            <Checkbox
              key={item.value}
              size={size}
              label={item.label}
              description={item.description}
              checked={selectedValues.includes(item.value)}
              onChange={(e) => handleChange(item.value, e.currentTarget.checked)}
              disabled={disabled || item.disabled}
              status={status}
              error={error}
              errorMessage={errorMessage}
              success={success}
              warning={warning}
              warningMessage={warningMessage}
            />
          ))}
        </div>

        {/* Status message */}
        {status && status !== 'default' && (
          <div
            className={`mt-2 text-xs font-medium ${
              status === 'success'
                ? 'text-success'
                : status === 'error'
                  ? 'text-error'
                  : 'text-warning'
            }`}
          >
            {status === 'success' && 'Valid selection'}
            {status === 'error' && errorMessage}
            {status === 'warning' && warningMessage}
          </div>
        )}

        {/* Helper text */}
        {helperText && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';

export default Checkbox;
