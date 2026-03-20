"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Car, Zap, Utensils, Heart, ShoppingBag,
    Home, Plane, Target, Smartphone, DollarSign, CreditCard
} from 'lucide-react';
import { formatCurrency, CalendarTransaction } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTransactionsFeature } from '../transactions/hooks/useTransactionsFeature';

// Map icon name strings (stored in data.json) → React icon elements
const ICON_MAP: Record<string, React.ReactNode> = {
    Car: <Car size={16} />,
    Zap: <Zap size={16} />,
    Utensils: <Utensils size={16} />,
    Heart: <Heart size={16} />,
    ShoppingBag: <ShoppingBag size={16} />,
    Home: <Home size={16} />,
    Plane: <Plane size={16} />,
    Target: <Target size={16} />,
    Smartphone: <Smartphone size={16} />,
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

interface Props {
    refreshTrigger?: number;
}

const FinancialCalendar: React.FC<Props> = () => {
    const { t } = useLanguage();
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDate, setSelectedDate] = useState<string | null>(
        // Default select today if it has a date string
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    );
    
    const { transactions, loading } = useTransactionsFeature();

    // ── Calendar math ──────────────────────────────────────────────────
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // JS getDay(): 0=Sun … 6=Sat. We want Mon-first: Mon=0 … Sun=6
    const firstDayJS = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
    const paddingCells = (firstDayJS + 6) % 7; // Mon-first offset

    // ── Transaction aggregation ────────────────────────────────────────
    // Map: "YYYY-MM-DD" → transactions on that day
    const txnByDate = useMemo(() => {
        const map = new Map<string, { items: CalendarTransaction[], income: number, expense: number }>();
        for (const txn of transactions) {
            if (!map.has(txn.date)) {
                map.set(txn.date, { items: [], income: 0, expense: 0 });
            }
            const data = map.get(txn.date)!;
            data.items.push(txn);
            if (txn.categoryName === 'Income') {
                data.income += txn.amount;
            } else {
                data.expense += txn.amount;
            }
        }
        return map;
    }, [transactions]);

    // Transactions for the currently viewed month
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthTxns = useMemo(() =>
        transactions.filter(t => t.date && t.date.startsWith(monthPrefix)),
        [transactions, monthPrefix]
    );

    const monthExpenses = useMemo(() =>
        monthTxns.filter(t => t.categoryName !== 'Income').reduce((s, t) => s + t.amount, 0),
        [monthTxns]
    );
    const monthIncome = useMemo(() =>
        monthTxns.filter(t => t.categoryName === 'Income').reduce((s, t) => s + t.amount, 0),
        [monthTxns]
    );

    // Transactions shown in the list panel
    const listedTxns = useMemo(() => {
        if (selectedDate) {
            return txnByDate.get(selectedDate)?.items || [];
        }
        return monthTxns;
    }, [selectedDate, txnByDate, monthTxns]);

    // ── Navigation ───────────────────────────────────────────────────
    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
        setSelectedDate(null);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
        setSelectedDate(null);
    };

    // ── Helpers ──────────────────────────────────────────────────────
    const isoDate = (day: number) =>
        `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isToday = (day: number) =>
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === day;

    const formatSelectedLabel = () => {
        if (!selectedDate) return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
        const d = new Date(selectedDate + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' }}>

            {/* ── Calendar Card ── */}
            <Card padding="large">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                            variant="icon"
                            onClick={prevMonth}
                            aria-label={t('calendar.prevMonth') || 'Previous Month'}
                            style={{ background: 'var(--surface-overlay-subtle)' }}
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <Button
                            variant="icon"
                            onClick={nextMonth}
                            aria-label={t('calendar.nextMonth') || 'Next Month'}
                            style={{ background: 'var(--surface-overlay-subtle)' }}
                        >
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>

                {/* Month summary */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    padding: '12px 14px', background: 'var(--surface-overlay-subtle)',
                    borderRadius: '10px', marginBottom: '16px', fontSize: 'var(--font-size-xs)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t('calendar.expenses')}</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger-color)' }}>-{formatCurrency(monthExpenses)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t('calendar.income')}</span>
                        <span style={{ fontWeight: 700, color: 'var(--success-color)' }}>+{formatCurrency(monthIncome)}</span>
                    </div>
                </div>

                {/* Day label row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
                    {DAY_LABELS.map(d => (
                        <div key={d} style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 600, paddingBottom: '4px' }}>{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                    {Array.from({ length: paddingCells }, (_, i) => <div key={`p-${i}`} />)}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const iso = isoDate(day);
                        const dayData = txnByDate.get(iso);
                        const hasTxns = !!dayData;
                        const isSelected = selectedDate === iso;
                        const todayFlag = isToday(day);

                        // Top spending category color for dot
                        const dotColor = hasTxns && dayData.items.length > 0 ? dayData.items[0].categoryColor : 'transparent';

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDate(isSelected ? null : iso)}
                                style={{
                                    aspectRatio: '1',
                                    background: todayFlag
                                        ? 'var(--primary-color)'
                                        : isSelected
                                            ? 'rgba(46,204,113,0.2)'
                                            : hasTxns
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'var(--surface-overlay-subtle)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: 600,
                                    color: todayFlag ? 'var(--bg-color)' : 'var(--text-primary)',
                                    position: 'relative',
                                    cursor: hasTxns ? 'pointer' : 'default',
                                    border: isSelected
                                        ? '1.5px solid var(--primary-color)'
                                        : hasTxns && !todayFlag
                                            ? '1px solid rgba(46,204,113,0.3)'
                                            : '1px solid transparent',
                                    transition: 'all 0.15s ease',
                                    gap: '2px',
                                    paddingBottom: hasTxns ? '4px' : '0',
                                }}
                            >
                                <span style={{ zIndex: 1 }}>{day}</span>
                                {hasTxns && (
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '1px',
                                        width: '100%',
                                        overflow: 'hidden',
                                        padding: '0 2px'
                                    }}>
                                        {dayData.income > 0 && (
                                            <div style={{ 
                                                fontSize: '7px', 
                                                color: todayFlag ? 'var(--bg-color)' : 'var(--success-color)',
                                                fontWeight: 800,
                                                lineHeight: 1
                                            }}>
                                                +{dayData.income >= 1000 ? (dayData.income / 1000).toFixed(1) + 'k' : Math.round(dayData.income)}
                                            </div>
                                        )}
                                        {dayData.expense > 0 && (
                                            <div style={{ 
                                                fontSize: '7px', 
                                                color: todayFlag ? 'var(--bg-color)' : 'var(--danger-color)',
                                                fontWeight: 800,
                                                lineHeight: 1
                                            }}>
                                                -{dayData.expense >= 1000 ? (dayData.expense / 1000).toFixed(1) + 'k' : Math.round(dayData.expense)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {hasTxns && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        width: '3px', height: '3px',
                                        borderRadius: '50%',
                                        background: todayFlag ? 'var(--bg-color)' : dotColor,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ── Transaction List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {formatSelectedLabel()}
                    </p>
                    {selectedDate && (
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedDate(null)}
                            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-color)', padding: 0, height: 'auto' }}
                        >
                            {t('calendar.showAll')}
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {t('calendar.loadingTransactions')}
                    </div>
                ) : listedTxns.length === 0 ? (
                    <Card style={{ padding: '30px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{t('calendar.noTransactions')}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: '6px' }}>
                            {selectedDate ? t('calendar.nothingRecordedDay') : t('calendar.noTransactionsMonth')}
                        </p>
                    </Card>
                ) : (
                    listedTxns.map(txn => {
                        const isIncome = txn.categoryName === 'Income';
                        const icon = ICON_MAP[txn.categoryIcon] ?? (isIncome ? <CreditCard size={16} /> : <DollarSign size={16} />);
                        return (
                            <Card
                                key={txn.id}
                                style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}
                                noMargin
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px',
                                        background: `${txn.categoryColor}22`,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        color: txn.categoryColor, flexShrink: 0,
                                    }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{txn.description || t('common.transaction')}</p>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            <span>{txn.categoryName}</span>
                                            <span>·</span>
                                            <span>{txn.time}</span>
                                            {!selectedDate && <><span>·</span><span>{txn.date}</span></>}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: isIncome ? '#2ECC71' : '#FF453A', whiteSpace: 'nowrap' }}>
                                    {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                                </span>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FinancialCalendar;
