import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import {
    Search,
    Gift,
    Star,
    Settings,
    Users,
    Award,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    Download
} from 'lucide-react';

interface LoyaltyTransaction {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
    points: number;
    invoiceRef?: string;
    description: string;
}

interface LoyaltyTier {
    name: string;
    minPoints: number;
    discountPercent: number;
    pointsMultiplier: number;
    color: string;
}

const LOYALTY_TIERS: LoyaltyTier[] = [
    { name: 'Bronze', minPoints: 0, discountPercent: 0, pointsMultiplier: 1, color: '#CD7F32' },
    { name: 'Silver', minPoints: 500, discountPercent: 2, pointsMultiplier: 1.25, color: '#C0C0C0' },
    { name: 'Gold', minPoints: 2000, discountPercent: 5, pointsMultiplier: 1.5, color: '#FFD700' },
    { name: 'Platinum', minPoints: 5000, discountPercent: 10, pointsMultiplier: 2, color: '#E5E4E2' }
];

const LoyaltyPoints: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.customers);
    const { invoices: salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [_activeTab] = useState<'overview' | 'customers' | 'transactions' | 'settings'>('overview');

    // Calculate loyalty data
    const loyaltyData = useMemo(() => {
        const customerPoints: Record<string, { earned: number; redeemed: number; balance: number }> = {};
        const transactions: LoyaltyTransaction[] = [];

        // Calculate points from sales (1 point per ₹100 spent)
        salesHistory
            .filter(s => s.sector === currentSector)
            .forEach(sale => {
                const customerId = typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || sale.customer?.id;
                const saleId = sale._id || sale.id;

                if (customerId) {
                    if (!customerPoints[customerId]) {
                        customerPoints[customerId] = { earned: 0, redeemed: 0, balance: 0 };
                    }
                    const pointsEarned = Math.floor(sale.totalAmount / 100);
                    customerPoints[customerId].earned += pointsEarned;
                    customerPoints[customerId].balance += pointsEarned;

                    const customer = customers.find(c => c.id === customerId || c._id === customerId);
                    transactions.push({
                        id: `earn-${saleId}`,
                        customerId: customerId,
                        customerName: customer?.name || 'Unknown',
                        date: sale.createdAt,
                        type: 'EARNED',
                        points: pointsEarned,
                        invoiceRef: `INV-${saleId.substring(0, 8)}`,
                        description: `Points for purchase`
                    });
                }
            });

        return { customerPoints, transactions };
    }, [salesHistory, customers, currentSector]);

    // Customer loyalty list
    const customerLoyalty = useMemo(() => {
        return customers.map(customer => {
            const points = loyaltyData.customerPoints[customer.id] || { earned: 0, redeemed: 0, balance: 0 };
            const tier = [...LOYALTY_TIERS].reverse().find(t => points.balance >= t.minPoints) || LOYALTY_TIERS[0];
            return {
                ...customer,
                ...points,
                tier
            };
        }).filter(c => c.earned > 0);
    }, [customers, loyaltyData]);

    const filteredCustomers = customerLoyalty.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    // Summary stats
    const totalPointsIssued = Object.values(loyaltyData.customerPoints).reduce<number>((acc, p) => acc + (p as any).earned, 0);
    const totalPointsRedeemed = Object.values(loyaltyData.customerPoints).reduce<number>((acc, p) => acc + (p as any).redeemed, 0);
    const activeMembers = customerLoyalty.length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Gift className="w-6 h-6 text-primary" />
                        Loyalty Points Program
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Reward customers and build loyalty</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Award Bonus Points
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Total Points Issued</p>
                            <p className="text-2xl font-bold text-primary mt-1">{totalPointsIssued.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Coins className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Points Redeemed</p>
                            <p className="text-2xl font-bold text-success mt-1">{totalPointsRedeemed.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <Gift className="w-6 h-6 text-success" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Outstanding Points</p>
                            <p className="text-2xl font-bold text-warning mt-1">{(totalPointsIssued - totalPointsRedeemed).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-xl">
                            <Star className="w-6 h-6 text-warning" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Active Members</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{activeMembers}</p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                            <Users className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tiers Overview */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Loyalty Tiers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {LOYALTY_TIERS.map(tier => {
                        const memberCount = customerLoyalty.filter(c => c.tier.name === tier.name).length;
                        return (
                            <div key={tier.name} className="p-4 rounded-xl border-2" style={{ borderColor: tier.color }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: tier.color }}>
                                        <Star className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold" style={{ color: tier.color }}>{tier.name}</span>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p className="text-neutral-500">{tier.minPoints}+ points</p>
                                    <p className="text-neutral-600 dark:text-neutral-400">{tier.discountPercent}% discount</p>
                                    <p className="text-neutral-600 dark:text-neutral-400">{tier.pointsMultiplier}x points</p>
                                    <p className="font-bold text-primary mt-2">{memberCount} members</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search member by name or phone..."
                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Tier</th>
                                <th className="p-4 text-right">Points Earned</th>
                                <th className="p-4 text-right">Points Redeemed</th>
                                <th className="p-4 text-right">Balance</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">
                                    <Gift className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                                    <p>No loyalty members found</p>
                                </td></tr>
                            ) : (
                                filteredCustomers.slice(0, 20).map(customer => (
                                    <tr key={customer.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: customer.tier.color }}>
                                                    <span className="text-white font-bold">{customer.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{customer.name}</p>
                                                    <p className="text-xs text-neutral-500">{customer.phone || 'No phone'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: customer.tier.color }}>
                                                {customer.tier.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="flex items-center justify-end gap-1 text-success">
                                                <ArrowUpRight className="w-4 h-4" />
                                                {customer.earned.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="flex items-center justify-end gap-1 text-error">
                                                <ArrowDownRight className="w-4 h-4" />
                                                {customer.redeemed.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-primary">{customer.balance.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <button className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20">
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No members found</div>
                    ) : (
                        filteredCustomers.slice(0, 20).map(customer => (
                            <div key={customer.id} className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: customer.tier.color }}>
                                            <span className="text-white font-bold">{customer.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 dark:text-white">{customer.name}</p>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: customer.tier.color }}>
                                                {customer.tier.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-500">Earned</p>
                                        <p className="font-bold text-success">{customer.earned}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-500">Redeemed</p>
                                        <p className="font-bold text-error">{customer.redeemed}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-500">Balance</p>
                                        <p className="font-bold text-primary">{customer.balance}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Program Rules */}
            <div className="bg-gradient-to-r from-primary/10 to-warning/10 p-4 rounded-xl border border-primary/20">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" /> Program Rules
                </h4>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                    <li>• Earn <strong>1 point for every ₹100</strong> spent</li>
                    <li>• Points can be redeemed at <strong>1 point = ₹1</strong></li>
                    <li>• Points expire after <strong>12 months</strong> of inactivity</li>
                    <li>• Higher tiers earn bonus multipliers on all purchases</li>
                </ul>
            </div>
        </div>
    );
};

export default LoyaltyPoints;
