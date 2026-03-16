import Fuse from 'fuse.js';
import Expense from '@smarterp/core/modules/expense/models/Expense.js';
export var AuditStatus;
(function (AuditStatus) {
    AuditStatus["PASS"] = "PASS";
    AuditStatus["FAIL"] = "FAIL";
    AuditStatus["FLAG"] = "FLAG"; // Needs review (e.g., suspicious vendor, over budget)
})(AuditStatus || (AuditStatus = {}));
export class AuditAgent {
    static BUDGET_LIMIT = 50000; // Hardcoded budget limit for now
    /**
     * Audits the extracted data against history and business rules
     */
    static async audit(data, tenantId) {
        // 1. Strict Tenant Scoping for Duplicates
        const duplicate = await this.checkForDuplicates(data, tenantId);
        if (duplicate) {
            return {
                status: AuditStatus.FAIL,
                reason: `Potential duplicate found: Expense on ${data.date.toLocaleDateString()} for ${data.amount}`
            };
        }
        // 2. Budget Violation Check
        if (data.amount > this.BUDGET_LIMIT) {
            return {
                status: AuditStatus.FLAG,
                reason: `Expense amount (${data.amount}) exceeds auto-approval budget limit (${this.BUDGET_LIMIT})`
            };
        }
        // 3. Fuzzy Vendor Analysis (Optional: Check if vendor name is suspicious or very similar to others)
        const vendorAlert = await this.analyzeVendorFuzzy(data.vendor, tenantId);
        if (vendorAlert) {
            return {
                status: AuditStatus.FLAG,
                reason: vendorAlert
            };
        }
        return {
            status: AuditStatus.PASS,
            reason: 'Audit passed: No duplicates found and within budget.'
        };
    }
    static async checkForDuplicates(data, tenantId) {
        // Find expenses with same amount and date (+/- 1 day) for the same tenant
        const dateStart = new Date(data.date);
        dateStart.setDate(dateStart.getDate() - 1);
        const dateEnd = new Date(data.date);
        dateEnd.setDate(dateEnd.getDate() + 1);
        const potentialMatch = await Expense.findOne({
            tenantId,
            amount: data.amount,
            date: { $gte: dateStart, $lte: dateEnd }
        });
        // Add additional check for vendor name similarity if potential match found
        if (potentialMatch) {
            const fuse = new Fuse([potentialMatch.description || ''], { threshold: 0.4 });
            const searchResult = fuse.search(data.vendor);
            if (searchResult.length > 0)
                return potentialMatch;
        }
        return null;
    }
    static async analyzeVendorFuzzy(vendorName, tenantId) {
        // Pull recent vendors for this tenant to check for "creative" spelling differences
        const recentExpenses = await Expense.find({ tenantId })
            .select('description')
            .limit(100);
        const vendors = recentExpenses.map(e => e.description || '').filter(v => v.length > 0);
        if (vendors.length === 0)
            return null;
        const fuse = new Fuse(vendors, { includeScore: true, threshold: 0.2 });
        const results = fuse.search(vendorName);
        // If we find a very close match (low score) but not exact, it might be a suspicious variation
        for (const res of results) {
            if (res.item.toLowerCase() !== vendorName.toLowerCase() && (res.score || 1) < 0.1) {
                return `Suspiciously similar vendor name found: "${res.item}" vs "${vendorName}"`;
            }
        }
        return null;
    }
}
