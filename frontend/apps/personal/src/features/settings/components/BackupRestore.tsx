import React from 'react';
import { Database, Download, Upload, Trash2, History, Shield, Smartphone, ChevronRight, AlertTriangle, FileText, X, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@repo/shared';

const BackupRestore: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--bg-color)',
            zIndex: 2200,
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
                        <Database size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('backupRestore.title')}</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px 16px' }}>
                {/* Backup Options */}
                <section style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('backupRestore.backup')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="glass-card clickable" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--success-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
                                <Download size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '15px', fontWeight: 700 }}>{t('backupRestore.localBackup')}</p>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('backupRestore.localBackupDesc')}</p>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                        <div className="glass-card clickable" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--info-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--info-color)' }}>
                                <History size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '15px', fontWeight: 700 }}>{t('backupRestore.autoBackup')}</p>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('backupRestore.autoBackupDesc')} • <span style={{ color: 'var(--success-color)' }}>{t('backupRestore.on')}</span></p>
                            </div>
                            <div className="toggle-pill" style={{ width: '40px', height: '22px', background: 'var(--success-color)', borderRadius: '11px', position: 'relative' }}>
                                <div style={{ position: 'absolute', right: '2px', top: '2px', width: '18px', height: '18px', background: 'var(--bg-color)', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Restore Options */}
                <section style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('backupRestore.restore')}</h3>
                    <div className="glass-card clickable" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--accent-rgb, 155, 89, 182), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-color)' }}>
                            <Upload size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '15px', fontWeight: 700 }}>{t('backupRestore.restoreFile')}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('backupRestore.restoreFileDesc')}</p>
                        </div>
                        <ChevronRight size={18} color="var(--text-secondary)" />
                    </div>
                </section>

                {/* Export Options */}
                <section style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('backupRestore.exportTo')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div className="glass-card clickable" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ color: '#E74C3C', marginBottom: '8px' }}><FileText size={24} style={{ margin: '0 auto' }} /></div>
                            <p style={{ fontSize: '14px', fontWeight: 700 }}>{t('backupRestore.pdfReport')}</p>
                        </div>
                        <div className="glass-card clickable" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ color: '#2ECC71', marginBottom: '8px' }}><History size={24} style={{ margin: '0 auto' }} /></div>
                            <p style={{ fontSize: '14px', fontWeight: 700 }}>{t('backupRestore.excelCsv')}</p>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section>
                    <h3 style={{ fontSize: '14px', color: 'var(--danger-color)', fontWeight: 700, marginBottom: '12px', paddingLeft: '4px', textTransform: 'uppercase' }}>{t('backupRestore.dangerZone')}</h3>
                    <div className="glass-card clickable" style={{ padding: '16px', border: '1px solid rgba(var(--danger-color-rgb), 0.2)', background: 'rgba(var(--danger-color-rgb), 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--danger-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger-color)' }}>
                                <Trash2 size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger-color)' }}>{t('backupRestore.clearAll')}</p>
                                <p style={{ fontSize: '14px', color: 'rgba(var(--danger-color-rgb), 0.6)' }}>{t('backupRestore.clearAllDesc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Help Note */}
                <div style={{ marginTop: '32px', padding: '16px', borderRadius: '16px', background: 'rgba(var(--warning-color-rgb), 0.05)', border: '1px solid rgba(var(--warning-color-rgb), 0.1)', display: 'flex', gap: '16px' }}>
                    <AlertTriangle size={24} color="var(--warning-color)" />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {t('backupRestore.warningNote')}<span style={{ color: 'var(--warning-color)', fontWeight: 700 }}>{t('backupRestore.overwrite')}</span>{t('backupRestore.warningNoteEnd')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BackupRestore;
