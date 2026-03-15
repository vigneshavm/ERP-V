"use client";

import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, ChevronRight, Lock, Smartphone } from 'lucide-react';
import { formatCurrency } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { Card } from '../../components/ui/Card';
import { useCardsFeature } from './hooks/useCardsFeature';

const NetworkBadge: React.FC<{ network: string }> = ({ network }) => (
    <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(var(--bg-color-rgb), 0.2)', color: 'inherit' }}>
        {network.toUpperCase()}
    </span>
);

const DebitCardView: React.FC = () => {
    const { t } = useLanguage();
    const { debitCards: cards, loading } = useCardsFeature();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (cards.length > 0 && !selectedId) {
            setSelectedId(cards[0].id);
        }
    }, [cards]);

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>{t('debitCards.loading')}</div>;
    if (cards.length === 0) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>{t('debitCards.noCards')}</div>;

    const selected = cards.find(c => c.id === selectedId) || cards[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

            {/* Card Visuals */}
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
                                <p style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600, letterSpacing: '1px', color: 'inherit' }}>{t('debitCards.availableBalance')}</p>
                                <p style={{ fontSize: '24px', fontWeight: 800, color: 'inherit' }}>{formatCurrency(card.balance)}</p>
                            </div>
                            <Wallet size={32} color="rgba(255,255,255,0.3)" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Balance Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Card style={{ padding: '18px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', marginBottom: '6px' }}>
                        <ArrowUpRight size={14} />
                        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>{t('debitCards.credited')}</p>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success-color)' }}>{formatCurrency(selected.balance + 15000)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--label-text)', marginTop: '4px' }}>{t('debitCards.thisMonth')}</p>
                </Card>
                <Card style={{ padding: '18px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', marginBottom: '6px' }}>
                        <ArrowDownRight size={14} />
                        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>{t('debitCards.debited')}</p>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger-color)' }}>{formatCurrency(15000)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--label-text)', marginTop: '4px' }}>{t('debitCards.thisMonth')}</p>
                </Card>
            </div>

            {/* Balance Breakdown */}
            <Card padding="medium">
                <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>{t('debitCards.balanceBreakdown')}</p>
                {[
                    { label: t('debitCards.openingBalance'), value: 12500, color: 'var(--label-text)' },
                    { label: t('debitCards.totalCredits'), value: selected.balance + 15000, color: 'var(--success-color)' },
                    { label: t('debitCards.totalDebits'), value: -15000, color: 'var(--danger-color)' },
                    { label: t('debitCards.currentBalance'), value: selected.balance, color: 'var(--text-primary)', bold: true },
                ].map(({ label, value, color, bold }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: label === t('debitCards.totalDebits') ? '1px solid var(--surface-border)' : undefined }}>
                        <p style={{ fontSize: '13px', color: color, fontWeight: bold ? 700 : 400 }}>{label}</p>
                        <p style={{ fontSize: '14px', fontWeight: bold ? 800 : 600, color: color }}>
                            {value < 0 ? '- ' : ''}{formatCurrency(Math.abs(value))}
                        </p>
                    </div>
                ))}
            </Card>

            {/* Quick Actions */}
            <Card padding="medium">
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px' }}>{t('debitCards.quickActions')}</p>
                {[
                    { icon: Lock, label: t('debitCards.blockCard'), sub: t('debitCards.blockCardSub') },
                    { icon: Smartphone, label: t('debitCards.cardOnUpi'), sub: t('debitCards.cardOnUpiSub') },
                    { icon: ChevronRight, label: t('debitCards.viewStatement'), sub: t('debitCards.viewStatementSub') },
                ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="clickable" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Icon size={16} color="var(--primary-color)" />
                            </div>
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

export default DebitCardView;
