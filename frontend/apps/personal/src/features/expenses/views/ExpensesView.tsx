import React from 'react';
import { ExpenseBreakdown } from '@repo/mfe-budget-planner';
import CategoryList from '../../transactions/components/CategoryList';
import { 
    useLanguage, 
    useTransactions, 
    PersonalTransactionType as TransactionType,
    mapTransactionsToHistory,
    Category
} from '@repo/shared';
import { useNavigation } from '@/shared/contexts/NavigationContext';

const ExpensesView: React.FC = () => {
    const { t } = useLanguage();
    const { navigateToCategoryDetails } = useNavigation();
    const { transactions, loading, refresh } = useTransactions(TransactionType.EXPENSE);

    const historyData = mapTransactionsToHistory(transactions, TransactionType.EXPENSE);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('expenses.loading')}</div>;

    return (
        <div className="view-content-wrapper">
            <div className="responsive-grid">
                <ExpenseBreakdown data={historyData} />
                <div className="category-list-container">
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>{t('expenses.topCategories')}</h3>
                    <CategoryList refreshTrigger={0} onCategoryClick={(cat: Category) => {
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
