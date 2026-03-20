"use client";

import { useState, useMemo } from 'react';

export const useBudgetCalculations = (initialBudget = '0', initialSpent = '0') => {
  const [budget, setBudget] = useState(initialBudget);
  const [spent, setSpent] = useState(initialSpent);

  const budgetNum = parseFloat(budget) || 0;
  const spentNum = parseFloat(spent) || 0;

  const isOverBudget = spentNum > budgetNum;
  const remaining = budgetNum - spentNum;

  const formattedRemaining = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(remaining);

  return {
    budget,
    setBudget,
    spent,
    setSpent,
    isOverBudget,
    remaining,
    formattedRemaining,
  };
};
