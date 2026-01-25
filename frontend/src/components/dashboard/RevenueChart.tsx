import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RevenueChartProps {
    data: any[];
    theme: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, theme }) => {
    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                    <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                            borderRadius: '8px'
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                        formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
