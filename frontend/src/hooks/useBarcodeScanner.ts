import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void;
    enabled?: boolean;
    timeout?: number; // Max time between keystrokes (ms) to be considered a scanner. Usually scanners are < 20ms.
}

export const useBarcodeScanner = ({ onScan, enabled = true, timeout = 50 }: UseBarcodeScannerProps) => {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if the user is explicitly typing in an input or textarea
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            
            // Allow scanner to work if it's a hidden input, or just rely on global if not in an input
            // We usually want to capture it globally *unless* they are typing in a search box.
            // But if they scan while focused in a text input, it will type the barcode there and hit enter.
            // For a robust POS, we might intercept it anyway if it's super fast.
            
            const currentTime = Date.now();
            
            // Check if this is the start of a new scan or continuing an existing one
            if (currentTime - lastKeyTime.current > timeout) {
                buffer.current = ''; // Reset buffer if time between keys is too long (human typing)
            }
            
            lastKeyTime.current = currentTime;

            // Handle the Enter key, which usually signifies the end of a scan
            if (e.key === 'Enter') {
                if (buffer.current.length > 3) { // Arbitrary minimum length for a barcode
                    if (!isInput) {
                        e.preventDefault(); // Prevent default if it was captured globally
                    }
                    onScan(buffer.current);
                    buffer.current = '';
                }
                return;
            }

            // Only accumulate printable single characters
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                buffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [onScan, enabled, timeout]);
};
