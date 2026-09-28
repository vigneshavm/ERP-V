/**
 * RADIO COMPONENT
 * 
 * Radio button input with:
 * - 3 sizes (sm, md, lg)
 * - 4 status states (default, success, error, warning)
 * - Label and description
 * - Disabled state
 * - Validation states
 * - Helper text
 * - Full dark mode support
 * - Accessibility features
 * 
 * Import: import { Radio, RadioGroup } from '@/components/shared'
 */

import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type RadioSize = 'sm' | 'md' | 'lg';

export type RadioStatus = 'default' | 'success' | 'error' | 'warning';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Visual size */
  size?: RadioSize;

  /** Status state (auto-resolved from error/success/warning props) */
  status?: RadioStatus;

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

  /** Helper text below radio */
  helperText?: string;

  /** Custom class for wrapper */
  wrapperClassName?: string;
}

// ============================================
// RADIO COMPONENT
// ============================================

const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
      disabled,
      wrapperClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    // Resolve status
    const resolvedStatus: RadioStatus = statusProp || (
      error ? 'error' : warning ? 'warning' : success ? 'success' : 'default'
    );

    // Size classes
    const sizeClasses: Record<RadioSize, { radio: string; label: string }> = {
      sm: { radio: 'w-4 h-4', label: 'text-xs' },
      md: { radio: 'w-5 h-5', label: 'text-sm' },
      lg: { radio: 'w-6 h-6', label: 'text-base' },
    };

    // Status classes
    const statusClasses: Record<RadioStatus, string> = {
      default: 'border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary focus:ring-primary/50',
      success: 'border-success dark:border-success checked:bg-success checked:border-success focus:ring-success/50',
      error: 'border-error dark:border-error checked:bg-error checked:border-error focus:ring-error/50',
      warning: 'border-warning dark:border-warning checked:bg-warning checked:border-warning focus:ring-warning/50',
    };

    // Base radio classes
    const baseRadioClasses = `appearance-none cursor-pointer border-2 rounded-full transition-all focus:outline-none focus:ring-2 dark:bg-slate-700 dark:checked:bg-current disabled:opacity-50 disabled:cursor-not-allowed`;

    const radioClasses = `${baseRadioClasses} ${sizeClasses[size].radio} ${statusClasses[resolvedStatus]} ${className}`;

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
            type="radio"
            disabled={disabled}
            className={radioClasses}
            {...props}
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

Radio.displayName = 'Radio';

// ============================================
// RADIO GROUP COMPONENT
// ============================================

export interface RadioGroupProps {
  /** Group label */
  label?: string;

  /** Group items */
  items: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;

  /** Selected value */
  value?: string;

  /** Change callback */
  onChange?: (value: string) => void;

  /** Visual size */
  size?: RadioSize;

  /** Status state */
  status?: RadioStatus;

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

  /** Vertical or horizontal layout */
  layout?: 'vertical' | 'horizontal';

  /** Custom class for wrapper */
  wrapperClassName?: string;

  /** Custom name for radio inputs */
  name?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      label,
      items = [],
      value,
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
      layout = 'vertical',
      wrapperClassName = '',
      name,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={wrapperClassName}>
        {/* Group label */}
        {label && (
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Radio items */}
        <div
          className={`${
            layout === 'horizontal'
              ? 'flex flex-wrap gap-6'
              : 'space-y-2'
          }`}
          role="radiogroup"
        >
          {items.map((item) => (
            <Radio
              key={item.value}
              name={name}
              value={item.value}
              checked={value === item.value}
              onChange={(e) => onChange?.(e.currentTarget.value)}
              size={size}
              label={item.label}
              description={item.description}
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

        {/* Status message (group-level) */}
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

RadioGroup.displayName = 'RadioGroup';

export default Radio;
