"use client";

import React, { useState, useEffect } from 'react';
import { Lock, ChevronLeft, X, Delete, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '@repo/shared';

export type SecurityPinMode = 'SET' | 'CONFIRM' | 'ENTER' | 'CHANGE';

interface SecurityPinProps {
    mode: SecurityPinMode;
    onSuccess: (pin: string) => void;
    onClose: () => void;
    existingPin?: string;
}

const SecurityPin: React.FC<SecurityPinProps> = ({ mode, onSuccess, onClose, existingPin }) => {
    const { t } = useLanguage();
    const [pin, setPin] = useState<string>('');
    const [tempPin, setTempPin] = useState<string>('');
    const [currentMode, setCurrentMode] = useState<SecurityPinMode>(mode);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleKeyPress = (val: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + val);
            setError(null);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError(null);
    };

    useEffect(() => {
        if (pin.length === 4) {
            // Process PIN
            if (currentMode === 'ENTER') {
                if (pin === existingPin) {
                    handleSuccess();
                } else {
                    handleError(t('securityPin.incorrectPin'));
                }
            } else if (currentMode === 'SET') {
                setTempPin(pin);
                setPin('');
                setCurrentMode('CONFIRM');
            } else if (currentMode === 'CONFIRM') {
                if (pin === tempPin) {
                    handleSuccess();
                } else {
                    handleError(t('securityPin.pinMismatch'));
                    setPin('');
                    setCurrentMode('SET');
                }
            } else if (currentMode === 'CHANGE') {
                if (pin === existingPin) {
                    setPin('');
                    setCurrentMode('SET');
                } else {
                    handleError(t('securityPin.incorrectPin'));
                    setPin('');
                }
            }
        }
    }, [pin]);

    const handleSuccess = () => {
        setIsSuccess(true);
        setTimeout(() => {
            onSuccess(currentMode === 'CONFIRM' ? pin : existingPin || pin);
        }, 1000);
    };

    const handleError = (msg: string) => {
        setError(msg);
        setPin('');
    };

    const getModeTitle = () => {
        switch (currentMode) {
            case 'SET': return t('securityPin.setPin');
            case 'CONFIRM': return t('securityPin.confirmPin');
            case 'ENTER': return t('securityPin.enterPin');
            case 'CHANGE': return t('securityPin.enterExisting');
            default: return t('securityPin.title');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--bg-color)',
            zIndex: 5000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-overlay)', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>{t('securityPin.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '24px', minHeight: '1.2em' }}>
                        {isSuccess ? (currentMode === 'CONFIRM' ? t('securityPin.setSuccess') : t('securityPin.success')) : getModeTitle()}
                    </h3>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: i < pin.length ? 'var(--primary-color)' : 'var(--surface-overlay-subtle, #333)',
                                    border: i < pin.length ? 'none' : '1px solid var(--surface-border)',
                                    boxShadow: i < pin.length ? '0 0 10px var(--primary-color)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            />
                        ))}
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', justifyContent: 'center', animation: 'shake 0.4s ease' }}>
                            <AlertCircle size={14} />
                            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{error}</span>
                        </div>
                    )}

                    {isSuccess && (
                        <div style={{ color: 'var(--success-color)', animation: 'popIn 0.4s ease' }}>
                            <ShieldCheck size={40} style={{ margin: '0 auto' }} />
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                    width: '100%',
                    maxWidth: '320px'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            className="clickable"
                            style={{
                                height: '72px',
                                borderRadius: '20px',
                                background: 'var(--surface-overlay)',
                                border: '1px solid var(--surface-border)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-2xl)',
                                fontWeight: 700,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeyPress('0')}
                        className="clickable"
                        style={{
                            height: '72px',
                            borderRadius: '20px',
                            background: 'var(--surface-overlay)',
                            border: '1px solid var(--surface-border)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 700,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="clickable"
                        style={{
                            height: '72px',
                            borderRadius: '20px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Delete size={28} />
                    </button>
                </div>

                {currentMode === 'ENTER' && (
                    <button style={{ marginTop: '32px', color: 'var(--primary-color)', background: 'none', border: 'none', fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>
                        {t('securityPin.forgotPin')}
                    </button>
                )}
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    50% { transform: translateX(8px); }
                    75% { transform: translateX(-8px); }
                }
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default SecurityPin;
