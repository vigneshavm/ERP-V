import React from 'react';
import { Unplug } from 'lucide-react';
import Layout from './Layout';

export interface NotConnectedInfo {
    title: string;
    /** Optional pointer to where the real figures live today. */
    detail?: string;
}

/**
 * Shown instead of a screen that has no live data behind it yet. It deliberately shows no figures:
 * these screens used to render hardcoded sample numbers that looked like the shop's own.
 */
const NotConnectedPage: React.FC<NotConnectedInfo> = ({ title, detail }) => (
    <Layout>
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Unplug className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                This screen isn't connected to your shop's data yet, so it shows nothing rather than sample figures.
            </p>
            {detail && <p className="mt-3 max-w-md text-sm font-medium text-slate-700 dark:text-slate-300">{detail}</p>}
        </div>
    </Layout>
);

export default NotConnectedPage;
