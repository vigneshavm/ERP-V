import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const values = new Map<string, unknown>();

jest.unstable_mockModule("../../../integrations/textilesoft/erpSystemConfig.js", () => ({
    getConfig: async (key: string, fallback: unknown) => values.get(key) ?? fallback,
    setConfig: async (key: string, value: unknown, group: string) => {
        values.set(key, value);
        return { key, value, group };
    },
}));
jest.unstable_mockModule("../../../integrations/textilesoft/erpTaxMaster.js", () => ({
    getTaxPercentage: async (_taxCode: string, fallback: number) => fallback,
}));

const { default: ConfigService } = await import("./ConfigService.js");

describe("ConfigService SQL-backed loyalty and segment rules", () => {
    beforeEach(() => {
        values.clear();
        ConfigService.clearCache();
    });

    it("stores loyalty config by tenant in the existing SQL config store", async () => {
        await ConfigService.saveLoyaltyRule("tenant-a", { spendPerPoint: 80, rupeesPer100Points: 12 });
        await ConfigService.saveLoyaltyRule("tenant-b", { spendPerPoint: 150, rupeesPer100Points: 5 });

        await expect(ConfigService.getLoyaltyRuleConfig("tenant-a")).resolves.toEqual({ spendPerPoint: 80, rupeesPer100Points: 12 });
        await expect(ConfigService.getLoyaltyRuleConfig("tenant-b")).resolves.toEqual({ spendPerPoint: 150, rupeesPer100Points: 5 });
    });

    it("updates one segment without dropping the other tenant rules", async () => {
        const saved = await ConfigService.saveSegmentRule("tenant-a", { segmentName: "HIGH_VALUE", minSpend: 40000, minOrders: 20 });

        expect(saved).toMatchObject({ segmentName: "HIGH_VALUE", minSpend: 40000, minOrders: 20, isActive: true });
        await expect(ConfigService.getSegmentRules("tenant-a")).resolves.toHaveLength(6);
        await expect(ConfigService.getSegmentRules("tenant-b")).resolves.toHaveLength(6);
    });
});
