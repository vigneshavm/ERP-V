"use client";

import React, { useState } from 'react';
import { Landmark, UserCircle, Plus, ChevronRight, ChevronLeft, X, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, Loan } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLoansFeature } from './hooks/useLoansFeature';

const iconMap: Record<string, any> = {
    Landmark: Landmark,
    UserCircle: UserCircle
};

const LoansView: React.FC<{ refreshTrigger?: number; onBack?: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();
    const { 
        loans, 
        loading, 
        addLoan, 
        updateLoan, 
        deleteLoan, 
        recordPayment 
    } = useLoansFeature();

    const [activeTab, setActiveTab] = useState<'Borrowed' | 'Lent'>('Borrowed');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const defaultForm: Partial<Loan> = {
        name: '', bank: '', total: 0, current: 0, interestRate: 0, tenureMonths: 0, type: 'Borrowed', deadline: '', color: '#3498DB', icon: 'Landmark'
    };
    const [formData, setFormData] = useState<Partial<Loan>>(defaultForm);

    const handleOpenAddModal = () => {
        setEditingLoan(null);
        setFormData(defaultForm);
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (loan: Loan) => {
        setEditingLoan(loan);
        setFormData(loan);
        setIsAddModalOpen(true);
    };

    const handleSaveLoan = async () => {
        if (!formData.name || !formData.bank || !formData.total) return;
        setIsSubmitting(true);
        try {
            if (editingLoan) {
                await updateLoan(editingLoan.id!, formData as Partial<Loan>);
            } else {
                await addLoan(formData as Omit<Loan, 'id'>);
            }
            setIsAddModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLoanFromState = async (id: number) => {
        if (!window.confirm(t('loans.deleteConfirm') || 'Are you sure you want to delete this loan?')) return;
        setIsSubmitting(true);
        try {
            await deleteLoan(id);
            setIsDetailsModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPaymentFromState = async () => {
        if (!selectedLoan || !paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) return;
        setIsSubmitting(true);
        try {
            await recordPayment(selectedLoan.id, Number(paymentAmount));
            setPaymentAmount('');
            setIsDetailsModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && loans.length === 0) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('loans.loading')}</div>;

    const filteredLoans = loans.filter((loan: Loan) => loan.type === activeTab);
    const totalBorrowed = loans.filter((l: Loan) => l.type === 'Borrowed').reduce((acc: number, curr: Loan) => acc + (curr.total - curr.current), 0);
    const totalLent = loans.filter((l: Loan) => l.type === 'Lent').reduce((acc: number, curr: Loan) => acc + (curr.total - curr.current), 0);
    const netPayable = totalBorrowed - totalLent;
    const isNetPositive = netPayable < 0; // If you lent more than borrowed, you are net positive
    const absNetPayable = Math.abs(netPayable);

    return (
        <div className="view-content-wrapper">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="view-container"
                style={{ paddingBottom: '90px' }}
            >
                {/* Header */}
                <div className="view-page-header" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {onBack && (
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                aria-label={t('common.back') || 'Go Back'}
                                style={{ padding: '8px', minWidth: 'auto', color: 'var(--text-secondary)' }}
                            >
                                <ChevronLeft size={24} />
                            </Button>
                        )}
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: '-0.5px' }}>{t('loans.title') || 'Loans & Debt'}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>{t('loans.subtitle') || 'Track your liabilities and receivables'}</p>
                        </div>
                    </div>
                    <Button variant="primary" icon={<Plus size={24} color="var(--bg-color)" />} onClick={handleOpenAddModal} aria-label={t('loans.addNewLoan') || 'Add New Loan'} style={{ width: '48px', height: '48px', borderRadius: '16px', padding: 0 }} />
                </div>

                {/* Net Summary Hero - Premium Redesign */}
                <Card
                    padding="large"
                    style={{
                        background: isNetPositive
                            ? 'linear-gradient(145deg, rgba(var(--success-color-rgb),0.1) 0%, rgba(var(--success-color-rgb),0.02) 100%)'
                            : 'linear-gradient(145deg, rgba(var(--danger-color-rgb),0.1) 0%, rgba(var(--danger-color-rgb),0.02) 100%)',
                        borderColor: isNetPositive ? 'rgba(var(--success-color-rgb),0.2)' : 'rgba(var(--danger-color-rgb),0.2)',
                        boxShadow: isNetPositive ? '0 10px 30px -10px rgba(var(--success-color-rgb),0.15)' : '0 10px 30px -10px rgba(var(--danger-color-rgb),0.15)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Decorative background circle */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-20px',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: isNetPositive ? 'rgba(var(--success-color-rgb),0.1)' : 'rgba(var(--danger-color-rgb),0.1)',
                        filter: 'blur(30px)',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', background: 'var(--surface-overlay-strong)', borderRadius: '8px' }}>
                                    <Activity size={16} color="var(--text-secondary)" />
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 600, letterSpacing: '0.5px' }}>{t('loans.netPayable') || 'NET BALANCE'}</p>
                            </div>
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                background: isNetPositive ? 'rgba(var(--success-color-rgb),0.15)' : 'rgba(var(--danger-color-rgb), 0.15)',
                                color: isNetPositive ? 'var(--success-color)' : 'var(--danger-color)',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {isNetPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {isNetPositive ? 'NET POSITIVE' : (t('loans.highPriority') || 'HIGH PRIORITY')}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, color: isNetPositive ? 'var(--success-color)' : 'var(--danger-color)', letterSpacing: '-1px' }}>
                                {formatCurrency(absNetPayable)}
                            </h2>
                        </div>

                        {/* Mini Breakdown */}
                        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('loans.borrowed') || 'Total Borrowed'}</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--danger-color)' }}>{formatCurrency(totalBorrowed)}</p>
                            </div>
                            <div style={{ width: '1px', background: 'var(--surface-border)' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('loans.lent') || 'Total Lent'}</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--success-color)' }}>{formatCurrency(totalLent)}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Animated Filter Tabs */}
                <div style={{ position: 'relative', display: 'flex', background: 'var(--surface-overlay-subtle)', padding: '4px', borderRadius: '16px', margin: '24px 0', border: '1px solid var(--surface-border)' }}>
                    {['Borrowed', 'Lent'].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as 'Borrowed' | 'Lent')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-size-sm)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 1,
                                    transition: 'color 0.3s ease'
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="loansTabIndicator"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'var(--surface-overlay-strong)',
                                            borderRadius: '12px',
                                            zIndex: -1
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {tab === 'Borrowed' ? (t('loans.borrowed') || 'Borrowed') : (t('loans.lent') || 'Lent')}
                            </button>
                        );
                    })}
                </div>

                {/* Loans Grid */}
                <div className="responsive-grid">
                    <AnimatePresence mode="popLayout">
                        {filteredLoans.map((loan: Loan, index: number) => {
                            const percentage = Math.round((loan.current / loan.total) * 100);
                            const IconComponent = iconMap[loan.icon] || Landmark;

                            return (
                                <Card
                                    key={loan.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    interactive
                                    onClick={() => { setSelectedLoan(loan); setIsDetailsModalOpen(true); }}
                                    style={{ padding: '20px', marginBottom: 0, background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '16px',
                                                background: `linear-gradient(135deg, ${loan.color}20, ${loan.color}05)`,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                border: `1px solid ${loan.color}30`,
                                                boxShadow: `inset 0 2px 10px ${loan.color}10`
                                            }}>
                                                <IconComponent size={26} color={loan.color} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>{loan.name}</h3>
                                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Landmark size={12} /> {loan.bank}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', background: 'var(--surface-overlay-subtle)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                            <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: loan.color, letterSpacing: '-0.5px' }}>{percentage}%</p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 600 }}>{t('loans.progress') || 'Progress'}</p>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '10px', fontWeight: 600 }}>
                                            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(loan.current)}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(loan.total)}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '10px', background: 'var(--surface-overlay)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--surface-overlay-subtle)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                style={{
                                                    height: '100%',
                                                    background: `linear-gradient(90deg, ${loan.color}dd, ${loan.color})`,
                                                    borderRadius: '6px',
                                                    boxShadow: `0 0 15px ${loan.color}80`
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                            {loan.interestRate !== undefined && loan.interestRate > 0 && (
                                                <div style={{ flex: 1, background: 'var(--surface-overlay)', padding: '10px', borderRadius: '10px' }}>
                                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('loans.interestRateTitle') || 'Interest'}</p>
                                                    <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{loan.interestRate}% <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>APR</span></p>
                                                </div>
                                            )}
                                            {loan.tenureMonths !== undefined && loan.tenureMonths > 0 && (
                                                <div style={{ flex: 1, background: 'var(--surface-overlay)', padding: '10px', borderRadius: '10px' }}>
                                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('loans.tenureTitle') || 'Tenure'}</p>
                                                    <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{loan.tenureMonths} <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>Months</span></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--surface-border)', paddingTop: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} color="var(--text-secondary)" />
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                                {t('loans.nextDue') || 'Next Due'}: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{loan.deadline}</span>
                                            </p>
                                        </div>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <ChevronRight size={16} color="var(--text-secondary)" />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </AnimatePresence>
                </div>


                {/* Add / Edit Loan Modal */}
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingLoan ? (t('loans.editLoan') || 'Edit Loan') : (t('loans.addNewLoan') || 'New Loan')}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Input label={t('loans.nameLabel') || 'Loan Name'} value={formData.name || ''} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder={t('loans.namePlaceholder') || "e.g. Car Loan"} />
                        <Input label={t('loans.bankLabel') || 'Bank / Person'} value={formData.bank || ''} onChange={(e: any) => setFormData({ ...formData, bank: e.target.value })} placeholder={t('loans.bankPlaceholder') || "e.g. Bank of America"} />
                        <Input label={t('loans.totalAmountLabel') || 'Total Amount'} type="number" value={formData.total || ''} onChange={(e: any) => setFormData({ ...formData, total: Number(e.target.value) })} placeholder="0.00" />

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <Input label={t('loans.interestRateLabel') || 'Interest (%)'} type="number" step="0.1" value={formData.interestRate || ''} onChange={(e: any) => setFormData({ ...formData, interestRate: Number(e.target.value) })} placeholder="0.0" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input label={t('loans.tenureLabel') || 'Tenure (Mo)'} type="number" step="1" value={formData.tenureMonths || ''} onChange={(e: any) => setFormData({ ...formData, tenureMonths: Number(e.target.value) })} placeholder="12" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, marginBottom: '16px' }}>
                                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('loans.typeLabel') || 'Type'}</label>
                                <select value={formData.type} onChange={(e: any) => setFormData({ ...formData, type: e.target.value as 'Borrowed' | 'Lent' })} style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', appearance: 'none', outline: 'none' }}>
                                    <option value="Borrowed">{t('loans.borrowed') || 'Borrowed'}</option>
                                    <option value="Lent">{t('loans.lent') || 'Lent'}</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input label={t('loans.deadlineLabel') || 'Deadline'} value={formData.deadline || ''} onChange={(e: any) => setFormData({ ...formData, deadline: e.target.value })} placeholder={t('loans.deadlinePlaceholder') || "e.g. 01 Jan 2028"} />
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            size="large"
                            isLoading={isSubmitting}
                            disabled={!formData.name || !formData.bank || !formData.total}
                            onClick={handleSaveLoan}
                            style={{ marginTop: '8px' }}
                        >
                            {isSubmitting ? 'Saving...' : (t('common.save') || 'Save')}
                        </Button>
                    </div>
                </Modal>

                {/* Loan Details Modal (Pay / Edit / Delete) */}
                <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={selectedLoan?.name || ''} showCloseIcon={false}>
                    {selectedLoan && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', marginTop: '-14px' }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Landmark size={14} /> {selectedLoan.bank}
                                    </p>
                                </div>
                                <Button variant="icon" onClick={() => setIsDetailsModalOpen(false)} aria-label={t('common.close') || 'Close'} icon={<X size={20} />} />
                            </div>

                            <div style={{ background: 'var(--surface-overlay-subtle)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--surface-border)' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>{t('loans.recordPayment') || 'Record Payment'}</p>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)', fontWeight: 600, zIndex: 1 }}>$</span>
                                        <Input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e: any) => setPaymentAmount(e.target.value)}
                                            placeholder="0.00"
                                            style={{ paddingLeft: '32px', marginBottom: 0 }}
                                        />
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleRecordPaymentFromState}
                                        isLoading={isSubmitting}
                                        disabled={!paymentAmount}
                                        style={{ padding: '14px 24px', height: '51px' }}
                                    >
                                        {t('common.pay') || 'Pay'}
                                    </Button>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'right' }}>Remaining: {formatCurrency(selectedLoan.total - selectedLoan.current)}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => { setIsDetailsModalOpen(false); handleOpenEditModal(selectedLoan); }}
                                >
                                    {t('common.edit') || 'Edit'}
                                </Button>
                                <Button
                                    variant="danger"
                                    fullWidth
                                    isLoading={isSubmitting}
                                    onClick={() => handleDeleteLoanFromState(selectedLoan.id)}
                                >
                                    {t('common.delete') || 'Delete'}
                                </Button>
                            </div>
                        </>
                    )}
                </Modal>
            </motion.div>
        </div>
    );
};

export default LoansView;

