import React from 'react';
import { Moon, Sun, Check, Palette, X, ChevronLeft, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@repo/shared';
import { useSettings } from '../../../contexts/SettingsContext';

interface AppearanceSettingsProps {
    onClose?: () => void;
    onBack?: () => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onClose, onBack }) => {
    const { t } = useLanguage();
    const { theme, setTheme, accentColor, setAccentColor } = useSettings();

    const themes = [
        { id: 'Dark', icon: <Moon size={20} />, label: t('appearance.dark'), desc: t('appearance.darkDesc') },
        { id: 'Light', icon: <Sun size={20} />, label: t('appearance.light'), desc: t('appearance.lightDesc') },
        { id: 'Cyber', icon: <Zap size={20} />, label: 'Neon Cyber', desc: 'High-contrast futuristic aesthetic' },
        { id: 'Gold', icon: <Crown size={20} />, label: 'Elegant Gold', desc: 'Refined premium minimalism' },
        { id: 'System', icon: <Sun size={20} />, label: t('appearance.system'), desc: t('appearance.systemDesc') },
    ];

    const colors = [
        { name: 'Gold', hex: '#F1C40F' },
        { name: 'Emerald', hex: '#2ECC71' },
        { name: 'Sky', hex: '#3498DB' },
        { name: 'Amethyst', hex: '#9B59B6' },
        { name: 'Coral', hex: '#E74C3C' },
        { name: 'Orange', hex: '#E67E22' },
    ];

    const isModal = !!onClose;

    return (
        <motion.div
            initial={{ opacity: 0, y: isModal ? 100 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isModal ? 100 : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
                position: isModal ? 'fixed' : 'relative',
                top: 0, left: 0, width: '100%', height: '100%',
                background: isModal ? 'var(--bg-color)' : 'transparent',
                zIndex: isModal ? 3000 : 1,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface-overlay)',
                borderBottom: '1px solid var(--surface-border)',
                marginBottom: '24px',
                position: isModal ? 'sticky' : 'relative',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose || onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Palette size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('appearance.title')}</h2>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <X size={24} />
                    </button>
                )}
            </div>

            <div style={{ padding: '0 20px 120px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Theme Selection */}
                <section>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase' }}>
                        {t('appearance.themeMode')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {themes.map(th => (
                            <div
                                key={th.id}
                                onClick={() => setTheme(th.id as any)}
                                className="glass-card clickable"
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: theme === th.id ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                                    background: theme === th.id ? 'rgba(var(--primary-color-rgb, 241, 196, 15), 0.05)' : 'var(--card-bg)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: theme === th.id ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                                        {th.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: 600, color: theme === th.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{th.label}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.6 }}>{th.desc}</p>
                                    </div>
                                </div>
                                {theme === th.id && <Check size={18} color="var(--primary-color)" />}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Accent Color */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingLeft: '4px' }}>
                        <Palette size={18} color="var(--text-secondary)" />
                        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {t('appearance.accentColor')}
                        </h3>
                    </div>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '20px' }}>
                            {colors.map(c => (
                                <motion.div
                                    key={c.hex}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setAccentColor(c.hex)}
                                    className="clickable"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: c.hex,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: accentColor === c.hex ? '3px solid white' : '1px solid var(--surface-border)',
                                        boxShadow: accentColor === c.hex ? `0 8px 24px ${c.hex}60` : 'none',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {accentColor === c.hex && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check size={24} color={c.hex === '#F1C40F' ? '#141414' : 'white'} strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: accentColor === c.hex ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.name}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Font Size Placeholder */}
                <section>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px', textTransform: 'uppercase' }}>
                        {t('appearance.typography')}
                    </h3>
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '15px', fontWeight: 600 }}>{t('appearance.fontSize')}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-overlay)', padding: '4px 10px', borderRadius: '8px' }}>100%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 10px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('appearance.small')}</span>
                            <div style={{ flex: 1, height: '6px', background: 'var(--surface-overlay-strong)', borderRadius: '3px', position: 'relative' }}>
                                <motion.div
                                    style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-color)', border: '4px solid var(--bg-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'grab' }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9, cursor: 'grabbing' }}
                                />
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '50%', background: 'var(--primary-color)', borderRadius: '3px', opacity: 0.3 }} />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 700 }}>{t('appearance.large')}</span>
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default AppearanceSettings;
