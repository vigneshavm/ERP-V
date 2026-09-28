/**
 * SELECT COMPONENT
 * 
 * Dropdown select with:
 * - Single and multi-select modes
 * - Searchable/filterable options
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - 3 sizes (sm, md, lg)
 * - 4 status states (default, success, error, warning)
 * - Custom option rendering
 * - Disabled state
 * - Validation and helper text
 * - Full dark mode support
 * - Accessibility features
 * 
 * Import: import { Select } from '@/components/shared'
 */

import React, { forwardRef, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, X, AlertCircle, CheckCircle, Search } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type SelectSize = 'sm' | 'md' | 'lg';

export type SelectStatus = 'default' | 'success' | 'error' | 'warning';

export interface SelectOption {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Disable this option */
  disabled?: boolean;
  /** Optional description or category */
  description?: string;
  /** Option group (for grouping options) */
  group?: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Available options */
  options: SelectOption[];

  /** Selected value(s) */
  value?: string | string[];

  /** Callback when selection changes */
  onChange?: (value: string | string[]) => void;

  /** Allow multiple selections */
  multiple?: boolean;

  /** Show search input */
  searchable?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Visual size */
  size?: SelectSize;

  /** Status state (auto-resolved from error/success/warning props) */
  status?: SelectStatus;

  /** Show error state */
  error?: boolean;
  errorMessage?: string;

  /** Show success state */
  success?: boolean;

  /** Show warning state */
  warning?: boolean;
  warningMessage?: string;

  /** Helper text shown below select */
  helperText?: string;

  /** Label above select */
  label?: string;

  /** Show required indicator (*) */
  required?: boolean;

  /** Disable the select */
  disabled?: boolean;

  /** Clear button text in multiple mode */
  clearText?: string;

  /** No options message */
  noOptionsMessage?: string;

  /** Search placeholder text */
  searchPlaceholder?: string;

  /** Custom render for option */
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;

  /** Custom render for selected value */
  renderValue?: (options: SelectOption[]) => React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options = [],
      value,
      onChange,
      multiple = false,
      searchable = true,
      placeholder = 'Select...',
      size = 'md',
      status: statusProp,
      error,
      errorMessage,
      success,
      warning,
      warningMessage,
      helperText,
      label,
      required,
      disabled,
      clearText = 'Clear',
      noOptionsMessage = 'No options found',
      searchPlaceholder = 'Search...',
      renderOption,
      renderValue,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Resolve status
    const resolvedStatus: SelectStatus = statusProp || (
      error ? 'error' : warning ? 'warning' : success ? 'success' : 'default'
    );

    // Convert value to array for easier handling
    const selectedValues = useMemo(() => {
      if (!value) return [];
      return typeof value === 'string' ? [value] : value;
    }, [value]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      const query = searchQuery.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          (opt.description?.toLowerCase().includes(query) || false)
      );
    }, [options, searchQuery]);

    // Get selected options
    const selectedOptions = useMemo(() => {
      return options.filter((opt) => selectedValues.includes(opt.value));
    }, [options, selectedValues]);

    // Size classes
    const sizeClasses: Record<SelectSize, string> = {
      sm: 'px-2 py-1.5 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // Status classes
    const statusClasses: Record<SelectStatus, string> = {
      default: 'border-slate-300 dark:border-slate-600 focus-within:ring-primary/50 focus-within:border-primary',
      success: 'border-success dark:border-success focus-within:ring-success/50 focus-within:border-success',
      error: 'border-error dark:border-error focus-within:ring-error/50 focus-within:border-error',
      warning: 'border-warning dark:border-warning focus-within:ring-warning/50 focus-within:border-warning',
    };

    // Status icon
    const statusIcon = resolvedStatus === 'success' ? (
      <CheckCircle size={16} className="flex-shrink-0" />
    ) : resolvedStatus === 'error' ? (
      <AlertCircle size={16} className="flex-shrink-0" />
    ) : resolvedStatus === 'warning' ? (
      <AlertCircle size={16} className="flex-shrink-0" />
    ) : null;

    // Handle option click
    const handleSelectOption = useCallback(
      (option: SelectOption) => {
        if (option.disabled) return;

        if (multiple) {
          const newValues = selectedValues.includes(option.value)
            ? selectedValues.filter((v) => v !== option.value)
            : [...selectedValues, option.value];
          onChange?.(newValues);
        } else {
          onChange?.(option.value);
          setIsOpen(false);
        }
      },
      [selectedValues, multiple, onChange]
    );

    // Handle clear
    const handleClear = useCallback(() => {
      onChange?.(multiple ? [] : '');
      setSearchQuery('');
    }, [multiple, onChange]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!isOpen) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex(0);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
            break;

          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            break;

          case 'Enter':
            e.preventDefault();
            if (filteredOptions[highlightedIndex]) {
              handleSelectOption(filteredOptions[highlightedIndex]);
            }
            break;

          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            break;

          case 'Tab':
            setIsOpen(false);
            break;

          default:
            break;
        }
      },
      [isOpen, filteredOptions, highlightedIndex, handleSelectOption]
    );

    // Focus search when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const isError = resolvedStatus === 'error';

    return (
      <div ref={ref} className="w-full" {...props}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Select container */}
        <div ref={containerRef} className="relative">
          {/* Select button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`w-full rounded-lg border-2 transition-all appearance-none flex items-center justify-between ${sizeClasses[size]} ${statusClasses[resolvedStatus]} ${statusBgClasses[resolvedStatus]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer'} bg-white dark:bg-slate-800 focus:outline-none focus:ring-2`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {renderValue ? (
                <div className="truncate">{renderValue(selectedOptions)}</div>
              ) : selectedOptions.length > 0 ? (
                <div className="truncate">
                  {multiple
                    ? `${selectedOptions.length} selected`
                    : selectedOptions[0].label}
                </div>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {selectedValues.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  title={clearText}
                >
                  <X size={14} />
                </button>
              )}

              {statusIcon && !selectedValues.length && (
                <div className="text-slate-400 dark:text-slate-500">{statusIcon}</div>
              )}

              <ChevronDown
                size={16}
                className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-1000 max-h-60 overflow-hidden flex flex-col"
              role="listbox"
            >
              {/* Search input */}
              {searchable && (
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <div className="flex-1 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                    {noOptionsMessage}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      onClick={() => handleSelectOption(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      disabled={option.disabled}
                      className={`w-full text-left px-3 py-2 transition-colors ${
                        index === highlightedIndex
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : ''
                      } ${
                        selectedValues.includes(option.value)
                          ? 'bg-primary/5 font-semibold text-primary dark:bg-primary/10'
                          : ''
                      } ${
                        option.disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      {renderOption ? (
                        renderOption(option, selectedValues.includes(option.value))
                      ) : (
                        <div>
                          <div className="text-sm font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
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
            {resolvedStatus === 'success' && 'Valid selection'}
            {resolvedStatus === 'error' && errorMessage}
            {resolvedStatus === 'warning' && warningMessage}
          </div>
        )}

        {/* Helper text */}
        {helperText && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</div>
        )}
      </div>
    );
  }
);

const statusBgClasses: Record<SelectStatus, string> = {
  default: 'bg-white dark:bg-slate-800',
  success: 'bg-success/5 dark:bg-success/10',
  error: 'bg-error/5 dark:bg-error/10',
  warning: 'bg-warning/5 dark:bg-warning/10',
};

Select.displayName = 'Select';

export default Select;
