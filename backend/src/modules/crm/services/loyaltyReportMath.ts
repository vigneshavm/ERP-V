/**
 * Loyalty report calculations (pure; LoyaltyReportService does the queries).
 *
 * Tiers are worked out from each customer's current points with the thresholds LoyaltyController uses, because the
 * stored `tier` is only refreshed on a manual adjustment, not when points are earned at billing.
 */

export const TIERS = [
    { tier: "Platinum", minPoints: 5000 },
    { tier: "Gold", minPoints: 2000 },
    { tier: "Silver", minPoints: 500 },
    { tier: "Bronze", minPoints: 0 },
] as const;
export type Tier = (typeof TIERS)[number]["tier"];

/** A customer is "active" if they bought something in the last ACTIVE_DAYS days. */
export const ACTIVE_DAYS = 90;

export const tierOf = (points: number): Tier => TIERS.find((t) => points >= t.minPoints)!.tier;

export interface MemberInput {
    id: string;
    name: string;
    phone: string;
    points: number;
    lastPurchase: string | null; // YYYY-MM-DD
    totalSpend: number;
    whatsappOptIn: boolean;
    /** Has any loyalty ledger entry, ever. */
    hasLedger: boolean;
}

export interface LedgerInput { customerId: string; type: string; points: number; date: string }

const round2 = (v: number) => Math.round(v * 100) / 100;
const dayNum = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);

/** A loyalty member: holds points, or has ever earned or redeemed. Customers who never touched the scheme aren't members. */
export const isMember = (c: MemberInput) => c.points > 0 || c.hasLedger;

export function summarizeLoyalty(
    customers: MemberInput[],
    ledger: LedgerInput[],
    rules: { spendPerPoint: number; rupeesPer100Points: number },
    today: string,
    sales: { memberSales: number; totalSales: number },
) {
    const members = customers.filter(isMember);
    const active = members.filter((m) => m.lastPurchase && dayNum(today) - dayNum(m.lastPurchase) <= ACTIVE_DAYS);
    const outstanding = members.reduce((s, m) => s + Math.max(0, m.points), 0);
    const pointValue = (p: number) => round2((p / 100) * rules.rupeesPer100Points);

    // Period movement. EARN / PROMOTIONAL_BONUS / positive ADJUSTMENT are issued; REDEEM is used; EXPIRE lapses.
    let issued = 0, redeemed = 0, expired = 0, adjustedDown = 0;
    for (const l of ledger) {
        const p = Math.abs(l.points);
        if (l.type === "EARN" || l.type === "PROMOTIONAL_BONUS" || (l.type === "ADJUSTMENT" && l.points > 0)) issued += p;
        else if (l.type === "REDEEM") redeemed += p;
        else if (l.type === "EXPIRE") expired += p;
        else if (l.type === "ADJUSTMENT" || l.type === "REFUND_REVERSAL") adjustedDown += p;
    }
    const earners = new Set(ledger.filter((l) => l.type === "EARN").map((l) => l.customerId));
    const redeemers = new Set(ledger.filter((l) => l.type === "REDEEM").map((l) => l.customerId));

    const tiers = TIERS.map(({ tier, minPoints }) => {
        const inTier = members.filter((m) => tierOf(m.points) === tier);
        return { tier, minPoints, members: inTier.length, points: inTier.reduce((s, m) => s + Math.max(0, m.points), 0) };
    });

    return {
        members: members.length,
        activeMembers: active.length,
        whatsappOptIn: members.filter((m) => m.whatsappOptIn).length,
        outstandingPoints: outstanding,
        outstandingValue: pointValue(outstanding),
        period: {
            issued, redeemed, expired, adjustedDown,
            redeemedValue: pointValue(redeemed),
            /** Points redeemed as a share of points issued in the period; null when none were issued. */
            redemptionRatePct: issued > 0 ? Math.round((redeemed / issued) * 1000) / 10 : null,
            earners: earners.size,
            redeemers: redeemers.size,
        },
        sales: {
            memberSales: round2(sales.memberSales),
            totalSales: round2(sales.totalSales),
            memberSharePct: sales.totalSales > 0 ? Math.round((sales.memberSales / sales.totalSales) * 1000) / 10 : null,
        },
        tiers,
        topMembers: [...members].sort((a, b) => b.points - a.points).slice(0, 15).map((m) => ({
            id: m.id, name: m.name, phone: m.phone, points: m.points, tier: tierOf(m.points), value: pointValue(m.points),
            lastPurchase: m.lastPurchase, totalSpend: round2(m.totalSpend),
        })),
        rules: { ...rules, rupeesPerPoint: rules.rupeesPer100Points / 100 },
    };
}
