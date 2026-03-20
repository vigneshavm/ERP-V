"use client";

import React, { useState } from 'react';
import { HelpCircle, Search, MessageSquare, Mail, BookOpen, ChevronRight, ChevronLeft, MessageCircle, Info, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const HelpSupport: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        { q: 'How do I export my data?', a: 'Go to Settings > Backup & Export to download your transactions in CSV or JSON format.' },
        { q: 'Is my data secure?', a: 'Yes, we use AES-256 encryption and offer Biometric Lock for maximum security.' },
        { q: 'How to add a recurring bill?', a: 'Navigate to Statistics > Recurring Bills and tap the "+" icon.' },
        { q: 'Can I sync across devices?', a: 'Yes, enable "Cloud Sync" in Settings > Data Management to keep your data updated everywhere.' },
        { q: 'What are Category Limits?', a: 'You can set a monthly budget for each category in Settings > Budget Settings.' },
        { q: 'How to change the currency?', a: 'Go to Settings > General and select your preferred currency.' },
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--bg-color)',
            zIndex: 4000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-overlay)', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HelpCircle size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>{t('helpSupport.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px 16px' }}>
                {/* Search */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ background: 'var(--surface-overlay)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--surface-border)' }}>
                        <Search size={20} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder={t('helpSupport.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: '100%', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* Contact Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div className="glass-card clickable" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--primary-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary-color)', margin: '0 auto 8px auto' }}>
                            <MessageCircle size={24} />
                        </div>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>{t('helpSupport.liveChat')}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success-color)', fontWeight: 600, marginTop: '4px' }}>{t('helpSupport.online')}</p>
                    </div>
                    <div className="glass-card clickable" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--secondary-color-rgb, 155, 89, 182), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--secondary-color, #9B59B6)', margin: '0 auto 8px auto' }}>
                            <Mail size={24} />
                        </div>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>{t('helpSupport.emailUs')}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('helpSupport.response')}</p>
                    </div>
                </div>

                {/* Knowledge Base */}
                <section style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('helpSupport.knowledgeBase')}</h3>
                    <div className="glass-card" style={{ padding: '0' }}>
                        {[
                            { icon: <BookOpen size={18} />, title: t('helpSupport.gettingStarted') },
                            { icon: <ShieldCheck size={18} />, title: t('helpSupport.securityPrivacy') },
                            { icon: <Info size={18} />, title: t('helpSupport.termsService') },
                        ].map((item, idx) => (
                            <div key={idx} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx < 2 ? '1px solid var(--surface-border)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: 'var(--primary-color)' }}>{item.icon}</div>
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.title}</span>
                                </div>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQs */}
                <section>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('helpSupport.faqs')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, idx) => (
                                <div key={idx} className="glass-card" style={{ padding: '16px' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{faq.q}</p>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{faq.a}</p>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                <Search size={40} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                <p>{t('helpSupport.noResults')} "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Social Links */}
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '16px' }}>{t('helpSupport.joinCommunity')}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ExternalLink size={20} color="var(--primary-color)" />
                        </div>
                    </div>
                    <p style={{ marginTop: '32px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', opacity: 0.7 }}>{t('helpSupport.version')}</p>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
