import React, { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import BusinessSubNav from './BusinessSubNav';

interface Template {
    id: number;
    name: string;
    category: string;
    thumbnail: string;
    description: string;
}

interface Theme {
    id: string;
    name: string;
    color: string;
    ring: string;
}

const MarketingTools: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [customMessage, setCustomMessage] = useState<string>('');
    const [selectedTheme, setSelectedTheme] = useState<string>('blue');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const templates: Template[] = [
        { id: 1, name: 'Sale Announcement', category: 'Flyer', thumbnail: '🎉', description: 'Announce special sales and offers' },
        { id: 2, name: 'New Product Launch', category: 'Banner', thumbnail: '🚀', description: 'Promote new products' },
        { id: 3, name: 'Discount Offer', category: 'Offer', thumbnail: '💰', description: 'Share discount deals' },
        { id: 4, name: 'Festival Greetings', category: 'Flyer', thumbnail: '🎊', description: 'Festival wishes with branding' },
        { id: 5, name: 'Social Media Post', category: 'Social', thumbnail: '📱', description: 'Ready-to-share social posts' },
        { id: 6, name: 'Email Campaign', category: 'Email', thumbnail: '📧', description: 'Professional email templates' }
    ];

    const themes: Theme[] = [
        { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
        { id: 'red', name: 'Bold Red', color: 'bg-red-500', ring: 'ring-red-500' },
        { id: 'green', name: 'Fresh Green', color: 'bg-green-500', ring: 'ring-green-500' },
        { id: 'purple', name: 'Royal Purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
        { id: 'orange', name: 'Vibrant Orange', color: 'bg-orange-500', ring: 'ring-orange-500' }
    ];

    const suggestions: string[] = [
        'Add customer testimonials to build trust',
        'Use high-quality product images',
        'Include clear call-to-action buttons',
        'Optimize for mobile viewing',
        'A/B test different headlines'
    ];

    return (
        <Layout>
            <PageHeader
                title="Marketing Tools"
                description="Create professional marketing materials for your business"
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Tools', link: '/business/online-shop' },
                    { label: 'Marketing Tools' }
                ]}
            />
            <BusinessSubNav />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Template Gallery */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Template Gallery</h2>
                            <span className="text-sm text-gray-500">{templates.length} Templates Available</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedTemplate?.id === template.id
                                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                        : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="aspect-square rounded-lg bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-white transition-colors text-5xl">
                                        {template.thumbnail}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTemplate?.id === template.id
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                        }`}>
                                        {template.category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Post Creator */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Social Media Post Creator</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
                                <textarea
                                    value={customMessage}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                                    placeholder="Write your engaging message here..."
                                />
                                <p className="mt-2 text-xs text-gray-500 text-right">{customMessage.length} characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Visual</label>
                                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors cursor-pointer text-center group">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {uploadedImage ? "Click to change image" : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Theme Selector</label>
                                <div className="flex flex-wrap gap-4">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setSelectedTheme(theme.id)}
                                            className={`group relative flex flex-col items-center space-y-2 p-3 rounded-xl border-2 transition-all ${selectedTheme === theme.id
                                                ? `border-indigo-500 bg-gray-50 ring-1 ring-offset-2 ${theme.ring}`
                                                : 'border-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full ${theme.color} shadow-sm group-hover:scale-110 transition-transform`} />
                                            <span className={`text-xs font-medium ${selectedTheme === theme.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {theme.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Preview Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">Mobile View</span>
                        </div>

                        <div className="relative mx-auto border-4 border-gray-800 bg-gray-800 rounded-[2.5rem] p-3 shadow-xl max-w-[300px]">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl"></div>
                            <div className="bg-white rounded-[2rem] overflow-hidden min-h-[480px] flex flex-col relative">
                                {/* Mock Mobile Header */}
                                <div className="bg-gray-50 p-4 border-b border-gray-100 pt-8">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">BZ</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">BizzAI Store</p>
                                            <p className="text-[10px] text-gray-500">Sponsored</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
                                    {selectedTemplate ? (
                                        <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden p-4 text-center">
                                            {uploadedImage ? (
                                                <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover rounded-lg mb-4" />
                                            ) : (
                                                <div className="text-6xl mb-4 text-bounce">{selectedTemplate.thumbnail}</div>
                                            )}
                                            <h3 className="font-bold text-gray-900 mb-2">{selectedTemplate.name}</h3>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{customMessage || 'Your custom message will appear here...'}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <p>Select a template to preview</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mock Mobile Footer */}
                                <div className="p-3 border-t border-gray-100 bg-white">
                                    <div className="flex justify-between text-xl text-gray-300">
                                        <span>♡</span>
                                        <span>💬</span>
                                        <span>↗</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mt-6">
                            <button className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95">
                                Download High Res
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="w-full py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                    Share Link
                                </button>
                                <button className="w-full py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                    Send Test
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Performance Suggestions */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h2 className="text-lg font-bold text-gray-900">Pro Tips</h2>
                        </div>
                        <ul className="space-y-3">
                            {suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start space-x-3 text-sm text-gray-600">
                                    <svg className="w-4 h-4 text-green-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MarketingTools;
