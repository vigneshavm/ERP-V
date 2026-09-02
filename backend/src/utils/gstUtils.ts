/**
 * Unified GST Calculation Utility
 * Handles tax breakdown, inclusive/exclusive tax calculations, intra-state vs inter-state tax splits,
 * and item array enrichment.
 */

export interface GSTBreakdown {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
}

export interface EnrichedGSTItem {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
    [key: string]: any;
}

export interface BatchGSTResult {
    items: EnrichedGSTItem[];
    totalTaxable: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalTax: number;
}

/**
 * Decomposes a total line value into taxable amount, CGST, SGST, IGST, and total tax.
 */
export const decomposeGST = (
    totalLineValue: number,
    gstRate: number,
    isInterState: boolean,
    isInclusive: boolean
): GSTBreakdown => {
    if (!gstRate || gstRate <= 0) {
        return { taxableAmount: +totalLineValue.toFixed(2), cgst: 0, sgst: 0, igst: 0, tax: 0 };
    }

    let taxableAmount: number;
    if (isInclusive) {
        taxableAmount = totalLineValue / (1 + gstRate / 100);
    } else {
        taxableAmount = totalLineValue;
    }

    const taxAmount = isInclusive 
        ? totalLineValue - taxableAmount 
        : taxableAmount * (gstRate / 100);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        igst = taxAmount;
    } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
    }

    return {
        taxableAmount: +taxableAmount.toFixed(2),
        cgst: +cgst.toFixed(2),
        sgst: +sgst.toFixed(2),
        igst: +igst.toFixed(2),
        tax: +(cgst + sgst + igst).toFixed(2),
    };
};

/**
 * Batch computes GST tax breakdown for an array of invoice or sales line items.
 */
export const calculateBatchGST = (
    items: any[],
    isInterState: boolean,
    isInclusive: boolean
): BatchGSTResult => {
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const enrichedItems = items.map((item) => {
        const gstRate = item.gstRate ?? 0;
        const lineValue = item.total ?? (item.price * item.quantity);

        const breakdown = decomposeGST(lineValue, gstRate, isInterState, isInclusive);

        totalTaxable += breakdown.taxableAmount;
        totalCGST += breakdown.cgst;
        totalSGST += breakdown.sgst;
        totalIGST += breakdown.igst;

        return {
            ...item,
            ...breakdown,
        };
    });

    return {
        items: enrichedItems,
        totalTaxable: +totalTaxable.toFixed(2),
        totalCGST: +totalCGST.toFixed(2),
        totalSGST: +totalSGST.toFixed(2),
        totalIGST: +totalIGST.toFixed(2),
        totalTax: +(totalCGST + totalSGST + totalIGST).toFixed(2),
    };
};
