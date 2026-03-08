"use client";

import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, CheckCircle2, Shield, Smartphone, Laptop, Trash2, HardDrive, Info, AlertTriangle, ChevronLeft, X } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const SyncStatus: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(t('syncStatus.justNow') || '2 minutes ago');

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setLastSync(t('syncStatus.justNow'));
        }, 3000);
    };

    const devices = [
        { id: 1, name: 'iPhone 15 Pro', type: 'Smartphone', lastSeen: 'Active', icon: <Smartphone size={18} /> },
        { id: 2, name: 'MacBook Pro M3', type: 'Laptop', lastSeen: '1 hour ago', icon: <Laptop size={18} /> },
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--bg-color)',
            zIndex: 2100,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-overlay)', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('syncStatus.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px 20px' }}>
                {/* Status Hero */}
                <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(var(--info-color-rgb), 0.1) 0%, rgba(155, 89, 182, 0.1) 100%)' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(var(--info-color-rgb), 0.1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 20px auto',
                        position: 'relative'
                    }}>
                        <Cloud size={40} color="var(--info-color)" />
                        {isSyncing ? (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '3px solid var(--info-color)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                        ) : (
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--success-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '3px solid var(--bg-color)' }}>
                                <CheckCircle2 size={14} color="white" />
                            </div>
                        )}
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{isSyncing ? t('syncStatus.syncing') : t('syncStatus.synced')}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('syncStatus.lastSynced')} {lastSync}</p>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="clickable"
                        style={{
                            marginTop: '24px',
                            width: '100%',
                            padding: '14px',
                            borderRadius: '16px',
                            background: isSyncing ? 'var(--surface-overlay)' : 'var(--primary-color)',
                            color: isSyncing ? 'rgba(255,255,255,0.3)' : 'var(--bg-color)',
                            border: 'none',
                            fontSize: '15px',
                            fontWeight: 800,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
                        {isSyncing ? t('syncStatus.syncing') : t('syncStatus.syncNow')}
                    </button>
                </div>

                {/* Storage Info */}
                <section style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('syncStatus.cloudStorage')}</h4>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>12.4 MB / 50 MB</span>
                    </div>
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay)', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                            <div style={{ width: '25%', height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('syncStatus.transactions')} (8.2MB)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--info-color)' }}></div>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('syncStatus.attachments')} (4.2MB)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Connected Devices */}
                <section>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>{t('syncStatus.connectedDevices')}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {devices.map(device => (
                            <div key={device.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: 'var(--primary-color)' }}>{device.icon}</div>
                                    <div>
                                        <p style={{ fontSize: '16px', fontWeight: 700 }}>{device.name}</p>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{device.lastSeen}</p>
                                    </div>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: 'var(--danger-color)' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security Note */}
                <div style={{ marginTop: '32px', padding: '16px', borderRadius: '16px', background: 'rgba(var(--success-color-rgb), 0.05)', border: '1px solid rgba(var(--success-color-rgb), 0.1)', display: 'flex', gap: '16px' }}>
                    <Shield size={24} color="var(--success-color)" />
                    <p style={{ fontSize: '14px', color: 'rgba(var(--text-primary-rgb, 255, 255, 255), 0.6)', lineHeight: '1.6' }}>
                        {t('syncStatus.securityNote')}<span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t('syncStatus.securityNoteHighlight')}</span>{t('syncStatus.securityNoteEnd')}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default SyncStatus;
