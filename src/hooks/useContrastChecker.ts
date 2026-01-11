import { useEffect, useRef, useCallback } from 'react';
import {
    getContrastRatio,
    meetsWCAGAA,
    flagContrastIssue,
    isGreyOnGrey,
    WCAGLevel,
    type WCAGElementType,
} from '../utils/contrastUtils';

interface ContrastCheckConfig {
    /** CSS selector to check (default: elements with color classes) */
    selector?: string;
    /** Element type for WCAG threshold (default: TEXT) */
    elementType?: WCAGElementType;
    /** Whether to log detailed issues (default: true in dev) */
    verbose?: boolean;
    /** Debounce delay in ms (default: 1000) */
    debounceMs?: number;
}

interface ContrastCheckResult {
    totalChecked: number;
    issuesFound: number;
    greyOnGreyCount: number;
}

/**
 * Development hook that checks for WCAG contrast violations.
 * Only active in development mode.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { checkNow, lastResult } = useContrastChecker({
 *     selector: '.text-slate-400, .text-gray-400',
 *     elementType: 'TEXT',
 *   });
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export function useContrastChecker(config: ContrastCheckConfig = {}) {
    const {
        selector = '[class*="text-slate-"], [class*="text-gray-"], [class*="text-neutral-"]',
        elementType = 'TEXT',
        verbose = true,
        debounceMs = 1000,
    } = config;

    const lastResultRef = useRef<ContrastCheckResult>({ totalChecked: 0, issuesFound: 0, greyOnGreyCount: 0 });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Gets the computed background color, traversing up the DOM tree if transparent.
     */
    const getEffectiveBackground = useCallback((element: Element): string => {
        let current: Element | null = element;

        while (current) {
            const computedStyle = window.getComputedStyle(current);
            const bgColor = computedStyle.backgroundColor;

            // Check if background is not transparent
            if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                return bgColor;
            }

            current = current.parentElement;
        }

        // Default to white if no background found
        return 'rgb(255, 255, 255)';
    }, []);

    /**
     * Performs contrast check on all matching elements.
     */
    const checkNow = useCallback((): ContrastCheckResult => {
        // Skip in production
        if (!import.meta.env.DEV) {
            return { totalChecked: 0, issuesFound: 0, greyOnGreyCount: 0 };
        }

        const elements = document.querySelectorAll(selector);
        let totalChecked = 0;
        let issuesFound = 0;
        let greyOnGreyCount = 0;

        elements.forEach((element) => {
            const computedStyle = window.getComputedStyle(element);
            const foreground = computedStyle.color;
            const background = getEffectiveBackground(element);

            if (!foreground || !background) return;

            totalChecked++;

            const ratio = getContrastRatio(foreground, background);
            const passes = meetsWCAGAA(ratio, elementType);

            // Check for grey on grey
            if (isGreyOnGrey(foreground, background)) {
                greyOnGreyCount++;
                if (verbose) {
                    console.warn(
                        '⚪ [A11y] Grey on grey detected:',
                        element,
                        `\n  FG: ${foreground}, BG: ${background}, Ratio: ${ratio.toFixed(2)}:1`
                    );
                }
            }

            if (!passes) {
                issuesFound++;
                flagContrastIssue({
                    element: element.tagName.toLowerCase() +
                        (element.className ? `.${element.className.toString().split(' ').join('.')}` : ''),
                    foreground,
                    background,
                    ratio,
                    requiredRatio: WCAGLevel[elementType],
                    elementType,
                });
            }
        });

        const result = { totalChecked, issuesFound, greyOnGreyCount };
        lastResultRef.current = result;

        if (verbose && totalChecked > 0) {
            const emoji = issuesFound === 0 ? '✅' : '⚠️';
            console.log(
                `${emoji} [A11y] Contrast check complete:`,
                `${totalChecked} elements checked,`,
                `${issuesFound} issues found,`,
                `${greyOnGreyCount} grey-on-grey`
            );
        }

        return result;
    }, [selector, elementType, verbose, getEffectiveBackground]);

    /**
     * Debounced check that runs after DOM updates settle.
     */
    const scheduleCheck = useCallback(() => {
        if (!import.meta.env.DEV) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            checkNow();
        }, debounceMs);
    }, [checkNow, debounceMs]);

    // Run initial check after mount (with delay for rendering)
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const timer = setTimeout(() => {
            checkNow();
        }, 2000); // Wait for initial render

        return () => clearTimeout(timer);
    }, [checkNow]);

    // Observe DOM changes for dynamic content
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const observer = new MutationObserver(() => {
            scheduleCheck();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

        return () => observer.disconnect();
    }, [scheduleCheck]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        /** Trigger an immediate contrast check */
        checkNow,
        /** Get the last check result */
        lastResult: lastResultRef.current,
        /** Schedule a debounced check */
        scheduleCheck,
    };
}

/**
 * Utility to check a specific color pair without the hook.
 * Useful for one-off checks in component logic.
 */
export function checkColorPair(
    foreground: string,
    background: string,
    elementType: WCAGElementType = 'TEXT'
): { passes: boolean; ratio: number; required: number } {
    const ratio = getContrastRatio(foreground, background);
    const required = WCAGLevel[elementType];
    return {
        passes: ratio >= required,
        ratio: Math.round(ratio * 100) / 100,
        required,
    };
}
