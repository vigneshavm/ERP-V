"use client";

import React, { useEffect, useState } from 'react';
import { Landmark, Wallet, CreditCard, Plus, ArrowRightLeft, MoreVertical, X } from 'lucide-react';
import { formatCurrency } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useTransactionsFeature } from '../hooks/useTransactionsFeature';

interface BankAccountsProps {
    refreshTrigger?: number;
}

const ACCOUNT_TYPES = ['Savings', 'Current', 'Cash', 'Credit', 'Investment'];
const ACCOUNT_COLORS = [
    { label: 'Blue', value: '#3498DB' },
    { label: 'Green', value: '#2ECC71' },
    { label: 'Red', value: '#E74C3C' },
    { label: 'Purple', value: '#9B59B6' },
    { label: 'Orange', value: '#E67E22' },
    { label: 'Teal', value: '#1ABC9C' },
];

const getIcon = (type: string, color: string, size = 24) => {
    if (type === 'Cash') return <Wallet size={size} color={color} />;
    if (type === 'Credit') return <CreditCard size={size} color={color} />;
    return <Landmark size={size} color={color} />;
};

const BankAccounts: React.FC<BankAccountsProps> = () => {
    const { t } = useLanguage();
    const { accounts, loading, addAccount } = useTransactionsFeature();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        type: 'Savings',
        balance: '',
        color: '#3498DB',
    });

    const handleAdd = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await addAccount({
                name: form.name.trim(),
                type: form.type,
                balance: parseFloat(form.balance) || 0,
                color: form.color,
            });
            setShowModal(false);
            setForm({ name: '', type: 'Savings', balance: '', color: '#3498DB' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('bankAccounts.loading')}</div>;

    if (accounts.length === 0 && !showModal) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Landmark size={48} color="var(--text-secondary)" strokeWidth={1} style={{ opacity: 0.5 }} />
            <p>{t('bankAccounts.noAccounts')}</p>
            <Button onClick={() => setShowModal(true)}>
                {t('bankAccounts.addAccount')}
            </Button>
        </div>
    );

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '120px' }}>

            {/* Total Balance Hero */}
            <Card padding="large" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{t('bankAccounts.totalNetWorth')}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-color)' }}>{formatCurrency(totalBalance)}</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="ghost" className="clickable" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowRightLeft size={16} />
                                {t('bankAccounts.transfer')}
                            </Button>
                            <Button onClick={() => setShowModal(true)} className="clickable" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={16} />
                                {t('bankAccounts.add')}
                            </Button>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary-color)', opacity: 0.05, filter: 'blur(50px)', borderRadius: '50%' }}></div>
            </Card>

            {/* Accounts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {accounts.map((acc) => {
                    const isSelected = selectedId === acc.id || (selectedId === null && acc.selected);
                    return (
                        <Card key={acc.id} interactive
                            onClick={() => setSelectedId(acc.id)}
                            style={{
                                borderColor: isSelected ? 'var(--primary-color)' : 'var(--surface-border)',
                                background: isSelected ? 'rgba(var(--success-color-rgb), 0.03)' : 'var(--surface-overlay-subtle, rgba(0,0,0,0.02))',
                                transition: 'var(--transition)'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${acc.color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${acc.color}30` }}>
                                        {getIcon(acc.type, acc.color)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{acc.name}</h3>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{acc.type} {t('bankAccounts.account')}</p>
                                    </div>
                                </div>
                                <MoreVertical size={18} color="var(--text-secondary)" className="clickable" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700 }}>{t('bankAccounts.income')}</p>
                                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)' }}>{formatCurrency(acc.income)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700 }}>{t('bankAccounts.expense')}</p>
                                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger-color)' }}>{formatCurrency(acc.expense)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700 }}>{t('bankAccounts.netBal')}</p>
                                    <p style={{ fontSize: '18px', fontWeight: 700, color: acc.balance < 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{formatCurrency(acc.balance)}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Add Account Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <Card style={{ width: '100%', maxWidth: '420px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{t('bankAccounts.addAccountTitle')}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t('bankAccounts.addAccountSub')}</p>
                            </div>
                            <Button variant="ghost" className="clickable" onClick={() => setShowModal(false)} style={{ padding: '8px' }}>
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Account Name */}
                        <div>
                            <Input
                                label={t('bankAccounts.accountName')}
                                placeholder={t('bankAccounts.accountNamePlaceholder')}
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>

                        {/* Account Type */}
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>{t('bankAccounts.accountType')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {ACCOUNT_TYPES.map(type => (
                                    <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                                        style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${form.type === type ? 'var(--primary-color)' : 'var(--surface-border)'}`, background: form.type === type ? 'rgba(var(--primary-color-rgb), 0.12)' : 'transparent', color: form.type === type ? 'var(--primary-color)' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Opening Balance */}
                        <div>
                            <Input
                                label={t('bankAccounts.openingBalance')}
                                type="number"
                                placeholder="0"
                                value={form.balance.toString()}
                                onChange={(e) => setForm(f => ({ ...f, balance: e.target.value }))}
                            />
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>{t('bankAccounts.color')}</label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                {ACCOUNT_COLORS.map(c => (
                                    <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.value, border: `3px solid ${form.color === c.value ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s ease', outline: 'none' }} />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div style={{ background: 'rgba(var(--card-bg),0.03)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--surface-border)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${form.color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${form.color}40` }}>
                                {getIcon(form.type, form.color, 20)}
                            </div>
                            <div>
                                <p style={{ fontSize: '16px', fontWeight: 600 }}>{form.name || t('bankAccounts.accountNameFallback')}</p>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{form.type} • {form.balance ? formatCurrency(parseFloat(form.balance)) : formatCurrency(0)}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                                {t('bankAccounts.cancel')}
                            </Button>
                            <Button onClick={handleAdd} disabled={!form.name.trim() || saving} style={{ flex: 2 }}>
                                {saving ? t('bankAccounts.adding') : t('bankAccounts.addAccount')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default BankAccounts;
