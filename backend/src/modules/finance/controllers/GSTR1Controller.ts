import { Request, Response } from 'express';
import { buildGSTR1Report } from '../services/GSTR1Service.js';
import { error } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    tenantId?: string;
}

/**
 * GET /api/gst/gstr1?period=2024-03
 * Returns JSON report for in-app display
 */
export const getGSTR1Report = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const period = req.query.period as string;

        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            res.status(400).json({ message: 'period query param is required in YYYY-MM format' });
            return;
        }

        const report = await buildGSTR1Report(tenantId!, period);
        res.status(200).json(report);
    } catch (err) {
        error(`GSTR-1 Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * GET /api/gst/gstr1/export?period=2024-03
 * Returns a downloadable JSON file (GST portal compatible structure)
 */
export const exportGSTR1 = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const period = req.query.period as string;

        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            res.status(400).json({ message: 'period query param is required in YYYY-MM format' });
            return;
        }

        const report = await buildGSTR1Report(tenantId!, period);

        // Format as GST-portal compatible JSON skeleton
        const gstPortalJson = {
            gstin: '',          // To be filled by tenant GSTIN at frontend
            ret_period: period.replace('-', ''),  // e.g. "202403"
            b2cs: report.invoices.map(inv => ({
                inv_no:  inv.invoiceNo,
                inv_dt:  inv.date,
                typ:     inv.isInterState ? 'DE' : 'OE',
                val:     inv.totalAmount,
                txval:   inv.taxableValue,
                iamt:    inv.igst,
                camt:    inv.cgst,
                samt:    inv.sgst,
            })),
            hsn: {
                data: report.hsnSummary.map(h => ({
                    num:     1,
                    hsn_sc: h.hsnCode,
                    desc:    h.description || h.hsnCode,
                    uqc:     'NOS',
                    cnt:     h.totalQty,
                    txval:   h.taxableValue,
                    iamt:    h.igst,
                    camt:    h.cgst,
                    samt:    h.sgst,
                    rt:      h.gstRate,
                }))
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="GSTR1_${period}.json"`);
        res.status(200).json(gstPortalJson);
    } catch (err) {
        error(`GSTR-1 Export Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};
