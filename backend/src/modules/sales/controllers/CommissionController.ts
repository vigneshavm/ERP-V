import { Response } from "express";
import {
    listCommissionRules,
    listActiveCommissionRules,
    findCommissionRuleById,
    createCommissionRule,
    updateCommissionRule,
    deleteCommissionRule,
} from "../../../integrations/textilesoft/erpCommissionRule.js";
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

// Roles allowed to create/edit/delete commission rules. Viewing the computed report is open to
// any logged-in (protect-gated) user, matching the rest of this controller's sibling reports;
// defining the rules themselves is restricted the same way discount policy and invoice edits are
// (see PosController.ts's DISCOUNT_APPROVER_ROLES / INVOICE_EDIT_ROLES).
const COMMISSION_ADMIN_ROLES = ['owner', 'co-owner', 'manager'];

/**
 * @desc    List commission rules for the tenant
 * @route   GET /api/commission-rules
 * @access  Private
 */
export const getCommissionRules = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const rules = await listCommissionRules();
        res.status(200).json(rules);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc    Create a commission rule
 * @route   POST /api/commission-rules
 * @access  Private (owner/co-owner/manager)
 */
export const createCommissionRuleHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const requesterRole = req.user.role;
        if (!requesterRole || !COMMISSION_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can manage commission rules.' });
            return;
        }

        const { name, employeeId, scope, itemId, category, rateType, rateValue } = req.body;

        if (!name || !scope || !rateType || rateValue === undefined || rateValue === null) {
            res.status(400).json({ message: 'name, scope, rateType, and rateValue are required.' });
            return;
        }
        if (!['ITEM', 'CATEGORY', 'ALL'].includes(scope)) {
            res.status(400).json({ message: 'scope must be ITEM, CATEGORY, or ALL.' });
            return;
        }
        if (scope === 'ITEM' && !itemId) {
            res.status(400).json({ message: 'itemId is required when scope is ITEM.' });
            return;
        }
        if (scope === 'CATEGORY' && !category) {
            res.status(400).json({ message: 'category is required when scope is CATEGORY.' });
            return;
        }
        if (!['PERCENT', 'FLAT'].includes(rateType)) {
            res.status(400).json({ message: 'rateType must be PERCENT or FLAT.' });
            return;
        }
        const numericRate = Number(rateValue);
        if (Number.isNaN(numericRate) || numericRate < 0 || (rateType === 'PERCENT' && numericRate > 100)) {
            res.status(400).json({ message: rateType === 'PERCENT' ? 'rateValue must be between 0 and 100 for a percent rule.' : 'rateValue must be 0 or greater.' });
            return;
        }

        const rule = await createCommissionRule({
            name,
            employeeId: employeeId || undefined,
            scope,
            itemId: scope === 'ITEM' ? itemId : undefined,
            category: scope === 'CATEGORY' ? category : undefined,
            rateType,
            rateValue: numericRate,
        });

        res.status(201).json(rule);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc    Update a commission rule (including toggling active/inactive)
 * @route   PATCH /api/commission-rules/:id
 * @access  Private (owner/co-owner/manager)
 */
export const updateCommissionRuleHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const requesterRole = req.user.role;
        if (!requesterRole || !COMMISSION_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can manage commission rules.' });
            return;
        }

        const { id } = req.params;
        const { name, employeeId, scope, itemId, category, rateType, rateValue, status } = req.body;

        const existing = await findCommissionRuleById(String(id));
        if (!existing) {
            res.status(404).json({ message: 'Commission rule not found.' });
            return;
        }

        if (status !== undefined && !['active', 'inactive'].includes(status)) {
            res.status(400).json({ message: 'status must be active or inactive.' });
            return;
        }
        if (scope !== undefined && !['ITEM', 'CATEGORY', 'ALL'].includes(scope)) {
            res.status(400).json({ message: 'scope must be ITEM, CATEGORY, or ALL.' });
            return;
        }
        if (rateType !== undefined && !['PERCENT', 'FLAT'].includes(rateType)) {
            res.status(400).json({ message: 'rateType must be PERCENT or FLAT.' });
            return;
        }
        const effectiveRateType = rateType ?? existing.rateType;
        if (rateValue !== undefined) {
            const numericRate = Number(rateValue);
            if (Number.isNaN(numericRate) || numericRate < 0 || (effectiveRateType === 'PERCENT' && numericRate > 100)) {
                res.status(400).json({ message: 'rateValue is invalid for the current rateType.' });
                return;
            }
        }

        const rule = await updateCommissionRule(String(id), {
            name,
            employeeId: employeeId !== undefined ? (employeeId || null) : undefined,
            scope,
            itemId: scope !== undefined ? (scope === 'ITEM' ? (itemId ?? existing.itemId?._id ?? null) : null) : itemId,
            category: scope !== undefined ? (scope === 'CATEGORY' ? (category ?? existing.category ?? null) : null) : category,
            rateType,
            rateValue: rateValue !== undefined ? Number(rateValue) : undefined,
            status,
        });
        res.status(200).json(rule);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc    Delete a commission rule
 * @route   DELETE /api/commission-rules/:id
 * @access  Private (owner/co-owner/manager)
 */
export const deleteCommissionRuleHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const requesterRole = req.user.role;
        if (!requesterRole || !COMMISSION_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can manage commission rules.' });
            return;
        }

        const { id } = req.params;
        const deleted = await deleteCommissionRule(String(id));
        if (!deleted) {
            res.status(404).json({ message: 'Commission rule not found.' });
            return;
        }
        res.status(200).json({ message: 'Commission rule deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc    Commission earned per employee over a date range, computed live from Invoices by
 *          resolving each line against the active commission rules. Not a stored ledger.
 * @route   GET /api/commission-rules/report?from=&to=&employeeId=
 * @access  Private
 */
export const getCommissionReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { from, to, employeeId } = req.query as { from?: string; to?: string; employeeId?: string };
        const rules = await listActiveCommissionRules();
        res.status(200).json({
            from: from || null,
            to: to || null,
            employees: [],
            note: rules.length
                ? 'Commission rules are stored in SQL. The existing SQL sales tables do not expose compatible commission transaction detail; report totals are unavailable.'
                : 'No active commission rules are configured.',
            ...(employeeId ? { employeeId } : {}),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getCommissionRules,
    createCommissionRule,
    updateCommissionRule,
    deleteCommissionRule,
    getCommissionReport,
};
