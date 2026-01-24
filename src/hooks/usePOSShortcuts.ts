import { useEffect } from 'react';

interface POSShortcutsProps {
    onSearchProduct?: () => void;
    onSearchCustomer?: () => void;
    onHoldBill?: () => void;
    onCheckout?: () => void;
    onDelete?: () => void;
    onFocusQty?: () => void;
    onToggleView?: () => void;
    onNewSale?: () => void;
    onEscape?: () => void;
    onSwitchSession?: (index: number) => void;
}

export const usePOSShortcuts = (handlers: POSShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if inside an input/textarea (except for specific overrides like F-keys)
            const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';

            // F2 or Ctrl+F: Search Product
            if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
                e.preventDefault();
                handlers.onSearchProduct?.();
            }

            // Ctrl+B: Focus SKU/Barcode
            if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                handlers.onSearchProduct?.(); // Usually targets the primary search/SKU anyway
            }

            // F4 or Ctrl+K: Search Customer (if applicable)
            if (e.key === 'F4' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
                e.preventDefault();
                handlers.onSearchCustomer?.();
            }

            // F6 or Ctrl+H: Hold Bill
            if (e.key === 'F6' || (e.ctrlKey && e.key.toLowerCase() === 'h')) {
                e.preventDefault();
                handlers.onHoldBill?.();
            }

            // F9 or Ctrl+Enter or Ctrl+Space: Checkout
            if (e.key === 'F9' || (e.ctrlKey && e.key === ' ') || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                handlers.onCheckout?.();
            }

            // Delete: Remove Item (Only if not in input)
            if (e.key === 'Delete' && !isInput) {
                e.preventDefault();
                handlers.onDelete?.();
            }

            // Ctrl+Q: Focus Quantity
            if ((e.ctrlKey && e.key.toLowerCase() === 'q')) {
                e.preventDefault();
                handlers.onFocusQty?.();
            }

            // Alt+V: Toggle View Mode (Scanner/Visual)
            if (e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                // We'll need a way to trigger this in the handler
                (handlers as any).onToggleView?.();
            }

            // Alt+N: New Sale (Clear)
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                (handlers as any).onNewSale?.();
            }

            // Alt+1-4 or Ctrl+1-4: Switch Session
            if ((e.altKey || (e.ctrlKey && !e.shiftKey)) && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                handlers.onSwitchSession?.(index);
            }

            // Esc: General Cancel/Clear
            if (e.key === 'Escape') {
                handlers.onEscape?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};
