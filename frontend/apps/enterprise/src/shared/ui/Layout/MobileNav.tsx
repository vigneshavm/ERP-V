import { LayoutDashboard, ShoppingCart, Menu, Landmark, Package } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useNavigation } from '@/app/providers/NavigationContext';

const MobileNav: React.FC = () => {
    const { currentView, setCurrentView } = useNavigation();
    const { setSidebarOpen } = useUiStore();

    const navItems = [
        { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Home' },
        { id: 'POS', icon: ShoppingCart, label: 'POS' },
        { id: 'FINANCE', icon: Landmark, label: 'Finance' },
        { id: 'INVENTORY', icon: Package, label: 'Stock' },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-sidebar/90 backdrop-blur-xl border-t border-default z-[100] flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom,0px)] expanager-glass">
            {navItems.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => setCurrentView(id as any)}
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${currentView === id ? 'text-primary' : 'text-secondary/60'}`}
                >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                </button>
            ))}
            <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-secondary/60 transition-colors hover:text-primary"
            >
                <Menu className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-widest">More</span>
            </button>
        </nav>
    );
};

export default MobileNav;

