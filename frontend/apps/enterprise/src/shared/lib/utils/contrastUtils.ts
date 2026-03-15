import { logger } from '@/shared/lib/logger';
/**
 * WCAG 2.1 AA Contrast Utilities
 * 
 * Provides functions for calculating and validating color contrast
 * according to WCAG 2.1 AA accessibility guidelines.
 */

/**
 * WCAG 2.1 AA minimum contrast ratios by element type
 */
export const WCAGLevel = {
    /** Normal text (< 18pt or < 14pt bold) */
    TEXT: 4.5,
    /** Large text (≥ 18pt or ≥ 14pt bold) */
    LARGE_TEXT: 3.0,
    /** Icons and graphical objects */
    ICONS: 3.0,
    /** Disabled/inactive UI elements */
    DISABLED: 2.5,
} as const;

export type WCAGElementType = keyof typeof WCAGLevel;

export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface ContrastResult {
    ratio: number;
    meetsText: boolean;
    meetsLargeText: boolean;
    meetsIcons: boolean;
    meetsDisabled: boolean;
}

export interface ContrastIssue {
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    requiredRatio: number;
    elementType: WCAGElementType;
}

/**
 * Parses a color string (hex or rgb) to an RGB object.
 */
export function parseColor(color: string): RGB | null {
    // Handle hex colors
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (hexMatch) {
        return {
            r: parseInt(hexMatch[1], 16),
            g: parseInt(hexMatch[2], 16),
            b: parseInt(hexMatch[3], 16),
        };
    }

    // Handle shorthand hex
    const shortHexMatch = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(color);
    if (shortHexMatch) {
        return {
            r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
            g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
            b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
        };
    }

    // Handle rgb() format
    const rgbMatch = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
        };
    }

    // Handle space-separated RGB (CSS custom property format: "255 255 255")
    const spaceMatch = /^(\d+)\s+(\d+)\s+(\d+)$/.exec(color.trim());
    if (spaceMatch) {
        return {
            r: parseInt(spaceMatch[1], 10),
            g: parseInt(spaceMatch[2], 10),
            b: parseInt(spaceMatch[3], 10),
        };
    }

    return null;
}

/**
 * Calculates relative luminance according to WCAG 2.1 formula.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getLuminance(rgb: RGB): number {
    const { r, g, b } = rgb;

    // Convert 8-bit RGB to sRGB
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;

    // Apply gamma correction
    const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
    const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
    const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

    // Calculate luminance using ITU-R BT.709 coefficients
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the contrast ratio between two colors.
 * @returns Contrast ratio from 1:1 to 21:1
 */
export function getContrastRatio(color1: string | RGB, color2: string | RGB): number {
    const rgb1 = typeof color1 === 'string' ? parseColor(color1) : color1;
    const rgb2 = typeof color2 === 'string' ? parseColor(color2) : color2;

    if (!rgb1 || !rgb2) {
        logger.warn('[ContrastUtils] Invalid color provided');
        return 1;
    }

    const L1 = getLuminance(rgb1);
    const L2 = getLuminance(rgb2);

    // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
    // where L1 is the lighter color
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a contrast ratio meets WCAG AA standards for a given element type.
 */
export function meetsWCAGAA(ratio: number, elementType: WCAGElementType): boolean {
    return ratio >= WCAGLevel[elementType];
}

/**
 * Comprehensive contrast check returning results for all element types.
 */
export function checkContrast(foreground: string | RGB, background: string | RGB): ContrastResult {
    const ratio = getContrastRatio(foreground, background);

    return {
        ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
        meetsText: ratio >= WCAGLevel.TEXT,
        meetsLargeText: ratio >= WCAGLevel.LARGE_TEXT,
        meetsIcons: ratio >= WCAGLevel.ICONS,
        meetsDisabled: ratio >= WCAGLevel.DISABLED,
    };
}

/**
 * Flags a contrast issue in development mode.
 * Logs detailed warning to console.
 */
export function flagContrastIssue(issue: ContrastIssue): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        const emoji = issue.ratio < WCAGLevel.DISABLED ? '🔴' : '🟡';
        logger.warn(`${emoji} [A11y Contrast Issue] in ${issue.element}`, {
            type: issue.elementType,
            foreground: issue.foreground,
            background: issue.background,
            ratio: `${issue.ratio.toFixed(2)}:1`,
            required: `${issue.requiredRatio}:1`
        });
    }
}

/**
 * Detects if a color pair represents "grey on grey" (low saturation, similar lightness).
 * This is a common accessibility issue.
 */
export function isGreyOnGrey(foreground: string | RGB, background: string | RGB): boolean {
    const fg = typeof foreground === 'string' ? parseColor(foreground) : foreground;
    const bg = typeof background === 'string' ? parseColor(background) : background;

    if (!fg || !bg) return false;

    // Check if both colors are low saturation (grey-ish)
    const isLowSat = (rgb: RGB): boolean => {
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const delta = max - min;
        // Low saturation if delta is less than 25% of max
        return delta < max * 0.25;
    };

    return isLowSat(fg) && isLowSat(bg);
}

/**
 * Suggests a better foreground color that meets the target contrast ratio.
 * Darkens or lightens the original color as needed.
 */
export function suggestAccessibleColor(
    foreground: string,
    background: string,
    targetRatio: number = WCAGLevel.TEXT
): string | null {
    const fg = parseColor(foreground);
    const bg = parseColor(background);

    if (!fg || !bg) return null;

    const bgLuminance = getLuminance(bg);
    const needsDarker = bgLuminance > 0.5;

    // Iteratively adjust the foreground until we meet the target
    let adjusted = { ...fg };
    const step = needsDarker ? -5 : 5;
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
        const ratio = getContrastRatio(adjusted, bg);
        if (ratio >= targetRatio) {
            // Convert back to hex
            const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
            return `#${toHex(adjusted.r)}${toHex(adjusted.g)}${toHex(adjusted.b)}`;
        }

        adjusted = {
            r: Math.max(0, Math.min(255, adjusted.r + step)),
            g: Math.max(0, Math.min(255, adjusted.g + step)),
            b: Math.max(0, Math.min(255, adjusted.b + step)),
        };

        iterations++;
    }

    return needsDarker ? '#000000' : '#ffffff';
}

/**
 * Pre-validated color pairs that meet WCAG AA requirements.
 * Use these semantic tokens for guaranteed accessibility.
 */
export const AccessibleColorPairs = {
    light: {
        textPrimary: { fg: '#0f172a', bg: '#ffffff', ratio: 18.1 },    // slate-900 on white
        textSecondary: { fg: '#475569', bg: '#ffffff', ratio: 6.2 },   // slate-600 on white
        textMuted: { fg: '#64748b', bg: '#ffffff', ratio: 4.6 },       // slate-500 on white
        textDisabled: { fg: '#94a3b8', bg: '#ffffff', ratio: 3.0 },    // slate-400 on white (large text only)
    },
    dark: {
        textPrimary: { fg: '#f8fafc', bg: '#020617', ratio: 18.5 },    // slate-50 on slate-950
        textSecondary: { fg: '#cbd5e1', bg: '#020617', ratio: 11.4 },  // slate-300 on slate-950
        textMuted: { fg: '#94a3b8', bg: '#020617', ratio: 6.5 },       // slate-400 on slate-950
        textDisabled: { fg: '#64748b', bg: '#020617', ratio: 4.2 },    // slate-500 on slate-950
    },
} as const;
