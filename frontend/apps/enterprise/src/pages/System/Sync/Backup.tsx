import { useState } from 'react';
import Layout from "@/shared/ui/Layout/Layout";
import FormInput from "@/shared/ui/Form/Input";
import { Database, Download, HardDrive, Cloud, Clock, CheckCircle, XCircle, Loader, Settings, Save, Trash2, Eye, Calendar, Archive } from 'lucide-react';

const Backup = () => {
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupDestination, setBackupDestination] = useState('local');
    const [scheduleTime, setScheduleTime] = useState('02:00');

    const backupHistory = [
        { id: 1, date: '2024-01-25 02:00', size: '45.2 MB', location: 'Local Storage', status: 'completed' },
        { id: 2, date: '2024-01-24 02:00', size: '44.8 MB', location: 'Google Drive', status: 'completed' },
        { id: 3, date: '2024-01-23 02:00', size: '44.5 MB', location: 'Local Storage', status: 'completed' },
        { id: 4, date: '2024-01-22 02:00', size: '44.1 MB', location: 'Local Storage', status: 'failed' },
        { id: 5, date: '2024-01-21 02:00', size: '43.9 MB', location: 'Google Drive', status: 'completed' }
    ];

    const storageUsage = {
        used: 220,
        total: 500,
        percentage: 44
    };

    const lastBackup = {
        date: '2024-01-25',
        time: '02:00 AM',
        size: '45.2 MB',
        status: 'Success'
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Failed
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200">
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        In Progress
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--erp-bg-sunken)] text-secondary text-xs font-medium rounded-lg border border-default">
                        {status}
                    </span>
                );
        }
    };

    return (
        <Layout>
            <div className="page-shell">
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Database className="w-6 h-6 text-main" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-main">Backup</h1>
                        <p className="text-muted text-sm">Protect your business data with automatic backups</p>
                    </div>
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all shadow-lg shadow-cyan-500/25">
                    <Download className="w-4 h-4" />
                    Create Backup Now
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Backup Settings Card */}
                    <div className="bg-white border border-default rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-[var(--erp-bg-sunken)] rounded-lg flex items-center justify-center">
                                <Settings className="w-4 h-4 text-secondary" />
                            </div>
                            <h2 className="text-base font-semibold text-main">Backup Settings</h2>
                        </div>
                        <div className="space-y-5">
                            {/* Auto Backup Toggle */}
                            <div className="flex items-center justify-between p-4 bg-[var(--erp-bg-sunken)] rounded-xl">
                                <div>
                                    <p className="font-medium text-main">Automatic Backup</p>
                                    <p className="text-sm text-muted">Enable daily automatic backups</p>
                                </div>
                                <button
                                    onClick={() => setAutoBackup(!autoBackup)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${autoBackup ? 'bg-cyan-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoBackup ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Backup Destination */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-3">Backup Destination</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBackupDestination('local')}
                                        className={`p-4 border-2 rounded-xl transition-all ${backupDestination === 'local'
                                            ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/20'
                                            : 'border-default hover:border-cyan-300 hover:bg-cyan-50/50'}`}
                                    >
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${backupDestination === 'local' ? 'bg-cyan-100' : 'bg-[var(--erp-bg-sunken)]'}`}>
                                            <HardDrive className={`w-6 h-6 ${backupDestination === 'local' ? 'text-cyan-600' : 'text-muted'}`} />
                                        </div>
                                        <p className={`font-medium ${backupDestination === 'local' ? 'text-main' : 'text-secondary'}`}>Local Storage</p>
                                    </button>
                                    <button
                                        onClick={() => setBackupDestination('drive')}
                                        className={`p-4 border-2 rounded-xl transition-all ${backupDestination === 'drive'
                                            ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/20'
                                            : 'border-default hover:border-cyan-300 hover:bg-cyan-50/50'}`}
                                    >
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${backupDestination === 'drive' ? 'bg-cyan-100' : 'bg-[var(--erp-bg-sunken)]'}`}>
                                            <Cloud className={`w-6 h-6 ${backupDestination === 'drive' ? 'text-cyan-600' : 'text-muted'}`} />
                                        </div>
                                        <p className={`font-medium ${backupDestination === 'drive' ? 'text-main' : 'text-secondary'}`}>Google Drive</p>
                                    </button>
                                </div>
                            </div>

                            {/* Schedule Time */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-2">
                                    <Clock className="w-4 h-4" />
                                    Schedule Backup Time
                                </label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--erp-bg-sunken)] border border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                />
                            </div>

                            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all shadow-lg shadow-cyan-500/25">
                                <Save className="w-4 h-4" />
                                Save Settings
                            </button>
                        </div>
                    </div>

                    {/* Backup History Card */}
                    <div className="bg-white border border-default rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-[var(--erp-bg-sunken)] rounded-lg flex items-center justify-center">
                                <Archive className="w-4 h-4 text-secondary" />
                            </div>
                            <h2 className="text-base font-semibold text-main">Backup History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--erp-bg-sunken)] border-b border-default">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Date & Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Size</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {backupHistory.map((backup) => (
                                        <tr key={backup.id} className="group hover:bg-[var(--erp-bg-sunken)]/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted" />
                                                    <span className="text-sm font-medium text-main">{backup.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-secondary">{backup.size}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {backup.location === 'Local Storage' ? (
                                                        <HardDrive className="w-4 h-4 text-muted" />
                                                    ) : (
                                                        <Cloud className="w-4 h-4 text-blue-500" />
                                                    )}
                                                    <span className="text-sm text-secondary">{backup.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(backup.status)}</td>
                                            <td className="px-4 py-3">
                                                <button className="p-1.5 text-muted hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Last Backup Card */}
                    <div className="bg-white border border-default rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-main" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-main">Last Backup</h2>
                                    <p className="text-cyan-100 text-sm">Successful</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted">Date</span>
                                <span className="text-sm font-medium text-main">{lastBackup.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted">Time</span>
                                <span className="text-sm font-medium text-main">{lastBackup.time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted">Size</span>
                                <span className="text-sm font-medium text-main">{lastBackup.size}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted">Status</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md">
                                    <CheckCircle className="w-3 h-3" />
                                    {lastBackup.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Storage Usage Card */}
                    <div className="bg-white border border-default rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[var(--erp-bg-sunken)] rounded-lg flex items-center justify-center">
                                <HardDrive className="w-4 h-4 text-secondary" />
                            </div>
                            <h2 className="text-base font-semibold text-main">Storage Usage</h2>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Used: {storageUsage.used} MB</span>
                                <span className="text-muted">Total: {storageUsage.total} MB</span>
                            </div>
                            <div className="w-full bg-[var(--erp-bg-sunken)] rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-cyan-500 to-teal-500 h-3 rounded-full transition-all"
                                    style={{ width: `${storageUsage.percentage}%` }}
                                />
                            </div>
                            <p className="text-center text-2xl font-bold text-cyan-600 mt-3">
                                {storageUsage.percentage}%
                            </p>
                        </div>
                        <p className="text-sm text-muted text-center">
                            {storageUsage.total - storageUsage.used} MB available
                        </p>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white border border-default rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[var(--erp-bg-sunken)] rounded-lg flex items-center justify-center">
                                <Settings className="w-4 h-4 text-secondary" />
                            </div>
                            <h2 className="text-base font-semibold text-main">Quick Actions</h2>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Download Latest Backup
                            </button>
                            <button className="w-full py-2.5 border border-default text-secondary text-sm font-medium rounded-xl hover:bg-[var(--erp-bg-sunken)] transition-colors flex items-center justify-center gap-2">
                                <Eye className="w-4 h-4" />
                                View All Backups
                            </button>
                            <button className="w-full py-2.5 border border-default text-secondary text-sm font-medium rounded-xl hover:bg-[var(--erp-bg-sunken)] transition-colors flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Clean Old Backups
                            </button>
                        </div>
                    </div>
                </div>
            </div>
                  </div>

        </Layout>
    );
};

export default Backup;
