import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] h-full p-8 text-center bg-white dark:bg-slate-900 rounded-sm m-4 border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400 animate-pulse">
                <Construction className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                {title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {description || "This module is currently under active development. BizzAI is working hard to bring this feature to you soon."}
            </p>
            <div className="mt-8 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-yellow-200 dark:border-yellow-900/50">
                Coming Soon
            </div>
        </div>
    );
};

export default PlaceholderPage;
