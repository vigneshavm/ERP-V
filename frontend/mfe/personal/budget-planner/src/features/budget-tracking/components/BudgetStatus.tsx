"use client";

import React from 'react';

interface BudgetStatusProps {
  isOverBudget: boolean;
  formattedRemaining: string;
}

export const BudgetStatus: React.FC<BudgetStatusProps> = ({ isOverBudget, formattedRemaining }) => {
  return (
    <div className={`p-4 rounded-lg border ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <p className={`text-sm font-medium ${isOverBudget ? 'text-red-800' : 'text-green-800'}`}>
        {isOverBudget ? 'Over Budget' : 'Within Budget'}
      </p>
      <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-900' : 'text-green-900'}`}>
        {formattedRemaining} {isOverBudget ? 'over' : 'remaining'}
      </p>
    </div>
  );
};
