import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Users, Tag, Book, User, Edit3, ArrowLeft, TrendingUp } from 'lucide-react';

const SupplierSubNav: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Global Module Links
    const globalLinks = [
        { name: 'Directory', path: '/suppliers', icon: Users, end: true },
        { name: 'Groups', path: '/suppliers/groups', icon: Tag },
        { name: 'Ledger', path: '/suppliers/ledger', icon: Book },
        { name: 'Inflow / Outflow', path: '/suppliers/inflow', icon: TrendingUp },
    ];

    // Contextual Links (when viewing a specific supplier)
    const contextLinks = [
        { name: 'Directory', path: '/suppliers', icon: ArrowLeft, end: true }, // Back to list
        { name: 'Profile', path: `/suppliers/${id}`, icon: User, end: true },
        { name: 'Edit', path: `/suppliers/${id}/edit`, icon: Edit3 },
        { name: 'Ledger', path: `/suppliers/${id}/ledger`, icon: Book }, // Specific ledger
    ];

    const links = id ? contextLinks : globalLinks;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-sm w-fit">
            {links.map((link) => (
                <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive
                            ? 'bg-white dark:bg-slate-900 text-primary shadow-sm border border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`
                    }
                >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.name}
                </NavLink>
            ))}
        </div>
    );
};

export default SupplierSubNav;
