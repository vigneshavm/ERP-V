import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';

const GoogleProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showHoursEditor, setShowHoursEditor] = useState(false);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);

    const [profileData, setProfileData] = useState({
        businessName: 'BizzAI Billing Solutions',
        address: '123 Business Street, Mumbai, Maharashtra 400001',
        phone: '+91 98765 43210',
        email: 'contact@bizzai.com',
        website: 'www.bizzai.com',
        category: 'Software Company',
        description: 'Complete billing and inventory management solution for businesses. We help small enterprises digitize their operations with ease.',
        verified: true
    });

    const [hours, setHours] = useState({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { open: '', close: '', closed: true }
    });

    const insights = {
        views: 1250,
        calls: 45,
        directions: 89,
        websiteClicks: 156
    };

    const completeness = 85;

    const photos = [
        { id: 1, url: 'https://via.placeholder.com/300x200?text=Office+Interior', type: 'Interior' },
        { id: 2, url: 'https://via.placeholder.com/300x200?text=Team', type: 'Team' },
        { id: 3, url: 'https://via.placeholder.com/300x200?text=Exterior', type: 'Exterior' }
    ];

    return (
        <Layout>
            <PageHeader
                title="Google Business Profile"
                description="Manage your online presence across Google Search and Maps"
                actions={[
                    <button
                        key="sync"
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5 mr-2 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.147-3.32C22.8 18.48 23.533 15.5 23.533 13.067c0-.987-.067-1.667-.187-2.147h-10.867z" />
                        </svg>
                        Sync with Google
                    </button>
                ]}
            />

            {/* Profile Completeness */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-xl"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-indigo-400" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * completeness) / 100} className="text-white" />
                            </svg>
                            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold text-sm">{completeness}%</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Profile Strength: Excellent</h3>
                            <p className="text-indigo-100 text-sm">Complete your profile to improve visibility in Google Search and Maps</p>
                        </div>
                    </div>
                    <button className="px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition text-white border border-white/30">
                        View Recommendations
                    </button>
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Search Views"
                    value={insights.views.toLocaleString()}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Phone Calls"
                    value={insights.calls}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Direction Requests"
                    value={insights.directions}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    iconBgColor="bg-purple-50"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Website Clicks"
                    value={insights.websiteClicks}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                    iconBgColor="bg-orange-50"
                    iconColor="text-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Business Profile */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                            <div className="flex items-center space-x-3">
                                <FormInput.IconWrapper>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </FormInput.IconWrapper>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Business Profile</h2>
                                    <p className="text-sm text-gray-500">Core business information</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {profileData.verified && (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center border border-green-200">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Verified
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    {isEditing ? 'Cancel' : 'Edit Info'}
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        label="Business Name"
                                        value={profileData.businessName}
                                        onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                                    />
                                    <FormInput
                                        label="Category"
                                        value={profileData.category}
                                        onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                                    />
                                </div>
                                <FormInput
                                    label="Address"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        label="Phone Number"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    />
                                    <FormInput
                                        label="Email Address"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    />
                                </div>
                                <FormInput
                                    label="Website URL"
                                    value={profileData.website}
                                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                                    <textarea
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                                    />
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium transition-all active:scale-95">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Name</p>
                                        <p className="font-medium text-gray-900 text-lg">{profileData.businessName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                                        <p className="font-medium text-gray-900">{profileData.category}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                                        <p className="font-medium text-gray-900">{profileData.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="font-medium text-gray-900">{profileData.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                        <p className="font-medium text-gray-900">{profileData.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Website</p>
                                        <a href={`https://${profileData.website}`} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                                            {profileData.website}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                                    <p className="text-gray-600 leading-relaxed">{profileData.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hours of Operation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Hours of Operation</h2>
                            </div>
                            <button
                                onClick={() => setShowHoursEditor(!showHoursEditor)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                {showHoursEditor ? 'Cancel' : 'Edit Hours'}
                            </button>
                        </div>

                        {showHoursEditor ? (
                            <div className="space-y-4">
                                {Object.entries(hours).map(([day, time]) => (
                                    <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                        <div className="w-28">
                                            <p className="font-medium text-gray-900 capitalize">{day}</p>
                                        </div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={time.closed}
                                                onChange={(e) => setHours({
                                                    ...hours,
                                                    [day]: { ...time, closed: e.target.checked }
                                                })}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-500">Closed</span>
                                        </label>
                                        {!time.closed && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="time"
                                                    value={time.open}
                                                    onChange={(e) => setHours({
                                                        ...hours,
                                                        [day]: { ...time, open: e.target.value }
                                                    })}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input
                                                    type="time"
                                                    value={time.close}
                                                    onChange={(e) => setHours({
                                                        ...hours,
                                                        [day]: { ...time, close: e.target.value }
                                                    })}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4">
                                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium transition-all active:scale-95">
                                        Save Hours
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(hours).map(([day, time]) => (
                                    <div key={day} className="flex justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                                        <span className="font-medium text-gray-700 capitalize w-32">{day}</span>
                                        <span className={`text-sm font-medium ${time.closed ? 'text-red-500' : 'text-gray-900'}`}>
                                            {time.closed ? 'Closed' : `${time.open} - ${time.close}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Photos Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Photos</h2>
                            <button className="text-indigo-600 text-sm font-medium hover:underline">See All</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {photos.slice(0, 4).map(photo => (
                                <div key={photo.id} className="relative aspect-square group overflow-hidden rounded-lg">
                                    <img src={photo.url} alt={photo.type} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button className="text-white text-xs font-bold uppercase tracking-wider">View</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                            className="w-full py-2.5 border border-dashed border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Add New Photo
                        </button>
                    </div>

                    {/* Post to Google */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Post Update</h2>
                        </div>
                        <div className="mb-4">
                            <textarea
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                                placeholder="Share news, offers, or events..."
                            />
                        </div>
                        <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-all active:scale-95">
                            Publish to Google
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-between px-4 group">
                                View on Search
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>
                            <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-between px-4 group">
                                View on Maps
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-between px-4 group">
                                Share Profile
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GoogleProfile;
