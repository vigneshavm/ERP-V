// Bill/receipt print layout + GRN numbering behavior (Settings -> Print Settings tab).
// Mirrors backend/src/modules/core/models/Tenant.ts's printSettings shape.

export interface PrintSettings {
    billHeaderText: string;
    billFooterText: string;
    grnNumberingMode: 'AUTO' | 'MANUAL';
    grnNumberingPrefix: string;
    grnNumberingReset: 'NEVER' | 'YEARLY' | 'MONTHLY';
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    billHeaderText: '',
    billFooterText: 'Thank you for your business!',
    grnNumberingMode: 'AUTO',
    grnNumberingPrefix: 'GRN',
    grnNumberingReset: 'NEVER'
};
