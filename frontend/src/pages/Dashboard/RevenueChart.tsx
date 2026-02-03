import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RevenueChartProps {
    data: any[];
    theme: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, theme }) => {
    const isDark = theme === 'dark';

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? "#334155" : "#e2e8f0"}
                    />
                    <XAxis
                        dataKey="name"
                        stroke={isDark ? "#94a3b8" : "#64748b"}
                        fontSize={10}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke={isDark ? "#94a3b8" : "#64748b"}
                        fontSize={10}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                        }}
                        itemStyle={{
                            color: '#3b82f6',
                            fontWeight: 700,
                            fontSize: '12px'
                        }}
                        labelStyle={{
                            marginBottom: '4px',
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#64748b'
                        }}
                        formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
