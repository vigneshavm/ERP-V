import { logger } from '@/shared/lib/logger';
/**
 * 8-Point Grid Spacing Utilities
 * 
 * Validates spacing values against the 8-point grid system.
 * Only multiples of 4px are valid (0, 4, 8, 16, 24, 32, 48, 64).
 */

/**
 * Valid spacing values in the 8-point grid system (in pixels)
 */
export const VALID_SPACING = [0, 4, 8, 16, 24, 32, 48, 64] as const;

export type ValidSpacing = typeof VALID_SPACING[number];

/**
 * Semantic spacing scale mapping
 */
export const SpacingScale = {
    /** 0px - No spacing */
    none: 0,
    /** 4px - Tight spacing (icons, dense UI) */
    xs: 4,
    /** 8px - Small spacing */
    sm: 8,
    /** 16px - Standard/Medium spacing */
    md: 16,
    /** 24px - Large spacing */
    lg: 24,
    /** 32px - Extra large spacing */
    xl: 32,
    /** 48px - 2XL spacing */
    '2xl': 48,
    /** 64px - 3XL spacing */
    '3xl': 64,
} as const;

export type SpacingScaleKey = keyof typeof SpacingScale;

export interface SpacingIssue {
    element: string;
    property: 'margin' | 'padding' | 'gap';
    value: number;
    suggestedValue: number;
    location?: string;
}

/**
 * Checks if a pixel value is valid on the 8-point grid.
 */
export function isValidSpacing(value: number): value is ValidSpacing {
    return VALID_SPACING.includes(value as ValidSpacing);
}

/**
 * Returns the nearest valid grid value for a given pixel value.
 */
export function nearestGridValue(value: number): ValidSpacing {
    if (value <= 0) return 0;
    if (value <= 2) return 4;
    if (value <= 6) return 8;
    if (value <= 12) return 16;
    if (value <= 20) return 24;
    if (value <= 28) return 32;
    if (value <= 40) return 48;
    return 64;
}

/**
 * Parses a CSS value string and extracts the numeric pixel value.
 * Returns null if not a pixel value.
 */
export function parsePixelValue(cssValue: string): number | null {
    const match = /^(-?\d+(?:\.\d+)?)\s*px$/i.exec(cssValue.trim());
    return match ? parseFloat(match[1]) : null;
}

/**
 * Validates a spacing value and returns validation result.
 */
export function validateSpacing(value: number | string): {
    isValid: boolean;
    value: number;
    suggested: ValidSpacing;
} {
    const numValue = typeof value === 'string' ? parsePixelValue(value) : value;

    if (numValue === null) {
        return { isValid: false, value: 0, suggested: 0 };
    }

    const isValid = isValidSpacing(numValue);
    const suggested = nearestGridValue(numValue);

    return { isValid, value: numValue, suggested };
}

/**
 * Flags a spacing issue in development mode.
 */
export function flagSpacingIssue(issue: SpacingIssue): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        logger.warn(`⚠️ [8pt Grid Issue] in ${issue.element}`, {
            property: issue.property,
            value: `${issue.value}px (off-grid)`,
            suggested: `${issue.suggestedValue}px`,
            location: issue.location
        });
    }
}

/**
 * Batch validate multiple spacing values.
 * Returns array of invalid values with suggestions.
 */
export function validateSpacingBatch(values: Record<string, number | string>): SpacingIssue[] {
    const issues: SpacingIssue[] = [];

    for (const [key, value] of Object.entries(values)) {
        const result = validateSpacing(value);

        if (!result.isValid && result.value !== 0) {
            // Try to parse property from key (e.g., "marginTop" -> "margin")
            let property: 'margin' | 'padding' | 'gap' = 'margin';
            if (key.toLowerCase().includes('padding')) property = 'padding';
            if (key.toLowerCase().includes('gap')) property = 'gap';

            issues.push({
                element: key,
                property,
                value: result.value,
                suggestedValue: result.suggested,
            });
        }
    }

    return issues;
}

/**
 * Converts a Tailwind-style spacing class to its pixel value.
 * e.g., "p-4" -> 16, "m-2" -> 8
 */
export function tailwindToPixels(className: string): number | null {
    // Tailwind default spacing scale
    const tailwindScale: Record<string, number> = {
        '0': 0,
        '0.5': 2,  // Off-grid, should flag
        '1': 4,
        '1.5': 6,  // Off-grid
        '2': 8,
        '2.5': 10, // Off-grid
        '3': 12,   // Off-grid
        '3.5': 14, // Off-grid
        '4': 16,
        '5': 20,   // Off-grid
        '6': 24,
        '7': 28,   // Off-grid
        '8': 32,
        '9': 36,   // Off-grid
        '10': 40,  // Off-grid
        '11': 44,  // Off-grid
        '12': 48,
        '14': 56,  // Off-grid
        '16': 64,
    };

    // Extract the number from class like "p-4", "m-2", "gap-4"
    const match = /^(?:p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap)-(\d+(?:\.\d+)?)$/.exec(className);

    if (match && match[1] in tailwindScale) {
        return tailwindScale[match[1]];
    }

    return null;
}

/**
 * Returns Tailwind classes that are on the 8-point grid.
 * Use these for consistent spacing.
 */
export const ValidTailwindSpacing = {
    padding: ['p-0', 'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'p-12', 'p-16'],
    margin: ['m-0', 'm-1', 'm-2', 'm-4', 'm-6', 'm-8', 'm-12', 'm-16'],
    gap: ['gap-0', 'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8', 'gap-12', 'gap-16'],
} as const;

/**
 * Common off-grid Tailwind classes to avoid.
 */
export const OffGridTailwindClasses = [
    'p-0.5', 'p-1.5', 'p-2.5', 'p-3', 'p-3.5', 'p-5', 'p-7', 'p-9', 'p-10', 'p-11', 'p-14',
    'm-0.5', 'm-1.5', 'm-2.5', 'm-3', 'm-3.5', 'm-5', 'm-7', 'm-9', 'm-10', 'm-11', 'm-14',
    'gap-0.5', 'gap-1.5', 'gap-2.5', 'gap-3', 'gap-3.5', 'gap-5', 'gap-7', 'gap-9', 'gap-10', 'gap-11', 'gap-14',
] as const;
