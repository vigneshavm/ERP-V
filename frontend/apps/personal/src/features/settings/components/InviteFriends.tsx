"use client";

import React from 'react';
import { Share2, ChevronLeft, X, Copy, Check, MessageCircle, Mail, Twitter } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const InviteFriends: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = React.useState(false);
    const inviteLink = "https://expensemanager.app/join/vignesh";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                        <Share2 size={20} color="var(--success-color)" />
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>{t('settings.inviteFriends')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(var(--success-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)', margin: '0 auto 20px auto' }}>
                        <Share2 size={36} />
                    </div>
                    <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: '12px' }}>Share the Wealth</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                        Invite your friends to manage their expenses smarter. Get 3 months of Premium for every friend who joins!
                    </p>
                </div>

                <div style={{ background: 'var(--surface-overlay)', padding: '20px', borderRadius: '20px', border: '1px solid var(--surface-border)', marginBottom: '32px' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Your Invite Link</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '12px', border: '1px dashed var(--surface-border)' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteLink}</span>
                        <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', color: copied ? 'var(--success-color)' : 'var(--primary-color)', cursor: 'pointer', display: 'flex' }}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 700, textTransform: 'uppercase', paddingLeft: '4px' }}>Quick Share</p>
                    <div className="responsive-grid-4" style={{ gap: '16px' }}>
                        {[
                            { icon: <MessageCircle size={24} />, name: 'WhatsApp', color: '#25D366' },
                            { icon: <Twitter size={24} />, name: 'Twitter', color: '#1DA1F2' },
                            { icon: <Mail size={24} />, name: 'Email', color: 'var(--primary-color)' },
                            { icon: <X size={24} />, name: 'More', color: 'var(--text-secondary)' },
                        ].map((plat, idx) => (
                            <div key={idx} className="clickable" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: plat.color }}>
                                    {plat.icon}
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{plat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteFriends;
