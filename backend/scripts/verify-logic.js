function calculateDueDate(purchaseDateStr, creditPeriod) {
    const d = new Date(purchaseDateStr);
    d.setDate(d.getDate() + creditPeriod);
    return d.toISOString().split('T')[0];
}

console.log('--- Verification Results ---');
console.log('Case 1: Jan 15, 2026 + 30 days ->', calculateDueDate('2026-01-15', 30));
console.log('Case 2: Jan 25, 2026 + 30 days ->', calculateDueDate('2026-01-25', 30));
console.log('Case 3: Feb 28, 2024 (Leap) + 1 day ->', calculateDueDate('2024-02-28', 1));
console.log('Case 4: Feb 28, 2024 (Leap) + 2 days ->', calculateDueDate('2024-02-28', 2));
console.log('--- End of Results ---');
