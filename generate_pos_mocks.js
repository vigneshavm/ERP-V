const fs = require('fs');
const path = require('path');

const posMocks = [
    { name: "POSOrdersIntelligenceMockUI", path: "POSOrdersIntelligenceMockUI.tsx", type: "grid", title: "POS Orders Intelligence" },
    { name: "POSReturnsIntelligenceMockUI", path: "POSReturnsIntelligenceMockUI.tsx", type: "grid", title: "POS Returns Intelligence" },
    { name: "ShiftManagementIntelligenceMockUI", path: "ShiftManagementIntelligenceMockUI.tsx", type: "dashboard", title: "Shift Management Intelligence" },
    { name: "CashDrawerIntelligenceMockUI", path: "CashDrawerIntelligenceMockUI.tsx", type: "dashboard", title: "Cash Drawer Intelligence" }
];

const gridTemplate = (name, title) => `import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2 } from 'lucide-react';

const ${name}: React.FC = () => {
    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        ${title}
                    </h1>
                    <p className="text-sm text-main/60 mt-1">POS Data Intelligence Grid</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all text-sm font-medium">
                        <BarChart2 className="w-4 h-4" /> Run Analytics
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search transactions or receipts..." 
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-teal-500/50 outline-none transition-all"
                    />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm ml-auto">
                    <Filter className="w-4 h-4" /> Filter Terminal
                </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">Receipt ID</th>
                                <th className="p-4 text-left font-medium">Terminal</th>
                                <th className="p-4 text-left font-medium">Cashier</th>
                                <th className="p-4 text-left font-medium">Time</th>
                                <th className="p-4 text-right font-medium">Amount</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                    <td className="p-4 font-medium text-teal-400 group-hover:text-teal-300">#TRX-900\${i}</td>
                                    <td className="p-4 text-main/80">Terminal \${i}</td>
                                    <td className="p-4 text-main/90 font-medium">Cashier \${i}</td>
                                    <td className="p-4 text-main/60">10:4\${i} AM</td>
                                    <td className="p-4 text-right font-medium text-main/90">\$\${i}45.50</td>
                                    <td className="p-4 text-center">
                                        <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ${name};
`;

const dashboardTemplate = (name, title) => `import React from 'react';
import { Activity, Clock, ShieldCheck, DollarSign } from 'lucide-react';

const ${name}: React.FC = () => {
    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        ${title}
                    </h1>
                    <p className="text-sm text-main/60 mt-1">POS Operations Dashboard</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Active Terminals", value: "8/10", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    { title: "Avg Shift Time", value: "8h 12m", icon: Clock, color: "text-teal-400", bg: "bg-teal-400/10" },
                    { title: "Drawer Discrepancy", value: "$0.00", icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-400/10" },
                    { title: "Cash Expected", value: "$4,250", icon: DollarSign, color: "text-cyan-400", bg: "bg-cyan-400/10" }
                ].map((kpi, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
                        <div className={\`p-3 rounded-xl \${kpi.bg} \${kpi.color}\`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-main/50 uppercase tracking-wider font-semibold">{kpi.title}</p>
                            <p className="text-2xl font-bold mt-1 text-main/90">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                <div className="glass-panel rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold mb-4">Live Shift Status</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center p-4 bg-black/20 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <div>
                                        <p className="font-medium">Terminal 0\${i}</p>
                                        <p className="text-xs text-main/50">Cashier: Jane Doe</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-teal-400">Online</p>
                                    <p className="text-xs text-main/50">Started 4h ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-main/30" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Drawer Analytics</h2>
                    <p className="text-sm text-main/60 max-w-sm">Detailed breakdown of cash variances, drops, and payouts will appear here after the end of shift.</p>
                </div>
            </div>
        </div>
    );
};

export default ${name};
`;

const rootPath = path.join(__dirname, 'frontend/src/pages/Pos');

posMocks.forEach(mock => {
    const fullPath = path.join(rootPath, mock.path);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    let content = mock.type === 'dashboard' ? dashboardTemplate(mock.name, mock.title) : gridTemplate(mock.name, mock.title);
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log("Created:", mock.path);
});

console.log("Successfully generated 4 unique high-fidelity POS Mocks!");
