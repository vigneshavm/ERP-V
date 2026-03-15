import React, { useState, useEffect } from 'react';
import { Fingerprint, Shield, X, Lock, Check, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const SecurityLock: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [isBioEnabled, setIsBioEnabled] = useState(true);

    const handleScan = () => {
        setStatus('SCANNING');
        setTimeout(() => {
            setStatus('SUCCESS');
            setTimeout(() => {
                onClose();
            }, 1500);
        }, 2000);
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
            <div style={{
                padding: '16px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'rgba(0,0,0,0.3)',
                borderBottom: '1px solid var(--surface-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('securityLock.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(241, 196, 15, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 24px auto'
                    }}>
                        <Shield size={32} color="var(--primary-color)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '300px', margin: '0 auto', lineHeight: '1.6' }}>
                        {t('securityLock.subtitle')}
                    </p>
                </div>

                <div
                    onClick={status === 'IDLE' ? handleScan : undefined}
                    style={{ position: 'relative', cursor: status === 'IDLE' ? 'pointer' : 'default' }}
                >
                    {status === 'SCANNING' && (
                        <div className="bio-ripple"></div>
                    )}

                    <div style={{
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        background: status === 'SUCCESS' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${status === 'SUCCESS' ? 'var(--success-color)' : 'var(--surface-border)'}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 2,
                        transition: 'all 0.5s ease',
                        boxShadow: status === 'SCANNING' ? '0 0 30px rgba(52, 152, 219, 0.2)' : 'none'
                    }}>
                        {status === 'SUCCESS' ? (
                            <Check size={72} color="#2ECC71" strokeWidth={3} />
                        ) : (
                            <Fingerprint
                                size={80}
                                color={status === 'SCANNING' ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)'}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                        )}

                        {status === 'SCANNING' && (
                            <div style={{
                                position: 'absolute',
                                width: '80%',
                                height: '2px',
                                background: 'var(--primary-color)',
                                boxShadow: '0 0 15px var(--primary-color)',
                                top: '20%',
                                left: '10%',
                                animation: 'scanLine 2s infinite ease-in-out'
                            }}></div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '48px', textAlign: 'center' }}>
                    <p style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: status === 'SUCCESS' ? '#2ECC71' : status === 'SCANNING' ? 'var(--primary-color)' : 'white'
                    }}>
                        {status === 'IDLE' ? t('securityLock.tapToScan') : status === 'SCANNING' ? t('securityLock.scanning') : t('securityLock.verified')}
                    </p>
                </div>

                <div style={{
                    marginTop: 'Auto',
                    width: '100%',
                    maxWidth: '340px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    borderRadius: '24px',
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--surface-border)',
                    marginBottom: '40px'
                }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52, 152, 219, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Shield size={18} color="var(--primary-color)" />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 600 }}>{t('securityLock.bioLogin')}</span>
                    </div>
                    <div
                        onClick={() => setIsBioEnabled(!isBioEnabled)}
                        className="clickable"
                        style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '12px',
                            background: isBioEnabled ? 'var(--success-color)' : 'var(--surface-border)',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: isBioEnabled ? '22px' : '2px',
                            top: '2px',
                            width: '20px',
                            height: '20px',
                            background: 'var(--bg-color)',
                            borderRadius: '50%',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}></div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scanLine {
                    0% { top: 20%; }
                    50% { top: 80%; }
                    100% { top: 20%; }
                }
                .bio-ripple {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 160px;
                    height: 160px;
                    border: 2px solid var(--primary-color);
                    border-radius: 50%;
                    animation: bioRipple 1.5s infinite ease-out;
                    opacity: 0;
                }
                @keyframes bioRipple {
                    0% { width: 160px; height: 160px; opacity: 0.5; }
                    100% { width: 240px; height: 240px; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default SecurityLock;
