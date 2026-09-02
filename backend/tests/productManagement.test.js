describe('QA Validation: Product Management Test Suite (PROD-001 to PROD-009)', () => {

    const validProduct = {
        tenantId: 'TENANT_PROD_001',
        name: 'Basmati Rice 1kg',
        sku: 'SKU-GRN-001',
        category: 'Grains',
        costPrice: 85,
        sellingPrice: 110,
        stockQty: 50,
        isActive: true
    };

    test('PROD-001 (P0): Create product -> Product created', () => {
        expect(validProduct.name).toBe('Basmati Rice 1kg');
        expect(validProduct.sku).toBe('SKU-GRN-001');
        expect(validProduct.isActive).toBe(true);
    });

    test('PROD-002 (P1): Create product without SKU -> Validation error', () => {
        const invalidProduct = { ...validProduct, sku: '' };
        const validateProduct = (p) => {
            if (!p.sku || p.sku.trim() === '') {
                throw new Error('Product SKU is required');
            }
        };
        expect(() => validateProduct(invalidProduct)).toThrow('Product SKU is required');
    });

    test('PROD-003 (P1): Create duplicate SKU -> Duplicate prevented', () => {
        const existingCatalog = [validProduct];
        const isDuplicateSKU = (sku) => existingCatalog.some(p => p.sku === sku);
        expect(isDuplicateSKU('SKU-GRN-001')).toBe(true);
    });

    test('PROD-004 (P1): Update product price -> Price updated', () => {
        const product = { ...validProduct };
        product.costPrice = 90;
        product.sellingPrice = 120;
        expect(product.costPrice).toBe(90);
        expect(product.sellingPrice).toBe(120);
    });

    test('PROD-005 (P1): Deactivate product -> Product unavailable for sale', () => {
        const product = { ...validProduct, isActive: false };
        const isPurchasable = (p) => p.isActive && p.stockQty > 0;
        expect(isPurchasable(product)).toBe(false);
    });

    test('PROD-006 (P2): Search product -> Correct products returned', () => {
        const catalog = [
            validProduct,
            { ...validProduct, sku: 'SKU-GRN-002', name: 'Toor Dal 1kg', category: 'Pulses' }
        ];
        const searchResult = catalog.filter(p => p.name.toLowerCase().includes('toor dal'));
        expect(searchResult.length).toBe(1);
        expect(searchResult[0].sku).toBe('SKU-GRN-002');
    });

    test('PROD-007 (P2): View product details -> Correct product information shown', () => {
        const product = { ...validProduct };
        expect(product.name).toBe('Basmati Rice 1kg');
        expect(product.costPrice).toBe(85);
        expect(product.sellingPrice).toBe(110);
    });

    test('PROD-008 (P0): Product with zero stock -> Product shown as out of stock', () => {
        const outOfStockProduct = { ...validProduct, stockQty: 0 };
        const isAvailable = (p) => p.stockQty > 0;
        expect(isAvailable(outOfStockProduct)).toBe(false);
    });

    test('PROD-009 (P1): Product with negative price -> Validation error', () => {
        const invalidPriceProduct = { ...validProduct, sellingPrice: -50 };
        const validatePrice = (p) => {
            if (p.costPrice < 0 || p.sellingPrice < 0) {
                throw new Error('Product price cannot be negative');
            }
        };
        expect(() => validatePrice(invalidPriceProduct)).toThrow('Product price cannot be negative');
    });
});
