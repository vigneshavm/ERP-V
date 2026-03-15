"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Database, Heart, Share2, HelpCircle, ChevronRight, LogOut, Moon, Globe, DollarSign, LayoutGrid, Cloud, Fingerprint, X, Lock } from 'lucide-react';

import { View } from '../../../contexts/NavigationContext';
import { fetchCategories } from '../../expenses/services/expensesApi';
import { useLanguage } from '@repo/shared';
import { useSettings } from '../../../contexts/SettingsContext';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SecurityPinMode } from '../../auth';

import { useNavigation } from '../../../contexts/NavigationContext';
import { useAuthStore } from '@repo/shared';

interface SettingsViewProps {
    setPinMode: (mode: SecurityPinMode) => void;
    appPin: string | null;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    setPinMode,
    appPin
}) => {
    const { t, availableLanguages, language } = useLanguage();
    const { userProfile, theme, currency } = useSettings();
    const logout = useAuthStore(state => state.logout);
    const {
        setIsCurrencyOpen,
        setIsLanguageOpen,
        setIsHelpOpen,
        setIsBackupOpen,
        setIsBioLockOpen,
        setIsAppearanceOpen,
        setIsEditProfileOpen,
        setIsCategoryEditorOpen,
        setIsDataManagementOpen,
        setIsRateUsOpen,
        setIsInviteFriendsOpen,
        setIsPinOverlayOpen
    } = useNavigation();
    const [categoryCount, setCategoryCount] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories().then(cats => setCategoryCount(cats.length));
    }, []);

    return (
        <div className="view-container">
            {/* Profile Header */}
            <div
                className="clickable"
                onClick={() => setIsEditProfileOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '10px' }}
            >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(45deg, var(--primary-color), #27AE60)`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--bg-color)', border: '4px solid var(--surface-border)' }}>
                    {userProfile.initials}
                </div>
                <div>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: '4px' }}>
                        {userProfile.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {process.env.NEXT_PUBLIC_IS_LOCAL === 'true' ? t('settings.offlineMode') : t('settings.premiumPlan')}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                    <ChevronRight size={20} />
                </div>
            </div>

            <div className="settings-layout">

                {/* General Settings */}
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('settings.general')}</h3>
                    <Card style={{ padding: '0' }}>
                        {[
                            { icon: <User size={18} />, title: t('settings.accountInfo'), value: '', color: 'var(--primary-color)' },
                            { icon: <LayoutGrid size={18} />, title: t('settings.categories'), value: categoryCount !== null ? `${categoryCount} ${t('common.total')}` : '...', color: '#2ECC71', onClick: () => setIsCategoryEditorOpen(true) },
                            {
                                icon: <Globe size={18} />,
                                title: t('settings.language'),
                                value: availableLanguages.find(l => l.code === language)?.name || 'English',
                                color: '#3498DB',
                                onClick: () => setIsLanguageOpen(true)
                            },
                            {
                                icon: <DollarSign size={18} />,
                                title: t('settings.currency'),
                                value: currency,
                                color: '#F1C40F',
                                onClick: () => setIsCurrencyOpen(true)
                            },
                            {
                                icon: <Moon size={18} />,
                                title: t('settings.appearance'),
                                value: theme,
                                color: '#9B59B6',
                                onClick: () => setIsAppearanceOpen(true)
                            },
                        ].map((item, idx, arr) => (
                            <div key={idx} onClick={item.onClick} className="clickable" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--surface-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: item.color }}>{item.icon}</div>
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{item.value}</span>
                                    <ChevronRight size={18} color="var(--text-secondary)" />
                                </div>
                            </div>
                        ))}
                    </Card>
                </section>

                {/* Data & Security */}
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('settings.dataSecurity')}</h3>
                    <Card style={{ padding: '0' }}>
                        <div onClick={() => setIsDataManagementOpen(true)} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Cloud size={18} color="#3498DB" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.cloudSync')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success-color)', fontWeight: 600 }}>{t('common.connected')}</span>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        </div>
                        <div onClick={() => setIsHelpOpen(true)} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <HelpCircle size={18} color="#9B59B6" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.helpSupport')}</span>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                        <div onClick={() => setIsBackupOpen(true)} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Database size={18} color="#F1C40F" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.backupExport')}</span>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                        <div onClick={() => setIsBioLockOpen(true)} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Fingerprint size={18} color="#F1C40F" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.biometricLock')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success-color)', fontWeight: 600 }}>{t('common.faceId')}</span>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        </div>
                        <div onClick={() => {
                            if (appPin) {
                                setPinMode('CHANGE');
                            } else {
                                setPinMode('SET');
                            }
                            setIsPinOverlayOpen(true);
                        }} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Lock size={18} color="#E74C3C" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.securityPin')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: appPin ? 'var(--success-color)' : 'var(--text-secondary)', fontWeight: 600 }}>
                                    {appPin ? t('common.enabled') : 'Off'}
                                </span>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        </div>
                        {appPin && (
                            <div onClick={() => {
                                if (window.confirm('Are you sure you want to remove your PIN?')) {
                                    localStorage.removeItem('app-pin');
                                    window.location.reload(); // Simple way to update state
                                }
                            }} className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <X size={18} color="var(--danger-color)" />
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--danger-color)' }}>Remove PIN</span>
                                </div>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        )}
                        <div className="clickable" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--surface-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Bell size={18} color="#3498DB" />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.notificationPrivacy')}</span>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                    </Card>
                </section>

                {/* Support */}
                <section style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('settings.support')}</h3>
                    <Card style={{ padding: '0' }}>
                        {[
                            { icon: <HelpCircle size={18} />, title: t('settings.helpCenter'), color: 'var(--warning-color, #F39C12)', onClick: () => setIsHelpOpen(true) },
                            { icon: <Heart size={18} />, title: t('settings.rateUs'), color: 'var(--danger-color, #E91E63)', onClick: () => setIsRateUsOpen(true) },
                            { icon: <Share2 size={18} />, title: t('settings.inviteFriends'), color: 'var(--success-color, #1ABC9C)', onClick: () => setIsInviteFriendsOpen(true) },
                        ].map((item, idx, arr) => (
                            <div key={idx} onClick={item.onClick} className="clickable" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: idx !== arr.length - 1 ? '1px solid var(--surface-border)' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: item.color }}>{item.icon}</div>
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                                </div>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </Card>
                </section>

                <Button
                    variant="danger"
                    fullWidth
                    size="large"
                    onClick={logout}
                    disabled={process.env.NEXT_PUBLIC_IS_LOCAL === 'true'}
                    style={{ marginBottom: '20px' }}
                    icon={<LogOut size={20} />}
                >
                    {process.env.NEXT_PUBLIC_IS_LOCAL === 'true' ? t('settings.logoutDisabled') : t('settings.logout')}
                </Button>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>{t('settings.version')} 4.2.0 (Build 892)</p>
            </div>
        </div>
    );
};

export default SettingsView;
