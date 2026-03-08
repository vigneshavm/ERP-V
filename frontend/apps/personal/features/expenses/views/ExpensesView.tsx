import React from 'react';
import { ExpenseBreakdown } from '@repo/mfe-budget-planner';
import CategoryList from '../../transactions/components/CategoryList';
import { useExpensesFeature } from '../hooks/useExpensesFeature';
import { useLanguage, useExpenses, Category } from '@repo/shared';
import { useNavigation } from '../../../contexts/NavigationContext';

const ExpensesView: React.FC = () => {
    const { t } = useLanguage();
    const { navigateToCategoryDetails } = useNavigation();
    const { refreshTrigger } = useExpenses();
    const { 
        data, 
        loading
    } = useExpensesFeature();

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('expenses.loading')}</div>;
    if (!data) return null;

    return (
        <div className="view-content-wrapper">
            <div className="responsive-grid">
                <ExpenseBreakdown data={data} />
                <div className="category-list-container">
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>{t('expenses.topCategories')}</h3>
                    <CategoryList refreshTrigger={refreshTrigger} onCategoryClick={(cat: Category) => {
                        navigateToCategoryDetails(
                            cat.id,
                            cat.name,
                            cat.value || 0,
                            cat.color
                        );
                    }} />
                </div>
            </div>
        </div>
    );
};

export default ExpensesView;
