"use client";

import React from 'react';
import { AmountInput } from '@repo/ui';
import { useBudgetCalculations, BudgetStatus } from '../features/budget-tracking';

export const BudgetPlannerPage: React.FC = () => {
  const {
    budget,
    setBudget,
    spent,
    setSpent,
    isOverBudget,
    formattedRemaining
  } = useBudgetCalculations('0', '0');

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Budget Planner</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AmountInput 
          label="Monthly Budget" 
          value={budget} 
          onChange={(e) => setBudget(e.target.value)} 
        />
        <AmountInput 
          label="Total Spent" 
          value={spent} 
          onChange={(e) => setSpent(e.target.value)} 
        />
      </div>

      <BudgetStatus 
        isOverBudget={isOverBudget} 
        formattedRemaining={formattedRemaining} 
      />
    </div>
  );
};
