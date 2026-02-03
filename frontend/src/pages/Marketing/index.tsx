import React from 'react';
import { Palette, MessageSquare, Ticket, Mail, LayoutTemplate, Percent } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../redux/store";
import { setActiveTab } from "../../redux/slices/uiSlice";
import Campaigns from './Campaigns';
import WhatsAppMarketing from './WhatsAppMarketing';
import SocialMediaMarketing from './SocialMediaMarketing';
import MarketingTemplates from './MarketingTemplates';
import EmailMarketing from './EmailMarketing';
import MarketingCoupons from './MarketingCoupons';
import MarketingOffers from './MarketingOffers';

const Marketing: React.FC = () => {
    const dispatch = useDispatch();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    const renderContent = () => {
        switch (activeTab) {
            case 'GROW_MARKETING':
            case 'GROW_MARKETING_CAMPAIGNS':
                return <Campaigns />;
            case 'GROW_MARKETING_TEMPLATES':
                return <MarketingTemplates />;
            case 'GROW_MARKETING_EMAIL':
                return <EmailMarketing />;
            case 'GROW_MARKETING_WHATSAPP':
                return <WhatsAppMarketing />;
            case 'GROW_MARKETING_SOCIAL':
                return <SocialMediaMarketing />;
            case 'GROW_MARKETING_COUPONS':
                return <MarketingCoupons />;
            case 'GROW_MARKETING_OFFERS':
                return <MarketingOffers />;
            default:
                return <Campaigns />;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[#020617] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl overflow-x-auto no-scrollbar max-w-full">
                    {/* Simplified Navigation for quick switching if needed, strictly we rely on Sidebar activeTab */}
                    {/* We can keep the existing buttons or expand them. For now, let's keep the quick toggles for main items or just rely on sidebar. 
                        The sidebar is the main nav. Let's just show context.
                     */}
                    <div className="px-4 py-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                            {activeTab.replace('GROW_MARKETING_', '').replace('GROW_MARKETING', 'MARKETING')}
                        </h2>
                    </div>
                </div>

                <div className="text-right px-4 hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Active Workspace</p>
                    <p className="text-sm font-bold text-[#020617] dark:text-[#F8FAFC]">Growth Marketing</p>
                </div>
            </header>

            <div key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
};

export default Marketing;
