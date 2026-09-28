
import React from 'react';
import { Rocket, Globe, Zap, Database, ArrowRight, BarChart, LayoutDashboard } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from "../../redux/slices/uiSlice";
import { Button, Card } from '../../components/shared';

const GrowthHub: React.FC = () => {
    const dispatch = useDispatch();

    const cards = [
        {
            title: 'Online Store',
            description: 'Manage your digital storefront, products, and online orders.',
            icon: Globe,
            path: 'GROW_STORE',
            color: 'text-primary',
            bg: 'bg-primary-soft dark:bg-primary-soft'
        },
        {
            title: 'Marketing',
            description: 'Run campaigns, manage social media, and WhatsApp marketing.',
            icon: Zap,
            path: 'GROW_MARKETING',
            color: 'text-warning',
            bg: 'bg-warning-soft dark:bg-warning-soft'
        },
        {
            title: 'Google Business',
            description: 'Sync and manage your Google Business Profile and reviews.',
            icon: Globe,
            path: 'GROW_GOOGLE',
            color: 'text-success',
            bg: 'bg-success-soft dark:bg-success-soft'
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
            color: 'text-danger',
            bg: 'bg-danger-soft dark:bg-danger-soft'
        },
        {
            title: 'Business Health',
            description: 'Architecture audit, performance metrics, and integrity checks.',
            icon: Rocket,
            path: 'GROW_ARCHITECTURE',
            color: 'text-primary',
            bg: 'bg-primary-soft dark:bg-primary-soft'
        }
    ];

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title text-slate-900 dark:text-white">Growth Hub</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Select a tool to scale and manage your business presence.</p>
                </div>
                <Button
                    variant="secondary"
                    size="md"
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    onClick={() => dispatch(setActiveTab('GROW_DASHBOARD' as any))}
                >
                    Back to Dashboard
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Card
                        key={card.path}
                        variant="default"
                        size="md"
                        interactive
                        onClick={() => dispatch(setActiveTab(card.path as any))}
                        className="cursor-pointer"
                    >
                        <Card.Body>
                            <div className={`w-14 h-14 ${card.bg} rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <card.icon className={`w-7 h-7 ${card.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{card.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">{card.description}</p>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary dark:text-primary group-hover:gap-3 transition-all">
                                Open Tool <ArrowRight className="w-3 h-3" />
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GrowthHub;
