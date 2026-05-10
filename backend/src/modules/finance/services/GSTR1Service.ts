import Invoice from '../../sales/models/Invoice.js';

// ─────────────────────────────────────────────────────────────
// Helper: decompose a flat total into taxable + CGST/SGST/IGST
// ─────────────────────────────────────────────────────────────
export const decomposeGST = (
    totalLineValue: number,
    gstRate: number,
    isInterState: boolean,
    isInclusive: boolean
): { taxableAmount: number; cgst: number; sgst: number; igst: number; tax: number } => {
    if (gstRate === 0) {
        return { taxableAmount: totalLineValue, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    }

    let taxableAmount: number;
    if (isInclusive) {
        // Extract tax from inclusive price
        taxableAmount = totalLineValue / (1 + gstRate / 100);
    } else {
        taxableAmount = totalLineValue;
    }

    const taxAmount = totalLineValue - taxableAmount;

    let cgst = 0, sgst = 0, igst = 0;
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
        tax:  +taxAmount.toFixed(2),
    };
};

// ─────────────────────────────────────────────────────────────
// GSTR-1 Report builder
// ─────────────────────────────────────────────────────────────
export interface GSTR1Report {
    period: string;
    generatedAt: Date;
    tenantId: string;
    summary: {
        totalInvoices: number;
        totalTaxableValue: number;
        totalCGST: number;
        totalSGST: number;
        totalIGST: number;
        totalTax: number;
        totalSales: number;
    };
    // HSN-wise summary (Table 12 of GSTR-1)
    hsnSummary: {
        hsnCode: string;
        description: string;
        gstRate: number;
        totalQty: number;
        totalValue: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
    }[];
    // Invoice-level B2C detail
    invoices: {
        invoiceNo: string;
        date: string;
        customerName: string;
        isInterState: boolean;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalAmount: number;
    }[];
}

export const buildGSTR1Report = async (
    tenantId: string,
    period: string // "YYYY-MM"
): Promise<GSTR1Report> => {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59);

    const invoices = await Invoice.find({
        tenantId,
        isDeleted: { $ne: true },
        createdAt: { $gte: startDate, $lte: endDate },
    })
        .populate('customer', 'name phone gstin')
        .populate('items.item', 'name hsnCode gstRate unit')
        .lean();

    // ── Aggregate ──────────────────────────────────────────
    const hsnMap = new Map<string, {
        hsnCode: string; gstRate: number;
        totalQty: number; totalValue: number;
        taxableValue: number; cgst: number; sgst: number; igst: number;
    }>();

    let sumTaxable = 0, sumCGST = 0, sumSGST = 0, sumIGST = 0, sumTotal = 0;

    const invoiceRows: GSTR1Report['invoices'] = [];

    for (const inv of invoices) {
        const isInterState = (inv as any).isInterState ?? false;
        const isInclusive  = ((inv as any).taxMode ?? 'INCLUSIVE') === 'INCLUSIVE';
        const customer      = inv.customer as any;

        let invTaxable = 0, invCGST = 0, invSGST = 0, invIGST = 0;

        for (const lineItem of (inv as any).items) {
            const populatedItem = lineItem.item as any;
            const gstRate   = lineItem.gstRate ?? populatedItem?.gstRate ?? 0;
            const hsnCode   = lineItem.hsnCode ?? populatedItem?.hsnCode ?? 'MISC';
            const lineValue = lineItem.total ?? (lineItem.price * lineItem.quantity);

            const gst = decomposeGST(lineValue, gstRate, isInterState, isInclusive);

            invTaxable += gst.taxableAmount;
            invCGST    += gst.cgst;
            invSGST    += gst.sgst;
            invIGST    += gst.igst;

            // HSN aggregation
            const key = `${hsnCode}_${gstRate}`;
            const existing = hsnMap.get(key) ?? {
                hsnCode, gstRate,
                totalQty: 0, totalValue: 0,
                taxableValue: 0, cgst: 0, sgst: 0, igst: 0
            };
            existing.totalQty    += lineItem.quantity ?? 0;
            existing.totalValue  += lineValue;
            existing.taxableValue+= gst.taxableAmount;
            existing.cgst        += gst.cgst;
            existing.sgst        += gst.sgst;
            existing.igst        += gst.igst;
            hsnMap.set(key, existing);
        }

        sumTaxable += invTaxable;
        sumCGST    += invCGST;
        sumSGST    += invSGST;
        sumIGST    += invIGST;
        sumTotal   += (inv as any).totalAmount ?? 0;

        invoiceRows.push({
            invoiceNo:    (inv as any).invoiceNo,
            date:         new Date((inv as any).createdAt).toISOString().split('T')[0],
            customerName: customer?.name ?? 'Walk-in',
            isInterState,
            taxableValue: +invTaxable.toFixed(2),
            cgst:         +invCGST.toFixed(2),
            sgst:         +invSGST.toFixed(2),
            igst:         +invIGST.toFixed(2),
            totalAmount:  (inv as any).totalAmount ?? 0,
        });
    }

    return {
        period,
        generatedAt: new Date(),
        tenantId,
        summary: {
            totalInvoices:    invoices.length,
            totalTaxableValue:+sumTaxable.toFixed(2),
            totalCGST:        +sumCGST.toFixed(2),
            totalSGST:        +sumSGST.toFixed(2),
            totalIGST:        +sumIGST.toFixed(2),
            totalTax:         +(sumCGST + sumSGST + sumIGST).toFixed(2),
            totalSales:       +sumTotal.toFixed(2),
        },
        hsnSummary: Array.from(hsnMap.values()).map(h => ({
            ...h,
            description:  '',   // HSN description can be enriched from a lookup table
            taxableValue: +h.taxableValue.toFixed(2),
            cgst:         +h.cgst.toFixed(2),
            sgst:         +h.sgst.toFixed(2),
            igst:         +h.igst.toFixed(2),
        })),
        invoices: invoiceRows,
    };
};

export default { buildGSTR1Report, decomposeGST };
