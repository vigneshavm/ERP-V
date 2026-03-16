"use client";

import React, { useEffect, useState } from 'react';
import { Smartphone, ArrowRight, Camera, Settings2, ShoppingBag, Check } from 'lucide-react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { 
    formatCurrency, 
    useLanguage,
    useTransactions,
    useGoals,
    useBudget,
    useUser,
    PersonalTransactionType as TransactionType
} from '@repo/shared';
import { Card } from '@repo/ui';

import PredictiveAlert from '@/features/predictions-and-alerts/PredictiveAlert';
import { calculateMonthlyForecast, analyzeCategoryTrends, ForecastResult, CategoryTrend } from '@/shared/lib/utils/predictionEngine';
import { useNavigation } from '@/shared/contexts/NavigationContext'; // Contexts moved to src/shared/contexts
import { useDashboardConfig } from '@/shared/lib/hooks/useDashboardConfig';
import Link from 'next/link';
import { WidgetContainer } from '@/shared/ui/WidgetContainer';
import WidgetMarketplace from '../components/WidgetMarketplace';
import { WIDGET_REGISTRY } from '@/shared/api/WidgetRegistry';

const DashboardView: React.FC = () => {
    const { t } = useLanguage();
    const { 
        setCurrentView, 
        setIsSMSHelperOpen, 
        setIsBankStatementOpen, 
        setIsReceiptOCROpen 
    } = useNavigation();
    
    // New Adapter Hooks
    const { user, loading: userLoading } = useUser();
    const { transactions, loading: transactionsLoading } = useTransactions();
    const { goals, loading: goalsLoading } = useGoals();
    const { budget, loading: budgetLoading } = useBudget();

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
        if (transactions.length > 0 && budget) {
            // Calculate predictions
            const currentMonthBudget = budget.totalBudget || 0;
            // Map types if necessary or ensure compatibility
            const forecastResult = calculateMonthlyForecast(transactions as any, currentMonthBudget);
            
            // Extract categories for trends (or use a dedicated hook if needed)
            const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).map(name => ({
                id: name,
                name: name
            }));
            
            const trendResults = analyzeCategoryTrends(transactions as any, uniqueCategories as any);

            setForecast(forecastResult);
            setTrends(trendResults);
        }
    }, [transactions, budget]);

    const loading = userLoading || transactionsLoading || goalsLoading || budgetLoading;
    const data = user; // Profile data

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
                                {formatCurrency(user?.totalWealth || 0, user?.currency || 'INR')}
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
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--label-text)' }}>{t('dashboard.newSpendsDetected')}</p>
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
                return budget && (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name} className="widget-span-full">
                        <div className="dashboard-monthly-grid">
                            <Card
                                className="monthly-summary-card"
                                noMargin
                                style={{
                                    border: '2px solid var(--primary-color)',
                                    background: 'var(--surface-overlay)',
                                    position: 'relative',
                                    marginBottom: '0'
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px', background: 'var(--primary-color)',
                                    color: 'var(--bg-color)', padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--font-size-xs)', fontWeight: 800
                                }}>
                                    {t('dashboard.current')}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>Current Month</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ background: 'var(--success-color)', color: 'var(--bg-color)', padding: '4px 10px', borderRadius: '10px', fontSize: 'var(--font-size-xs)', fontWeight: 800 }}>
                                                {formatCurrency(budget.totalBudget, user?.currency || 'INR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: 'var(--label-text)', fontSize: 'var(--font-size-xs)', marginBottom: '4px', fontWeight: 600 }}>Spent</p>
                                        <p style={{ fontWeight: 800, color: 'var(--danger-color)', fontSize: 'var(--font-size-base)' }}>
                                            {formatCurrency(budget.spentAmount, user?.currency || 'INR')}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay-subtle)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min((budget.spentAmount / budget.totalBudget) * 100, 100)}%`, height: '100%', background: 'var(--primary-color)' }}></div>
                                </div>
                            </Card>
                        </div>
                    </WidgetContainer>
                );

            case 'savings-goals':
                return (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card style={{ padding: '16px', textAlign: 'left', marginBottom: 0 }}>
                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Top Goals Progress</h4>
                            {goals.slice(0, 2).map(goal => (
                                <div key={goal.id} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--label-text)' }}>{goal.name}</span>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%`, height: '100%', background: goal.color }}></div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </WidgetContainer>
                );

            case 'category-breakdown':
                return budget && (
                    <WidgetContainer key={id} id={id} isEditMode={isEditMode} onRemove={() => removeWidget(id)} title={widgetMeta.name}>
                        <Card style={{ padding: '16px', textAlign: 'left', marginBottom: 0 }}>
                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Spending by Category</h4>
                            {budget.categoryBudgets.slice(0, 3).map((cb, i: number) => (
                                <div key={i} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--font-size-xs)' }}>
                                        <span>{cb.categoryName}</span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(cb.spent, user?.currency || 'INR')}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--surface-overlay)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((cb.spent / (budget.totalBudget || 1)) * 100, 100)}%`,
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
