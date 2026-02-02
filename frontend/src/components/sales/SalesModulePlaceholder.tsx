import React from 'react';

const SalesModulePlaceholder: React.FC<{ view?: string }> = ({ view }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v12a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Sales Module: {view || 'Overview'}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                This component is under development. The full feature set for {view || 'this view'} will be available in the next update.
            </p>
        </div>
    );
};

export default SalesModulePlaceholder;
