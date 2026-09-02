describe('QA Validation: B2C Product Browsing Test Suite (B2C-001 to B2C-007)', () => {

    const catalog = [
        { id: 'P1', name: 'Cotton Shirt Blue M', category: 'Apparel', sellingPrice: 1299, stockQty: 25, isActive: true },
        { id: 'P2', name: 'Denim Jeans Black 32', category: 'Apparel', sellingPrice: 2499, stockQty: 0, isActive: true },
        { id: 'P3', name: 'Discontinued Leather Belt', category: 'Accessories', sellingPrice: 899, stockQty: 10, isActive: false }
    ];

    test('B2C-001 (P0): Open product catalog -> Active products displayed', () => {
        const publicCatalog = catalog.filter(p => p.isActive);
        expect(publicCatalog.length).toBe(2);
        expect(publicCatalog[0].id).toBe('P1');
        expect(publicCatalog[1].id).toBe('P2');
    });

    test('B2C-002 (P1): Search valid product -> Correct product displayed', () => {
        const query = 'Denim';
        const searchResult = catalog.filter(p => p.isActive && p.name.toLowerCase().includes(query.toLowerCase()));
        expect(searchResult.length).toBe(1);
        expect(searchResult[0].name).toBe('Denim Jeans Black 32');
    });

    test('B2C-003 (P2): Search invalid product -> No product found', () => {
        const query = 'NonExistentXYZProduct';
        const searchResult = catalog.filter(p => p.isActive && p.name.toLowerCase().includes(query.toLowerCase()));
        expect(searchResult.length).toBe(0);
    });

    test('B2C-004 (P1): View product details -> Correct details displayed', () => {
        const product = catalog.find(p => p.id === 'P1');
        expect(product).toBeDefined();
        expect(product.name).toBe('Cotton Shirt Blue M');
        expect(product.sellingPrice).toBe(1299);
        expect(product.category).toBe('Apparel');
    });

    test('B2C-005 (P0): Product has stock -> Add to cart available', () => {
        const product = catalog.find(p => p.id === 'P1');
        const canAddToCart = Boolean(product && product.isActive && product.stockQty > 0);
        expect(canAddToCart).toBe(true);
    });

    test('B2C-006 (P0): Product out of stock -> Purchase disabled', () => {
        const product = catalog.find(p => p.id === 'P2'); // Out of stock
        const canAddToCart = Boolean(product && product.isActive && product.stockQty > 0);
        expect(canAddToCart).toBe(false);
    });

    test('B2C-007 (P0): Inactive product -> Product not available for purchase', () => {
        const product = catalog.find(p => p.id === 'P3'); // Inactive
        const isPurchasable = Boolean(product && product.isActive);
        expect(isPurchasable).toBe(false);
    });
});
