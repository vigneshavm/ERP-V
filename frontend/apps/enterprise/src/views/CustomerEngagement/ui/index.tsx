import React from 'react';
import { MessageCircle, Mail, Gift, MessageSquare } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "@/app/store/store";
import { useUiStore } from "@/shared/lib/store/uiStore";

// Import components from Marketing folder where they currently reside
import WhatsAppEngagement from './WhatsAppEngagement';
import EmailEngagement from './EmailEngagement';
import LoyaltyEngagement from './LoyaltyEngagement';
import FeedbackEngagement from './FeedbackEngagement';

const CustomerEngagement: React.FC = () => {
    const dispatch = useDispatch();
    const { activeTab } = useUiStore();

    const renderContent = () => {
        switch (activeTab) {
            case 'GROW_ENGAGEMENT':
            case 'GROW_ENGAGEMENT_SMS': // Defaulting SMS to WhatsApp or first item for now if no dedicated SMS component
                return <WhatsAppEngagement />;
            case 'GROW_ENGAGEMENT_WHATSAPP':
                return <WhatsAppEngagement />;
            case 'GROW_ENGAGEMENT_EMAIL':
                return <EmailEngagement />;
            case 'GROW_ENGAGEMENT_LOYALTY':
                return <LoyaltyEngagement />;
            case 'GROW_ENGAGEMENT_FEEDBACK':
                return <FeedbackEngagement />;
            default:
                return <WhatsAppEngagement />;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[#020617] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl overflow-x-auto no-scrollbar max-w-full">
                    <div className="px-4 py-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                            {activeTab.replace('GROW_ENGAGEMENT_', '').replace('GROW_ENGAGEMENT', 'ENGAGEMENT').replace('_', ' ')}
                        </h2>
                    </div>
                </div>

                <div className="text-right px-4 hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Active Workspace</p>
                    <p className="text-sm font-bold text-[#020617] dark:text-[#F8FAFC]">Customer Engagement</p>
                </div>
            </header>

            <div key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
};

export default CustomerEngagement;
