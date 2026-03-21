import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { Users, Tag, Book, FileText, User, Edit3, ArrowLeft, TrendingUp } from 'lucide-react';

const SupplierSubNav: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

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
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50 rounded-2xl w-fit">
            {links.map((link) => (
                <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive
                            ? 'bg-white dark:bg-[var(--erp-bg)] text-indigo-600 shadow-sm border border-default dark:border-default'
                            : 'text-muted hover:text-secondary dark:hover:text-muted'
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
