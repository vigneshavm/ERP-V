
import React from 'react';
import { Rocket, Globe, Zap, Database, ArrowRight, BarChart, LayoutDashboard } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useUiStore } from "@/shared/lib/store/uiStore";
import { useNavigation } from '@/app/providers/NavigationContext';
import Layout, { PageShell } from "@/shared/ui/Layout";

const GrowthHub: React.FC = () => {
    const dispatch = useDispatch();
    const { navigate } = useNavigation();

    const cards = [
        {
            title: 'Online Store',
            description: 'Manage your digital storefront, products, and online orders.',
            icon: Globe,
            path: 'GROW_STORE',
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            title: 'Marketing',
            description: 'Run campaigns, manage social media, and WhatsApp marketing.',
            icon: Zap,
            path: 'GROW_MARKETING',
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-900/20'
        },
        {
            title: 'Google Business',
            description: 'Sync and manage your Google Business Profile and reviews.',
            icon: Globe,
            path: 'GROW_GOOGLE',
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20'
        },
        {
            title: 'Data & Sync',
            description: 'Backup, restore, import/export data, and sync devices.',
            icon: Database,
            path: 'GROW_DATA',
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/20'
        },
        {
            title: 'Reporting',
            description: 'Advanced business intelligence, sales, and inventory analytics.',
            icon: BarChart,
            path: 'PROFIT_PULSE',
            color: 'text-rose-600',
            bg: 'bg-rose-100 dark:bg-rose-900/20'
        },
        {
            title: 'Business Health',
            description: 'Architecture audit, performance metrics, and integrity checks.',
            icon: Rocket,
            path: 'GROW_ARCHITECTURE',
            color: 'text-indigo-600',
            bg: 'bg-indigo-100 dark:bg-indigo-900/20'
        }
    ];

    return (
        <>
            <Layout>
                <PageShell>
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-main tracking-tight">Growth Hub</h1>
                    <p className="text-muted dark:text-muted font-medium">Select a tool to scale and manage your business presence.</p>
                </div>
                <button
                    onClick={() => navigate('GROW_DASHBOARD' as any)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-secondary dark:text-slate-200 rounded-xl transition-all text-sm font-bold"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.path}
                        onClick={() => navigate(card.path as any)}
                        className="group bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer"
                    >
                        <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <card.icon className={`w-7 h-7 ${card.color}`} />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-main mb-2">{card.title}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 h-10">{card.description}</p>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                            Open Tool <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                ))}
            </div>
            </div>
            </PageShell>
        </Layout>
    </>
    );
};

export default GrowthHub;
