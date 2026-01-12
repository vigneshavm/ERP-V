
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import {
    Globe, Phone, Mail, MapPin, Camera, Plus, Trash2, CheckCircle,
    AlertCircle, RefreshCw, ExternalLink, Share2, QrCode, Save,
} from 'lucide-react';
import { syncGoogleProfile } from '../../../store';

const GoogleBusiness: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { activeTab } = useSelector((state: RootState) => state.ui);
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const gbpConfig = activeTenant?.googleBusinessConfig;
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [isLoading, setIsLoading] = useState(false);
    const activeSection = (activeTab.includes('PROFILE') ? 'profile' :
        activeTab.includes('REVIEWS') ? 'reviews' :
            activeTab.includes('POSTS') ? 'posts' :
                activeTab.includes('INSIGHTS') ? 'insights' :
                    activeTab.includes('PHOTOS') ? 'photos' : 'profile');

    const handleSync = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(syncGoogleProfile(user.tenantId));
        setIsLoading(false);
    };

    if (!gbpConfig?.isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-[#4F46E5]/10 rounded-[2rem] flex items-center justify-center mb-8">
                    <Globe className="w-12 h-12 text-[#4F46E5]" />
                </div>
                <h2 className="text-4xl font-black text-[#020617] dark:text-[#F8FAFC] mb-6 tracking-tight">Grow Your Local Presence</h2>
                <p className="text-[#64748B] mb-12 text-xl leading-relaxed">
                    Connect your Google Business Profile to appear on Google Search and Maps.
                    Manage your store's information, track performance, and post updates directly from your POS.
                </p>
                <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="px-10 py-5 bg-[#4F46E5] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#4F46E5]/30 flex items-center gap-4"
                >
                    {isLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    Connect Google Profile
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white dark:bg-[#020617] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#4F46E5] rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC]">{gbpConfig.businessName}</h2>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-widest mt-1">
                            {gbpConfig.verificationStatus === 'VERIFIED' ? (
                                <span className="text-[#22C55E] flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Verified on Google
                                </span>
                            ) : (
                                <span className="text-[#F59E0B] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Pending Verification
                                </span>
                            )}
                            <span>•</span>
                            <span>Last synced: {gbpConfig.lastSyncAt ? new Date(gbpConfig.lastSyncAt).toLocaleTimeString() : 'Never'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleSync} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors" title="Sync with Google">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-6 py-4 bg-[#020617] dark:bg-[#F8FAFC] text-white dark:text-[#020617] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                        View on Maps
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {gbpConfig.metrics.map((metric) => (
                    <div key={metric.name} className="bg-white dark:bg-[#020617] p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg group hover:border-[#4F46E5]/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[#4F46E5] group-hover:scale-110 transition-transform">
                                {metric.name.includes('Views') && <Globe className="w-5 h-5" />}
                                {metric.name.includes('Calls') && <Phone className="w-5 h-5" />}
                                {metric.name.includes('Direction') && <MapPin className="w-5 h-5" />}
                                {metric.name.includes('Website') && <ExternalLink className="w-5 h-5" />}
                            </div>
                            <span className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC]">{metric.value.toLocaleString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#64748B] uppercase tracking-wide">{metric.name}</h4>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Information Editor */}
                <div className="flex-1 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Business Information</h3>
                        <button className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4F46E5]/30">
                            <Save className="w-4 h-4" /> Save
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Business Name</label>
                            <input type="text" defaultValue={gbpConfig.businessName} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Category</label>
                            <input type="text" defaultValue={gbpConfig.category} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Address</label>
                            <input type="text" defaultValue={gbpConfig.address} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="bg-[#4F46E5] text-white rounded-[2rem] p-6 shadow-xl shadow-[#4F46E5]/20">
                        <h3 className="text-lg font-black mb-4">Profile Health</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black">{gbpConfig.completeness}%</span>
                            <span className="text-indigo-200 mb-1 font-bold">Complete</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2 mb-4">
                            <div style={{ width: `${gbpConfig.completeness}%` }} className="h-full bg-white rounded-full"></div>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">Complete your profile to rank higher on Google Maps.</p>
                    </div>

                    <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-lg">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#64748B] mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors font-bold text-sm">
                                <Share2 className="w-4 h-4 text-[#4F46E5]" /> Share Profile
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors font-bold text-sm">
                                <QrCode className="w-4 h-4 text-[#4F46E5]" /> Get QR Code
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleBusiness;
