export interface StockReservation {
    id: string;
    tenantId: string;
    productId: string;
    quantity: number;
    cartId: string;
    expiresAt: Date;
}

class StockReservationManager {
    private reservations: Map<string, StockReservation> = new Map();

    /**
     * Reserve stock for a customer cart/checkout session for a specific TTL (e.g. 15 mins)
     */
    reserveStock(tenantId: string, productId: string, quantity: number, cartId: string, ttlMinutes = 15): StockReservation {
        this.cleanExpired();

        const id = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        const reservation: StockReservation = {
            id,
            tenantId,
            productId,
            quantity,
            cartId,
            expiresAt
        };

        this.reservations.set(id, reservation);
        return reservation;
    }

    /**
     * Get total reserved quantity for a specific product and tenant
     */
    getReservedQuantity(tenantId: string, productId: string): number {
        this.cleanExpired();
        let total = 0;
        for (const res of this.reservations.values()) {
            if (res.tenantId === tenantId && res.productId === productId && res.expiresAt > new Date()) {
                total += res.quantity;
            }
        }
        return total;
    }

    /**
     * Release a specific reservation (e.g. cart cleared or checkout abandoned)
     */
    releaseReservation(reservationId: string): boolean {
        return this.reservations.delete(reservationId);
    }

    /**
     * Commit reservation (e.g. checkout successful)
     */
    commitReservation(reservationId: string): boolean {
        return this.reservations.delete(reservationId);
    }

    private cleanExpired(): void {
        const now = new Date();
        for (const [id, res] of this.reservations.entries()) {
            if (res.expiresAt <= now) {
                this.reservations.delete(id);
            }
        }
    }
}

export const stockReservationManager = new StockReservationManager();
export default stockReservationManager;
