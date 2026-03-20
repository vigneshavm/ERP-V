import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import { useNavigate } from 'react-router-dom';

const ReportsDashboard = () => {
    const navigate = useNavigate();

    const reportCategories = [
        {
            title: 'Transaction Reports',
            icon: '📊',
            color: 'bg-blue-50 border-blue-200',
            reports: [
                { name: 'Business Snapshot', path: '/', icon: '📸' },
                { name: 'Intelligence Hub', path: '/', icon: '⚡' },
                { name: 'Sales Report', path: '/reports/sales', icon: '💰' },
                { name: 'Purchase Report', path: '/reports/purchase', icon: '🛒' },
                { name: 'Day Book', path: '/reports/daybook', icon: '📅' },
                { name: 'All Transactions', path: '/reports/transactions', icon: '📝' },
                { name: 'Profit & Loss', path: '/reports/profit-loss', icon: '📈' },
                { name: 'Bill-Wise Profit', path: '/reports/bill-profit', icon: '💵' },
                { name: 'Cash Flow', path: '/reports/cashflow', icon: '💸' },
                { name: 'Trial Balance', path: '/reports/trial-balance', icon: '⚖️' },
                { name: 'Balance Sheet', path: '/reports/balance-sheet', icon: '📋' }
            ]
        },
        {
            title: 'Party Reports',
            icon: '👥',
            color: 'bg-green-50 border-green-200',
            reports: [
                { name: 'Party Statement', path: '/reports/party-statement', icon: '📄' },
                { name: 'Party-Wise P&L', path: '/reports/party-pl', icon: '📊' },
                { name: 'All Parties', path: '/reports/all-parties', icon: '👨‍💼' },
                { name: 'Party Report by Item', path: '/reports/party-item', icon: '📦' },
                { name: 'Sales by Party', path: '/reports/sales-party', icon: '💰' },
                { name: 'Purchase by Party', path: '/reports/purchase-party', icon: '🛒' },
                { name: 'Sales by Party Group', path: '/reports/sales-party-group', icon: '👥' },
                { name: 'Purchase by Party Group', path: '/reports/purchase-party-group', icon: '🏢' }
            ]
        },
        {
            title: 'GST Reports',
            icon: '🏛️',
            color: 'bg-purple-50 border-purple-200',
            reports: [
                { name: 'GSTR-1', path: '/reports/gstr1', icon: '📑' },
                { name: 'GSTR-2', path: '/reports/gstr2', icon: '📑' },
                { name: 'GSTR-3B', path: '/reports/gstr3b', icon: '📑' },
                { name: 'GSTR-9', path: '/reports/gstr9', icon: '📑' }
            ]
        }
    ];

    return (
        <Layout>
            <PageHeader
                title="Reports Dashboard"
                description="Access all business reports and analytics"
            />

            <div className="space-y-8">
                {reportCategories.map((category, idx) => (
                    <div key={idx}>
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="text-3xl">{category.icon}</span>
                            <h2 className="text-2xl font-bold text-main">{category.title}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {category.reports.map((report, reportIdx) => (
                                <button
                                    key={reportIdx}
                                    onClick={() => navigate(report.path)}
                                    className={`p-6 border-2 rounded-xl ${category.color} hover:shadow-lg transition group`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-3xl group-hover:scale-110 transition">{report.icon}</span>
                                        <div className="text-left">
                                            <h3 className="font-bold text-main">{report.name}</h3>
                                            <p className="text-xs text-secondary">View detailed report</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Need Custom Reports?</h3>
                <p className="text-indigo-100 mb-4">Create custom reports tailored to your business needs</p>
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
                    Create Custom Report
                </button>
            </div>
        </Layout>
    );
};

export default ReportsDashboard;

