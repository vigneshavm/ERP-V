"use client";

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BudgetPlannerPage } from './pages/BudgetPlannerPage';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<BudgetPlannerPage />);
}
