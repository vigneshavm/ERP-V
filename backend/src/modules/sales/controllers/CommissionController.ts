import { Request, Response } from "express";
import mongoose from "mongoose";
import CommissionRule from "../models/CommissionRule.js";
import Invoice from "../models/Invoice.js";
import User from "../../core/models/User.js";
import Item from "../../inventory/models/Item.js";

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
export const getCommissionRules = async (req: Request, res: Response): Promise<void> => {
    try {
        const rules = await CommissionRule.find({ tenantId: (req as any).tenantId })
            .populate('employeeId', 'name role')
            .populate('itemId', 'name sku category')
            .sort({ createdAt: -1 });
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
export const createCommissionRule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requesterRole = (req as any).user?.role;
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

        const rule = await CommissionRule.create({
            tenantId: (req as any).tenantId,
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
export const updateCommissionRule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requesterRole = (req as any).user?.role;
        if (!requesterRole || !COMMISSION_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can manage commission rules.' });
            return;
        }

        const { id } = req.params;
        const { name, employeeId, scope, itemId, category, rateType, rateValue, status } = req.body;

        const rule = await CommissionRule.findOne({ _id: id, tenantId: (req as any).tenantId });
        if (!rule) {
            res.status(404).json({ message: 'Commission rule not found.' });
            return;
        }

        if (name !== undefined) rule.name = name;
        if (employeeId !== undefined) rule.employeeId = employeeId || undefined;
        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status)) {
                res.status(400).json({ message: 'status must be active or inactive.' });
                return;
            }
            rule.status = status;
        }
        if (scope !== undefined) {
            if (!['ITEM', 'CATEGORY', 'ALL'].includes(scope)) {
                res.status(400).json({ message: 'scope must be ITEM, CATEGORY, or ALL.' });
                return;
            }
            rule.scope = scope;
            rule.itemId = scope === 'ITEM' ? (itemId ?? rule.itemId) : undefined;
            rule.category = scope === 'CATEGORY' ? (category ?? rule.category) : undefined;
        } else {
            if (itemId !== undefined) rule.itemId = itemId;
            if (category !== undefined) rule.category = category;
        }
        if (rateType !== undefined) {
            if (!['PERCENT', 'FLAT'].includes(rateType)) {
                res.status(400).json({ message: 'rateType must be PERCENT or FLAT.' });
                return;
            }
            rule.rateType = rateType;
        }
        if (rateValue !== undefined) {
            const numericRate = Number(rateValue);
            if (Number.isNaN(numericRate) || numericRate < 0 || (rule.rateType === 'PERCENT' && numericRate > 100)) {
                res.status(400).json({ message: 'rateValue is invalid for the current rateType.' });
                return;
            }
            rule.rateValue = numericRate;
        }

        await rule.save();
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
export const deleteCommissionRule = async (req: Request, res: Response): Promise<void> => {
    try {
        const requesterRole = (req as any).user?.role;
        if (!requesterRole || !COMMISSION_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can manage commission rules.' });
            return;
        }

        const { id } = req.params;
        const result = await CommissionRule.findOneAndDelete({ _id: id, tenantId: (req as any).tenantId });
        if (!result) {
            res.status(404).json({ message: 'Commission rule not found.' });
            return;
        }
        res.status(200).json({ message: 'Commission rule deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

// Resolves the single best-matching active rule for a given employee + item + category
// combination. Precedence (most specific first): employee+item, employee+category,
// employee+all, tenant-wide item, tenant-wide category, tenant-wide all.
function resolveRule(rules: any[], employeeId: string, itemId: string, category: string | undefined) {
    const matches = (r: any) => {
        const empMatch = !r.employeeId || r.employeeId.toString() === employeeId;
        if (!empMatch) return false;
        if (r.scope === 'ITEM') return r.itemId && r.itemId.toString() === itemId;
        if (r.scope === 'CATEGORY') return !!category && r.category === category;
        return true; // ALL
    };
    const candidates = rules.filter(matches);
    if (candidates.length === 0) return null;

    const specificity = (r: any) => {
        const empBonus = r.employeeId ? 3 : 0;
        const scopeBonus = r.scope === 'ITEM' ? 2 : r.scope === 'CATEGORY' ? 1 : 0;
        return empBonus + scopeBonus;
    };
    candidates.sort((a, b) => specificity(b) - specificity(a));
    return candidates[0];
}

/**
 * @desc    Commission earned per employee over a date range, computed live from Invoices by
 *          resolving each line against the active commission rules. Not a stored ledger.
 * @route   GET /api/commission-rules/report?from=&to=&employeeId=
 * @access  Private
 */
export const getCommissionReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).tenantId;
        const { from, to, employeeId } = req.query as { from?: string; to?: string; employeeId?: string };

        const dateFilter: Record<string, Date> = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            dateFilter.$lte = toDate;
        }

        const invoiceQuery: Record<string, any> = { tenantId, isDeleted: { $ne: true } };
        if (Object.keys(dateFilter).length > 0) invoiceQuery.createdAt = dateFilter;
        if (employeeId) invoiceQuery.createdBy = employeeId;

        const [rules, invoices, items] = await Promise.all([
            CommissionRule.find({ tenantId, status: 'active' }).lean(),
            Invoice.find(invoiceQuery).select('createdBy items totalAmount createdAt').lean(),
            Item.find({ tenantId }).select('category').lean(),
        ]);

        if (rules.length === 0) {
            res.status(200).json({ from: from || null, to: to || null, employees: [], note: 'No active commission rules are configured yet.' });
            return;
        }

        const itemCategoryMap = new Map<string, string | undefined>(items.map((it: any) => [it._id.toString(), it.category]));

        const perEmployee = new Map<string, { employeeId: string; invoiceIds: Set<string>; totalCommission: number; totalSalesAttributed: number }>();

        for (const invoice of invoices) {
            const empId = (invoice.createdBy as mongoose.Types.ObjectId)?.toString();
            if (!empId) continue;

            for (const line of (invoice.items || []) as any[]) {
                const itemId = line.item?.toString();
                if (!itemId) continue;
                const category = itemCategoryMap.get(itemId);
                const rule = resolveRule(rules, empId, itemId, category);
                if (!rule) continue;

                const lineBase = line.taxableAmount || line.total || (line.price * line.quantity) || 0;
                const commission = rule.rateType === 'PERCENT'
                    ? (lineBase * rule.rateValue) / 100
                    : rule.rateValue;

                if (!perEmployee.has(empId)) {
                    perEmployee.set(empId, { employeeId: empId, invoiceIds: new Set(), totalCommission: 0, totalSalesAttributed: 0 });
                }
                const entry = perEmployee.get(empId)!;
                entry.totalCommission += commission;
                entry.totalSalesAttributed += lineBase;
                entry.invoiceIds.add((invoice._id as mongoose.Types.ObjectId).toString());
            }
        }

        const employeeIds = Array.from(perEmployee.keys());
        const users = await User.find({ _id: { $in: employeeIds } }).select('name role').lean();
        const userNameMap = new Map(users.map((u: any) => [u._id.toString(), u.name]));

        const employees = employeeIds.map((id) => {
            const entry = perEmployee.get(id)!;
            return {
                employeeId: id,
                employeeName: userNameMap.get(id) || 'Unknown',
                invoiceCount: entry.invoiceIds.size,
                totalSalesAttributed: Math.round(entry.totalSalesAttributed * 100) / 100,
                totalCommission: Math.round(entry.totalCommission * 100) / 100,
            };
        }).sort((a, b) => b.totalCommission - a.totalCommission);

        res.status(200).json({ from: from || null, to: to || null, employees });
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
