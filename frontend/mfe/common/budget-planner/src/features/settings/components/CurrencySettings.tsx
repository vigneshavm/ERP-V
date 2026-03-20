"use client";

import React, { useState } from 'react';
import { Check, Search, X, DollarSign, ArrowRightLeft, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@repo/shared';
import { useSettings } from '@/shared/contexts/SettingsContext';

const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 1, flag: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 82.5, flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 89.2, flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 104.5, flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 0.58, flag: '🇯🇵' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 22.4, flag: '🇦🇪' },
];

const CurrencySettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const { currency, setCurrency } = useSettings();
    const [selectedCode, setSelectedCode] = useState(currency);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCurrencies = currencies.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApply = () => {
        setCurrency(selectedCode);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--bg-color)', zIndex: 3000, display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'var(--surface-overlay)',
                borderBottom: '1px solid var(--surface-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('currencySettings.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Search */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    background: 'var(--surface-overlay)', borderRadius: '12px',
                    border: '1px solid var(--surface-border)'
                }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder={t('currencySettings.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '15px', width: '100%', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Currency List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredCurrencies.map(c => (
                        <div
                            key={c.code}
                            onClick={() => setSelectedCode(c.code)}
                            className="clickable"
                            style={{
                                padding: '16px 20px',
                                borderRadius: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: selectedCode === c.code ? 'rgba(241, 196, 15, 0.05)' : 'var(--surface-overlay-subtle)',
                                border: selectedCode === c.code ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>{c.flag}</span>
                                <div>
                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.code}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {selectedCode === c.code ? (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Check size={16} color="black" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{c.symbol}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Conversion Preview */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 40px)',
                maxWidth: '440px'
            }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
                            <ArrowRightLeft size={18} />
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('currencySettings.currentRate')}</p>
                            <p style={{ fontSize: '14px', fontWeight: 700 }}>1 {selectedCode} = ₹ {currencies.find(c => c.code === selectedCode)?.rate}</p>
                        </div>
                    </div>
                    <button onClick={handleApply} style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--primary-color)', border: 'none', color: 'var(--bg-color)', fontSize: '14px', fontWeight: 800 }}>
                        {t('currencySettings.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CurrencySettings;
