"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency, CalendarTransaction } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { useNavigation, View } from '@/shared/contexts/NavigationContext';
import { useExpenseStore } from '@repo/shared';

import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useTransactionsFeature } from '@/features/transaction-management/model';

type Period = 'Day' | 'Week' | 'Month' | 'Year';

// --- Helpers ---------------------------------------------------------------

function getPeriodWindow(period: Period): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;
    switch (period) {
        case 'Day':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            break;
        case 'Week': {
            const dow = (now.getDay() + 6) % 7; // Mon=0
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow, 0, 0, 0);
            break;
        }
        case 'Month':
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            break;
        case 'Year':
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            break;
    }
    return { start, end };
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildBarData(txns: CalendarTransaction[], period: Period) {
    if (period === 'Day') {
        const hours = Array.from({ length: 8 }, (_, i) => i * 3);
        return hours.map(h => {
            const label = `${String(h).padStart(2, '0')}h`;
            const amount = txns
                .filter(t => {
                    const parts = t.time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!parts) return false;
                    let hr = parseInt(parts[1]);
                    if (parts[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
                    if (parts[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
                    return hr >= h && hr < h + 3;
                })
                .reduce((s, t) => s + t.amount, 0);
            return { name: label, amount };
        });
    }
    if (period === 'Week') {
        return DAY_LABELS.map((day, i) => {
            const now = new Date();
            const dow = (now.getDay() + 6) % 7;
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i);
            const dateStr = target.toISOString().slice(0, 10);
            const amount = txns.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0);
            return { name: day, amount };
        });
    }
    if (period === 'Month') {
        const now = new Date();
        const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Array.from({ length: Math.ceil(days / 5) }, (_, i) => {
            const weekStart = i * 5 + 1;
            const weekEnd = Math.min(weekStart + 4, days);
            const amount = txns.filter(t => {
                const d = parseInt(t.date?.slice(-2) || '0');
                return d >= weekStart && d <= weekEnd;
            }).reduce((s, t) => s + t.amount, 0);
            return { name: `${weekStart}-${weekEnd}`, amount };
        });
    }
    // Year
    return MONTH_LABELS.map((month, i) => {
        const amount = txns.filter(t => {
            const m = new Date(t.date || '').getMonth();
            return m === i;
        }).reduce((s, t) => s + t.amount, 0);
        return { name: month, amount };
    });
}

function buildCategoryData(txns: CalendarTransaction[]) {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    txns.filter(t => t.categoryName !== 'Income').forEach(t => {
        const catName = t.categoryName || 'Other';
        if (!map[catName]) map[catName] = { name: catName, value: 0, color: t.categoryColor || '#CCCCCC' };
        map[catName].value += t.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 6);
}

// --- Component -------------------------------------------------------------

const StatsAnalytics: React.FC = () => {
    const { t } = useLanguage();
    const { setCurrentView } = useNavigation();
    
    const [activePeriod, setActivePeriod] = useState<Period>('Month');
    const { transactions: allTxns, loading } = useTransactionsFeature();

    const PERIOD_LABELS: Record<Period, string> = {
        Day: t('stats.today'),
        Week: t('stats.thisWeek'),
        Month: t('stats.thisMonth'),
        Year: t('stats.thisYear'),
    };

    const periodTxns = useMemo(() => {
        const { start, end } = getPeriodWindow(activePeriod);
        return allTxns.filter(t => {
            const d = new Date((t.date || '') + 'T00:00:00');
            return d >= start && d <= end;
        });
    }, [allTxns, activePeriod]);

    const expenses = useMemo(() => periodTxns.filter(t => t.categoryName !== 'Income'), [periodTxns]);
    const income = useMemo(() => periodTxns.filter(t => t.categoryName === 'Income'), [periodTxns]);

    const totalExpense = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
    const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
    const net = totalIncome - totalExpense;

    const barData = useMemo(() => buildBarData(expenses, activePeriod), [expenses, activePeriod]);
    const categoryData = useMemo(() => buildCategoryData(expenses), [expenses]);

    const topCategory = categoryData[0];
    const avgPerTxn = expenses.length > 0 ? totalExpense / expenses.length : 0;

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('stats.loading')}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '120px' }}>

            {/* Period Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface-overlay)', borderRadius: '14px', padding: '4px', overflowX: 'auto', flexWrap: 'nowrap' }}>
                {(['Day', 'Week', 'Month', 'Year'] as Period[]).map(period => (
                    <Button
                        key={period}
                        variant={activePeriod === period ? 'primary' : 'ghost'}
                        onClick={() => setActivePeriod(period)}
                        style={{ flex: 1, minWidth: '80px', padding: '10px' }}
                    >
                        {t(`stats.${period === 'Day' ? 'today' : period === 'Week' ? 'thisWeek' : period === 'Month' ? 'thisMonth' : 'thisYear'}`)}
                    </Button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <Card style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', marginBottom: '6px' }}>
                        <TrendingDown size={13} />
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>{t('stats.spent')}</p>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger-color)' }}>{formatCurrency(totalExpense)}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{expenses.length} {t('stats.txns')}</p>
                </Card>
                <Card style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', marginBottom: '6px' }}>
                        <TrendingUp size={13} />
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>{t('stats.incomeLabel')}</p>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success-color)' }}>{formatCurrency(totalIncome)}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{income.length} {t('stats.txns')}</p>
                </Card>
                <Card style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: net >= 0 ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '6px' }}>
                        <Wallet size={13} />
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>{t('stats.net')}</p>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: net >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(net))}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('stats.avgPerTxnShort')} {formatCurrency(avgPerTxn)}{t('stats.perTxn')}</p>
                </Card>
            </div>

            {/* Status Alert */}
            <Card style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: net >= 0 ? 'rgba(var(--success-color-rgb), 0.05)' : 'rgba(var(--danger-color-rgb), 0.05)' }}>
                {net >= 0
                    ? <CheckCircle2 size={18} color="var(--success-color)" />
                    : <AlertCircle size={18} color="var(--danger-color)" />}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {PERIOD_LABELS[activePeriod]} — {net >= 0
                        ? <><span style={{ color: 'var(--success-color)', fontWeight: 700 }}>+{formatCurrency(net)} {t('stats.surplus')}</span>. {t('stats.onTrack')}</>
                        : <><span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>{formatCurrency(Math.abs(net))} {t('stats.deficit')}</span>. {t('stats.spendingExceeds')}</>}
                </p>
            </Card>

            {/* Spending Bar Chart */}
            <Card padding="medium">
                <h3 style={{ marginBottom: '4px', fontSize: '16px', fontWeight: 700 }}>
                    {t('stats.spendingTitle')} – {PERIOD_LABELS[activePeriod]}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {activePeriod === 'Day' ? t('stats.byHour') : activePeriod === 'Week' ? t('stats.byDay') : activePeriod === 'Month' ? t('stats.byWindow') : t('stats.byMonth')}
                </p>
                {barData.every(d => d.amount === 0)
                    ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '14px' }}>{t('stats.noExpenseData')}</p>
                    : (
                        <div style={{ height: '220px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'var(--surface-overlay)' }}
                                        contentStyle={{ 
                                            background: 'var(--card-bg)', 
                                            backdropFilter: 'var(--glass-blur)',
                                            WebkitBackdropFilter: 'var(--glass-blur)',
                                            border: '1px solid var(--card-border)', 
                                            borderRadius: '12px', 
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                                        formatter={(v: number) => [formatCurrency(v), t('stats.spentLabel')]}
                                    />
                                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={28}>
                                        {barData.map((entry, i) => (
                                            <Cell key={i} fill={entry.amount === Math.max(...barData.map(d => d.amount)) ? 'var(--primary-color)' : 'rgba(var(--success-color-rgb), 0.35)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )
                }
            </Card>

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
                <Card padding="medium">
                    <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>{t('stats.categoryBreakdown')}</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* Donut */}
                        <div style={{ height: '160px', minWidth: '160px', flex: '0 0 auto' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        strokeWidth={0}
                                    >
                                        {categoryData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ 
                                            background: 'var(--card-bg)', 
                                            backdropFilter: 'var(--glass-blur)',
                                            WebkitBackdropFilter: 'var(--glass-blur)',
                                            border: '1px solid var(--card-border)', 
                                            borderRadius: '12px', 
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                        formatter={(v: number) => [formatCurrency(v), '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend rows */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', minWidth: '140px' }}>
                            {categoryData.map((cat) => {
                                const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0;
                                return (
                                    <div key={cat.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                                                <p style={{ fontSize: '13px', fontWeight: 600 }}>{t(`addTransaction.categories.${cat.name}`)}</p>
                                            </div>
                                            <p style={{ fontSize: '13px', fontWeight: 700 }}>{pct}%</p>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            )}

            {/* Insights */}
            <Card padding="medium">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>{t('stats.quickInsights')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topCategory && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: topCategory.color }} />
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('stats.topCategory')}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t(`addTransaction.categories.${topCategory.name}`)}</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: topCategory.color }}>{formatCurrency(topCategory.value)}</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('stats.avgPerTransaction')}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{expenses.length} {t('stats.transactions')}</p>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700 }}>{formatCurrency(avgPerTxn)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('stats.savingsRate')}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('stats.savingsFormula')}</p>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: totalIncome > 0 && net > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {totalIncome > 0 ? `${Math.round((net / totalIncome) * 100)}%` : '—'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Quick Nav */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                    { label: t('stats.detailedReports'), view: 'Reports' },
                    { label: t('stats.yearlyOverview'), view: 'YearlyOverview' },
                    { label: t('stats.budget'), view: 'Budget' },
                ].map(({ label, view }) => (
                    <Button key={view} variant="secondary" onClick={() => setCurrentView(view as View)}>
                        {label} →
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default StatsAnalytics;
