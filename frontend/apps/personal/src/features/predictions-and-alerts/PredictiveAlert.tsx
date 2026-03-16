"use client";

import React from 'react';
import { TrendingUp, AlertCircle, ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/shared/ui/Card';
import { useLanguage } from '@repo/shared';
import { formatCurrency } from '@repo/shared';
import { ForecastResult, CategoryTrend } from '@/shared/lib/utils/predictionEngine';

interface PredictiveAlertProps {
    forecast: ForecastResult;
    trends: CategoryTrend[];
    onAdjust: () => void;
}

const PredictiveAlert: React.FC<PredictiveAlertProps> = ({ forecast, trends, onAdjust }) => {
    const { t } = useLanguage();

    if (!forecast.isOverBudget && trends.length === 0) return null;

    const mainTrend = trends[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ marginBottom: '0' }}
            >
                <Card
                    interactive
                    onClick={onAdjust}
                    style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(var(--danger-color-rgb), 0.15) 0%, rgba(155, 89, 182, 0.1) 100%)',
                        border: '1px solid rgba(var(--danger-color-rgb), 0.3)',
                        overflow: 'hidden',
                        position: 'relative',
                        marginBottom: 0
                    }}
                >
                    {/* Background Glow */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(var(--danger-color-rgb), 0.2) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(var(--danger-color-rgb), 0.2)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Sparkles size={18} color="var(--danger-color)" />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>{t('dashboard.forecastTitle')}</h4>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: 'rgba(var(--danger-color-rgb), 0.15)',
                                color: 'var(--danger-color)',
                                fontSize: '13px',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>
                                <AlertCircle size={12} />
                                {t('dashboard.potentialOverspend')}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: 'var(--label-text)', marginBottom: '4px' }}>{t('dashboard.forecastAmount')}</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {formatCurrency(forecast.projectedSpent)}
                                    </span>
                                    <span style={{ fontSize: '14px', color: 'var(--danger-color)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        <TrendingUp size={14} style={{ marginRight: '4px' }} />
                                        +{((forecast.projectedSpent / forecast.currentSpent - 1) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {mainTrend && (
                            <div style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--surface-border)',
                                marginBottom: '20px'
                            }}>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--label-text)' }}>
                                    You'll overspend on <span style={{ color: 'var(--danger-color)', fontWeight: 800 }}>{mainTrend.categoryName}</span> by <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(mainTrend.overBy)}</span> this month.
                                </p>
                            </div>
                        )}

                        <button
                            className="clickable"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-color)',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: 800,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {t('dashboard.adjustNow')}
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

export default PredictiveAlert;
