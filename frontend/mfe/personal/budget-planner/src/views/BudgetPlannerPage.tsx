"use client";

import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

// Feature Views
import DashboardView from '@/features/dashboard/views/DashboardView';
import ExpensesView from '@/features/expenses/views/ExpensesView';
import { BudgetView } from '@/features/budget-tracking/views/BudgetView';
import GoalsView from '@/features/goals/GoalsView';
import SettingsView from '@/features/settings/views/SettingsView';
import IncomeView from '@/features/expenses/views/IncomeView';
import NotificationsView from '@/features/predictions-and-alerts/NotificationsView';
import AnalyticsView from '@/features/reports/AnalyticsView';
import LoansView from '@/features/cards-and-loans/LoansView';
import CategoryDetailsView from '@/features/expenses/views/CategoryDetailsView';
import CreditCardView from '@/features/cards-and-loans/CreditCardView';
import DebitCardView from '@/features/cards-and-loans/DebitCardView';

export const BudgetPlannerPage: React.FC = () => {
  const { currentView, setCurrentView, setPinMode, appPin, setIsRemindersOpen } = useNavigation();

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Expenses':
        return <ExpensesView />;
      case 'Budget':
        return <BudgetView />;
      case 'Goals':
        return <GoalsView />;
      case 'Settings':
      case 'Appearance':
      case 'DataManagement':
        return <SettingsView setPinMode={setPinMode} appPin={appPin} />;
      case 'Income':
        return <IncomeView />;
      case 'Notifications':
        return <NotificationsView setIsRemindersOpen={setIsRemindersOpen} />;
      case 'Statistics':
      case 'Reports':
      case 'Insights':
        return <AnalyticsView />;
      case 'Loans':
        return <LoansView onBack={() => setCurrentView('Dashboard')} />;
      case 'CategoryDetails':
        return <CategoryDetailsView />;
      case 'Recurring':
        // Fallback or add RecurringView if available
        return <ExpensesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="budget-planner-root">
      {renderView()}
    </div>
  );
};
