"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, DashboardData, Category } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { useDashboardFeature } from '../../dashboard/hooks/useDashboardFeature';
import { useExpensesFeature } from '../hooks/useExpensesFeature';

const IncomeView: React.FC = () => {
    const { t } = useLanguage();
    const { data: dashboardData, loading: dashboardLoading } = useDashboardFeature();
    const { data: expensesData, loading: expensesLoading } = useExpensesFeature();

    const loading = dashboardLoading || expensesLoading;
    const data = dashboardData;
    
    // Process categories once data is available
    const categories = expensesData?.categories.filter(c => c.value > 0) || [];

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('income.loading')}</div>;
    if (!data) return null;

    const totalIncome = data.monthlySummaries[0]?.income || 0;

    return (
        <div className="view-content-wrapper">
            <div className="responsive-grid">
                <Card style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('income.monthlyDistribution')}</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="category-list-container">
                    <Card style={{ padding: '20px' }}>
                        <p style={{ color: 'var(--label-text)', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>{t('income.totalIncome')}</p>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success-color)' }}>
                            {formatCurrency(totalIncome, data.profile.currency)}
                        </h2>
                    </Card>
                    
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', opacity: 0.9 }}>{t('income.recentSources')}</h4>
                        {categories.map((cat, i) => (
                            <div key={i} style={{ padding: '12px', background: 'var(--surface-overlay)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }}></div>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(cat.value, data.profile.currency)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeView;
