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
            const currentTime = Date.now();
            
            // Check if this is the start of a new scan or continuing an existing one
            if (currentTime - lastKeyTime.current > timeout) {
                buffer.current = ''; // Reset buffer if time between keys is too long (human typing)
            }
            
            lastKeyTime.current = currentTime;

            // Handle the Enter key, which usually signifies the end of a scan
            if (e.key === 'Enter') {
                if (buffer.current.length > 3) { // Arbitrary minimum length for a barcode
                    // Always mark the Enter as handled, so an input's own Enter handler (e.g. the POS
                    // barcode box) skips this scan instead of adding the item a second time.
                    e.preventDefault();
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
