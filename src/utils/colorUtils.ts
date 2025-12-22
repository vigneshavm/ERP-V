
/**
 * Converts a hex color string to an RGB object.
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Converts various color formats to an RGB object.
 */
function getRgb(hex: string) {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    return { r, g, b };
}

/**
 * Converts RGB to HSL.
 */
function rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break; // 4
        }
        h /= 6;
    }
    return { h, s, l };
}

/**
 * Converts HSL to RGB.
 */
function hslToRgb(h: number, s: number, l: number) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Generates a Tailwind-like palette (50-950) from a single hex color.
 * The input color is assumed to be the '600' shade (average primary weight).
 * returns an object mapping shade (string) to "r g b" string.
 */
export const generatePalette = (hex: string): Record<string, string> => {
    const { r, g, b } = getRgb(hex);
    const { h, s } = rgbToHsl(r, g, b);

    // Target lightness values for a standard Tailwind palette
    // 600 is usually the base (approx L=0.45 - 0.5)
    // We will adjust these based on the input color's lightness to try and maintain relative scale,
    // but for simplicity, we'll map the input color to 600 and distribute others around it.

    // Fixed lightness scale for safety and consistency
    const lightnessMap: Record<number, number> = {
        50: 0.95,
        100: 0.90,
        200: 0.80,
        300: 0.70,
        400: 0.60,
        500: 0.50,
        600: 0.45, // Primary
        700: 0.35,
        800: 0.25,
        900: 0.15,
        950: 0.05
    };

    // If the input color is very light or very dark, this fixed scale might ignore it.
    // Ideally we should use the input color as the anchor (say 600) and shift relative to it.
    // For this MVP, we will stick to the fixed scale but override 600 with exact input (or close to it) if possible.
    // Actually, to ensure the EXACT selected color is used, we should set the '600' or 'primary' variable to the exact RBG.

    const palette: Record<string, string> = {};

    Object.entries(lightnessMap).forEach(([shade, targetL]) => {
        // We use the H and S of the base color, and just force the L
        // This ensures all shades are of the same "color" (Hue).
        // Caveat: S might need to vary (lighter shades often less saturated), but constant S is "ok" for generating.
        const { r: newR, g: newG, b: newB } = hslToRgb(h, s, targetL);
        palette[shade] = `${newR} ${newG} ${newB}`;
    });

    // FORCE the 600 shade to be exactly the input color (to match user selection exactly)
    palette['600'] = `${r} ${g} ${b}`;
    // And maybe 500 is slightly lighter version of the real input

    return palette;
};
