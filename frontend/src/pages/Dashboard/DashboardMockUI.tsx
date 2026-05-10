import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveTab } from '../../redux/slices/uiSlice';
import Layout from '../../components/shared/Layout';
import {
  Activity, ArrowUpRight, ArrowDownRight, Users, Box, Banknote,
  ShieldCheck, Clock, ChevronRight, TrendingUp, TrendingDown,
  Package, Zap, AlertTriangle
} from 'lucide-react';
import dashboardData from '../../mockData/dashboardData.json';

const DashboardMockUI: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1W');

  const now = new Date();
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const shopFloorAlerts = [
    { title: 'Urgent Replenishment', desc: 'Saree Section: 3 items stock out today.', colorClass: 'text-danger border-danger/30 bg-danger/10', icon: Box },
    { title: 'Counter Cash Limit', desc: 'Counter 1 reached ₹50k. Transfer to safe.', colorClass: 'text-warning border-warning/30 bg-warning/10', icon: Banknote },
    { title: 'Pending Delivery', desc: 'A. Mudaliar order due for pickup at 4 PM.', colorClass: 'text-info border-info/30 bg-info/10', icon: Clock },
    { title: 'Shift Handover', desc: 'Verify closing balance for Morning Shift.', colorClass: 'text-success border-success/30 bg-success/10', icon: ShieldCheck },
  ];

  return (
    <Layout>
      <div className="space-y-8 pt-8">

        {/* Page Header */}
        <div className="relative overflow-hidden glass-panel p-8 mb-8 group border-t-2 border-t-success/30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-success/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-aura opacity-50" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -ml-32 -mb-32 animate-aura" style={{ animationDelay: '5s' }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-sm bg-success/20 border border-success/40 flex items-center justify-center glow-success">
                <Activity className="w-8 h-8 text-success" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-5xl font-display font-black text-main tracking-tighter uppercase mb-1 drop-shadow-sm">Shop Summary</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-success/20 text-success text-[10px] font-black uppercase rounded-sm border border-success/30 tracking-[0.2em]">
                    All Systems Go
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] opacity-70">
                    Daily Operations View
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-1">Current Period</p>
              <p className="text-2xl font-display font-black text-main tracking-tighter">{monthLabel}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-[0.2em] opacity-60">Today's Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData.kpis.map((kpi, i) => {
              const colorMap: Record<string, { border: string; text: string; bg: string }> = {
                'text-emerald-400': { border: 'border-l-success', text: 'text-success', bg: 'bg-success/10' },
                'text-indigo-400':  { border: 'border-l-primary', text: 'text-primary', bg: 'bg-primary/10' },
                'text-rose-400':    { border: 'border-l-danger',  text: 'text-danger',  bg: 'bg-danger/10'  },
                'text-amber-400':   { border: 'border-l-warning', text: 'text-warning', bg: 'bg-warning/10' },
              };
              const colors = colorMap[kpi.color] || colorMap['text-emerald-400'];
              return (
                <div key={i} className={`card-interactive p-6 flex flex-col justify-between min-h-[150px] border-l-4 ${colors.border} group bg-card/60 backdrop-blur-2xl`}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 animate-aura opacity-30" style={{ backgroundColor: `rgb(var(--color-${colors.text.replace('text-', '')}))` }} />
                  <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-sm ${colors.bg} ${colors.text} border ${colors.border.replace('border-l-', 'border-')}/30`}>
                      {kpi.iconName === 'Banknote' && <Banknote className="w-5 h-5" />}
                      {kpi.iconName === 'Briefcase' && <Zap className="w-5 h-5" />}
                      {kpi.iconName === 'Users' && <Users className="w-5 h-5" />}
                      {kpi.iconName === 'Box' && <Package className="w-5 h-5" />}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-sm border ${kpi.isUp ? 'text-success bg-success/10 border-success/30' : 'text-danger bg-danger/10 border-danger/30'}`}>
                      {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.trend}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className={`text-3xl font-display font-black tracking-tighter mb-1 ${colors.text}`}>{kpi.val}</p>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-70">{kpi.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 animate-aura opacity-50" />
            <div className="flex items-center justify-between mb-8 relative z-10 border-b border-default pb-4">
              <div>
                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                  <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                  Sales Trends
                </h3>
                <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Shop's Performance Over Time</p>
              </div>
              <div className="flex gap-2">
                {dashboardData.chartData.timeFrames.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTimeframe(t)}
                    className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border ${activeTimeframe === t ? 'bg-primary/20 border-primary/50 text-primary' : 'text-secondary border-default/30 hover:border-primary/30 hover:text-main'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] flex items-end gap-2 pb-8 pt-4 relative z-10">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                {[1, 2, 3, 4, 5].map(line => (
                  <div key={line} className="w-full h-px bg-default" />
                ))}
              </div>
              {(() => {
                const activeValues = (dashboardData.chartData as any).values[activeTimeframe];
                const maxVal = Math.max(...activeValues) || 1;
                return activeValues.map((v: number, i: number) => {
                  const h = (v / maxVal) * 100;
                  const isLast = i === activeValues.length - 1;
                  return (
                    <div key={i} className="flex-1 group/bar relative flex flex-col justify-end" style={{ height: '100%' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-1000 ${isLast ? 'bg-primary shadow-[0_0_20px_rgba(var(--color-primary),0.4)]' : 'bg-surface/80 group-hover/bar:bg-primary/50 border-t border-default/30'}`}
                        style={{ height: `${h}%` }}
                      />
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-default text-main text-[10px] font-black px-2 py-1 rounded-sm shadow-xl transition-opacity z-20 whitespace-nowrap">
                        ₹{v}k
                      </div>
                      <div className="text-center text-[9px] font-bold text-secondary mt-2 uppercase tracking-widest absolute -bottom-6 left-1/2 -translate-x-1/2 w-full truncate">
                        {(dashboardData.chartData.labels as any)[activeTimeframe][i]}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Shop Floor Alerts */}
          <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-danger/10 rounded-full blur-3xl -mr-24 -mt-24 animate-aura opacity-50" />
            <div className="flex items-center justify-between mb-6 relative z-10 border-b border-default pb-4">
              <div>
                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                  <div className="w-2 h-8 bg-danger rounded-full shadow-[0_0_15px_rgba(var(--color-error),0.5)]" />
                  Floor Alerts
                </h3>
                <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Immediate Tactical Tasks</p>
              </div>
              <span className="w-7 h-7 bg-danger/20 text-danger rounded-sm border border-danger/30 flex items-center justify-center text-[11px] font-black animate-pulse">
                {shopFloorAlerts.length}
              </span>
            </div>
            <div className="flex-1 space-y-3 relative z-10">
              {shopFloorAlerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-sm border bg-surface/30 hover:bg-surface/60 transition-all cursor-pointer group/alert flex items-start gap-4 hover:translate-x-1 duration-200 ${alert.colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-default/30'}`}>
                  <div className={`p-2 rounded-sm border mt-0.5 ${alert.colorClass}`}>
                    <alert.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[12px] font-black text-main uppercase tracking-tight group-hover/alert:text-primary transition-colors">{alert.title}</h4>
                    <p className="text-[10px] text-secondary mt-0.5 leading-relaxed opacity-80">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { dispatch(setActiveTab('AUDIT_LOGS')); navigate('/settings/audit'); }}
              className="w-full mt-6 py-3 rounded-sm border border-default text-[10px] font-black uppercase tracking-widest text-secondary hover:text-main hover:bg-surface/50 transition-all flex items-center justify-center gap-2 relative z-10"
            >
              View All Activity <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Vendor Transactions */}
        <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -ml-48 -mb-48 animate-aura opacity-50" />
          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-default pb-4">
            <div>
              <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                <div className="w-2 h-8 bg-accent rounded-full shadow-[0_0_15px_rgba(var(--color-accent),0.5)]" />
                Vendor Purchase Log
              </h3>
              <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Latest purchases & payments from suppliers</p>
            </div>
            <button
              onClick={() => navigate('/purchase')}
              className="px-5 py-2 bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest hover:bg-accent hover:text-white transition-all rounded-sm"
            >
              Full Register
            </button>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-default/50">
                  <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-60">Vendor / Supplier</th>
                  <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-60">Mobile</th>
                  <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-60">Amount</th>
                  <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-60 text-center">Status</th>
                  <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-60 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {(dashboardData as any).recentTransactions?.map((txn: any, i: number) => (
                  <tr key={i} className="border-b border-default/20 hover:bg-surface/30 transition-colors group/row">
                    <td className="py-3 px-4">
                      <p className="text-sm font-black text-main uppercase tracking-tight group-hover/row:text-primary transition-colors">{txn.vendor}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-bold text-secondary">{txn.mobile}</td>
                    <td className="py-3 px-4 text-sm font-black text-main font-mono">{txn.amount}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${txn.status === 'Completed' ? 'bg-success/10 border-success/30 text-success' : 'bg-warning/10 border-warning/30 text-warning'}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-bold text-secondary text-right">{txn.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardMockUI;
