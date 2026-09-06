// Raw thermal-label command generation for specific printer brands, covering the Textilesoft
// gap of supporting multiple label-printer brands (Citizen, GODEX, TSC, TVS, Zebra) rather than
// only a generic browser-print PDF.
//
// Scope note: ZPL (Zebra) and TSPL (TSC/GODEX/TVS -- all three implement or emulate the TSPL
// command set on their thermal label printers) are well-documented, standardized protocols that
// can be generated correctly from spec without needing physical hardware to verify against.
// Citizen's own label printers mostly use ESC/POS-style or vendor-specific CLP commands that
// vary by exact model and aren't standardized the same way, so Citizen intentionally stays on
// the existing PDF/browser-print path (PRINTER_PROFILES marks it 'pdf') rather than emitting a
// raw command format this codebase can't verify is correct for a given Citizen model.
//
// A raw command string is only useful to a real printer over a direct connection (USB/serial/
// network port 9100, or a vendor print spooler) -- a browser can't open that connection itself,
// so the UI offers it as a downloadable .txt/.prn file the user sends to the printer via their
// OS's print utility or the printer's network port, alongside the existing in-browser PDF option.

export type PrinterBrand = 'ZEBRA' | 'TSC' | 'GODEX' | 'TVS' | 'CITIZEN_GENERIC';
export type PrinterProtocol = 'ZPL' | 'TSPL' | 'pdf';

export interface PrinterProfile {
    brand: PrinterBrand;
    label: string;
    protocol: PrinterProtocol;
    defaultDpi: 203 | 300;
}

export const PRINTER_PROFILES: Record<PrinterBrand, PrinterProfile> = {
    ZEBRA: { brand: 'ZEBRA', label: 'Zebra (e.g. TLP2844) — ZPL', protocol: 'ZPL', defaultDpi: 203 },
    TSC: { brand: 'TSC', label: 'TSC (e.g. TTP/TE series) — TSPL', protocol: 'TSPL', defaultDpi: 203 },
    GODEX: { brand: 'GODEX', label: 'GODEX — TSPL/EZPL (TSPL-compatible)', protocol: 'TSPL', defaultDpi: 203 },
    TVS: { brand: 'TVS', label: 'TVS (LP 44 / 45 / 46) — TSPL-compatible', protocol: 'TSPL', defaultDpi: 203 },
    CITIZEN_GENERIC: { brand: 'CITIZEN_GENERIC', label: 'Citizen / Generic — PDF via Browser Print', protocol: 'pdf', defaultDpi: 203 },
};

export interface LabelItemInput {
    name?: string;
    code: string; // barcode/SKU value to encode
    price?: string | number;
}

export interface LabelDimsMm {
    widthMm: number;
    heightMm: number;
}

const mmToDots = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);

// Escapes characters ZPL treats specially inside ^FD field data.
const escapeZpl = (value: string) => value.replace(/[\^~]/g, '');

/**
 * Zebra Programming Language (ZPL II). One ^XA...^XZ label per item, repeated `copies` times via
 * the ^PQ quantity command so a single job prints the full run.
 */
export const generateZPL = (item: LabelItemInput, dims: LabelDimsMm, dpi = 203, copies = 1): string => {
    const widthDots = mmToDots(dims.widthMm, dpi);
    const heightDots = mmToDots(dims.heightMm, dpi);
    const name = escapeZpl(String(item.name || ''));
    const code = escapeZpl(String(item.code || ''));
    const priceLine = item.price ? `^FO20,${Math.round(heightDots * 0.6)}^A0N,28,28^FDRs.${item.price}^FS` : '';

    return [
        '^XA',
        `^PW${widthDots}`,
        `^LL${heightDots}`,
        name ? `^FO20,20^A0N,24,24^FD${name}^FS` : '',
        `^FO20,${Math.round(heightDots * 0.3)}^BY2^BCN,${Math.round(heightDots * 0.35)},Y,N,N^FD${code}^FS`,
        priceLine,
        `^PQ${Math.max(1, copies)}`,
        '^XZ',
    ].filter(Boolean).join('\n');
};

/**
 * TSPL (TSC Printer Language) -- also implemented or emulated by GODEX and TVS thermal label
 * printers, which is why those two brands share this generator.
 */
export const generateTSPL = (item: LabelItemInput, dims: LabelDimsMm, copies = 1): string => {
    const name = String(item.name || '').replace(/"/g, "'");
    const code = String(item.code || '').replace(/"/g, "'");
    const priceLine = item.price ? `TEXT 20,140,"3",0,1,1,"Rs.${item.price}"` : '';

    return [
        `SIZE ${dims.widthMm} mm, ${dims.heightMm} mm`,
        'GAP 2 mm, 0 mm',
        'DIRECTION 1',
        'CLS',
        name ? `TEXT 20,20,"2",0,1,1,"${name}"` : '',
        `BARCODE 20,50,"128",60,1,0,2,2,"${code}"`,
        priceLine,
        `PRINT 1,${Math.max(1, copies)}`,
    ].filter(Boolean).join('\r\n');
};

/** Generates the raw command text for a batch of items, in the protocol the profile calls for. */
export const generateBatchCommands = (
    profile: PrinterProfile,
    items: LabelItemInput[],
    dims: LabelDimsMm,
    copiesPerItem = 1
): string => {
    if (profile.protocol === 'ZPL') {
        return items.map((it) => generateZPL(it, dims, profile.defaultDpi, copiesPerItem)).join('\n\n');
    }
    if (profile.protocol === 'TSPL') {
        return items.map((it) => generateTSPL(it, dims, copiesPerItem)).join('\r\n\r\n');
    }
    return '';
};

export const printFileExtension = (profile: PrinterProfile): string => (profile.protocol === 'ZPL' ? 'zpl' : 'prn');
