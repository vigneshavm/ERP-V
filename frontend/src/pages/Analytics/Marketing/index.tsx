
import React from 'react';
import { Palette, MessageSquare } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../redux/store";
import { setActiveTab } from "../../../redux/slices/uiSlice";
import Campaigns from './Campaigns';
import WhatsAppMarketing from './WhatsAppMarketing';
import SocialMediaMarketing from './SocialMediaMarketing';

const Marketing: React.FC = () => {
    const dispatch = useDispatch();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    // Mapping for local UI state if needed, but we can just use activeTab directly
    const internalTab = (activeTab === 'GROW_MARKETING_WHATSAPP' || activeTab === 'GROW_ENGAGEMENT_WHATSAPP') ? 'whatsapp' : 'creative';

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-[#020617] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-3xl">
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_MARKETING_CAMPAIGNS'))}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${internalTab === 'creative' ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                    >
                        <Palette className="w-4 h-4" /> Creative Builder
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_MARKETING_WHATSAPP'))}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${internalTab === 'whatsapp' ? 'bg-white dark:bg-[#020617] text-[#22C55E] shadow-lg' : 'text-[#64748B] hover:text-[#020617]'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> WhatsApp Marketing
                    </button>
                </div>

                <div className="text-right px-4 hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Active Campaign</p>
                    <p className="text-sm font-bold text-[#020617] dark:text-[#F8FAFC]">Summer Sale 2026</p>
                </div>
            </header>

            <div key={internalTab}>
                {internalTab === 'creative' ? <Campaigns /> :
                    activeTab === 'GROW_MARKETING_SOCIAL' ? <SocialMediaMarketing /> :
                        <WhatsAppMarketing />}
            </div>
        </div>
    );
};

export default Marketing;
