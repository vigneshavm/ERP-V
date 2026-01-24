import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { RootState } from '../../store';

interface NavGroupProps {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

/**
 * Collapsible navigation group for sidebar.
 * Expands/collapses on click, adapts to collapsed sidebar mode.
 */
const NavGroup: React.FC<NavGroupProps> = ({
    icon: Icon,
    label,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { desktopCollapsed } = useSelector((state: RootState) => state.ui);

    // Collapsed Mode (Icon only tooltip)
    if (desktopCollapsed) {
        return (
            <div className="relative group py-1">
                <button
                    className="w-full flex justify-center py-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title={label}
                >
                    <Icon className="w-4 h-4" />
                </button>
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl p-2 min-w-[180px]">
                        <div className="px-3 py-2 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 mb-1">
                            {label}
                        </div>
                        <div className="space-y-0.5">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-2 px-3 border-l-2 border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
            >
                <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-neutral-800 dark:group-hover:text-neutral-200" />
                    <span className="text-[13px] font-semibold pt-0.5">{label}</span>
                </div>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {/* 
                       We aren't automatically injecting isSubItem here because React.Children map is fragile with fragments.
                       We will update TenantView to pass `isSubItem` explicitly to children of NavGroup.
                     */}
                    {children}
                </div>
            )}
        </div>
    );
};

export default NavGroup;
