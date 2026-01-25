import React from 'react';
import { Palette, Sun, Moon, Shield, Upload } from 'lucide-react';

interface PersonalizationTabProps {
    userTheme: 'light' | 'dark' | 'system';
    setUserTheme: (t: 'light' | 'dark' | 'system') => void;
    userColor: string;
    setUserColor: (c: string) => void;
    userLogo: string;
    handleUserLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const COLORS = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Violet', hex: '#8b5cf6' },
];

const PersonalizationTab: React.FC<PersonalizationTabProps> = ({
    userTheme, setUserTheme, userColor, setUserColor, userLogo, handleUserLogoUpload
}) => {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-500" /> Your Personal Appearance
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preferred Theme</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                            <button onClick={() => setUserTheme('light')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button onClick={() => setUserTheme('dark')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                            <button onClick={() => setUserTheme('system')} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${userTheme === 'system' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                <Shield className="w-4 h-4" /> System
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Personal Color Hint</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setUserColor(c.hex)}
                                    className={`w-10 h-10 rounded-full border-4 transition-all ${userColor === c.hex ? 'border-white dark:border-slate-600 scale-110 shadow-md ring-2 ring-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Custom Avatar/Logo</label>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                {userLogo ? <img src={userLogo} className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs">No Avatar</span>}
                            </div>
                            <div className="space-y-3">
                                <input type="file" id="user-logo-upload" accept="image/*" className="hidden" onChange={handleUserLogoUpload} />
                                <label htmlFor="user-logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-bold transition-colors">
                                    <Upload className="w-4 h-4" /> Change Avatar
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizationTab;
