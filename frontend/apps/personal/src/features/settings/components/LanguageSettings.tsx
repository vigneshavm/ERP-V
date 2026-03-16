"use client";

import React, { useState } from 'react';
import { Check, Search, X, Languages, ChevronLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useLanguage } from '@repo/shared';

const LanguageSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { language, setLanguage, availableLanguages, t } = useLanguage();
    const [selectedCode, setSelectedCode] = useState(language);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLanguages = availableLanguages.filter(l =>
        l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApply = () => {
        setLanguage(selectedCode);
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
                        <Languages size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('common.defaultLanguage') || 'Language'}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Search */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{
                    background: 'var(--surface-overlay)', borderRadius: '12px',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                    border: '1px solid var(--surface-border)'
                }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder={t('common.searchLanguage') || 'Search language...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '15px', width: '100%', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Language List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredLanguages.map(l => (
                        <div
                            key={l.code}
                            onClick={() => setSelectedCode(l.code)}
                            className="clickable"
                            style={{
                                padding: '16px 20px',
                                borderRadius: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: selectedCode === l.code ? 'rgba(241, 196, 15, 0.05)' : 'var(--surface-overlay-subtle)',
                                border: selectedCode === l.code ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '24px' }}>{l.flag}</span>
                                <div>
                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{l.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{l.code.toUpperCase()}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {selectedCode === l.code ? (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Check size={16} color="black" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}></span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Apply Button */}
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
                            <Languages size={18} />
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Selected Info</p>
                            <p style={{ fontSize: '14px', fontWeight: 700 }}>{filteredLanguages.find(l => l.code === selectedCode)?.name}</p>
                        </div>
                    </div>
                    <button onClick={handleApply} style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--primary-color)', border: 'none', color: 'var(--bg-color)', fontSize: '14px', fontWeight: 800 }}>
                        {t('common.apply') || 'APPLY'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguageSettings;
