export interface MockBankAccount {
    name: string;
    no: string;
    bal: string;
    up: boolean;
    diff: string;
}

export const bank_accounts: MockBankAccount[] = [
    { name: 'HDFC Corporate', no: '**** 8829', bal: '₹12,42,900.00', up: true, diff: '+₹42k' },
    { name: 'SBI Operational', no: '**** 1102', bal: '₹4,12,000.00', up: false, diff: '-₹12k' }
];
