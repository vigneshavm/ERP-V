import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    MessageSquare,
    Phone,
    CheckCircle,
    AlertCircle,
    Users,
    Send,
    Calendar,
    Clock,
    Plus,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Mail,
    Eye,
    XCircle,
    Smile,
    IndianRupee,
    Filter,
    RefreshCw
} from 'lucide-react';
import {
    WhatsAppCampaign, WhatsAppConfig, WhatsAppCampaignStatus

} from '../../types/tenant';

const WhatsAppMarketing: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [activeView, setActiveView] = useState<'dashboard' | 'create'>('dashboard');
    const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
    const [selectedAudience, setSelectedAudience] = useState<'ALL' | 'LOYALTY' | 'RECENT' | 'CUSTOM'>('ALL');
    const [message, setMessage] = useState('');
    const [recipientCount, setRecipientCount] = useState(0);

    // Mock WhatsApp Config
    const waConfig: WhatsAppConfig = {
        isConnected: true,
        phoneNumber: '+91-9876543210',
        lastSyncAt: new Date().toISOString(),
        apiKeyConfigured: true,
        metrics: {
            totalSent: 12450,
            totalDelivered: 11890,
            totalRead: 9234,
            totalFailed: 560
        },
        campaigns: [
            { id: 'c1', name: 'Summer Sale 2026', status: 'COMPLETED', sentAt: '2026-01-05T10:00:00Z', audienceType: 'ALL', recipientCount: 2500, sent: 2500, delivered: 2420, read: 1890, failed: 80, message: 'Summer sale now live!', estimatedCost: 625 },
            { id: 'c2', name: 'Loyalty Members Exclusive', status: 'COMPLETED', sentAt: '2026-01-02T14:30:00Z', audienceType: 'LOYALTY', recipientCount: 850, sent: 850, delivered: 830, read: 720, failed: 20, message: 'Special rewards for you!', estimatedCost: 212.5 },
            { id: 'c3', name: 'New Year Greetings', status: 'SENDING', audienceType: 'ALL', recipientCount: 3200, sent: 1600, delivered: 1550, read: 0, failed: 50, message: 'Happy New Year!', estimatedCost: 800 },
            { id: 'c4', name: 'Flash Sale Alert', status: 'SCHEDULED', scheduledAt: '2026-01-12T09:00:00Z', audienceType: 'RECENT', recipientCount: 1200, sent: 0, delivered: 0, read: 0, failed: 0, message: '24-hour flash sale!', estimatedCost: 300 },
            { id: 'c5', name: 'Product Launch', status: 'DRAFT', audienceType: 'ALL', recipientCount: 0, sent: 0, delivered: 0, read: 0, failed: 0, message: '', estimatedCost: 0 }
        ]
    };

    const audienceOptions = [
        { id: 'ALL', label: 'All Customers', count: 3200, icon: Users },
        { id: 'LOYALTY', label: 'Loyalty Members', count: 850, icon: CheckCircle },
        { id: 'RECENT', label: 'Recent Buyers (30 days)', count: 1200, icon: Clock },
        { id: 'CUSTOM', label: 'Custom Segment', count: 0, icon: Filter }
    ];

    const variableTags = ['{CustomerName}', '{StoreName}', '{LastPurchase}', '{Points}'];

    const getStatusBadge = (status: WhatsAppCampaignStatus) => {
        const styles: Record<WhatsAppCampaignStatus, string> = {
            DRAFT: 'bg-slate-100 text-slate-600',
            SCHEDULED: 'bg-blue-100 text-blue-600',
            SENDING: 'bg-yellow-100 text-yellow-600',
            COMPLETED: 'bg-green-100 text-green-600',
            FAILED: 'bg-red-100 text-red-600'
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
    };

    const handleAudienceSelect = (audienceId: 'ALL' | 'LOYALTY' | 'RECENT' | 'CUSTOM') => {
        setSelectedAudience(audienceId);
        const audience = audienceOptions.find(a => a.id === audienceId);
        setRecipientCount(audience?.count || 0);
    };

    const costPerMessage = 0.25; // INR
    const estimatedCost = recipientCount * costPerMessage;

    if (!waConfig.isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-[#22C55E]/10 rounded-3xl flex items-center justify-center mb-8">
                    <MessageSquare className="w-12 h-12 text-[#22C55E]" />
                </div>
                <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Connect WhatsApp Business</h2>
                <p className="text-[#64748B] mb-10 text-lg leading-relaxed">
                    Link your WhatsApp Business API to send broadcast messages, promotions, and updates directly to your customers.
                </p>
                <button className="px-10 py-5 bg-[#22C55E] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#22C55E]/30 flex items-center gap-4">
                    <MessageSquare className="w-5 h-5" /> Connect WhatsApp
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-32">
            {activeView === 'dashboard' ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Connection Status Header */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white dark:bg-[#020617] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl mb-12">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-[#22C55E] rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC]">WhatsApp Business</h2>
                                <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-widest mt-1">
                                    <span className="text-[#22C55E] flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Connected
                                    </span>
                                    <span>•</span>
                                    <span>{waConfig.phoneNumber}</span>
                                    <span>•</span>
                                    <span>Last sync: {waConfig.lastSyncAt ? new Date(waConfig.lastSyncAt).toLocaleTimeString() : 'Never'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors" title="Refresh">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            {isOwnerOrAdmin && (
                                <button
                                    onClick={() => setActiveView('create')}
                                    className="px-8 py-4 bg-[#22C55E] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#22C55E]/30 flex items-center gap-3"
                                >
                                    <Plus className="w-4 h-4" /> New Broadcast
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {[
                            { label: 'Messages Sent', value: waConfig.metrics.totalSent, icon: Send, color: '#4F46E5' },
                            { label: 'Delivered', value: waConfig.metrics.totalDelivered, icon: CheckCircle, color: '#22C55E' },
                            { label: 'Read', value: waConfig.metrics.totalRead, icon: Eye, color: '#0EA5E9' },
                            { label: 'Failed', value: waConfig.metrics.totalFailed, icon: XCircle, color: '#EF4444' }
                        ].map((metric) => (
                            <div key={metric.label} className="bg-white dark:bg-[#020617] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl group hover:border-[#22C55E]/30 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform" style={{ color: metric.color }}>
                                        <metric.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC]">{metric.value.toLocaleString()}</span>
                                </div>
                                <h4 className="text-lg font-black text-[#020617] dark:text-[#F8FAFC]">{metric.label}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Campaign Manager Table */}
                    <div className="bg-white dark:bg-[#020617] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC]">Campaign History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Campaign</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Date</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Sent</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Delivered</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Read</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waConfig.campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="p-6">
                                                <span className="font-bold text-[#020617] dark:text-[#F8FAFC]">{campaign.name}</span>
                                            </td>
                                            <td className="p-6 text-sm text-[#64748B]">
                                                {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : (campaign.scheduledAt ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}` : '-')}
                                            </td>
                                            <td className="p-6 font-bold">{campaign.sent.toLocaleString()}</td>
                                            <td className="p-6 font-bold">{campaign.delivered.toLocaleString()}</td>
                                            <td className="p-6 font-bold">{campaign.read.toLocaleString()}</td>
                                            <td className="p-6">{getStatusBadge(campaign.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                    {/* Broadcast Creator Wizard */}
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className="flex items-center gap-2 text-[#64748B] hover:text-[#22C55E] text-xs font-black uppercase tracking-widest transition-colors mb-8"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>

                    <div className="bg-white dark:bg-[#020617] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12">
                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-16">
                            {[1, 2, 3, 4].map((step) => (
                                <React.Fragment key={step}>
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-all ${createStep >= step ? 'bg-[#22C55E] text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#64748B]'}`}
                                    >
                                        {step}
                                    </div>
                                    {step < 4 && <div className={`w-16 h-1 rounded-full ${createStep > step ? 'bg-[#22C55E]' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Step 1: Audience Selection */}
                        {createStep === 1 && (
                            <div className="space-y-10">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Select Your Audience</h2>
                                    <p className="text-[#64748B]">Choose which customers will receive your broadcast message.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                    {audienceOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAudienceSelect(opt.id as any)}
                                            className={`p-8 rounded-[2rem] border-2 text-left transition-all ${selectedAudience === opt.id ? 'border-[#22C55E] bg-[#22C55E]/5' : 'border-slate-200 dark:border-slate-800 hover:border-[#22C55E]/50'}`}
                                        >
                                            <opt.icon className={`w-8 h-8 mb-4 ${selectedAudience === opt.id ? 'text-[#22C55E]' : 'text-[#64748B]'}`} />
                                            <h3 className="text-lg font-black text-[#020617] dark:text-[#F8FAFC]">{opt.label}</h3>
                                            <p className="text-sm font-bold text-[#64748B] mt-1">{opt.count.toLocaleString()} customers</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center pt-8">
                                    <p className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-8">Recipients: <span className="text-[#22C55E]">{recipientCount.toLocaleString()}</span> customers</p>
                                    <button
                                        onClick={() => setCreateStep(2)}
                                        disabled={recipientCount === 0}
                                        className="px-12 py-5 bg-[#22C55E] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#22C55E]/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                                    >
                                        Next: Compose Message <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Message Composer */}
                        {createStep === 2 && (
                            <div className="space-y-10">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Compose Your Message</h2>
                                    <p className="text-[#64748B]">Write a compelling message for your customers.</p>
                                </div>
                                <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-4">Message</label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-[#22C55E]/20 outline-none transition-all resize-none"
                                                rows={6}
                                                placeholder="Write your broadcast message here..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-4">Variable Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {variableTags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => setMessage(prev => prev + ' ' + tag)}
                                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-[#22C55E]/10 hover:text-[#22C55E] transition-all"
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-4">Live Preview</h4>
                                        <div className="bg-white dark:bg-[#020617] rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-[#22C55E] rounded-full flex items-center justify-center text-white font-black text-sm">
                                                    {activeTenant?.name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{activeTenant?.name || 'Your Store'}</p>
                                                    <p className="text-[10px] text-[#64748B]">Business Account</p>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-[#020617] dark:text-[#F8FAFC]">{message || 'Your message will appear here...'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-8">
                                    <button onClick={() => setCreateStep(1)} className="px-8 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setCreateStep(3)}
                                        disabled={!message.trim()}
                                        className="px-12 py-5 bg-[#22C55E] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#22C55E]/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        Next: Review Cost <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Cost Estimator */}
                        {createStep === 3 && (
                            <div className="space-y-10 text-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Cost Estimate</h2>
                                    <p className="text-[#64748B]">Review the estimated cost for this broadcast.</p>
                                </div>
                                <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-center gap-2 text-6xl font-black text-[#22C55E] mb-8">
                                        <IndianRupee className="w-12 h-12" />
                                        {estimatedCost.toFixed(2)}
                                    </div>
                                    <div className="space-y-4 text-left">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#64748B]">Recipients</span>
                                            <span className="font-bold">{recipientCount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#64748B]">Cost per message</span>
                                            <span className="font-bold">₹{costPerMessage.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between text-lg">
                                            <span className="font-black">Total</span>
                                            <span className="font-black text-[#22C55E]">₹{estimatedCost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-8">
                                    <button onClick={() => setCreateStep(2)} className="px-8 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setCreateStep(4)}
                                        className="px-12 py-5 bg-[#22C55E] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#22C55E]/30 hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        Next: Schedule <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Schedule or Send */}
                        {createStep === 4 && (
                            <div className="space-y-10 text-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] mb-4">Send or Schedule</h2>
                                    <p className="text-[#64748B]">Choose when to deliver your broadcast.</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-2xl mx-auto">
                                    <button className="w-full md:w-auto flex-1 p-10 rounded-[2.5rem] border-2 border-[#22C55E] bg-[#22C55E]/5 hover:bg-[#22C55E] hover:text-white group transition-all">
                                        <Send className="w-12 h-12 mx-auto mb-6 text-[#22C55E] group-hover:text-white transition-colors" />
                                        <h3 className="text-xl font-black">Send Now</h3>
                                        <p className="text-sm text-[#64748B] mt-2 group-hover:text-white/80">Deliver immediately to {recipientCount.toLocaleString()} recipients</p>
                                    </button>
                                    <button className="w-full md:w-auto flex-1 p-10 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 hover:border-[#4F46E5] group transition-all">
                                        <Calendar className="w-12 h-12 mx-auto mb-6 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
                                        <h3 className="text-xl font-black">Schedule</h3>
                                        <p className="text-sm text-[#64748B] mt-2">Pick a date and time for delivery</p>
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-8">
                                    <button onClick={() => setCreateStep(3)} className="px-8 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                                        Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppMarketing;
