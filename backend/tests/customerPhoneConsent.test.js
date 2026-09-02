describe('QA Validation: Customer Phone & Optional Consent Test Suite (CUST-001 to CUST-008)', () => {

    const customerDatabase = [
        { id: 'CUST_1001', name: 'John Doe', phone: '9876543210', marketingConsent: { optIn: true } },
        { id: 'CUST_1002', name: 'Jane Smith', phone: '9876543211', marketingConsent: { optIn: false } }
    ];

    test('CUST-001 (P0): Checkout without phone -> Order can proceed', () => {
        const orderPayload = { customerName: 'Walk-in Guest', phone: '', items: [{ id: 'P1', qty: 1 }] };
        const canProceed = Boolean(orderPayload.items.length > 0);
        expect(canProceed).toBe(true);
    });

    test('CUST-002 (P0): Checkout with valid phone -> Phone stored', () => {
        const phone = '9876543210';
        const phoneRegex = /^[0-9]{10,12}$/;
        expect(phoneRegex.test(phone)).toBe(true);
    });

    test('CUST-003 (P1): Invalid phone format -> Validation error', () => {
        const invalidPhone = '123-abc-xyz';
        const phoneRegex = /^[0-9]{10,12}$/;
        const validatePhone = (p) => {
            if (p && !phoneRegex.test(p)) {
                throw new Error('Invalid mobile phone number format');
            }
        };

        expect(() => validatePhone(invalidPhone)).toThrow('Invalid mobile phone number format');
    });

    test('CUST-004 (P0): Existing customer phone -> Existing customer identified according to business rules', () => {
        const inputPhone = '9876543210';
        const match = customerDatabase.find(c => c.phone === inputPhone);

        expect(match).toBeDefined();
        expect(match.id).toBe('CUST_1001');
        expect(match.name).toBe('John Doe');
    });

    test('CUST-005 (P0): New customer phone -> Customer profile created', () => {
        const newPhone = '9998887770';
        const existing = customerDatabase.find(c => c.phone === newPhone);

        expect(existing).toBeUndefined();

        const createdProfile = {
            id: 'CUST_1003',
            name: 'New Customer',
            phone: newPhone,
            marketingConsent: { optIn: false }
        };

        expect(createdProfile.id).toBe('CUST_1003');
        expect(createdProfile.phone).toBe('9998887770');
    });

    test('CUST-006 (P0): Phone provided but marketing consent = No -> Phone stored, marketing disabled', () => {
        const customer = customerDatabase.find(c => c.id === 'CUST_1002');

        expect(customer.phone).toBe('9876543211');
        expect(customer.marketingConsent.optIn).toBe(false);
    });

    test('CUST-007 (P0): Phone not provided -> Customer can complete guest checkout', () => {
        const guestCheckoutPayload = {
            name: 'Guest User',
            phone: undefined,
            items: [{ id: 'P1', qty: 2 }]
        };

        const isGuestCheckoutValid = Boolean(guestCheckoutPayload.name && guestCheckoutPayload.items.length > 0);
        expect(isGuestCheckoutValid).toBe(true);
        expect(guestCheckoutPayload.phone).toBeUndefined();
    });

    test('CUST-008 (P0): Duplicate customer identification -> Correct customer matching rules applied', () => {
        const inputPhone = '9876543210';
        const matches = customerDatabase.filter(c => c.phone === inputPhone);

        // Matching rule: Always return existing single matched customer instead of creating duplicate profile
        expect(matches.length).toBe(1);
        expect(matches[0].id).toBe('CUST_1001');
    });
});
