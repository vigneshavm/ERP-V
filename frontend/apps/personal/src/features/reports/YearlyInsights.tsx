"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChevronRight, ChevronLeft, FileText, Download, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { formatCurrency, CalendarTransaction } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useReportsFeature } from './hooks/useReportsFeature';

interface YearlyInsightsProps {
    refreshTrigger?: number;
}

const YearlyInsights: React.FC<YearlyInsightsProps & { onBack?: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();
    const { yearlyInsights: data, loading } = useReportsFeature();

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('insights.loading')}</div>;
    if (!data) return null;

    const { yearlyData, distribution } = data;
    return (
        <div className="view-container">
            <div className="view-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onBack && (
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            style={{ padding: '8px', minWidth: 'auto', color: 'var(--text-secondary)' }}
                        >
                            <ChevronLeft size={24} />
                        </Button>
                    )}
                    <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('insights.deepInsights')} 2024-2025</span>
                        <ChevronRight size={16} />
                    </Button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" style={{ width: '40px', height: '40px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <FileText size={20} />
                    </Button>
                </div>
            </div>

            <div className="responsive-grid">
                <Card style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(var(--success-color-rgb), 0.2)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('insights.avgBalance')}</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-color)' }}>{formatCurrency(116591)}</p>
                </Card>
                <Card style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(var(--danger-color-rgb), 0.2)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('insights.avgExpense')}</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger-color)' }}>{formatCurrency(107526)}</p>
                </Card>
                <Card style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(var(--warning-color-rgb), 0.2)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('insights.avgIncome')}</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning-color)' }}>{formatCurrency(224117)}</p>
                </Card>
            </div>

            <Card style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(var(--success-color-rgb), 0.05)' }}>
                <TrendingUp size={20} color="var(--success-color)" />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {t('insights.savingsRateIs')} <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>12% {t('insights.higher')}</span> {t('insights.thanLastYear')}
                </p>
            </Card>

            <Card style={{ padding: '20px', height: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{t('insights.balanceTrends')}</h3>
                    <Info size={16} color="var(--text-secondary)" />
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={yearlyData}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                        />
                        <Tooltip
                            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="var(--primary-color)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{t('insights.incomeAllocation')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {distribution.map((item: any, idx: number) => (
                        <Card key={idx} style={{ padding: '12px 16px', flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '8px' }} noMargin>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                            </div>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.percentage}%</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatCurrency(item.amount)}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YearlyInsights;
