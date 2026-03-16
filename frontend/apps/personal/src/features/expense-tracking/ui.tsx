"use client";

import React, { useMemo } from 'react';
import { useLanguage, formatCurrency } from '@repo/shared';
import { useNavigation } from '@/shared/contexts/NavigationContext';
import { useTransactionsFeature } from '@/features/transaction-management/model';
import { ArrowLeft, Tag } from 'lucide-react';

const CategoryDetailsView: React.FC = () => {
    const { t } = useLanguage();
    const { categoryDetailsState, setCurrentView } = useNavigation();
    const { transactions, loading } = useTransactionsFeature();

    const categoryTransactions = useMemo(() => {
        if (!categoryDetailsState) return [];
        return transactions
            .filter(tx => tx.categoryName === categoryDetailsState.categoryName)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, categoryDetailsState]);

    if (!categoryDetailsState) {
        // Fallback if accessed directly without state
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <p>No category selected</p>
                <button
                    onClick={() => setCurrentView('Expenses')}
                    style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '12px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Back to Expenses
                </button>
            </div>
        );
    }

    return (
        <div className="view-content-wrapper" style={{ paddingBottom: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <button
                    onClick={() => setCurrentView('Expenses')}
                    style={{
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--surface-border)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${categoryDetailsState.categoryColor}20`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: `1px solid ${categoryDetailsState.categoryColor}40`
                    }}>
                        <Tag size={20} color={categoryDetailsState.categoryColor} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                            {categoryDetailsState.categoryName}
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                            {t('categoryDetails.total') || 'Total'}: {formatCurrency(categoryDetailsState.categoryValue)}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                        {t('common.loading') || 'Loading...'}
                    </div>
                ) : categoryTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                        {t('categoryDetails.noTransactions') || 'No transactions found for this category.'}
                    </div>
                ) : (
                    categoryTransactions.map(tx => (
                        <div
                            key={tx.id}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--surface-border)',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.name}</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    {new Date(tx.date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger-color)' }}>
                                -{formatCurrency(tx.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoryDetailsView;
