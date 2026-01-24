import { useState, useEffect, useRef, useCallback } from 'react';

export const usePOSUIState = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewMode, setViewMode] = useState<'SCANNER' | 'VISUAL'>('SCANNER');
    const [mobileTab, setMobileTab] = useState<'MAIN' | 'CART'>('MAIN');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);
    const [isCategoryBrowserOpen, setIsCategoryBrowserOpen] = useState(false);
    const [isReturnMode, setIsReturnMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const posContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    }, []);

    return {
        isFullScreen, setIsFullScreen,
        viewMode, setViewMode,
        mobileTab, setMobileTab,
        isProcessing, setIsProcessing,
        isPreOrder, setIsPreOrder,
        isHeldBillsOpen, setIsHeldBillsOpen,
        isCategoryBrowserOpen, setIsCategoryBrowserOpen,
        isReturnMode, setIsReturnMode,
        isMobileMenuOpen, setIsMobileMenuOpen,
        posContainerRef,
        toggleFullScreen
    };
};
