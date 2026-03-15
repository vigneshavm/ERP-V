import { LayoutDashboard, ShoppingCart, Menu } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useNavigation } from '@/app/providers/NavigationContext';

const MobileNav: React.FC = () => {
    const { currentView, setCurrentView } = useNavigation();
    const { setSidebarOpen } = useUiStore();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-sidebar/90 backdrop-blur-xl border-t border-default z-[100] flex justify-around items-center h-16 pb-safe expanager-glass">
            <button
                onClick={() => setCurrentView('DASHBOARD')}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-secondary/60'}`}
            >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            </button>
            <button
                onClick={() => setCurrentView('POS')}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === 'POS' ? 'text-primary' : 'text-secondary/60'}`}
            >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">POS</span>
            </button>
            <button
                onClick={() => setSidebarOpen(true)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 text-secondary/60 transition-colors hover:text-primary`}
            >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">More</span>
            </button>
        </nav>
    );
};

export default MobileNav;
