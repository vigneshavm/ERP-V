"use client";

import React, { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, ChevronRight, CalendarDays, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCardsFeature } from './hooks/useCardsFeature';

const NetworkBadge: React.FC<{ network: string }> = ({ network }) => {
    const colors: Record<string, string> = {
        Visa: '#1a1f71',
        Mastercard: '#eb001b',
        Rupay: '#1b5e20',
    };
    return (
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(var(--bg-color-rgb), 0.2)', color: 'inherit' }}>
            {network.toUpperCase()}
        </span>
    );
};

const CreditCardView: React.FC = () => {
    const { t } = useLanguage();
    const { creditCards: cards, loading } = useCardsFeature();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (cards.length > 0 && !selectedId) {
            setSelectedId(cards[0].id);
        }
    }, [cards]);

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>{t('creditCards.loading')}</div>;
    if (cards.length === 0) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>{t('creditCards.noCards')}</div>;

    const selected = cards.find(c => c.id === selectedId) || cards[0];
    const utilisation = Math.round((selected.spent / selected.limit) * 100);
    const available = selected.limit - selected.spent;
    const daysUntilDue = Math.ceil((new Date(selected.dueDate).getTime() - Date.now()) / 86400000);
    const isDueUrgent = daysUntilDue <= 5;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

            {/* Card Carousel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cards.map((card) => (
                    <Card
                        key={card.id}
                        interactive
                        noMargin
                        onClick={() => setSelectedId(card.id)}
                        style={{
                            padding: '24px',
                            background: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})`,
                            outline: selectedId === card.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                            outlineOffset: '3px',
                            transform: selectedId === card.id ? 'scale(1.01)' : 'scale(1)',
                            boxShadow: selectedId === card.id ? `0 12px 40px ${card.color}40` : 'var(--card-shadow)',
                            userSelect: 'none',
                            color: 'white' // Keep cards white as they are specialized color blocks
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                            <div>
                                <p style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600, letterSpacing: '1px', color: 'inherit' }}>{card.bank.toUpperCase()}</p>
                                <p style={{ fontSize: '16px', fontWeight: 700, color: 'inherit', marginTop: '2px' }}>{card.cardName}</p>
                            </div>
                            <NetworkBadge network={card.network} />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '4px', color: '#fff', marginBottom: '20px', fontFamily: 'monospace' }}>
                            •••• •••• •••• {card.last4}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <p style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600, letterSpacing: '1px', color: 'inherit' }}>{t('creditCards.creditLimit')}</p>
                                <p style={{ fontSize: '20px', fontWeight: 700, color: 'inherit' }}>{formatCurrency(card.limit)}</p>
                            </div>
                            <CreditCard size={32} color="rgba(255,255,255,0.3)" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Stats for Selected Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Card style={{ padding: '18px', marginBottom: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--label-text)', letterSpacing: '1px' }}>{t('creditCards.amountSpent')}</p>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--danger-color)', marginTop: '6px' }}>{formatCurrency(selected.spent)}</p>
                </Card>
                <Card style={{ padding: '18px', marginBottom: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--label-text)', letterSpacing: '1px' }}>{t('creditCards.available')}</p>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success-color)', marginTop: '6px' }}>{formatCurrency(available)}</p>
                </Card>
            </div>

            {/* Utilisation Bar */}
            <Card padding="medium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{t('creditCards.creditUtilisation')}</p>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: utilisation > 70 ? 'var(--danger-color)' : utilisation > 40 ? 'var(--warning-color)' : 'var(--success-color)' }}>{utilisation}%</p>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-overlay-strong)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min(utilisation, 100)}%`,
                        background: utilisation > 70 ? 'var(--danger-color)' : utilisation > 40 ? 'var(--warning-color)' : 'var(--success-color)',
                        borderRadius: '100px',
                        transition: 'width 0.5s ease'
                    }} />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    {utilisation <= 30 ? t('creditCards.utilisationGreat') : utilisation <= 70 ? t('creditCards.utilisationWarning') : t('creditCards.utilisationDanger')}
                </p>
            </Card>

            {/* Due Date Card */}
            <Card style={{ borderColor: isDueUrgent ? 'rgba(var(--danger-color-rgb), 0.3)' : 'var(--surface-border)', background: isDueUrgent ? 'rgba(var(--danger-color-rgb), 0.05)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isDueUrgent ? 'rgba(var(--danger-color-rgb), 0.15)' : 'var(--surface-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CalendarDays size={20} color={isDueUrgent ? 'var(--danger-color)' : 'var(--text-secondary)'} />
                        </div>
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: isDueUrgent ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                                {daysUntilDue <= 0 ? t('creditCards.dueToday') : t('creditCards.dueIn').replace('{days}', daysUntilDue.toString())}
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {new Date(selected.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--label-text)', marginBottom: '2px' }}>{t('creditCards.minDue')}</p>
                        <p style={{ fontSize: '18px', fontWeight: 700 }}>{formatCurrency(selected.minDue)}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <Button style={{ flex: 1 }}>
                        {t('creditCards.payFull')}
                    </Button>
                    <Button variant="secondary" style={{ flex: 1 }}>
                        {t('creditCards.payMin')}
                    </Button>
                </div>
            </Card>

            {/* Benefits & Protection */}
            <Card padding="medium">
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px' }}>{t('creditCards.cardBenefits')}</p>
                {[
                    { icon: ShieldCheck, label: t('creditCards.zeroFraud'), sub: t('creditCards.zeroFraudSub') },
                    { icon: CheckCircle2, label: t('creditCards.rewardPoints'), sub: t('creditCards.pointsEarned').replace('{points}', Math.floor(selected.spent / 100).toString()) },
                ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--surface-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon size={16} color="var(--primary-color)" />
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>{label}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</p>
                            </div>
                        </div>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                    </div>
                ))}
            </Card>
        </div>
    );
};

export default CreditCardView;
