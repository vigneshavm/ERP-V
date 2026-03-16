"use client";

import React, { useEffect, useState } from 'react';
import { ChevronLeft, FileText, Download, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import { fetchReports } from './services/reportsApi';
import { useLanguage } from '@repo/shared';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useReportsFeature } from './hooks/useReportsFeature';

interface DetailedReportsProps {
    refreshTrigger?: number;
    onBack?: () => void;
}

const DetailedReports: React.FC<DetailedReportsProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const { reports, loading } = useReportsFeature();
    const [selectedDateRange, setSelectedDateRange] = useState(t('reports.last30Days'));
    const [selectedCategories, setSelectedCategories] = useState(t('reports.allCategories'));
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('reports.loading')}</div>;

    return (
        <div className="view-container">
            <div className="view-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', display: 'flex' }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{t('reports.title')}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{t('reports.subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" style={{ width: '48px', height: '48px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Filter size={20} />
                    </Button>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="responsive-grid">
                <Card style={{ padding: '20px' }}>
                    <TrendingUp size={20} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('reports.savingsRate')}</p>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>32.4%</h3>
                </Card>
                <Card style={{ padding: '20px' }}>
                    <TrendingDown size={20} color="var(--danger-color)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('reports.debtRatio')}</p>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>12.8%</h3>
                </Card>
            </div>

            <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '16px', paddingLeft: '4px' }}>{t('reports.recent')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.map(report => (
                        <Card key={report.id} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} noMargin>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'rgba(var(--primary-color-rgb), 0.1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'var(--info-color, var(--primary-color))'
                                }}>
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>{report.title}</p>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{report.period} • {report.type}</p>
                                </div>
                            </div>
                            <Button variant="ghost" style={{ width: '40px', height: '40px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Download size={18} />
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>

            <Card style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(var(--warning-color-rgb), 0.05) 0%, rgba(var(--warning-color-rgb), 0.02) 100%)', border: '1px solid rgba(var(--warning-color-rgb), 0.1)' }}>
                <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, marginBottom: '8px' }}>{t('reports.customBuilder')}</h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                    {t('reports.customDesc')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setSelectedDateRange(selectedDateRange === t('reports.last30Days') ? t('reports.ytd') : t('reports.last30Days'))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Calendar size={16} /> {selectedDateRange}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setSelectedCategories(selectedCategories === t('reports.allCategories') ? t('reports.mainAccounts') : t('reports.allCategories'))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Filter size={16} /> {selectedCategories}
                    </Button>
                </div>
                <Button
                    variant="primary"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                    style={{ marginTop: '20px', width: '100%' }}
                >
                    {isGenerating ? t('reports.generating') : t('reports.generateCustom')}
                </Button>
            </Card>
        </div>
    );
};

export default DetailedReports;
