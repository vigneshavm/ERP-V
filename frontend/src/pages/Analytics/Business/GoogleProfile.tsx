import React, { useState, useEffect } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import FormInput from "../../../components/core/Form/Input";
import StatsCard from "../../../components/shared/Display/StatsCard";
import BusinessSubNav from './BusinessSubNav';
import { googleBusinessService, GoogleBusinessProfileData, GoogleReview, GooglePost } from "../../../services/googleBusinessService";
import { toast } from 'react-toastify';

type ProfileData = GoogleBusinessProfileData;


interface WorkingHours {
    open: string;
    close: string;
    closed: boolean;
}

interface HoursState {
    [key: string]: WorkingHours;
}

interface Photo {
    id: number;
    url: string;
    type: string;
}

const GoogleProfile: React.FC = () => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [showHoursEditor, setShowHoursEditor] = useState<boolean>(false);
    const [showPhotoUpload, setShowPhotoUpload] = useState<boolean>(false);
    const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
    const [newPostContent, setNewPostContent] = useState<string>('');
    const [newPostType, setNewPostType] = useState<'UPDATE' | 'OFFER' | 'EVENT'>('UPDATE');
    const [newPostImage, setNewPostImage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'posts'>('overview');

    const [profileData, setProfileData] = useState<ProfileData>({
        businessName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        category: '',
        description: '',
        verified: false,
        insights: { views: 0, calls: 0, directions: 0, websiteClicks: 0 },
        completeness: 0,
        isConnected: false,
        reviews: [],
        posts: []
    });

    const [hours, setHours] = useState<HoursState>({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { open: '', close: '', closed: true }
    });

    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await googleBusinessService.getProfile();
            setProfileData({
                ...data,
                insights: data.insights || { views: 0, calls: 0, directions: 0, websiteClicks: 0 },
                completeness: data.completeness || 0,
                isConnected: data.isConnected || false,
                reviews: data.reviews || [],
                posts: data.posts || []
            });
            if ((data as any).hours) {
                setHours((data as any).hours);
            }
        } catch (error: any) {
            toast.error('Failed to load business profile');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await googleBusinessService.updateProfile({
                ...profileData,
                hours
            } as any);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleGoogleSync = async () => {
        try {
            const data = await googleBusinessService.syncProfile();
            if (data) {
                toast.success('Google Business Profile synchronized successfully');
                fetchProfile();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initiate sync');
        }
    };

    const handleSaveHours = async () => {
        try {
            await googleBusinessService.updateProfile({ hours } as any);
            toast.success('Business hours updated');
            setShowHoursEditor(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update hours');
        }
    };

    const handleReply = async (reviewId: string, reviewer: string) => {
        const reply = window.prompt(`Reply to ${reviewer}:`);
        if (reply) {
            try {
                await googleBusinessService.replyToReview(reviewId, reply);
                toast.success('Reply posted successfully');
                // Optimistically update UI
                const updatedReviews = profileData.reviews?.map(r =>
                    (r as any)._id === reviewId || r.reviewer === reviewer ? { ...r, reply } : r
                );
                setProfileData({ ...profileData, reviews: updatedReviews });
            } catch (error: any) {
                toast.error('Failed to post reply');
            }
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            toast.error('Post content cannot be empty');
            return;
        }

        try {
            const post = await googleBusinessService.createPost({
                content: newPostContent,
                type: newPostType,
                imageUrl: newPostImage
            });
            toast.success('Post created and deployed successfully');
            setProfileData({
                ...profileData,
                posts: [post, ...(profileData.posts || [])]
            });
            setNewPostContent('');
            setNewPostImage('');
            setShowCreatePostModal(false);
        } catch (error: any) {
            toast.error('Failed to create post');
        }
    };

    // Use real insights from profileData
    const insights = profileData.insights || {
        views: 0,
        calls: 0,
        directions: 0,
        websiteClicks: 0
    };

    const completeness: number = profileData.completeness || 0;

    const photos = profileData.photos || [];

    if (!loading && !profileData.isConnected) {
        return (
            <Layout>
                <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50/50 to-white">
                    <div className="relative mb-12 group">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                        <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-indigo-50 transform group-hover:rotate-6 transition-transform duration-500">
                            <svg className="w-16 h-16 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.147-3.32C22.8 18.48 23.533 15.5 23.533 13.067c0-.987-.067-1.667-.187-2.147h-10.867z" />
                            </svg>
                        </div>
                    </div>

                    <div className="max-w-xl text-center">
                        <div className="inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-indigo-100 shadow-sm">
                            Google Integration
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight italic">
                            Command Your <span className="text-indigo-600">Search</span> Presence
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl mb-12 leading-relaxed font-medium">
                            Synthesize your physical presence with digital dominance. Connect your Google Business Profile to orchestrate reviews, hours, and analytics with precision.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleGoogleSync}
                                className="px-10 py-5 bg-indigo-600 text-white text-lg font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.147-3.32C22.8 18.48 23.533 15.5 23.533 13.067c0-.987-.067-1.667-.187-2.147h-10.867z" />
                                </svg>
                                Connect with Google
                            </button>
                        </div>

                        <div className="mt-16 grid grid-cols-3 gap-8 pt-12 border-t border-gray-100">
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-900 mb-1">Instant</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Synchronization</div>
                            </div>
                            <div className="text-center border-x border-gray-100">
                                <div className="text-2xl font-black text-gray-900 mb-1">Secure</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">OAuth 2.0</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-900 mb-1">Unified</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dashboard</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="relative mb-10">
                <PageHeader
                    title="Google Business Profile"
                    description="Orchestrate your omni-channel presence across Google Search and Maps"
                    breadcrumbs={[
                        { label: 'Dashboard', link: '/' },
                        { label: 'Business', link: '/business/online-shop' },
                        { label: 'Growth Tools', link: '/business/online-shop' },
                        { label: 'Google Profile' }
                    ]}
                    actions={[
                        <button
                            key="sync"
                            onClick={handleGoogleSync}
                            className="px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-700 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-50 flex items-center shadow-lg transition-all active:scale-95"
                        >
                            <svg className="w-5 h-5 mr-3 text-indigo-600 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.147-3.32C22.8 18.48 23.533 15.5 23.533 13.067c0-.987-.067-1.667-.187-2.147h-10.867z" />
                            </svg>
                            Sync Profile
                        </button>
                    ]}
                />
            </div>

            <BusinessSubNav />

            {/* Navigation Tabs - Refined */}
            <div className="flex space-x-2 bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl mb-10 max-w-md border border-gray-200">
                {['overview', 'reviews', 'posts'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === tab
                            ? 'bg-white text-indigo-600 shadow-xl border border-indigo-50'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Profile Completeness - Refined Banner */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-10 mb-12 shadow-2xl border border-white/10 group">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={263.89} strokeDashoffset={263.89 - (263.89 * completeness) / 100} className="text-white" strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute font-black text-xl text-white">{completeness}%</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase mb-3 text-white border border-white/30">
                                        Optimization Level
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Profile Strength: Exceptional</h3>
                                    <p className="text-indigo-100 font-medium max-w-md opacity-80 leading-relaxed">
                                        Your business visibility is in the top 5% in your region. Complete remaining steps to reach full dominance.
                                    </p>
                                </div>
                            </div>
                            <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1 active:scale-95 whitespace-nowrap">
                                View Optimization Plan
                            </button>
                        </div>
                    </div>

                    {/* Insights - Premium Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatsCard
                            title="Search Visibility"
                            value={insights.views.toLocaleString()}
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            iconBgColor="bg-blue-50"
                            iconColor="text-blue-600"
                        />
                        <StatsCard
                            title="Call Operations"
                            value={insights.calls.toString()}
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                            iconBgColor="bg-green-50"
                            iconColor="text-green-600"
                        />
                        <StatsCard
                            title="Logistics Queries"
                            value={insights.directions.toString()}
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            iconBgColor="bg-purple-50"
                            iconColor="text-purple-600"
                        />
                        <StatsCard
                            title="Digital Conversions"
                            value={insights.websiteClicks.toString()}
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                            iconBgColor="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Business Profile - Refined Card */}
                            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl">
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-indigo-50">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Corporate Identity</h2>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Core Business parameters</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {profileData.verified && (
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100 flex items-center shadow-sm">
                                                <svg className="w-3.5 h-3.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verified Entity
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                        >
                                            {isEditing ? 'Cancel Edit' : 'Edit Identity'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8">
                                    {isEditing ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormInput
                                                    label="Business Name"
                                                    name="businessName"
                                                    value={profileData.businessName}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, businessName: e.target.value })}
                                                />
                                                <FormInput
                                                    label="Category"
                                                    name="category"
                                                    value={profileData.category}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, category: e.target.value })}
                                                />
                                            </div>
                                            <FormInput
                                                label="Global Headquarters Address"
                                                name="address"
                                                value={profileData.address}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, address: e.target.value })}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormInput
                                                    label="Direct Line"
                                                    name="phone"
                                                    value={profileData.phone}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, phone: e.target.value })}
                                                />
                                                <FormInput
                                                    label="Communication Email"
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, email: e.target.value })}
                                                />
                                            </div>
                                            <FormInput
                                                label="Digital Domain (Website URL)"
                                                name="website"
                                                value={profileData.website}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, website: e.target.value })}
                                            />
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Narrative / Description</label>
                                                <textarea
                                                    value={profileData.description}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfileData({ ...profileData, description: e.target.value })}
                                                    rows={5}
                                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-600 transition-all resize-none shadow-inner font-medium text-gray-700"
                                                    placeholder="Define your business mission..."
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={handleSave}
                                                    className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                                                >
                                                    Deploy Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10 animate-in fade-in duration-700">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                                <div className="col-span-full mb-4">
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 leading-none">Entity Designation</p>
                                                    <p className="text-3xl font-black text-gray-900 tracking-tight">{profileData.businessName}</p>
                                                </div>
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Classification</p>
                                                    <p className="font-bold text-gray-900">{profileData.category}</p>
                                                </div>
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Node Location</p>
                                                    <p className="font-bold text-gray-900 leading-snug">{profileData.address}</p>
                                                </div>
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Channel (Phone)</p>
                                                    <p className="font-bold text-gray-900">{profileData.phone}</p>
                                                </div>
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Endpoint (Email)</p>
                                                    <p className="font-bold text-gray-900 truncate">{profileData.email}</p>
                                                </div>
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">URL Anchor</p>
                                                    <a href={`https://${profileData.website}`} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
                                                        Visit Node
                                                        <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-indigo-50/30 rounded-[2rem] border-2 border-indigo-100/50 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <svg className="w-20 h-20 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 10.06-11.427l.718 1.258c-4.665.901-7.112 3.036-7.332 6.393 1.13.14 2.454.912 2.454 2.88 0 2.227-1.417 3.513-3.011 3.513-1.571 0-3.006-1.317-3.006-3.756 0-2.531 1.637-4.247 3.511-4.832V1.192c-6.83 1.839-10.547 7.745-10.547 13.554V21h7.117z" /></svg>
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Strategic Narrative</p>
                                                <p className="text-gray-700 leading-relaxed font-semibold italic text-lg opacity-90 relative z-10">"{profileData.description}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operational Cycle - Refined Hours */}
                            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl">
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg ring-4 ring-purple-50">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Operational Cycles</h2>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Service availability</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowHoursEditor(!showHoursEditor)}
                                        className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                    >
                                        {showHoursEditor ? 'Cancel Config' : 'Modify Cycles'}
                                    </button>
                                </div>

                                <div className="p-8">
                                    {showHoursEditor ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {Object.entries(hours).map(([day, time]) => (
                                                <div key={day} className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                                    <div className="w-full sm:w-32">
                                                        <p className="font-black text-gray-900 capitalize tracking-tight">{day}</p>
                                                    </div>
                                                    <div className="flex items-center flex-1 w-full gap-6">
                                                        <label className="flex items-center cursor-pointer group">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only"
                                                                    checked={time.closed}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours({
                                                                        ...hours,
                                                                        [day]: { ...time, closed: e.target.checked }
                                                                    })}
                                                                />
                                                                <div className={`w-12 h-6 rounded-full transition-colors ${time.closed ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${time.closed ? 'translate-x-6' : ''}`}></div>
                                                            </div>
                                                            <span className={`ml-3 text-xs font-black uppercase tracking-widest ${time.closed ? 'text-red-500' : 'text-gray-400'}`}>
                                                                Inactive
                                                            </span>
                                                        </label>

                                                        {!time.closed && (
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <input
                                                                    type="time"
                                                                    value={time.open}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours({
                                                                        ...hours,
                                                                        [day]: { ...time, open: e.target.value }
                                                                    })}
                                                                    className="w-full px-4 py-2 bg-white border-2 border-transparent rounded-xl focus:border-purple-600 transition-all font-bold text-gray-700 shadow-sm"
                                                                />
                                                                <div className="w-4 h-0.5 bg-gray-300"></div>
                                                                <input
                                                                    type="time"
                                                                    value={time.close}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours({
                                                                        ...hours,
                                                                        [day]: { ...time, close: e.target.value }
                                                                    })}
                                                                    className="w-full px-4 py-2 bg-white border-2 border-transparent rounded-xl focus:border-purple-600 transition-all font-bold text-gray-700 shadow-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-end pt-6">
                                                <button
                                                    onClick={handleSaveHours}
                                                    className="px-10 py-4 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                                                >
                                                    Sync Parameters
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in duration-700">
                                            {Object.entries(hours).map(([day, time]) => (
                                                <div key={day} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-purple-200 hover:shadow-lg transition-all group">
                                                    <span className="font-black text-gray-900 capitalize tracking-tight w-32 group-hover:text-purple-600 transition-colors">{day}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${time.closed
                                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                            }`}>
                                                            {time.closed ? 'Suspended' : `${time.open} — ${time.close}`}
                                                        </span>
                                                        {!time.closed && (
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Premium Modules */}
                        <div className="lg:col-span-1 space-y-10">
                            {/* Visual Asset Library */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-150"></div>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase px-4 py-1 bg-gray-50 rounded-full border border-gray-100">Visual Assets</h2>
                                    <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">Full Archive</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {photos.length > 0 ? (
                                        photos.slice(0, 4).map((photo, idx) => (
                                            <div key={idx} className="relative aspect-[4/3] group overflow-hidden rounded-[1.5rem] shadow-inner border border-gray-100">
                                                <img src={photo.url} alt={photo.type} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                                                <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center">
                                                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">Preview</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                            No assets deployed
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowPhotoUpload(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Inject Media
                                </button>
                            </div>

                            {/* Global Updates Node */}
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>
                                <div className="flex items-center space-x-4 mb-8 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase opacity-90">Global Sync Post</h2>
                                </div>
                                <div className="mb-8 relative z-10">
                                    <textarea
                                        rows={4}
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        className="w-full px-6 py-5 bg-white shadow-inner rounded-[1.5rem] text-sm font-semibold focus:ring-4 focus:ring-white/20 transition-all resize-none text-gray-800 placeholder-gray-300"
                                        placeholder="Orchestrate news, offers, or events..."
                                    ></textarea>
                                </div>
                                <button
                                    onClick={handleCreatePost}
                                    className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-gray-50 transition-all active:scale-95 text-xs relative z-10"
                                >
                                    Deploy to Network
                                </button>
                            </div>

                            {/* Control Center */}
                            <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 relative z-10">Executive Controls</h2>
                                <div className="space-y-4 relative z-10">
                                    {[
                                        { label: 'View on Search Node', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
                                        { label: 'View on Maps Matrix', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                                        { label: 'Broadcast Profile', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316' }
                                    ].map((action, i) => (
                                        <button key={i} className="w-full py-4 bg-white/5 border border-white/10 text-gray-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-between px-6 group/btn">
                                            {action.label}
                                            <svg className="w-4 h-4 text-gray-600 group-hover/btn:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={action.icon} />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'reviews' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10">
                        <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Public Sentiment</h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Global Review Intelligence</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner">
                                <span className="text-lg font-black text-indigo-600">4.9</span>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {profileData.reviews?.map((review, idx) => (
                                <div key={idx} className="flex gap-6 p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-white hover:border-indigo-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-full -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="flex-shrink-0 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg ring-4 ring-indigo-50 transform group-hover:rotate-6 transition-transform">
                                            {review.reviewer.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{review.reviewer}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex bg-white px-3 py-1.5 rounded-xl shadow-inner gap-1 border border-gray-100">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 font-semibold leading-relaxed mb-6 italic opacity-85 text-lg">"{review.comment}"</p>

                                        {review.reply ? (
                                            <div className="p-6 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100/50 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                    <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 10.06-11.427l.718 1.258c-4.665.901-7.112 3.036-7.332 6.393 1.13.14 2.454.912 2.454 2.88 0 2.227-1.417 3.513-3.011 3.513-1.571 0-3.006-1.317-3.006-3.756 0-2.531 1.637-4.247 3.511-4.832V1.192c-6.83 1.839-10.547 7.745-10.547 13.554V21h7.117z" /></svg>
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2"></span>
                                                    Corporate Feedback
                                                </p>
                                                <p className="text-indigo-900 font-bold opacity-80">{review.reply}</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleReply(review._id || 'mock-id', review.reviewer)}
                                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                                            >
                                                Dispatch Response
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!profileData.reviews || profileData.reviews.length === 0) && (
                                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Quiet Mode: No Review Activity Detected</p>
                                    <button onClick={handleGoogleSync} className="mt-6 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Request Global Feed Sync</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-10 animate-in fade-in duration-700">
                    <div className="flex justify-between items-center bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Broadcast Hub</h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-1">Global Communication Feed</p>
                        </div>
                        <button className="relative z-10 px-8 py-4 bg-white text-gray-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95">
                            Initiate Broadcast
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {profileData.posts?.map((post, idx) => (
                            <div key={idx} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 flex flex-col">
                                <div className="h-60 bg-gray-900 relative overflow-hidden">
                                    {post.imageUrl ? (
                                        <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center relative">
                                            <svg className="w-20 h-20 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 flex gap-2">
                                        <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[10px] font-black text-gray-900 uppercase tracking-widest shadow-2xl border border-white/20">{post.type}</span>
                                    </div>
                                    <div className="absolute bottom-6 left-6 text-white/80 text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg">
                                        {new Date(post.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <p className="text-gray-700 font-bold leading-relaxed mb-8 italic opacity-90 line-clamp-4">"{post.content}"</p>

                                    <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                                        <div className="p-3 bg-indigo-50 rounded-2xl flex items-center justify-between group-hover:bg-indigo-600 transition-colors duration-500">
                                            <svg className="w-4 h-4 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            <span className="font-black text-indigo-900 group-hover:text-white text-xs">{post.views}</span>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-2xl flex items-center justify-between group-hover:bg-purple-600 transition-colors duration-500">
                                            <svg className="w-4 h-4 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                                            <span className="font-black text-purple-900 group-hover:text-white text-xs">{post.clicks}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!profileData.posts || profileData.posts.length === 0) && (
                            <div className="col-span-full py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-gray-200">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                </div>
                                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Broadcast Feed Inactive</p>
                                <p className="text-gray-400 font-bold text-xs mt-2 max-w-xs mx-auto">Commence engagement to see global search metrics</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default GoogleProfile;

