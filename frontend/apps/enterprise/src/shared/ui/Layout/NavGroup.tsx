import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { RootState } from "@/app/store/store";

interface NavGroupProps {
    icon?: React.ElementType;
    label: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    isActive?: boolean;
}

/**
 * Collapsible navigation group for sidebar.
 * Expands/collapses on click, adapts to collapsed sidebar mode.
 */
const NavGroup: React.FC<NavGroupProps> = ({
    icon: Icon = ChevronDown, // Default icon if missing
    label,
    children,
    defaultOpen = false,
    isActive = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { desktopCollapsed } = useUiStore();

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
                    <div className="bg-sidebar/95 backdrop-blur-xl border border-default rounded-xl shadow-2xl p-2 min-w-[200px] expanager-glass">
                        <div className="px-3 py-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-default mb-2">
                            {label}
                        </div>
                        <div className="space-y-1">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1 w-full flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between py-2 px-3 border-l-2 transition-all group rounded-r-lg ${
                    isActive 
                    ? "border-primary bg-primary/10 text-primary font-black shadow-[inset_4px_0_12px_-4px_rgba(var(--color-primary),0.2)]" 
                    : "border-transparent text-secondary hover:bg-white/5 font-bold opacity-70 hover:opacity-100"
                }`}
            >
                <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                    <span className="text-[11px] font-black uppercase tracking-widest pt-0.5 truncate">{label}</span>
                </div>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 opacity-100' : 'opacity-40'} ${isActive ? 'text-primary' : 'text-secondary'}`}
                />
            </button>

            {isOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-300 flex flex-col w-full items-stretch">
                    {children}
                </div>
            )}
        </div>
    );
};

export default NavGroup;
