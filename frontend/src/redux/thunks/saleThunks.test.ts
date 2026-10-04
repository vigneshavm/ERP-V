import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import type { Sale } from "../../types/sales";

const mocks = vi.hoisted(() => ({ post: vi.fn(), queue: vi.fn(), finance: vi.fn(), points: vi.fn() }));
vi.mock("../../services/api", () => ({ default: { post: mocks.post } }));
vi.mock("../../services/db", () => ({ db: { offlineSales: { add: mocks.queue } } }));
vi.mock("../slices/financeSlice", () => ({ addTransaction: mocks.finance }));
vi.mock("../slices/posSlice", () => ({
    recordSale: (sale: Sale) => ({ type: "pos/recordSale", payload: sale }),
    updateCustomerPoints: mocks.points,
}));
vi.mock("../slices/inventorySlice", () => ({ deductStock: (payload: unknown) => ({ type: "inventory/deductStock", payload }) }));
const { processSale } = await import("./saleThunks");

const makeSale = () => ({ id: "pending-1", total: 200, items: [{ id: "barcode-1", barcode: "barcode-1", name: "Shirt", price: 200, qty: 1, unit: "Piece" }], date: "2026-10-02", paymentMethod: "CASH" } as unknown as Sale);
let onlineDescriptor: PropertyDescriptor | undefined;
beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockReset();
    onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});
afterEach(() => {
    if (onlineDescriptor) Object.defineProperty(navigator, "onLine", onlineDescriptor);
    else Reflect.deleteProperty(navigator, "onLine");
});
describe("SQL sale persistence confirmation", () => {
    test.each(["network", "permission", "server rejection"])("%s failure rejects without queue, local posting or receipt continuation", async reason => {
        mocks.post.mockRejectedValue(new Error(reason));
        const sale = makeSale();
        const dispatch = vi.fn();
        const receipt = vi.fn();
        await expect(processSale(sale)(dispatch as never, (() => ({})) as never).then(receipt)).rejects.toThrow(reason);
        expect(dispatch).not.toHaveBeenCalled();
        expect(receipt).not.toHaveBeenCalled();
        expect(mocks.queue).not.toHaveBeenCalled();
        expect(mocks.finance).not.toHaveBeenCalled();
        expect(mocks.points).not.toHaveBeenCalled();
        expect(sale.id).toBe("pending-1");
    });
    test("success=false rejects without local success", async () => {
        mocks.post.mockResolvedValue({ data: { success: false, message: "Insufficient stock" } });
        const dispatch = vi.fn();
        await expect(processSale(makeSale())(dispatch as never, (() => ({})) as never)).rejects.toThrow("Insufficient stock");
        expect(dispatch).not.toHaveBeenCalled();
        expect(mocks.queue).not.toHaveBeenCalled();
    });
    test.each([{ success: true }, { success: true, invoice: { billNo: "A1" } }, { success: true, invoice: { billNo: "A1", totalAmount: "" } }])("incomplete confirmation is not local success: %j", async data => {
        mocks.post.mockResolvedValue({ data });
        const dispatch = vi.fn();
        await expect(processSale(makeSale())(dispatch as never, (() => ({})) as never)).rejects.toThrow("confirmation is incomplete");
        expect(dispatch).not.toHaveBeenCalled();
    });
    test("offline refuses without API call or queue", async () => {
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
        const dispatch = vi.fn();
        await expect(processSale(makeSale())(dispatch as never, (() => ({})) as never)).rejects.toThrow("offline");
        expect(mocks.post).not.toHaveBeenCalled();
        expect(mocks.queue).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
    test("confirmed SQL bill updates display state after response, without financial/reward shadow writes", async () => {
        mocks.post.mockResolvedValue({ data: { success: true, invoice: { billNo: "A1", totalAmount: 199 } } });
        const sale = makeSale();
        const dispatch = vi.fn();
        await expect(processSale(sale)(dispatch as never, (() => ({})) as never)).resolves.toBe("A1");
        expect(sale.total).toBe(199);
        expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(["pos/recordSale", "inventory/deductStock"]);
        expect(mocks.post).toHaveBeenCalledWith("/api/pos/invoice", expect.any(Object), expect.objectContaining({ headers: { "Idempotency-Key": "pending-1" } }));
        expect(mocks.finance).not.toHaveBeenCalled();
        expect(mocks.points).not.toHaveBeenCalled();
        expect(mocks.queue).not.toHaveBeenCalled();
    });
});

describe('validated measured quantity at submission', () => {
    test('invalid measured quantity stops before API or local state', async () => {
        const sale = makeSale();
        sale.items[0].unit = 'Meter';
        sale.items[0].cutLength = 0;
        const dispatch = vi.fn();
        await expect(processSale(sale)(dispatch as never, (() => ({})) as never)).rejects.toThrow('positive cut length');
        expect(mocks.post).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
    test('confirmed stock display uses the same measured quantity submitted to SQL', async () => {
        const sale = makeSale();
        sale.items[0].unit = 'Meter';
        sale.items[0].cutLength = 1.25;
        sale.items[0].qty = 2;
        mocks.post.mockResolvedValue({ data: { success: true, invoice: { billNo: 'A2', totalAmount: 500 } } });
        const dispatch = vi.fn();
        await processSale(sale)(dispatch as never, (() => ({})) as never);
        const payload = mocks.post.mock.calls[0][1];
        expect(payload.items[0].quantity).toBe(2.5);
        expect(dispatch).toHaveBeenCalledWith({ type: 'inventory/deductStock', payload: { id: sale.items[0].id, qty: 2.5 } });
    });
});
