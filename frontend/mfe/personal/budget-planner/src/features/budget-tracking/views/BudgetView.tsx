"use client";

import React from 'react';
import { formatCurrency, ExpenseHistory, useLanguage } from '@repo/shared';
import { Card, LoadingSpinner } from '@repo/ui';
import { useBudgetsFeature } from '../model/useBudgetsFeature';
import { ExpenseBreakdown } from '../components/ExpenseBreakdown';
import { Settings2, Plus, ArrowRight } from 'lucide-react';

export const BudgetView: React.FC = () => {
    const { t } = useLanguage();
    const { budget, loading, error, updateMode } = useBudgetsFeature();

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><LoadingSpinner /></div>;
    if (error) return <div style={{ color: 'var(--danger-color)', padding: '20px' }}>Error: {error.message}</div>;

    return (
        <div className="view-content-wrapper" style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('budgets.title')}</h1>
                    <p style={{ color: 'var(--label-text)' }}>{t('budgets.manageMoney')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-button" onClick={() => {}}>
                        <Settings2 size={18} />
                    </button>
                    <button className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {t('budgets.addCategory')}
                    </button>
                </div>
            </header>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <ExpenseBreakdown data={budget?.history || { totalSpent: 0, month: '', categories: [], paymentMethods: [], dailyTrend: [] }} />
                
                <div className="budget-settings-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card padding="large">
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>{t('budgets.mode')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button 
                                className={`mode-toggle ${budget?.mode === 'flexible' ? 'active' : ''}`}
                                onClick={() => updateMode('flexible')}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: budget?.mode === 'flexible' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                                    background: budget?.mode === 'flexible' ? 'var(--surface-overlay)' : 'transparent',
                                    color: budget?.mode === 'flexible' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: 700
                                }}
                            >
                                {t('budgets.flexible')}
                            </button>
                            <button 
                                className={`mode-toggle ${budget?.mode === 'zero-based' ? 'active' : ''}`}
                                onClick={() => updateMode('zero-based')}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: budget?.mode === 'zero-based' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                                    background: budget?.mode === 'zero-based' ? 'var(--surface-overlay)' : 'transparent',
                                    color: budget?.mode === 'zero-based' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: 700
                                }}
                            >
                                {t('budgets.zeroBased')}
                            </button>
                        </div>
                    </Card>

                    <Card padding="large" interactive>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('budgets.investmentPlanner')}</h4>
                                <p style={{ fontSize: '14px', color: 'var(--label-text)' }}>{t('budgets.optimizeSavings')}</p>
                            </div>
                            <ArrowRight size={20} color="var(--primary-color)" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
