export interface MockPDC {
    entity: string;
    date: string;
    amount: string;
    color: string;
}

export const pdcs: MockPDC[] = [
    { entity: 'S.V. Textiles', date: '22 MAY 2026', amount: '₹42,000', color: 'text-emerald-500' },
    { entity: 'Apex Logistics', date: '25 MAY 2026', amount: '₹1,12,000', color: 'text-amber-500' },
    { entity: 'General Mills', date: '30 MAY 2026', amount: '₹15,000', color: 'text-emerald-500' }
];
