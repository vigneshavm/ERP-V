"use client";

import React, { useEffect, useState } from 'react';
import { Smartphone, ArrowRight, Camera, Settings2, ShoppingBag, Check } from 'lucide-react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { formatCurrency, DashboardData, Transaction, Category, useLanguage } from '@repo/shared';
import { Card } from '@repo/ui';

import PredictiveAlert from '@/features/predictions-and-alerts/PredictiveAlert';
import { calculateMonthlyForecast, analyzeCategoryTrends, ForecastResult, CategoryTrend } from '@/shared/lib/utils/predictionEngine';
import { useNavigation } from '../contexts/NavigationContext'; // Contexts remain in app for now or moved to app/providers
import { useDashboardConfig } from '@/shared/lib/hooks/useDashboardConfig';
import Link from 'next/link';
import { WidgetContainer } from '@/shared/ui/WidgetContainer';
import WidgetMarketplace from '../components/WidgetMarketplace';
import { WIDGET_REGISTRY } from '@/shared/api/WidgetRegistry';

import { useDashboardFeature } from '../hooks/useDashboardFeature';
import { useTransactionsFeature } from '@/features/transactions/hooks/useTransactionsFeature';
import { useExpensesFeature } from '@/features/expenses/hooks/useExpensesFeature';

const DashboardView: React.FC = () => {
    const { t } = useLanguage();
    const { 
        setCurrentView, 
        setIsSMSHelperOpen, 
        setIsBankStatementOpen, 
        setIsReceiptOCROpen 
    } = useNavigation();
    
    const { data: dashboardData, loading: dashboardLoading } = useDashboardFeature();
    const { transactions, loading: transactionsLoading } = useTransactionsFeature();
    const { data: expensesData, categories, loading: expensesLoading } = useExpensesFeature();

    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [trends, setTrends] = useState<CategoryTrend[]>([]);
    const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);

    const {
        activeWidgetIds,
        isEditMode,
        setIsEditMode,
        reorderWidgets,
        removeWidget,
        addWidget
    } = useDashboardConfig();

    useEffect(() => {
        if (dashboardData && transactions.length > 0 && categories.length > 0) {
            // Calculate predictions
            const currentMonthBudget = dashboardData.monthlySummaries[0]?.budget || 0;
            const forecastResult = calculateMonthlyForecast(transactions as any, currentMonthBudget);
            const trendResults = analyzeCategoryTrends(transactions as any, categories as any);

            setForecast(forecastResult);
            setTrends(trendResults);
        }
    }, [dashboardData, transactions, categories]);

    const loading = dashboardLoading || transactionsLoading || expensesLoading;
    const data = dashboardData;

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('dashboard.loadingWealth')}</div>;
    }

    if (!data) return null;

    const toggleMarketplaceWidget = (id: string) => {
        if (activeWidgetIds.includes(id)) {
            removeWidget(id);
        } else {
            addWidget(id);
        }
    };

    const renderWidget = (id: string) => {
        const widgetMeta = WIDGET_REGISTRY.find(w => w.id === id);
        if (!widgetMeta) return null;

        switch (id) {
            case 'total-wealth':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card
                            style={{
                                padding: '16px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                marginBottom: 0
                            }}
                        >
                            <p style={{ color: 'var(--label-text)', fontSize: 'var(--font-size-sm)', marginBottom: '8px', fontWeight: 600 }}>{t('dashboard.totalWealth')}</p>
                            <h2 style={{ fontSize: 'clamp(var(--font-size-3xl), 5vw, var(--font-size-4xl))', fontWeight: 800, color: 'var(--warning-color)', letterSpacing: '-1px' }}>
                                {formatCurrency(data.profile.totalWealth, data.profile.currency)}
                            </h2>
                        </Card>
                    </WidgetContainer>
                );

            case 'predictive-alert':
                return forecast && (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Link href="/goals" style={{ textDecoration: 'none' }}>
                            <PredictiveAlert
                                forecast={forecast}
                                trends={trends}
                                onAdjust={() => {}}
                            />
                        </Link>
                    </WidgetContainer>
                );

            case 'receipt-ocr':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card
                            interactive
                            onClick={() => setIsReceiptOCROpen(true)}
                            className="transaction-helper-banner"
                            style={{
                                padding: '18px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--surface-overlay)',
                                border: '1px solid var(--surface-border)',
                                pointerEvents: isEditMode ? 'none' : 'auto',
                                height: '100%',
                                minHeight: '88px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--surface-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Camera size={22} color="var(--primary-color)" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--text-primary)' }}>{t('receiptOCR.title')}</h4>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--label-text)' }}>{t('receiptOCR.subtitle')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                                <span style={{ marginRight: '4px' }}>{t('receiptOCR.scanShort')}</span> <ArrowRight size={18} />
                            </div>
                        </Card>
                    </WidgetContainer>
                );

            case 'sms-helper':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card
                            interactive
                            onClick={() => setIsSMSHelperOpen(true)}
                            className="transaction-helper-banner"
                            style={{
                                padding: '18px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--surface-overlay)',
                                border: '1px solid var(--surface-border)',
                                pointerEvents: isEditMode ? 'none' : 'auto',
                                height: '100%',
                                minHeight: '88px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(var(--success-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Smartphone size={22} color="var(--success-color)" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--text-primary)' }}>{t('dashboard.transactionHelper')}</h4>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--label-text)' }}>{data.smsTransfers.pendingCount} {t('dashboard.newSpendsDetected')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                                <span style={{ marginRight: '4px' }}>{t('dashboard.view')}</span> <ArrowRight size={18} />
                            </div>
                        </Card>
                    </WidgetContainer>
                );

            case 'bank-statement':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card
                            interactive
                            onClick={() => setIsBankStatementOpen(true)}
                            className="transaction-helper-banner"
                            style={{
                                padding: '18px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--surface-overlay)',
                                border: '1px solid var(--surface-border)',
                                pointerEvents: isEditMode ? 'none' : 'auto',
                                height: '100%',
                                minHeight: '88px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(var(--primary-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" /></svg>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--text-primary)' }}>{t('dashboard.bankStatement')}</h4>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--label-text)' }}>{t('dashboard.uploadPdf')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info-color)', fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                                <span style={{ marginRight: '4px' }}>{t('dashboard.upload')}</span> <ArrowRight size={18} />
                            </div>
                        </Card>
                    </WidgetContainer>
                );

            case 'monthly-summary':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name} className="widget-span-full">
                        <div className="dashboard-monthly-grid">
                            {data.monthlySummaries.map((item, idx) => (
                                <Card
                                    key={idx}
                                    className="monthly-summary-card"
                                    noMargin
                                    style={{
                                        border: item.isCurrentMonth ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                                        background: item.isCurrentMonth ? 'var(--surface-overlay)' : 'var(--card-bg)',
                                        position: 'relative',
                                        marginBottom: '0'
                                    }}
                                >
                                    {item.isCurrentMonth && (
                                        <div style={{
                                            position: 'absolute', top: '16px', right: '16px', background: 'var(--primary-color)',
                                            color: 'var(--bg-color)', padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--font-size-xs)', fontWeight: 800
                                        }}>
                                            {t('dashboard.current')}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>{item.month}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ background: 'var(--success-color)', color: 'var(--bg-color)', padding: '4px 10px', borderRadius: '10px', fontSize: 'var(--font-size-xs)', fontWeight: 800 }}>
                                                    {formatCurrency(item.budget, data.profile.currency)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ color: 'var(--label-text)', fontSize: 'var(--font-size-xs)', marginBottom: '4px', fontWeight: 600 }}>{t('dashboard.netFlow')}</p>
                                            <p style={{ fontWeight: 800, color: 'var(--success-color)', fontSize: 'var(--font-size-base)' }}>
                                                + {formatCurrency(item.income - item.expense, data.profile.currency)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay-subtle)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                                        <div style={{ width: `${item.progress}%`, height: '100%', background: 'var(--success-color)' }}></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ color: 'var(--label-text)', fontSize: 'var(--font-size-xs)', marginBottom: '4px', fontWeight: 600 }}>{t('dashboard.expense')}</p>
                                            <p style={{ fontWeight: 700, color: 'var(--danger-color)' }}>{formatCurrency(item.expense, data.profile.currency)}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ color: 'var(--label-text)', fontSize: 'var(--font-size-xs)', marginBottom: '4px', fontWeight: 600 }}>{t('dashboard.income')}</p>
                                            <p style={{ fontWeight: 700, color: 'var(--success-color)' }}>{formatCurrency(item.income, data.profile.currency)}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </WidgetContainer>
                );

            case 'savings-goals':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card style={{ padding: '16px', textAlign: 'left', marginBottom: 0 }}>
                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Savings Progress</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--label-text)' }}>Emergency Fund</span>
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>65%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '65%', height: '100%', background: 'var(--primary-color)' }}></div>
                            </div>
                        </Card>
                    </WidgetContainer>
                );

            case 'category-breakdown':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card style={{ padding: '16px', textAlign: 'left', marginBottom: 0 }}>
                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Spending by Category</h4>
                            {trends.slice(0, 3).map((trend, i: number) => (
                                <div key={i} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--font-size-xs)' }}>
                                        <span>{trend.categoryName}</span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(trend.spent, data.profile.currency)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--surface-overlay)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((trend.spent / (data.monthlySummaries[0].expense || 1)) * 100, 100)}%`,
                                            height: '100%',
                                            background: i === 0 ? 'var(--primary-color)' : i === 1 ? 'var(--warning-color)' : 'var(--danger-color)'
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </WidgetContainer>
                );

            case 'weekly-spending':
                const weeklyData = [
                    { day: 'Mon', amount: 120 },
                    { day: 'Tue', amount: 340 },
                    { day: 'Wed', amount: 110 },
                    { day: 'Thu', amount: 560 },
                    { day: 'Fri', amount: 230 },
                    { day: 'Sat', amount: 450 },
                    { day: 'Sun', amount: 320 },
                ];
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card style={{ padding: '16px', textAlign: 'left', marginBottom: 0 }}>
                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Weekly Spending</h4>
                            <div style={{ width: '100%', height: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData}>
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--surface-overlay)' }}
                                            contentStyle={{
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--card-border)',
                                                borderRadius: '8px',
                                                color: 'var(--text-primary)',
                                                fontSize: '13px'
                                            }}
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill="var(--primary-color)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </WidgetContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className="view-content-wrapper">
            {/* Customization Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                gap: '12px'
            }}>
                <button
                    onClick={() => setIsMarketplaceOpen(true)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flex: 'none'
                    }}
                >
                    <ShoppingBag size={20} />
                    <span>Widget Store</span>
                </button>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: isEditMode ? 'var(--primary-color)' : 'var(--surface-overlay)',
                        border: '1px solid var(--card-border)',
                        color: isEditMode ? 'var(--bg-color)' : 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flex: 'none'
                    }}
                >
                    {isEditMode ? <Check size={20} /> : <Settings2 size={20} />}
                    <span>{isEditMode ? 'Exit Customization' : 'Customize Dashboard'}</span>
                </button>
            </div>

            <Reorder.Group
                axis="y"
                values={activeWidgetIds}
                onReorder={reorderWidgets}
                className="dashboard-widgets-grid"
                style={{
                    padding: '0',
                    margin: '0'
                }}
            >
                <AnimatePresence>
                    {activeWidgetIds.map((id: string) => renderWidget(id))}
                </AnimatePresence>
            </Reorder.Group>

            <WidgetMarketplace
                isOpen={isMarketplaceOpen}
                onClose={() => setIsMarketplaceOpen(false)}
                activeWidgetIds={activeWidgetIds}
                onToggleWidget={toggleMarketplaceWidget}
            />
        </div>
    );
};

export default DashboardView;
