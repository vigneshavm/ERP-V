import React, { useState } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import {
    PiggyBank,
    TrendingUp,
    Home,
    Utensils,
    CreditCard,
    ArrowRight,
    CircleHelp,
    Share2
} from 'lucide-react';

interface ExperienceInsightsProps {
    data: any;
}

const ExperienceInsights: React.FC<ExperienceInsightsProps> = ({ data }) => {
    const [excludeInvestment, setExcludeInvestment] = useState(false);

    // Mock calculations based on available data
    const totalExpense = data?.total_expense || 0;
    const monthlyTrends = data?.monthly_trends || [];
    const categories = data?.by_category || [];

    const avgExpense = totalExpense / (monthlyTrends.length || 1);
    const avgIncome = monthlyTrends.reduce((acc: number, curr: any) => acc + (curr.income || 0), 0) / (monthlyTrends.length || 1);
    const avgBalance = avgIncome - avgExpense;

    const chartData = monthlyTrends.map((m: any) => ({
        name: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][new Date(m.year, m.month === 'January' ? 0 : 1).getMonth()], // Simplification for labels
        balance: m.income - m.expense
    }));

    const categoryIcons: Record<string, React.ReactNode> = {
        'Savings': <PiggyBank className="w-5 h-5 text-amber-200" />,
        'Investments': <TrendingUp className="w-5 h-5 text-pink-400" />,
        'Rent': <Home className="w-5 h-5 text-red-300" />,
        'Food & Drinks': <Utensils className="w-5 h-5 text-yellow-500" />,
        'Default': <CreditCard className="w-5 h-5 text-neutral-400" />
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-emerald-500">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </div>
                    <h2 className="text-xl font-medium text-neutral-300">Year 2024-2025</h2>
                </div>
                <div className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-neutral-500">
                    <Share2 className="w-5 h-5" />
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900/50 border border-white/5 rounded-2xl">
                <input
                    type="checkbox"
                    id="exclude-investment"
                    checked={excludeInvestment}
                    onChange={(e) => setExcludeInvestment(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900"
                />
                <label htmlFor="exclude-investment" className="text-sm font-medium text-neutral-400">
                    Exclude categories of type <span className="text-neutral-200 font-bold">INVESTMENT</span> from data calculations
                </label>
            </div>

            {/* Hero Insights */}
            <div className="text-center space-y-2 py-4">
                <p className="text-sm font-medium text-neutral-500">Average monthly balance for the year 2024-2025</p>
                <h3 className="text-4xl font-bold text-emerald-500">₹{Math.round(avgBalance).toLocaleString('en-IN')}/month</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Average monthly expense</p>
                    <p className="text-xl font-bold text-rose-500">₹{Math.round(avgExpense).toLocaleString('en-IN')}/month</p>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Average monthly income</p>
                    <p className="text-xl font-bold text-emerald-500">₹{Math.round(avgIncome).toLocaleString('en-IN')}/month</p>
                </div>
            </div>

            {/* Main Chart */}
            <div className="relative h-[300px] w-full mt-4">
                <div className="absolute top-0 right-0 flex items-center gap-2 text-[10px] font-bold text-neutral-500">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                    Balance/month 2024-2025
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
                            tickFormatter={(value) => `${value / 1000}L`}
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
                <p className="text-sm font-medium text-neutral-400">
                    The percentage of your income distributed across expense categories and savings
                </p>
            </div>

            {/* Categories List */}
            <div className="space-y-6 pb-12">
                {categories.map((cat: any, idx: number) => {
                    const percentage = parseFloat(cat.percentage);
                    return (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center shrink-0">
                                {categoryIcons[cat.category] || categoryIcons['Default']}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-neutral-300">
                                        {cat.category} <span className="text-neutral-500 font-medium ml-1">₹{cat.amount.toLocaleString()}</span>
                                    </h4>
                                    <span className="text-lg font-bold text-neutral-200">{cat.percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500/50 rounded-full"
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
