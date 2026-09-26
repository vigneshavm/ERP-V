import React, { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Export button with progress and failure states. `onExport` may page through the whole API
 * (every row for the current filters, not just the visible page), so it can take a moment.
 */
export const ReportExportButton: React.FC<{ onExport: () => Promise<void> | void; disabled?: boolean }> = ({ onExport, disabled }) => {
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    const run = async () => {
        setBusy(true);
        setFailed(false);
        try {
            await onExport();
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={run}
            disabled={busy || disabled}
            title={failed ? 'Export failed. Try again.' : 'Download every row for the current period and filters as CSV'}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold disabled:opacity-50 ${failed
                ? 'border-danger-line text-danger bg-white dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
            <Download className={`w-4 h-4 ${busy ? 'animate-pulse' : ''}`} aria-hidden />
            {busy ? 'Exporting…' : failed ? 'Retry export' : 'Export CSV'}
        </button>
    );
};
