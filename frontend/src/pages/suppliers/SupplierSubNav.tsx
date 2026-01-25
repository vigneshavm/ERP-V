import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Tag, Book, FileText } from 'lucide-react';

const SupplierSubNav: React.FC = () => {
    const links = [
        { name: 'Directory', path: '/suppliers', icon: Users },
        { name: 'Groups', path: '/suppliers/groups', icon: Tag },
        { name: 'Ledger', path: '/suppliers/ledger', icon: Book },
        { name: 'Statements', path: '/suppliers/statements', icon: FileText },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit">
            {links.map((link) => (
                <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/suppliers'}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700'
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
