import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, ShoppingCart, Menu } from 'lucide-react';
import { RootState } from '../../../redux/store';
import { setActiveTab, setSidebarOpen } from '../../../redux/slices/uiSlice';

const MobileNav: React.FC = () => {
    const dispatch = useDispatch();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-card/80 backdrop-blur-lg border-t border-default z-50 flex justify-around items-center h-16 pb-safe">
            <button
                onClick={() => dispatch(setActiveTab('DASHBOARD'))}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'DASHBOARD' ? 'text-primary' : 'text-neutral-400'}`}
            >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
                onClick={() => dispatch(setActiveTab('POS'))}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'POS' ? 'text-primary' : 'text-neutral-400'}`}
            >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-medium">POS</span>
            </button>
            <button
                onClick={() => dispatch(setSidebarOpen(true))}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 text-neutral-400`}
            >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
            </button>
        </nav>
    );
};

export default MobileNav;
