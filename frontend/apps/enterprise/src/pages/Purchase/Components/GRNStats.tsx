import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock, Box } from 'lucide-react';

interface GRNStatsProps {
    stats: {
        completeCount: number;
        partialCount: number;
        pendingCount: number;
        totalExpected: number;
        totalReceived: number;
        totalCount: number;
    };
}

const GRNStats: React.FC<GRNStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-secondary uppercase">Total GRNs</p>
                    <FileText className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalCount}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-secondary uppercase">Complete</p>
                    <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-bold text-success">{stats.completeCount}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-secondary uppercase">Partial</p>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <p className="text-2xl font-bold text-warning">{stats.partialCount}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-secondary uppercase">Pending</p>
                    <Clock className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-2xl font-bold text-muted">{stats.pendingCount}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-secondary uppercase">Items Received</p>
                    <Box className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {stats.totalReceived} <span className="text-sm text-neutral-400">/ {stats.totalExpected}</span>
                </p>
            </div>
        </div>
    );
};

export default GRNStats;
