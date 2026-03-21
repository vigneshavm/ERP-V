import React, { useState } from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';

interface NavSubmenuProps {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

/**
 * Nested submenu component for two-level navigation.
 * Used within NavGroup for deeper hierarchy (e.g., Sales → Transactions → Invoice).
 */
const NavSubmenu: React.FC<NavSubmenuProps> = ({
    icon: Icon,
    label,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { desktopCollapsed } = useUiStore();

    if (desktopCollapsed) return null;

    return (
        <div className="space-y-0.5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-2 pr-3 pl-10 border-l-2 border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 dark:hover:bg-[var(--erp-card)]/50 transition-colors"
            >
                <div className="flex items-center space-x-2">
                    {/* Optional: No icon for sub-headers as per requirement "No icons for submenus", 
                        but NavSubmenu IS a submenu container. 
                        We will hide the passed Icon if we want text only, or keep it small.
                        User said "No icons for submenus". So we remove Icon render.
                    */}
                    <span className="text-[12px] font-medium">{label}</span>
                </div>
                <ChevronRight
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="space-y-0.5">
                    {children}
                </div>
            )}
        </div>
    );
};

export default NavSubmenu;
