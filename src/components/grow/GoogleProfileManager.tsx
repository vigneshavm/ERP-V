import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
    Globe,
    Phone,
    Mail,
    MapPin,
    Clock,
    Camera,
    BarChart,
    Plus,
    Trash2,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Share2,
    QrCode,
    Save,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { syncGoogleProfile, updateGoogleBusinessProfile } from '../../store/tenantSlice';
import { GoogleBusinessConfig, GooglePost, BusinessHour } from '../../types/tenant';

const GoogleProfileManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const gbpConfig = activeTenant?.googleBusinessConfig;
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'editor' | 'hours' | 'photos' | 'posts'>('overview');

    const handleSync = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(syncGoogleProfile(user.tenantId));
        setIsLoading(false);
    };

    if (!gbpConfig?.isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-[#4F46E5]/10 rounded-3xl flex items-center justify-center mb-8">
                    <Globe className="w-12 h-12 text-[#4F46E5]" />
                </div>
                <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Grow Your Local Presence</h2>
                <p className="text-[#64748B] mb-10 text-lg leading-relaxed">
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
        <div className="space-y-12 pb-32">
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
                    <button
                        onClick={handleSync}
                        className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                        title="Sync with Google"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-6 py-4 bg-[#020617] dark:bg-[#F8FAFC] text-white dark:text-[#020617] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                        View on Maps
                    </button>
                </div>
            </div>

            {/* Completeness & Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Completeness */}
                <div className="lg:col-span-1 bg-white dark:bg-[#020617] p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                        Profile Health
                    </h3>

                    <div className="relative pt-1">
                        <div className="flex mb-4 items-center justify-between">
                            <div>
                                <span className="text-xs font-black inline-block py-1 px-3 uppercase rounded-full text-[#4F46E5] bg-[#4F46E5]/10">
                                    Task Progress
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black inline-block text-[#4F46E5]">
                                    {gbpConfig.completeness}%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-4 mb-8 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                            <div style={{ width: `${gbpConfig.completeness}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4F46E5] transition-all duration-1000"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-[#64748B]">Business Hours</span>
                            <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-bold text-[#64748B]">Cover Photo</span>
                            <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                        <button className="w-full py-4 text-[#4F46E5] text-xs font-black uppercase tracking-widest border border-dashed border-[#4F46E5]/30 rounded-2xl hover:bg-[#4F46E5]/5 transition-all">
                            Show More Missing Tasks
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gbpConfig.metrics.map((metric) => (
                        <div key={metric.name} className="bg-white dark:bg-[#020617] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-[#4F46E5]/30 transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[#4F46E5] group-hover:scale-110 transition-transform">
                                    {metric.name.includes('Views') && <Globe className="w-6 h-6" />}
                                    {metric.name.includes('Calls') && <Phone className="w-6 h-6" />}
                                    {metric.name.includes('Direction') && <MapPin className="w-6 h-6" />}
                                    {metric.name.includes('Website') && <ExternalLink className="w-6 h-6" />}
                                </div>
                                <span className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC]">{metric.value.toLocaleString()}</span>
                            </div>
                            <h4 className="text-lg font-black text-[#020617] dark:text-[#F8FAFC] mb-1">{metric.name}</h4>
                            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{metric.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Tabs for Sections */}
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-3xl w-fit mx-auto">
                <button
                    onClick={() => setActiveSection('overview')}
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'overview' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                >
                    Info
                </button>
                <button
                    onClick={() => setActiveSection('hours')}
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'hours' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                >
                    Hours
                </button>
                <button
                    onClick={() => setActiveSection('photos')}
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'photos' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                >
                    Photos
                </button>
                <button
                    onClick={() => setActiveSection('posts')}
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'posts' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                >
                    Posts
                </button>
            </div>

            {/* Section Content */}
            <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in fade-in zoom-in duration-300">
                {activeSection === 'overview' && (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black tracking-tight">Business Information</h3>
                            {isOwnerOrAdmin && (
                                <button className="flex items-center gap-3 px-8 py-4 bg-[#4F46E5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4F46E5]/30">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Business Name</label>
                                <input
                                    type="text"
                                    defaultValue={gbpConfig.businessName}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Category</label>
                                <input
                                    type="text"
                                    defaultValue={gbpConfig.category}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Address</label>
                                <input
                                    type="text"
                                    defaultValue={gbpConfig.address}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Phone</label>
                                <input
                                    type="tel"
                                    defaultValue={gbpConfig.phone}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Website</label>
                                <input
                                    type="url"
                                    defaultValue={gbpConfig.website}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Description</label>
                                <textarea
                                    rows={4}
                                    defaultValue={gbpConfig.description}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'hours' && (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black tracking-tight">Business Hours</h3>
                            <button className="text-[#4F46E5] text-xs font-black uppercase tracking-widest hover:underline">
                                Copy to All Days
                            </button>
                        </div>

                        <div className="space-y-4">
                            {gbpConfig.hours.map((hour) => (
                                <div key={hour.day} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] gap-6">
                                    <span className="text-lg font-black w-32">{hour.day}</span>

                                    <div className="flex-1 flex items-center gap-6">
                                        {!hour.isClosed ? (
                                            <>
                                                <input type="time" defaultValue={hour.open} className="bg-white dark:bg-[#020617] p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold" />
                                                <span className="font-bold text-[#64748B]">to</span>
                                                <input type="time" defaultValue={hour.close} className="bg-white dark:bg-[#020617] p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold" />
                                            </>
                                        ) : (
                                            <span className="text-[#EF4444] font-black uppercase text-xs tracking-widest">Closed All Day</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${hour.isClosed ? 'bg-slate-300' : 'bg-[#22C55E]'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${hour.isClosed ? 'translate-x-0' : 'translate-x-6'}`} />
                                        </div>
                                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{hour.isClosed ? 'Closed' : 'Open'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'photos' && (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black tracking-tight">Photos & Media</h3>
                            <button className="flex items-center gap-3 px-8 py-4 bg-[#4F46E5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4F46E5]/30">
                                <Plus className="w-4 h-4" /> Add Photos
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {gbpConfig.photos.map((photo) => (
                                <div key={photo.id} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                                    <img src={photo.url} alt="Business" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button className="p-3 bg-white text-[#EF4444] rounded-xl shadow-lg hover:scale-110 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-[#020617]">
                                            {photo.type}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all cursor-pointer text-[#64748B] hover:text-[#4F46E5]">
                                <Camera className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'posts' && (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black tracking-tight">Recent Updates</h3>
                            <button className="flex items-center gap-3 px-8 py-4 bg-[#4F46E5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4F46E5]/30">
                                <Plus className="w-4 h-4" /> Create Post
                            </button>
                        </div>

                        <div className="space-y-6">
                            {gbpConfig.posts.map((post) => (
                                <div key={post.id} className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-[#4F46E5]/10 text-[#4F46E5] rounded-full text-[10px] font-black uppercase">
                                                {post.type}
                                            </span>
                                            <span className="text-xs font-bold text-[#64748B]">Published {new Date(post.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-lg font-bold text-[#020617] dark:text-[#F8FAFC] leading-relaxed">
                                            {post.content}
                                        </p>
                                    </div>
                                    <div className="flex flex-row md:flex-col items-center justify-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-8">
                                        <button className="p-4 bg-white dark:bg-[#020617] rounded-xl shadow-md hover:text-[#4F46E5] transition-all" title="Edit Post">
                                            <Save className="w-5 h-5" />
                                        </button>
                                        <button className="p-4 bg-white dark:bg-[#020617] rounded-xl shadow-md hover:text-[#EF4444] transition-all" title="Delete Post">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions Footer */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xl flex items-center gap-2">
                <button className="flex items-center gap-3 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                    <Share2 className="w-5 h-5 text-[#4F46E5]" />
                    <span className="text-xs font-black uppercase tracking-widest">Share Profile</span>
                </button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
                <button className="flex items-center gap-3 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                    <QrCode className="w-5 h-5 text-[#4F46E5]" />
                    <span className="text-xs font-black uppercase tracking-widest">Generate QR</span>
                </button>
            </div>
        </div>
    );
};

export default GoogleProfileManager;
