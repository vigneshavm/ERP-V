"use client";

import React, { useState } from 'react';
import JournalEntryList from '../components/JournalEntryList';
import JournalEntryForm from '../components/JournalEntryForm';
import { ArrowLeft } from 'lucide-react';

const JournalEntryView = () => {
    const [view, setView] = useState<'list' | 'form'>('list');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                        {view === 'list' ? 'Journal Entries' : 'New Journal Entry'}
                    </h1>
                    <p className="text-neutral-500 font-medium">
                        {view === 'list' 
                            ? 'Manage and audit manual accounting entries' 
                            : 'Create a balanced double-entry transaction record'}
                    </p>
                </div>
                {view === 'form' && (
                    <button 
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to List
                    </button>
                )}
            </header>

            {view === 'list' ? (
                <JournalEntryList onNewEntry={() => setView('form')} />
            ) : (
                <JournalEntryForm 
                    onCancel={() => setView('list')} 
                    onPost={() => setView('list')} 
                />
            )}
        </div>
    );
};

export default JournalEntryView;
