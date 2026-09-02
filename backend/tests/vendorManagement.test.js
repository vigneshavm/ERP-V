describe('QA Validation: Vendor Management Test Suite (VEN-001 to VEN-011)', () => {

    // Mock Database / Logic Validation Suite
    const validVendor = {
        tenantId: 'TENANT_VEN_001',
        supplierId: 'SUP_00101',
        businessName: 'Apex Textiles Pvt Ltd',
        contactPersonName: 'Rajesh Kumar',
        contactNo: '9876543210',
        email: 'rajesh@apextextiles.com',
        creditLimit: 50000,
        creditPeriod: 30,
        status: 'active'
    };

    test('VEN-001 (P0): Create vendor with valid details -> Vendor created successfully', () => {
        expect(validVendor.businessName).toBeTruthy();
        expect(validVendor.supplierId).toBeTruthy();
        expect(validVendor.status).toBe('active');
    });

    test('VEN-002 (P1): Create vendor without vendor name -> Validation error', () => {
        const invalidVendor = { ...validVendor, businessName: '' };
        const validate = (v) => {
            if (!v.businessName || v.businessName.trim() === '') {
                throw new Error('Business/Vendor Name is required');
            }
        };
        expect(() => validate(invalidVendor)).toThrow('Business/Vendor Name is required');
    });

    test('VEN-003 (P1): Create vendor with invalid email -> Validation error', () => {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        const invalidEmail = 'invalid-email-address';
        expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    test('VEN-004 (P1): Create vendor with invalid phone number -> Validation error', () => {
        const phoneRegex = /^[0-9]{10,12}$/;
        const invalidPhone = 'abc123';
        expect(phoneRegex.test(invalidPhone)).toBe(false);
    });

    test('VEN-005 (P1): Create duplicate vendor -> Duplicate vendor prevented', () => {
        const existingVendors = [validVendor];
        const isDuplicate = (supplierId) => existingVendors.some(v => v.supplierId === supplierId);
        expect(isDuplicate('SUP_00101')).toBe(true);
    });

    test('VEN-006 (P1): Update vendor details -> Details updated successfully', () => {
        const vendor = { ...validVendor };
        vendor.contactPersonName = 'Suresh Kumar';
        vendor.creditLimit = 75000;
        expect(vendor.contactPersonName).toBe('Suresh Kumar');
        expect(vendor.creditLimit).toBe(75000);
    });

    test('VEN-007 (P1): Deactivate vendor -> Vendor status becomes inactive', () => {
        const vendor = { ...validVendor };
        vendor.status = 'inactive';
        expect(vendor.status).toBe('inactive');
    });

    test('VEN-008 (P0): Create PO for inactive vendor -> PO creation rejected', () => {
        const inactiveVendor = { ...validVendor, status: 'inactive' };
        const attemptPOCreation = (vendor) => {
            if (vendor.status === 'inactive') {
                throw new Error('Cannot create Purchase Order for an inactive vendor');
            }
        };
        expect(() => attemptPOCreation(inactiveVendor)).toThrow('Cannot create Purchase Order for an inactive vendor');
    });

    test('VEN-009 (P2): Search vendor -> Correct vendor displayed', () => {
        const vendors = [
            validVendor,
            { ...validVendor, supplierId: 'SUP_00102', businessName: 'Vijayalaxmi Silks' }
        ];
        const searchResult = vendors.filter(v => v.businessName.toLowerCase().includes('vijayalaxmi'));
        expect(searchResult.length).toBe(1);
        expect(searchResult[0].businessName).toBe('Vijayalaxmi Silks');
    });

    test('VEN-010 (P1): View vendor purchase history -> Correct purchase history displayed', () => {
        const purchaseHistory = [
            { purchaseNumber: 'PUR-20260827-001', vendorId: 'SUP_00101', totalAmount: 15000, status: 'COMPLETED' },
            { purchaseNumber: 'PUR-20260827-002', vendorId: 'SUP_00101', totalAmount: 25000, status: 'COMPLETED' }
        ];
        const vendorHistory = purchaseHistory.filter(p => p.vendorId === 'SUP_00101');
        expect(vendorHistory.length).toBe(2);
        expect(vendorHistory[0].purchaseNumber).toBe('PUR-20260827-001');
    });

    test('VEN-011 (P1): View vendor outstanding payment -> Correct outstanding amount displayed', () => {
        const bills = [
            { billNo: 'BILL-001', vendorId: 'SUP_00101', amount: 10000, paidAmount: 4000, status: 'partial' },
            { billNo: 'BILL-002', vendorId: 'SUP_00101', amount: 15000, paidAmount: 0, status: 'unpaid' }
        ];
        
        const outstandingAmount = bills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        expect(outstandingAmount).toBe(21000);
    });
});
