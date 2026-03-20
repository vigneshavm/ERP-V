import React, { useState } from 'react';
import { MessageCircle, Mail, Gift, MessageSquare } from 'lucide-react';
import WhatsAppEngagement from './WhatsAppEngagement';
import EmailEngagement from './EmailEngagement';
import LoyaltyEngagement from './LoyaltyEngagement';
import FeedbackEngagement from './FeedbackEngagement';

type EngagementTab = 'whatsapp' | 'email' | 'loyalty' | 'feedback';

const TABS: { id: EngagementTab; label: string; icon: React.ElementType }[] = [
    { id: 'whatsapp', label: 'WhatsApp',  icon: MessageCircle },
    { id: 'email',    label: 'Email',     icon: Mail },
    { id: 'loyalty',  label: 'Loyalty',   icon: Gift },
    { id: 'feedback', label: 'Feedback',  icon: MessageSquare },
];

const CustomerEngagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EngagementTab>('whatsapp');

    const renderContent = () => {
        switch (activeTab) {
            case 'whatsapp': return <WhatsAppEngagement />;
            case 'email':    return <EmailEngagement />;
            case 'loyalty':  return <LoyaltyEngagement />;
            case 'feedback': return <FeedbackEngagement />;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[#020617] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl overflow-x-auto no-scrollbar max-w-full gap-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <div className="text-right px-4 hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Active Workspace</p>
                    <p className="text-sm font-bold text-[#020617] dark:text-[#F8FAFC]">Customer Engagement</p>
                </div>
            </header>
            <div key={activeTab}>{renderContent()}</div>
        </div>
    );
};

export default CustomerEngagement;
