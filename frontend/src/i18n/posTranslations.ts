// Tamil-language variant of the POS/billing screen -- matches Textilesoft's
// GstSaleCashBillEntry "+Tamil language variant" pattern (a parallel-language cash sale bill
// entry screen). Scoped to the core billing flow (settlement footer, header controls, customer
// identification) rather than the entire app; see contexts/LanguageContext.tsx.
export const posTranslations = {
    en: {
        // POSFooter -- settlement / checkout
        settlement: 'Settlement',
        loyaltyRedemption: 'Loyalty Redemption',
        balance: 'Bal:',
        pts: 'pts',
        pointsToRedeem: 'Points to redeem',
        max: 'MAX',
        redemptionValue: 'Redemption Value:',
        taxMode: 'Tax Mode',
        payment: 'Payment',
        plusTax: '+ Tax',
        inclusive: 'Incl.',
        cash: 'CASH',
        card: 'CARD',
        upi: 'UPI',
        subtotal: 'Subtotal',
        discount: 'Discount',
        discountExceedsCap: 'Exceeds allowed max',
        tax: 'Tax',
        totalPayable: 'Total Payable',
        refundAmount: 'Refund Amount',
        finalizeBill: 'Finalize Bill',
        processing: 'Processing...',

        // POSHeader
        storeLocation: 'Store Location',
        allStores: 'All Stores',
        terminal: 'Terminal',
        online: 'Online',
        offline: 'Offline',
        heldBills: 'Held Bills',
        sale: 'Sale',
        return: 'Return',
        scanner: 'Scanner',
        visual: 'Visual',

        // POSCustomerPanel
        identifyCustomer: 'Identify Customer (Mobile No.)',
        customerNameOptional: 'Customer Name (Optional)',
    },
    ta: {
        settlement: 'பணம் செலுத்துதல்',
        loyaltyRedemption: 'விசுவாசப் புள்ளிகள் பயன்பாடு',
        balance: 'இருப்பு:',
        pts: 'புள்ளிகள்',
        pointsToRedeem: 'பயன்படுத்த வேண்டிய புள்ளிகள்',
        max: 'அதிகபட்சம்',
        redemptionValue: 'மீட்பு மதிப்பு:',
        taxMode: 'வரி முறை',
        payment: 'பணம் செலுத்தும் முறை',
        plusTax: '+ வரி',
        inclusive: 'உட்பட',
        cash: 'ரொக்கம்',
        card: 'கார்டு',
        upi: 'UPI',
        subtotal: 'கூட்டுத்தொகை',
        discount: 'தள்ளுபடி',
        discountExceedsCap: 'அனுமதிக்கப்பட்ட அதிகபட்சத்தை மீறுகிறது',
        tax: 'வரி',
        totalPayable: 'செலுத்த வேண்டிய தொகை',
        refundAmount: 'திரும்பத் தரும் தொகை',
        finalizeBill: 'பில் முடிக்கவும்',
        processing: 'செயலாக்கத்தில்...',

        storeLocation: 'கடை இடம்',
        allStores: 'அனைத்து கடைகள்',
        terminal: 'முனையம்',
        online: 'இணைப்பில்',
        offline: 'இணைப்பு இல்லை',
        heldBills: 'நிறுத்தி வைக்கப்பட்ட பில்கள்',
        sale: 'விற்பனை',
        return: 'திரும்பப்பெறல்',
        scanner: 'ஸ்கேனர்',
        visual: 'காட்சி',

        identifyCustomer: 'வாடிக்கையாளரை அடையாளம் காணவும் (மொபைல் எண்)',
        customerNameOptional: 'வாடிக்கையாளர் பெயர் (விருப்பம்)',
    },
} as const;

export type TranslationKey = keyof typeof posTranslations.en;
