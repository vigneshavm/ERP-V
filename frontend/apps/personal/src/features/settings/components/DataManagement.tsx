import React from 'react';
import { ChevronLeft, Download, Upload, Cloud, RefreshCw, FileText, Table, Calendar, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const DataManagement: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--bg-color)', zIndex: 4000, display: 'flex', flexDirection: 'column'
        }}>
            <div style={{
                padding: '16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'var(--surface-overlay)',
                borderBottom: '1px solid var(--surface-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cloud size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>{t('dataManagement.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
                <div className="view-container">
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>{t('dataManagement.subtitle')}</p>
                    </div>

                    {/* Cloud Sync Hero */}
                    <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--secondary-color-rgb, 155, 89, 182), 0.1) 100%)', border: '1px solid rgba(var(--primary-color-rgb), 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(var(--primary-color-rgb), 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary-color)' }}>
                                <Cloud size={28} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px', opacity: 0.8 }}>{t('dataManagement.lastSync')}</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{t('dataManagement.twoHoursAgo')}</p>
                            </div>
                        </div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: '8px' }}>{t('dataManagement.cloudSync')}</h3>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
                            {t('dataManagement.cloudSyncDesc')}
                        </p>
                        <button className="clickable" style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--primary-color)',
                            border: 'none',
                            color: 'var(--bg-color)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <RefreshCw size={18} />
                            {t('dataManagement.syncNow')}
                        </button>
                    </div>

                    {/* Export Section */}
                    <section style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dataManagement.exportData')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="glass-card clickable" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--success-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{t('dataManagement.exportPdf')}</p>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', opacity: 0.8 }}>{t('dataManagement.exportPdfDesc')}</p>
                                    </div>
                                </div>
                                <Download size={18} color="var(--text-secondary)" />
                            </div>

                            <div className="glass-card clickable" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--warning-color-rgb, 241, 196, 15), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--warning-color, #F1C40F)' }}>
                                        <Table size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{t('dataManagement.exportCsv')}</p>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', opacity: 0.8 }}>{t('dataManagement.exportCsvDesc')}</p>
                                    </div>
                                </div>
                                <Download size={18} color="var(--text-secondary)" />
                            </div>
                        </div>
                    </section>

                    {/* Backup & Restore */}
                    <section style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dataManagement.backupRestore')}</h3>
                        <div className="glass-card" style={{ padding: '0' }}>
                            <div className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Upload size={18} color="var(--secondary-color, #9B59B6)" />
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{t('dataManagement.createLocalBackup')}</span>
                                </div>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                            <div className="clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Calendar size={18} color="var(--tertiary-color, #E67E22)" />
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{t('dataManagement.restoreBackup')}</span>
                                </div>
                                <ChevronRight size={18} color="var(--text-secondary)" />
                            </div>
                        </div>
                    </section>

                    {/* Storage Info */}
                    <div style={{ marginTop: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '8px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                            <span>{t('dataManagement.cloudStorageUsed')}</span>
                            <span>12.4 MB / 50 MB</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--surface-overlay)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: '25%', height: '100%', background: 'var(--primary-color)' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
