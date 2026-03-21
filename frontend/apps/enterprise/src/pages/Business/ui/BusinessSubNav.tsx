import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Store,
    Globe,
    Zap,
    MessageSquare
} from 'lucide-react';

const BusinessSubNav: React.FC = () => {
    const location = useLocation();

    const navItems = [
        {
            name: 'Online Store',
            path: '/business/online-shop',
            icon: Store,
            description: 'Manage E-commerce'
        },
        {
            name: 'Google Profile',
            path: '/business/google-profile',
            icon: Globe,
            description: 'Local Search & Maps'
        },
        {
            name: 'Marketing Tools',
            path: '/business/marketing-tools',
            icon: Zap,
            description: 'Creative Assets'
        },
        {
            name: 'WhatsApp Marketing',
            path: '/business/whatsapp-marketing',
            icon: MessageSquare,
            description: 'Broadcast & Chat'
        }
    ];

    return (
        <div className="bg-white border-b border-default sticky top-0 z-20 mb-6 -mx-4 px-4 lg:-mx-8 lg:px-8">
            <div className="flex overflow-x-auto no-scrollbar py-1">
                <div className="flex gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`group flex flex-col items-center px-4 py-3 rounded-xl transition-all relative min-w-[120px] ${isActive
                                    ? 'bg-indigo-50/50'
                                    : 'hover:bg-[var(--erp-bg-sunken)]'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg mb-1 transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-[var(--erp-bg-sunken)] text-muted group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                    }`}>
                                    <Icon size={18} />
                                </div>
                                <span className={`text-[13px] font-bold whitespace-nowrap ${isActive ? 'text-indigo-600' : 'text-secondary'
                                    }`}>
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 rounded-full" />
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BusinessSubNav;
