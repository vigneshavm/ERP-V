export interface MockFloorAlert {
    id: string;
    title: string;
    desc: string;
    colorClass: string;
    icon: string; // Using string name for lucide icon
}

export const floor_alerts: MockFloorAlert[] = [
    { id: 'FA-001', title: 'Urgent Replenishment', desc: 'Saree Section: 3 items stock out today.', colorClass: 'text-danger border-danger/30 bg-danger/10', icon: 'Box' },
    { id: 'FA-002', title: 'Counter Cash Limit', desc: 'Counter 1 reached ₹50k. Transfer to safe.', colorClass: 'text-warning border-warning/30 bg-warning/10', icon: 'Banknote' },
    { id: 'FA-003', title: 'Pending Delivery', desc: 'A. Mudaliar order due for pickup at 4 PM.', colorClass: 'text-blue-500 border-blue-500/30 bg-blue-500/10', icon: 'Clock' },
    { id: 'FA-004', title: 'Shift Handover', desc: 'Verify closing balance for Morning Shift.', colorClass: 'text-success border-success/30 bg-success/10', icon: 'ShieldCheck' },
];
