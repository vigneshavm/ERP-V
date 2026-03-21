import React from 'react';
import { Sparkles, X, Loader2, Send, Bot, RotateCcw } from 'lucide-react';

interface StorefrontAiPanelProps {
    showAi: boolean;
    setShowAi: (val: boolean) => void;
    aiQuery: string;
    setAiQuery: (val: string) => void;
    aiThinking: boolean;
    aiResult: { text: string, ids: string[] } | null;
    visualSearchImage: string | null;
    isVisualSearching: boolean;
    handleAiSearch: () => void;
    clearAi: () => void;
}

export const StorefrontAiPanel: React.FC<StorefrontAiPanelProps> = ({
    showAi,
    setShowAi,
    aiQuery,
    setAiQuery,
    aiThinking,
    aiResult,
    visualSearchImage,
    isVisualSearching,
    handleAiSearch,
    clearAi
}) => {
    if (!showAi && !aiResult && !visualSearchImage) return null;

    return (
        <div className="mb-8 bg-white dark:bg-[var(--erp-bg)] rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden animate-in slide-in-from-top-2">
            {showAi && !visualSearchImage && (
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-bold">AI Shopping Assistant</span>
                    </div>
                    <button onClick={() => setShowAi(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="p-6">
                {visualSearchImage && (
                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-default dark:border-default">
                        <div className="relative group">
                            <img src={visualSearchImage} alt="Visual Search" className="w-24 h-24 object-cover rounded-xl border-2 border-indigo-500 shadow-md" />
                            <button onClick={clearAi} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                        <div>
                            <h3 className="font-bold text-main text-lg flex items-center gap-2">
                                Visual Search Active
                                {isVisualSearching && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                            </h3>
                            <p className="text-muted dark:text-muted text-sm">
                                {isVisualSearching ? 'Analyzing image and matching products...' : 'Here are products that visually match your upload.'}
                            </p>
                        </div>
                    </div>
                )}

                {showAi && !visualSearchImage && !aiResult && !aiThinking && (
                    <div className="relative">
                        <textarea
                            value={aiQuery}
                            onChange={e => setAiQuery(e.target.value)}
                            placeholder="Describe what you are looking for..."
                            className="w-full bg-[var(--erp-bg-sunken)] dark:bg-slate-950 border border-default dark:border-default rounded-xl p-4 pr-14 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20 text-main placeholder:text-muted"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSearch(); } }}
                        />
                        <button
                            onClick={handleAiSearch}
                            disabled={!aiQuery.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {aiThinking && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                        <p className="text-main dark:text-main font-bold animate-pulse">Thinking...</p>
                    </div>
                )}

                {aiResult && (
                    <div className="animate-in fade-in">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <div className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] p-4 rounded-2xl rounded-tl-none text-sm text-main dark:text-slate-200 leading-relaxed shadow-sm">
                                    {aiResult.text}
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                                        {aiResult.ids.length} Results
                                    </span>
                                    <button onClick={clearAi} className="text-xs text-muted hover:text-main dark:hover:text-slate-200 font-bold flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> Clear Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
