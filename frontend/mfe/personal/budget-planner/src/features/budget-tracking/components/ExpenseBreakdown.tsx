"use client";

import React from 'react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Cell } from 'recharts';
import { formatCurrency, ExpenseHistory, useLanguage } from '@repo/shared';
import { Card } from '@repo/ui';

interface ExpenseBreakdownProps {
    data: ExpenseHistory;
}

export const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({ data }) => {
    const { t } = useLanguage();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="expense-breakdown-container">
            {/* Summary Header */}
            <Card padding="large" style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--label-text)', fontSize: '14px', marginBottom: '8px' }}>{t('breakdown.totalSpent')} ({data.month.split(' ')[0]})</p>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#E74C3C' }}>{formatCurrency(data.totalSpent)}</h2>
            </Card>


            {/* Cash vs Account Bar Chart */}
            <Card padding="large">
                <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('breakdown.paymentMethod')}</h3>
                <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.paymentMethods} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--label-text)', fontSize: 12 }} width={70} />
                            <Tooltip
                                cursor={{ fill: 'var(--surface-overlay)' }}
                                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                {data.paymentMethods.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Spending Trend Area Chart */}
            <Card padding="large">
                <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('breakdown.dailyTrend')}</h3>
                <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.dailyTrend}>
                            <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--label-text)', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#E74C3C" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
