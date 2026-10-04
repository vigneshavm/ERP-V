import React, { useState, useEffect } from 'react';
import {
    Database,
    Upload,
    RefreshCw,
    Server,
    HardDrive,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Folder,
    FileCheck,
    Check,
    Play,
    Info,
    ShieldAlert
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

interface SqlConfig {
    server: string;
    port?: number;
    instanceName?: string;
    targetDatabase: string;
    defaultBackupDir: string;
    hasAdminCredentials: boolean;
}

interface BackupFile {
    fileName: string;
    fullPath: string;
    sizeBytes: number;
    sizeMB: number;
    modifiedAt: string;
}

interface BackupHeader {
    databaseName: string;
    backupStartDate?: string;
    backupFinishDate?: string;
    backupSizeMB?: number;
    serverName?: string;
    softwareVersion?: string;
    isValid: boolean;
}

interface SyncReport {
    read: number;
    inserted: number;
    updated: number;
    unchanged: number;
    stockAdjusted: number;
    skipped: number;
    duplicates: number;
    errors: string[];
}

interface RestoreResponse {
    success: boolean;
    targetDatabase: string;
    filePath: string;
    durationMs: number;
    headerDetails?: BackupHeader;
    syncReport?: SyncReport;
    /** Local bills kept across the restore (see backend sqlRestoreCarryover.ts). */
    carryover?: {
        backupLastBillAt: string | null;
        localLastBillAt: string | null;
        finalLastBillAt: string | null;
        localWasNewer: boolean;
        carried: { key: string; billNo: string; at: string | null; lines: number; userId: string }[];
        conflicts: { key: string; localAt: string | null; backupAt: string | null }[];
        verified: boolean;
        savedTo?: string;
        previousDatabase?: string;
    };
    message: string;
}

const billTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : '—');

export const SqlRestoreManager: React.FC = () => {
    const [config, setConfig] = useState<SqlConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [discoveredFiles, setDiscoveredFiles] = useState<BackupFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [customDir, setCustomDir] = useState('');

    const [selectedPath, setSelectedPath] = useState('');
    const [customInputPath, setCustomInputPath] = useState('');
    const [inputMode, setInputMode] = useState<'detected' | 'custom'>('detected');

    const [verifying, setVerifying] = useState(false);
    const [headerDetails, setHeaderDetails] = useState<BackupHeader | null>(null);

    const [autoSync, setAutoSync] = useState(false); // the old catalog sync targeted MongoDB; SQL-only mode has none
    const [stockMode, setStockMode] = useState<'overwrite' | 'initial-only'>('overwrite');

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreStatusStep, setRestoreStatusStep] = useState<string>('');
    const [restoreResult, setRestoreResult] = useState<RestoreResponse | null>(null);

    // Fetch config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await api.get('/api/sync/sql/config');
            if (res.data?.success) {
                setConfig(res.data.data);
                if (res.data.data.defaultBackupDir) {
                    setCustomDir(res.data.data.defaultBackupDir);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load SQL database configuration');
        } finally {
            setLoadingConfig(false);
        }
    };

    // Scan backup files
    const scanBackupFiles = async (dirToScan?: string) => {
        setLoadingFiles(true);
        setHeaderDetails(null);
        try {
            const res = await api.post('/api/sync/sql/backup-files', {
                directory: dirToScan || customDir || undefined
            });
            if (res.data?.success) {
                setDiscoveredFiles(res.data.data || []);
                if (res.data.data?.length > 0 && !selectedPath) {
                    setSelectedPath(res.data.data[0].fullPath);
                }
                toast.success(`Found ${res.data.data?.length || 0} backup file(s)`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to scan backup files');
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        if (config) {
            scanBackupFiles();
        }
    }, [config]);

    // Active path
    const activeFilePath = inputMode === 'detected' ? selectedPath : customInputPath;

    // Verify backup header
    const handleVerify = async (pathToCheck?: string) => {
        const targetPath = pathToCheck || activeFilePath;
        if (!targetPath) {
            toast.warn('Please select or specify a backup file path first');
            return;
        }

        setVerifying(true);
        setHeaderDetails(null);
        try {
            const res = await api.post('/api/sync/sql/verify', { filePath: targetPath });
            if (res.data?.success) {
                setHeaderDetails(res.data.data);
                toast.success('Backup file verified successfully');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to verify backup file');
        } finally {
            setVerifying(false);
        }
    };

    // Trigger restore
    const executeRestore = async () => {
        if (!activeFilePath) {
            toast.warn('Please select a backup file');
            return;
        }

        setConfirmModalOpen(false);
        setIsRestoring(true);
        setRestoreResult(null);
        setRestoreStatusStep('Connecting to SQL Server and terminating active connections...');

        try {
            setTimeout(() => {
                setRestoreStatusStep('Restoring database from backup file (WITH REPLACE)...');
            }, 1500);

            if (autoSync) {
                setTimeout(() => {
                    setRestoreStatusStep('Database restored. Synchronizing catalog & inventory into ERP...');
                }, 4000);
            }

            const res = await api.post('/api/sync/sql/restore', {
                filePath: activeFilePath,
                targetDbName: config?.targetDatabase,
                autoSync,
                stockMode
            });

            if (res.data?.success) {
                setRestoreResult(res.data.data);
                toast.success('Database restore completed successfully!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Restore failed. Check server logs.');
        } finally {
            setIsRestoring(false);
            setRestoreStatusStep('');
        }
    };

    // Manual sync only
    const handleManualSync = async () => {
        const toastId = toast.loading('Applying ERP database access...');
        try {
            const res = await api.post('/api/sync/sql/access');
            if (res.data?.success) {
                toast.update(toastId, {
                    render: res.data.message || 'ERP database access applied.',
                    type: 'success',
                    isLoading: false,
                    autoClose: 5000
                });
            }
        } catch (err: any) {
            toast.update(toastId, {
                render: err.response?.data?.message || 'Could not apply ERP database access',
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Textile Shop Database Restore
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Restore periodic shop database backups (.bak) to replace the current SQL Server database and sync ERP stock.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualSync}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Apply ERP Database Access
                    </button>
                    <button
                        onClick={loadConfig}
                        disabled={loadingConfig}
                        className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-700 transition"
                        title="Refresh configuration"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingConfig ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Server & DB Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 font-medium">SQL Server Host</div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {config?.server || 'localhost'}
                            {config?.port ? `:${config.port}` : ''}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ready for Restore
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 font-medium">Target Database (To Replace)</div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                            [{config?.targetDatabase || 'SSS_copy'}]
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                            Overwritten with REPLACE option
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs text-neutral-500 font-medium">Default Backup Folder</div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-white truncate" title={config?.defaultBackupDir}>
                            {config?.defaultBackupDir || 'C:\\Textilesoft\\Backup'}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                            {discoveredFiles.length} file(s) found
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Restore Workflow */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Backup File Selector */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold">1</span>
                                Select Backup File (.bak)
                            </h2>

                            {/* Mode toggle */}
                            <div className="flex rounded-lg p-0.5 bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                                <button
                                    onClick={() => setInputMode('detected')}
                                    className={`px-3 py-1.5 rounded-md transition ${inputMode === 'detected' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                                >
                                    Discovered Backups
                                </button>
                                <button
                                    onClick={() => setInputMode('custom')}
                                    className={`px-3 py-1.5 rounded-md transition ${inputMode === 'custom' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                                >
                                    Custom Path
                                </button>
                            </div>
                        </div>

                        {inputMode === 'detected' ? (
                            <div className="space-y-3">
                                {/* Search directory input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customDir}
                                        onChange={(e) => setCustomDir(e.target.value)}
                                        placeholder="Scan directory (e.g. C:\Textilesoft\Backup)"
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => scanBackupFiles(customDir)}
                                        disabled={loadingFiles}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                                        Scan
                                    </button>
                                </div>

                                {/* List of files */}
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {loadingFiles ? (
                                        <div className="p-8 text-center text-sm text-neutral-500">
                                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                                            Scanning for .bak backup files...
                                        </div>
                                    ) : discoveredFiles.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-neutral-500">
                                            <HardDrive className="w-8 h-8 mx-auto mb-2 text-neutral-400 opacity-60" />
                                            No .bak files found in the specified folders.
                                            <div className="text-xs text-neutral-400 mt-1">
                                                Switch to &ldquo;Custom Path&rdquo; to paste the exact file path.
                                            </div>
                                        </div>
                                    ) : (
                                        discoveredFiles.map((file) => {
                                            const isSelected = selectedPath === file.fullPath;
                                            return (
                                                <div
                                                    key={file.fullPath}
                                                    onClick={() => {
                                                        setSelectedPath(file.fullPath);
                                                        setHeaderDetails(null);
                                                    }}
                                                    className={`p-3.5 flex items-center justify-between cursor-pointer transition ${isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-500' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                                                            <HardDrive className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                                {file.fileName}
                                                            </div>
                                                            <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                                                                <span>{file.sizeMB} MB</span>
                                                                <span>•</span>
                                                                <span>{new Date(file.modifiedAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="text-blue-600 dark:text-blue-400 pr-2">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                                        Full Windows Path to .bak file on SQL Server host
                                    </label>
                                    <input
                                        type="text"
                                        value={customInputPath}
                                        onChange={(e) => {
                                            setCustomInputPath(e.target.value);
                                            setHeaderDetails(null);
                                        }}
                                        placeholder="C:\Backups\TextileShop_2026-09-28.bak"
                                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                                <p className="text-xs text-neutral-500">
                                    The path must be accessible from the machine where SQL Server is running.
                                </p>
                            </div>
                        )}

                        {/* Selected file summary bar */}
                        {activeFilePath && (
                            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs text-neutral-500">Selected Backup File:</div>
                                    <div className="text-xs font-mono font-medium text-neutral-900 dark:text-white truncate">
                                        {activeFilePath}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleVerify()}
                                    disabled={verifying}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
                                >
                                    <FileCheck className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                                    {verifying ? 'Verifying...' : 'Verify File'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Verification & Restore Execution */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Header Verification Details */}
                    <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold">2</span>
                            Verification & Settings
                        </h2>

                        {headerDetails ? (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Valid SQL Server Backup File
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300 pt-1">
                                    <div>
                                        <span className="text-neutral-400">Database Name:</span>{' '}
                                        <span className="font-semibold text-neutral-900 dark:text-white">[{headerDetails.databaseName}]</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400">Backup Size:</span>{' '}
                                        <span className="font-semibold text-neutral-900 dark:text-white">{headerDetails.backupSizeMB} MB</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-neutral-400">Backup Taken At:</span>{' '}
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                            {headerDetails.backupStartDate ? new Date(headerDetails.backupStartDate).toLocaleString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-500 text-xs text-center border border-dashed border-neutral-300 dark:border-neutral-700">
                                Click &ldquo;Verify File&rdquo; to inspect the backup header details before initiating the restore.
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoSync}
                                    onChange={(e) => setAutoSync(e.target.checked)}
                                    className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                        Sync ERP Catalog & Stock after restore
                                    </span>
                                    <p className="text-xs text-neutral-500">
                                        Automatically updates ERP items, lots, and stock levels from the newly restored SQL database.
                                    </p>
                                </div>
                            </label>

                            {autoSync && (
                                <div className="pl-6">
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        Stock Synchronization Mode
                                    </label>
                                    <select
                                        value={stockMode}
                                        onChange={(e) => setStockMode(e.target.value as any)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    >
                                        <option value="overwrite">Overwrite Stock (Textilesoft is source of truth)</option>
                                        <option value="initial-only">Initial Stock Only (Safe for new items)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Restore Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => setConfirmModalOpen(true)}
                                disabled={!activeFilePath || isRestoring}
                                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-4 h-4" />
                                Restore & Overwrite Database
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* In-Progress Spinner & Live Status */}
            {isRestoring && (
                <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 shadow-sm animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                        <div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                Database Restore in Progress...
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {restoreStatusStep || 'Executing SQL Server restore...'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-neutral-500">
                        Please do not close this browser tab. Large backups can take several minutes.
                    </p>
                </div>
            )}

            {/* Restore Result Card */}
            {restoreResult && (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500 text-white">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    Restore Completed Successfully!
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                    {restoreResult.message}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            {(restoreResult.durationMs / 1000).toFixed(1)}s
                        </span>
                    </div>

                    {/* Sync Statistics if available */}
                    {restoreResult.carryover && (
                        <div className="mt-4 rounded-lg border border-default p-4 text-sm space-y-2">
                            <p className="font-bold text-main">Local bills kept across the restore</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div><span className="text-muted">Backup last bill</span><br />{billTime(restoreResult.carryover.backupLastBillAt)}</div>
                                <div><span className="text-muted">Local last bill (before)</span><br />{billTime(restoreResult.carryover.localLastBillAt)}</div>
                                <div><span className="text-muted">Last bill now</span><br /><b>{billTime(restoreResult.carryover.finalLastBillAt)}</b></div>
                            </div>
                            <p className="text-xs">
                                {restoreResult.carryover.carried.length
                                    ? `${restoreResult.carryover.carried.length} bill(s) were not in the backup and were re-applied — each verified present exactly once with all lines.`
                                    : 'No local bills needed keeping.'}
                                {restoreResult.carryover.savedTo ? ` Copy saved at ${restoreResult.carryover.savedTo}.` : ''}
                                {restoreResult.carryover.previousDatabase ? ` The old database is kept as ${restoreResult.carryover.previousDatabase}.` : ''}
                            </p>
                            {restoreResult.carryover.carried.length > 0 && (
                                <div className="max-h-40 overflow-y-auto text-xs border-t border-default pt-2">
                                    {restoreResult.carryover.carried.map(b => (
                                        <div key={b.key} className="flex justify-between gap-2">
                                            <span>{b.billNo || b.key}{b.userId ? ` · ${b.userId}` : ''}</span>
                                            <span className="text-muted">{billTime(b.at)} · {b.lines} line(s)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {restoreResult.carryover.conflicts.length > 0 && (
                                <p className="text-xs text-danger">
                                    {restoreResult.carryover.conflicts.length} local bill(s) share a bill key with a different bill in the backup and were not copied
                                    (they are in the saved copy): {restoreResult.carryover.conflicts.slice(0, 5).map(c => c.key).join(', ')}
                                    {restoreResult.carryover.conflicts.length > 5 ? '…' : ''}
                                </p>
                            )}
                        </div>
                    )}

                    {restoreResult.syncReport && (
                        <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
                                ERP Synchronization Summary:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-200 dark:border-emerald-800">
                                    <div className="text-neutral-400">Total Records Read</div>
                                    <div className="text-base font-bold text-neutral-900 dark:text-white">
                                        {restoreResult.syncReport.read}
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-200 dark:border-emerald-800">
                                    <div className="text-neutral-400">Items Updated</div>
                                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                                        {restoreResult.syncReport.updated}
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-200 dark:border-emerald-800">
                                    <div className="text-neutral-400">New Items Inserted</div>
                                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                        {restoreResult.syncReport.inserted}
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-200 dark:border-emerald-800">
                                    <div className="text-neutral-400">Stock Lots Adjusted</div>
                                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                                        {restoreResult.syncReport.stockAdjusted}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                Confirm Database Overwrite
                            </h3>
                        </div>

                        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <p>
                                Are you sure you want to restore this backup file into database{' '}
                                <strong className="text-neutral-900 dark:text-white font-mono">[{config?.targetDatabase || 'SSS_copy'}]</strong>?
                            </p>
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                                <div className="font-semibold flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Warning:
                                </div>
                                <div>• Any existing data in [{config?.targetDatabase}] will be permanently replaced.</div>
                                <div>• All active database connections to [{config?.targetDatabase}] will be closed immediately.</div>
                                {autoSync && <div>• ERP MongoDB catalog will be synchronized with the new stock records.</div>}
                            </div>
                            <div className="text-xs text-neutral-500 font-mono break-all pt-1">
                                File: {activeFilePath}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeRestore}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Yes, Overwrite & Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SqlRestoreManager;
