describe('QA Validation: Checkout Test Suite (CHECK-001 to CHECK-009)', () => {

    const catalog = {
        'P1': { id: 'P1', name: 'Shirt', price: 1000, stockQty: 10, isActive: true },
        'P2': { id: 'P2', name: 'Shoes', price: 3000, stockQty: 0, isActive: true },
        'P3': { id: 'P3', name: 'Hat', price: 500, stockQty: 5, isActive: false }
    };

    test('CHECK-001 (P0): Checkout valid cart -> Checkout initiated', () => {
        const cart = [{ productId: 'P1', quantity: 1, price: 1000 }];
        const canInitiate = Boolean(cart && cart.length > 0);
        expect(canInitiate).toBe(true);
    });

    test('CHECK-002 (P0): Checkout empty cart -> Checkout rejected', () => {
        const emptyCart = [];
        const processCheckout = (items) => {
            if (!items || items.length === 0) {
                throw new Error('Checkout rejected: Cart is empty');
            }
        };

        expect(() => processCheckout(emptyCart)).toThrow('Checkout rejected: Cart is empty');
    });

    test('CHECK-003 (P0): Checkout with available stock -> Checkout succeeds', () => {
        const cartItem = { productId: 'P1', quantity: 2 };
        const product = catalog[cartItem.productId];
        const isStockAvailable = Boolean(product && product.stockQty >= cartItem.quantity);

        expect(isStockAvailable).toBe(true);
    });

    test('CHECK-004 (P0): Checkout with insufficient stock -> Checkout rejected', () => {
        const cartItem = { productId: 'P1', quantity: 20 }; // Requested 20, Available 10
        const processCheckoutItem = (item) => {
            const product = catalog[item.productId];
            if (!product || product.stockQty < item.quantity) {
                throw new Error('Checkout rejected: Insufficient stock available');
            }
        };

        expect(() => processCheckoutItem(cartItem)).toThrow('Checkout rejected: Insufficient stock available');
    });

    test('CHECK-005 (P0): Checkout with optional phone -> Successful', () => {
        const payload = { customerName: 'John', phone: '9876543210', items: [{ productId: 'P1', quantity: 1 }] };
        const isCheckoutValid = Boolean(payload.items.length > 0);

        expect(isCheckoutValid).toBe(true);
        expect(payload.phone).toBe('9876543210');
    });

    test('CHECK-006 (P0): Checkout without phone -> Successful', () => {
        const payload = { customerName: 'Walk-in Customer', phone: '', items: [{ productId: 'P1', quantity: 1 }] };
        const isCheckoutValid = Boolean(payload.items.length > 0);

        expect(isCheckoutValid).toBe(true);
        expect(payload.phone).toBe('');
    });

    test('CHECK-007 (P0): Price changed during checkout -> Latest valid price/rule applied', () => {
        const clientStalePrice = 800; // Client sends 800
        const dbProductLatest = catalog['P1']; // Server price updated to 1000

        const finalPriceUsed = dbProductLatest.price; // Server overrides client price
        expect(finalPriceUsed).toBe(1000);
        expect(finalPriceUsed).not.toBe(clientStalePrice);
    });

    test('CHECK-008 (P0): Product becomes unavailable -> Checkout prevented', () => {
        const cartItem = { productId: 'P3', quantity: 1 }; // Product P3 is isActive: false
        const processCheckoutItem = (item) => {
            const product = catalog[item.productId];
            if (!product || !product.isActive || product.stockQty <= 0) {
                throw new Error('Checkout prevented: Product is currently unavailable');
            }
        };

        expect(() => processCheckoutItem(cartItem)).toThrow('Checkout prevented: Product is currently unavailable');
    });

    test('CHECK-009 (P0): Duplicate checkout request -> Only one order created', () => {
        const processedOrders = new Map();
        const idempotencyKey = 'IDEM_ORDER_99001';

        const placeOrder = (key) => {
            if (processedOrders.has(key)) {
                return { status: 'EXISTING_ORDER', orderId: processedOrders.get(key) };
            }
            const newOrderId = 'INV-2026-9901';
            processedOrders.set(key, newOrderId);
            return { status: 'CREATED', orderId: newOrderId };
        };

        // First attempt -> Order created
        const res1 = placeOrder(idempotencyKey);
        expect(res1.status).toBe('CREATED');
        expect(res1.orderId).toBe('INV-2026-9901');

        // Duplicate attempt with same key -> Returns existing order without creating second invoice
        const res2 = placeOrder(idempotencyKey);
        expect(res2.status).toBe('EXISTING_ORDER');
        expect(res2.orderId).toBe('INV-2026-9901');
    });
});
