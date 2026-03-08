import React from 'react';
import { FinanceMath } from '@yourcompany/finance-lib';

interface AmountInputProps {
  value: string | number;
  onChange: (value: string) => void;
  label?: string;
  currency?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({ value, onChange, label, currency = 'INR' }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {currency === 'INR' ? '₹' : '$'}
        </span>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="0.00"
        />
      </div>
      <p className="text-xs text-gray-400">
        Preview: {FinanceMath.formatCurrency(value || 0, 'en-IN', currency)}
      </p>
    </div>
  );
};
