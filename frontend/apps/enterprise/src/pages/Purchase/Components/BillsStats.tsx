import React from 'react';
import { FileText, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';
import { StatsCard } from "@repo/ui";

interface Props {
    billsCount: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const BillsStats: React.FC<Props> = ({ billsCount, totalAmount, paidAmount, outstandingAmount }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
                title="Total Bills"
                value={billsCount}
                icon={<FileText className="w-full h-full" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
            />
            <StatsCard
                title="Total Amount"
                value={formatCurrency(totalAmount)}
                icon={<IndianRupee className="w-full h-full" />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
            />
            <StatsCard
                title="Amount Paid"
                value={formatCurrency(paidAmount)}
                icon={<CheckCircle className="w-full h-full" />}
                iconBgColor="bg-emerald-100"
                iconColor="text-emerald-600"
                trend="Settled"
                trendUp={true}
            />
            <StatsCard
                title="Outstanding"
                value={formatCurrency(outstandingAmount)}
                icon={<AlertCircle className="w-full h-full" />}
                iconBgColor="bg-red-100"
                iconColor="text-red-600"
                trend="To be paid"
                trendUp={false}
            />
        </div>
    );
};

export default BillsStats;
