import React from 'react';
import { Palette, Sun, Moon, Shield, Upload, User, Layout as LayoutIcon, Camera } from 'lucide-react';

const COLORS = [
    { name: 'Indigo Signature', hex: '#4f46e5' },
    { name: 'Emerald Focus', hex: '#10b981' },
    { name: 'Rose Accent', hex: '#f43f5e' },
    { name: 'Amber Glow', hex: '#f59e0b' },
    { name: 'Blue Clarity', hex: '#3b82f6' },
    { name: 'Violet Vision', hex: '#8b5cf6' },
];

const PersonalizationTab = ({
    userTheme, setUserTheme, userColor, setUserColor, userLogo, handleUserLogoUpload
}) => {
    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* User Profile Perspective Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Your Workspace Perspective</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Individual preferences for your terminal session</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Dark/Light Choice */}
                    <div className="lg:col-span-2 space-y-4">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <LayoutIcon className="w-3 h-3" /> Preferred Display Mode
                        </label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-full shadow-inner">
                            <button
                                onClick={() => setUserTheme('light')}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-black rounded-xl transition-all ${userTheme === 'light' ? 'bg-white text-indigo-600 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${userTheme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    <Sun className="w-4 h-4" />
                                </div>
                                SOLAR (LIGHT)
                            </button>
                            <button
                                onClick={() => setUserTheme('dark')}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-black rounded-xl transition-all ${userTheme === 'dark' ? 'bg-slate-700 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${userTheme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    <Moon className="w-4 h-4" />
                                </div>
                                LUNAR (DARK)
                            </button>
                            <button
                                onClick={() => setUserTheme('system')}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-black rounded-xl transition-all ${userTheme === 'system' ? 'bg-white dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 shadow-xl border border-indigo-100 dark:border-indigo-900/50' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${userTheme === 'system' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    <Shield className="w-4 h-4" />
                                </div>
                                ADAPTIVE
                            </button>
                        </div>
                    </div>

                    {/* Color Hint */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Palette className="w-3 h-3" /> User Color Hint
                        </label>
                        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setUserColor(c.hex)}
                                    className={`w-9 h-9 rounded-xl border-[3px] transition-all duration-300 ${userColor === c.hex ? 'border-white dark:border-slate-500 scale-110 shadow-lg ring-1 ring-indigo-500' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Personalized Assets Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Avatar & Profile Image</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Manage how you appear across the system</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:rotate-6">
                            {userLogo ? (
                                <img src={userLogo} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center opacity-30">
                                    <User className="w-12 h-12 mx-auto" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                            <Camera className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Identity Image</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">Upload a professional avatar to be used in logs, audit trails, and the header of your dashboard.</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <input type="file" id="user-logo-upload" accept="image/*" className="hidden" onChange={handleUserLogoUpload} />
                            <label htmlFor="user-logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95">
                                <Upload className="w-4 h-4" /> UPLOAD IMAGE
                            </label>
                            <button className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl text-xs font-black tracking-widest hover:text-red-500 transition-colors">
                                RESET
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PersonalizationTab;
