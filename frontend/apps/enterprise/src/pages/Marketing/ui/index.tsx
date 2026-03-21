import React, { useState } from 'react';
import { Palette, MessageSquare, Ticket, Mail, LayoutTemplate, Percent } from 'lucide-react';
import Campaigns from './Campaigns';
import WhatsAppMarketing from './WhatsAppMarketing';
import SocialMediaMarketing from './SocialMediaMarketing';
import MarketingTemplates from './MarketingTemplates';
import EmailMarketing from './EmailMarketing';
import MarketingCoupons from './MarketingCoupons';
import MarketingOffers from './MarketingOffers';

type MarketingTab = 'campaigns' | 'templates' | 'email' | 'whatsapp' | 'social' | 'coupons' | 'offers';

const TABS: { id: MarketingTab; label: string; icon: React.ElementType }[] = [
    { id: 'campaigns',  label: 'Campaigns',  icon: Palette },
    { id: 'templates',  label: 'Templates',  icon: LayoutTemplate },
    { id: 'email',      label: 'Email',      icon: Mail },
    { id: 'whatsapp',   label: 'WhatsApp',   icon: MessageSquare },
    { id: 'social',     label: 'Social',     icon: Palette },
    { id: 'coupons',    label: 'Coupons',    icon: Ticket },
    { id: 'offers',     label: 'Offers',     icon: Percent },
];

const Marketing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MarketingTab>('campaigns');

    const renderContent = () => {
        switch (activeTab) {
            case 'campaigns':  return <Campaigns />;
            case 'templates':  return <MarketingTemplates />;
            case 'email':      return <EmailMarketing />;
            case 'whatsapp':   return <WhatsAppMarketing />;
            case 'social':     return <SocialMediaMarketing />;
            case 'coupons':    return <MarketingCoupons />;
            case 'offers':     return <MarketingOffers />;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[var(--erp-bg)] p-4 rounded-[2rem] border border-default dark:border-default shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] p-1.5 rounded-3xl overflow-x-auto no-scrollbar max-w-full gap-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow'
                                    : 'text-muted hover:text-secondary'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <div className="text-right px-4 hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Active Workspace</p>
                    <p className="text-sm font-bold text-[#020617] dark:text-[#F8FAFC]">Growth Marketing</p>
                </div>
            </header>
            <div key={activeTab}>{renderContent()}</div>
        </div>
    );
};

export default Marketing;
