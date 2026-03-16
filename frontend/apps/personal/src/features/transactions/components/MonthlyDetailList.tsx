"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, Zap, Car, ShoppingBag, Coffee, CreditCard, ArrowUpRight, ArrowDownRight, Search, DollarSign, Heart, Film, Receipt, ArrowDownUp, ShieldAlert, Check, Trash2, Tag, ChevronDown } from 'lucide-react';
import { formatCurrency, CalendarTransaction } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { UndoRedoControls } from '@/shared/ui/UndoRedoControls';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactionsFeature } from '@/features/transaction-management/model';
import { useExpensesFeature } from '@/features/expenses/hooks/useExpensesFeature';

const ICON_MAP: Record<string, any> = {
    Utensils, Zap, Car, ShoppingBag, Coffee, CreditCard, Heart, Film, Receipt
};

const MonthlyDetailList: React.FC = () => {
    const { t } = useLanguage();
    const { transactions, loading, updateTransactionsCategory, deleteTransactions, reverseTransaction, refresh } = useTransactionsFeature();
    const { categories } = useExpensesFeature();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortByAmount, setSortByAmount] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [disputingId, setDisputingId] = useState<string | null>(null);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    const totals = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return filteredTransactions.reduce((acc: { income: number, expense: number }, t: CalendarTransaction) => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                if (t.categoryName === 'Income') {
                    acc.income += t.amount;
                } else {
                    acc.expense += t.amount;
                }
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const groupedTransactions = useMemo(() => {
        if (sortByAmount) {
            const sorted = [...filteredTransactions].sort((a, b) => b.amount - a.amount);
            return [['__sorted__', sorted]] as [string, CalendarTransaction[]][];
        }
        const groups: { [key: string]: CalendarTransaction[] } = {};
        filteredTransactions.forEach(t => {
            if (!groups[t.date]) groups[t.date] = [];
            groups[t.date].push(t);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredTransactions, sortByAmount]);

    const formatDateHeader = (dateStr: string) => {
        if (dateStr === '__sorted__') return t('monthlyDetail.allTransactions');
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return t('monthlyDetail.today');
        if (date.toDateString() === yesterday.toDateString()) return t('monthlyDetail.yesterday');
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Delete ${selectedIds.length} transactions?`)) {
            await deleteTransactions(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
        }
    };

    const handleBulkUpdateCategory = async (catId: string) => {
        await updateTransactionsCategory(selectedIds, catId);
        setSelectedIds([]);
        setIsSelectionMode(false);
        setShowCategoryPicker(false);
    };

    const handleDispute = async (id: string) => {
        if (window.confirm(t('common.disputeConfirm') || 'Are you sure you want to dispute this transaction? It will be reversed immediately.')) {
            setDisputingId(id);
            await reverseTransaction(id);
            setDisputingId(null);
        }
    };

    const toggleAllInView = () => {
        const allInViewIds = filteredTransactions.map(t => t.id);
        const allSelected = allInViewIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allInViewIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...allInViewIds])]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px' }}>

            {/* Search + Sort Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <Input
                        icon={<Search size={18} />}
                        placeholder={t('monthlyDetail.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    variant={sortByAmount ? 'primary' : 'secondary'}
                    onClick={() => setSortByAmount(s => !s)}
                    title={sortByAmount ? 'Sort by date' : 'Sort by amount'}
                    style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '46px', // match Input's default height approximately
                    }}
                >
                    <ArrowDownUp size={15} />
                    {t('monthlyDetail.byAmount')}
                </Button>
                <Button
                    variant={isSelectionMode ? 'primary' : 'secondary'}
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (isSelectionMode) setSelectedIds([]);
                    }}
                    style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '46px',
                    }}
                >
                    <Check size={18} />
                    {isSelectionMode ? t('common.cancel') : t('common.edit')}
                </Button>
            </div>

            {isSelectionMode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {selectedIds.length} {t('common.selected')}
                    </p>
                    <button
                        onClick={toggleAllInView}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        {filteredTransactions.every(t => selectedIds.includes(t.id)) ? t('common.deselectAll') : t('common.selectAll')}
                    </button>
                </div>
            )}

            {/* Totals Summary Card */}
            <Card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', marginBottom: '4px' }}>
                        <ArrowUpRight size={14} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('monthlyDetail.income')}</span>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(totals.income)}</p>
                </div>
                <div style={{ borderLeft: '1px solid var(--surface-border)', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', marginBottom: '4px' }}>
                        <ArrowDownRight size={14} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('monthlyDetail.expense')}</span>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(totals.expense)}</p>
                </div>
            </Card>

            {/* Transaction List */}
            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('monthlyDetail.loading')}</div>
            ) : groupedTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('monthlyDetail.noTransactions')}</div>
            ) : groupedTransactions.map(([date, txns]) => (
                <div key={date}>
                    <h4 style={{ color: 'var(--text-primary)', opacity: 0.7, fontSize: '13px', fontWeight: 700, marginBottom: '16px', letterSpacing: '1px' }}>
                        {formatDateHeader(date).toUpperCase()}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {txns.map((tx) => {
                            const isIncome = tx.categoryName === 'Income';
                            const IconComp = ICON_MAP[tx.categoryIcon] || (isIncome ? CreditCard : DollarSign);
                            return (
                                <Card
                                    key={tx.id}
                                    noMargin
                                    onClick={() => isSelectionMode && toggleSelect(tx.id)}
                                    style={{
                                        padding: '14px',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: isSelectionMode ? 'pointer' : 'default',
                                        border: selectedIds.includes(tx.id) ? '1px solid var(--primary-color)' : '1px solid transparent',
                                        background: selectedIds.includes(tx.id) ? 'rgba(var(--success-color-rgb), 0.05)' : 'var(--card-bg)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {isSelectionMode && (
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                border: '2px solid var(--primary-color)',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: selectedIds.includes(tx.id) ? 'var(--primary-color)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}>
                                                {selectedIds.includes(tx.id) && <Check size={14} color="var(--text-on-primary)" strokeWidth={3} />}
                                            </div>
                                        )}
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '50%',
                                            background: `${tx.categoryColor}15`,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            border: `1px solid ${tx.categoryColor}25`
                                        }}>
                                            <IconComp size={18} color={tx.categoryColor} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.name}</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {tx.categoryName} • {sortByAmount ? tx.date : tx.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 700,
                                                color: isIncome ? 'var(--success-color)' : 'var(--danger-color)'
                                            }}>
                                                {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                                            </p>
                                        </div>
                                        {tx.isAnomaly && !isSelectionMode && (
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleDispute(tx.id);
                                                }}
                                                isLoading={disputingId === tx.id}
                                                style={{
                                                    padding: '4px',
                                                    color: 'var(--warning-color)',
                                                    background: 'rgba(var(--warning-color-rgb), 0.1)',
                                                    borderRadius: '8px'
                                                }}
                                                title="Dispute Anomaly"
                                                icon={<ShieldAlert size={18} />}
                                            />
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 'calc(100% - 40px)',
                            maxWidth: '600px',
                            backgroundColor: 'var(--surface-overlay-strong, var(--card-bg))',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            zIndex: 1001
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIds.length} Selected</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                                    style={{ padding: '8px 12px' }}
                                >
                                    <Tag size={16} style={{ marginRight: '6px' }} />
                                    <span className="hide-mobile">Recategorize</span>
                                    <ChevronDown size={14} style={{ marginLeft: '4px' }} />
                                </Button>

                                {showCategoryPicker && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '120%',
                                        right: 0,
                                        width: '200px',
                                        background: 'var(--surface-overlay)',
                                        border: '1px solid var(--surface-border)',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                        zIndex: 1002,
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleBulkUpdateCategory(cat.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    textAlign: 'left',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-primary)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    fontSize: '13px'
                                                }}
                                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-overlay)')}
                                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button variant="danger" size="small" onClick={handleBulkDelete} style={{ padding: '8px 12px' }}>
                                <Trash2 size={16} style={{ marginRight: '6px' }} />
                                <span className="hide-mobile">Delete</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UndoRedoControls onAction={refresh} />

            <style>{`
                @media (max-width: 600px) {
                    .hide-mobile { display: none; }
                }
            `}</style>
        </div>
    );
};

export default MonthlyDetailList;
