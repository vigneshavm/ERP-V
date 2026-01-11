import { useEffect, useRef, useCallback } from 'react';
import {
    validateSpacing,
    flagSpacingIssue,
    VALID_SPACING,
    type SpacingIssue,
} from '../utils/spacingUtils';

interface SpacingValidatorConfig {
    /** Whether to scan the DOM for inline styles (default: true) */
    scanInlineStyles?: boolean;
    /** Debounce delay in ms (default: 2000) */
    debounceMs?: number;
    /** Whether to log summary (default: true in dev) */
    verbose?: boolean;
}

interface SpacingValidatorResult {
    totalScanned: number;
    issuesFound: number;
}

/**
 * Development hook that scans the DOM for off-grid spacing values.
 * Only active in development mode.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { scanNow } = useSpacingValidator();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useSpacingValidator(config: SpacingValidatorConfig = {}) {
    const {
        scanInlineStyles = true,
        debounceMs = 2000,
        verbose = true,
    } = config;

    const lastResultRef = useRef<SpacingValidatorResult>({ totalScanned: 0, issuesFound: 0 });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Scans an element's computed styles for off-grid spacing.
     */
    const scanElement = useCallback((element: Element): SpacingIssue[] => {
        const issues: SpacingIssue[] = [];
        const style = window.getComputedStyle(element);
        const spacingProps = [
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'gap', 'rowGap', 'columnGap',
        ] as const;

        for (const prop of spacingProps) {
            const value = style.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
            const result = validateSpacing(value);

            if (!result.isValid && result.value !== 0 && !VALID_SPACING.includes(result.value as any)) {
                const isMargin = prop.startsWith('margin');
                const isPadding = prop.startsWith('padding');

                issues.push({
                    element: `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.toString().split(' ')[0] : ''}`,
                    property: isMargin ? 'margin' : isPadding ? 'padding' : 'gap',
                    value: result.value,
                    suggestedValue: result.suggested,
                    location: prop,
                });
            }
        }

        return issues;
    }, []);

    /**
     * Performs a full DOM scan for spacing issues.
     */
    const scanNow = useCallback((): SpacingValidatorResult => {
        // Skip in production
        if (!import.meta.env.DEV) {
            return { totalScanned: 0, issuesFound: 0 };
        }

        if (!scanInlineStyles) {
            return { totalScanned: 0, issuesFound: 0 };
        }

        // Find elements with inline styles that might have spacing
        const elementsWithStyle = document.querySelectorAll('[style*="margin"], [style*="padding"], [style*="gap"]');
        let totalScanned = 0;
        let issuesFound = 0;

        elementsWithStyle.forEach((element) => {
            totalScanned++;
            const issues = scanElement(element);

            issues.forEach((issue) => {
                issuesFound++;
                flagSpacingIssue(issue);
            });
        });

        const result = { totalScanned, issuesFound };
        lastResultRef.current = result;

        if (verbose && totalScanned > 0) {
            const emoji = issuesFound === 0 ? '✅' : '⚠️';
            console.log(
                `${emoji} [8pt Grid] Spacing scan complete:`,
                `${totalScanned} elements scanned,`,
                `${issuesFound} off-grid values found`
            );
        }

        return result;
    }, [scanInlineStyles, verbose, scanElement]);

    /**
     * Debounced scan that runs after DOM updates settle.
     */
    const scheduleSccan = useCallback(() => {
        if (!import.meta.env.DEV) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            scanNow();
        }, debounceMs);
    }, [scanNow, debounceMs]);

    // Run initial scan after mount
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const timer = setTimeout(() => {
            scanNow();
        }, 3000); // Wait for initial render

        return () => clearTimeout(timer);
    }, [scanNow]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        /** Trigger an immediate spacing scan */
        scanNow,
        /** Get the last scan result */
        lastResult: lastResultRef.current,
        /** Schedule a debounced scan */
        scheduleScan: scheduleSccan,
    };
}
