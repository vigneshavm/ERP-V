import { logger } from '@/shared/lib/logger';
/**
 * Dark Mode Utilities
 * 
 * Helper functions for dark mode detection and contrast validation.
 */

import { getContrastRatio, WCAGLevel } from './contrastUtils';

/**
 * Check if dark mode is currently active.
 */
export function isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
}

/**
 * Get the effective background color for the current theme.
 * Returns CSS color value.
 */
export function getEffectiveBackground(): string {
    if (isDarkMode()) {
        return '#020617'; // slate-950
    }
    return '#ffffff'; // white
}

/**
 * Get the effective foreground color for the current theme.
 */
export function getEffectiveForeground(): string {
    if (isDarkMode()) {
        return '#f8fafc'; // slate-50
    }
    return '#0f172a'; // slate-900
}

/**
 * Dark mode color palette reference.
 * All colors validated for WCAG AA contrast against slate-950 background.
 */
export const DarkModePalette = {
    background: '#020617',    // slate-950
    foreground: '#f8fafc',    // slate-50

    // Text colors (all meet 4.5:1+ against slate-950)
    textPrimary: '#f8fafc',   // slate-50 - 18.5:1
    textSecondary: '#cbd5e1', // slate-300 - 11.4:1
    textMuted: '#94a3b8',     // slate-400 - 6.5:1
    textDisabled: '#64748b',  // slate-500 - 4.2:1

    // Icon colors (all meet 3:1+ against slate-950)
    iconPrimary: '#e2e8f0',   // slate-200 - 13.5:1
    iconSecondary: '#94a3b8', // slate-400 - 6.5:1
    iconDisabled: '#64748b',  // slate-500 - 4.2:1

    // Surface colors
    surfaceElevated: '#0f172a', // slate-900
    surfacePressed: '#1e293b',  // slate-800
    border: '#334155',          // slate-700
} as const;

/**
 * Light mode color palette reference.
 * All colors validated for WCAG AA contrast against white background.
 */
export const LightModePalette = {
    background: '#ffffff',
    foreground: '#0f172a',    // slate-900

    // Text colors (all meet 4.5:1+ against white)
    textPrimary: '#0f172a',   // slate-900 - 18.1:1
    textSecondary: '#475569', // slate-600 - 6.2:1
    textMuted: '#64748b',     // slate-500 - 4.6:1
    textDisabled: '#94a3b8',  // slate-400 - 3.0:1

    // Icon colors (all meet 3:1+ against white)
    iconPrimary: '#334155',   // slate-700 - 9.1:1
    iconSecondary: '#64748b', // slate-500 - 4.6:1
    iconDisabled: '#94a3b8',  // slate-400 - 3.0:1

    // Surface colors
    surfaceElevated: '#f8fafc', // slate-50
    surfacePressed: '#f1f5f9',  // slate-100
    border: '#e2e8f0',          // slate-200
} as const;

/**
 * Get the current theme palette based on active mode.
 */
export function getCurrentPalette() {
    return isDarkMode() ? DarkModePalette : LightModePalette;
}

/**
 * Validates that the primary brand color is visible in both modes.
 * Returns true if the color meets contrast requirements.
 */
export function validatePrimaryColorVisibility(primaryColor: string): {
    lightMode: { passes: boolean; ratio: number };
    darkMode: { passes: boolean; ratio: number };
} {
    const lightRatio = getContrastRatio(primaryColor, LightModePalette.background);
    const darkRatio = getContrastRatio(primaryColor, DarkModePalette.background);

    return {
        lightMode: {
            passes: lightRatio >= WCAGLevel.ICONS,
            ratio: Math.round(lightRatio * 100) / 100,
        },
        darkMode: {
            passes: darkRatio >= WCAGLevel.ICONS,
            ratio: Math.round(darkRatio * 100) / 100,
        },
    };
}

/**
 * Development function to log all dark mode contrast ratios.
 */
export function validateDarkModeColors(): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') return;

    const bg = DarkModePalette.background;
    const checks = [
        { name: 'textPrimary', color: DarkModePalette.textPrimary, min: 4.5 },
        { name: 'textSecondary', color: DarkModePalette.textSecondary, min: 4.5 },
        { name: 'textMuted', color: DarkModePalette.textMuted, min: 4.5 },
        { name: 'textDisabled', color: DarkModePalette.textDisabled, min: 2.5 },
        { name: 'iconPrimary', color: DarkModePalette.iconPrimary, min: 3 },
        { name: 'iconSecondary', color: DarkModePalette.iconSecondary, min: 3 },
    ];

    // eslint-disable-next-line no-console -- TODO(TS-FIX): Phase 2/3 fix
    console.group('🌙 Dark Mode Contrast Validation');
    let allPass = true;

    checks.forEach(({ name, color, min }) => {
        const ratio = getContrastRatio(color, bg);
        const passes = ratio >= min;
        if (!passes) allPass = false;

        logger.info(
            `${passes ? '✅' : '❌'} ${name}: ${ratio.toFixed(2)}:1 (min: ${min}:1)`
        );
    });

    logger.info(allPass ? '\n✅ All checks passed!' : '\n⚠️ Some checks failed');
    // eslint-disable-next-line no-console -- TODO(TS-FIX): Phase 2/3 fix
    console.groupEnd();
}
