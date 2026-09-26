import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import {
    PiggyBank,
    TrendingUp,
    Home,
    Utensils,
    CreditCard,
    ArrowRight,
    Share2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ExperienceInsightsProps {
    data: any;
}

const ExperienceInsights: React.FC<ExperienceInsightsProps> = ({ data }) => {
    // Averages over the report's monthly trends (last 6 months). Income is null when the backend
    // couldn't compute it; then income and balance show "—" rather than a made-up figure.
    const monthlyTrends: { expense: number; income: number | null; label: string }[] = data?.monthly_trends || [];
    const categories = data?.by_category || [];
    const mean = (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

    const avgExpense = mean(monthlyTrends.map(m => m.expense));
    const withIncome = monthlyTrends.filter(m => m.income !== null);
    const avgIncome = withIncome.length > 0 ? mean(withIncome.map(m => m.income as number)) : null;
    const avgBalance = withIncome.length > 0 ? mean(withIncome.map(m => (m.income as number) - m.expense)) : null;
    const perMonth = (value: number | null) => value === null ? '—' : `${formatCurrency(value, { fractionDigits: 0 })}/month`;

    // Oldest month first, labelled by the backend (e.g. "September 2026").
    const chartData = [...withIncome].reverse().map(m => ({
        name: m.label,
        balance: (m.income as number) - m.expense
    }));

    const categoryIcons: Record<string, React.ReactNode> = {
        'Savings': <PiggyBank className="w-5 h-5 text-warning" />,
        'Investments': <TrendingUp className="w-5 h-5 text-pink-400" />,
        'Rent': <Home className="w-5 h-5 text-danger" />,
        'Food & Drinks': <Utensils className="w-5 h-5 text-warning" />,
        'Default': <CreditCard className="w-5 h-5 text-slate-400" />
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-success">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </div>
                    <h2 className="text-xl font-medium text-slate-300">Last 6 months</h2>
                </div>
                <div className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-slate-500">
                    <Share2 className="w-5 h-5" />
                </div>
            </div>

            {/* Hero Insights */}
            <div className="text-center space-y-2 py-4">
                <p className="text-sm font-medium text-slate-500">Average monthly balance (income − expenses), last 6 months</p>
                <h3 className="text-4xl font-bold text-success">{perMonth(avgBalance)}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Average monthly expense</p>
                    <p className="text-xl font-bold text-danger">{perMonth(avgExpense)}</p>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Average monthly income</p>
                    <p className="text-xl font-bold text-success">{perMonth(avgIncome)}</p>
                </div>
            </div>

            {/* Main Chart */}
            <div className="relative h-[300px] w-full mt-4">
                <div className="absolute top-0 right-0 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-3 h-3 bg-warning rounded-sm" />
                    Balance per month
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff0a" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                            itemStyle={{ color: '#f97316' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Line
                            type="linear"
                            dataKey="balance"
                            stroke="#f97316"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#f97316', stroke: '#f97316', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#f97316' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Distribution Text */}
            <div className="text-center pt-8">
                <p className="text-sm font-medium text-slate-400">
                    Share of total expenses by category
                </p>
            </div>

            {/* Categories List */}
            <div className="space-y-6 pb-12">
                {categories.map((cat: any, idx: number) => {
                    const percentage = parseFloat(cat.percentage);
                    return (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                                {categoryIcons[cat.category] || categoryIcons['Default']}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-300">
                                        {cat.category} <span className="text-slate-500 font-medium ml-1">₹{cat.amount.toLocaleString()}</span>
                                    </h4>
                                    <span className="text-lg font-bold text-slate-200">{cat.percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success/50 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExperienceInsights;
