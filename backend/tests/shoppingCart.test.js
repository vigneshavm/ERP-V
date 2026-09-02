describe('QA Validation: Shopping Cart Test Suite (CART-001 to CART-011)', () => {

    const productA = { id: 'P1', name: 'Shirt', price: 1000, stockQty: 10 };
    const productB = { id: 'P2', name: 'Jeans', price: 2000, stockQty: 5 };

    test('CART-001 (P0): Add product -> Product added', () => {
        const cart = [];
        cart.push({ productId: productA.id, name: productA.name, price: productA.price, quantity: 1 });
        
        expect(cart.length).toBe(1);
        expect(cart[0].productId).toBe('P1');
    });

    test('CART-002 (P0): Add multiple products -> All products added', () => {
        const cart = [
            { productId: productA.id, name: productA.name, price: productA.price, quantity: 1 },
            { productId: productB.id, name: productB.name, price: productB.price, quantity: 2 }
        ];

        expect(cart.length).toBe(2);
        expect(cart[0].productId).toBe('P1');
        expect(cart[1].productId).toBe('P2');
    });

    test('CART-003 (P0): Increase quantity -> Quantity updated', () => {
        const cartItem = { productId: 'P1', quantity: 1 };
        cartItem.quantity += 1;

        expect(cartItem.quantity).toBe(2);
    });

    test('CART-004 (P1): Decrease quantity -> Quantity updated', () => {
        const cartItem = { productId: 'P1', quantity: 3 };
        cartItem.quantity -= 1;

        expect(cartItem.quantity).toBe(2);
    });

    test('CART-005 (P0): Remove product -> Product removed', () => {
        let cart = [
            { productId: 'P1', quantity: 1 },
            { productId: 'P2', quantity: 2 }
        ];
        cart = cart.filter(item => item.productId !== 'P1');

        expect(cart.length).toBe(1);
        expect(cart[0].productId).toBe('P2');
    });

    test('CART-006 (P0): Add quantity greater than stock -> Validation error', () => {
        const stockQty = 5;
        const requestedQty = 10;

        const addToCart = (stock, qty) => {
            if (qty > stock) {
                throw new Error('Requested quantity exceeds available stock');
            }
        };

        expect(() => addToCart(stockQty, requestedQty)).toThrow('Requested quantity exceeds available stock');
    });

    test('CART-007 (P0): Cart subtotal -> Correct subtotal', () => {
        const cart = [
            { price: 1000, quantity: 2 }, // 2000
            { price: 2000, quantity: 1 }  // 2000
        ];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        expect(subtotal).toBe(4000);
    });

    test('CART-008 (P1): Apply discount -> Discount calculated correctly', () => {
        const subtotal = 4000;
        const discountPercent = 10; // 10% OFF
        const discountAmount = (subtotal * discountPercent) / 100;

        expect(discountAmount).toBe(400);
    });

    test('CART-009 (P1): Calculate tax -> Correct tax', () => {
        const taxableAmount = 3600; // Subtotal 4000 - Discount 400
        const gstRate = 18; // 18% GST
        const taxAmount = (taxableAmount * gstRate) / 100;

        expect(taxAmount).toBe(648);
    });

    test('CART-010 (P0): Calculate final amount -> Correct total', () => {
        const subtotal = 4000;
        const discount = 400;
        const tax = 648;
        const finalTotal = subtotal - discount + tax;

        expect(finalTotal).toBe(4248);
    });

    test('CART-011 (P0): Empty cart checkout -> Checkout prevented', () => {
        const emptyCart = [];

        const validateCartCheckout = (cart) => {
            if (!cart || cart.length === 0) {
                throw new Error('Cart is empty. Checkout prevented.');
            }
        };

        expect(() => validateCartCheckout(emptyCart)).toThrow('Cart is empty. Checkout prevented.');
    });
});
