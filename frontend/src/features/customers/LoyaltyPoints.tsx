import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import {
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
import { Button, Card, Input } from '@/components/shared';
import PageHeader from '../../components/shared/Layout/PageHeader';

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
            <PageHeader
                title="Loyalty Points Program"
                description="Reward customers and build loyalty"
                actions={<div className="flex gap-2">
                    <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />}>
                        Export
                    </Button>
                    <Button variant="primary" size="md" icon={<Award className="w-4 h-4" />}>
                        Award Bonus Points
                    </Button>
                </div>}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="default" size="md">
                    <Card.Body>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Total Points Issued</p>
                                <p className="text-2xl font-bold text-primary mt-1">{totalPointsIssued.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Coins className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" size="md">
                    <Card.Body>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Points Redeemed</p>
                                <p className="text-2xl font-bold text-success mt-1">{totalPointsRedeemed.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-xl">
                                <Gift className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" size="md">
                    <Card.Body>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Outstanding Points</p>
                                <p className="text-2xl font-bold text-warning mt-1">{(totalPointsIssued - totalPointsRedeemed).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-xl">
                                <Star className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" size="md">
                    <Card.Body>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Active Members</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeMembers}</p>
                            </div>
                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                <Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Tiers Overview */}
            <Card variant="default" size="md">
                <Card.Body>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Loyalty Tiers</h3>
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
                                        <p className="text-slate-500">{tier.minPoints}+ points</p>
                                        <p className="text-slate-600 dark:text-slate-400">{tier.discountPercent}% discount</p>
                                        <p className="text-slate-600 dark:text-slate-400">{tier.pointsMultiplier}x points</p>
                                        <p className="font-bold text-primary mt-2">{memberCount} members</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card.Body>
            </Card>

            {/* Search */}
            <Card variant="default" size="md">
                <Card.Body>
                    <div className="max-w-md">
                        <Input
                            type="text"
                            placeholder="Search member by name or phone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card.Body>
            </Card>

            {/* Members Table */}
            <Card variant="default" size="lg">
                <Card.Body>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Tier</th>
                                <th className="p-4 text-right">Points Earned</th>
                                <th className="p-4 text-right">Points Redeemed</th>
                                <th className="p-4 text-right">Balance</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                                    <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p>No loyalty members found</p>
                                </td></tr>
                            ) : (
                                filteredCustomers.slice(0, 20).map(customer => (
                                    <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: customer.tier.color }}>
                                                    <span className="text-white font-bold">{customer.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{customer.name}</p>
                                                    <p className="text-xs text-slate-500">{customer.phone || 'No phone'}</p>
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
                                            <Button variant="primary" size="sm" fullWidth>
                                                View History
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LoyaltyPoints;
