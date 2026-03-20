"use client";

import React, { useState } from 'react';
import {
  User,
  Briefcase,
  Building2,
  Globe,
  ChevronRight,
  Zap,
  LogOut,
  BarChart3,
  ShoppingCart,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SelectionPageProps {
  onSelect: (type: 'personal' | 'business' | 'enterprise') => void;
}

const WORKSPACES = [
  {
    id: 'personal' as const,
    label: 'Personal Budget',
    description: 'Track expenses, set saving goals, and visualize your financial health with AI-powered insights.',
    icon: User,
    accent: '#2563eb',
    accentBg: 'rgba(37,99,235,0.08)',
    accentBorder: 'rgba(37,99,235,0.2)',
    accentHover: 'rgba(37,99,235,0.13)',
    pills: ['Expense Tracking', 'Goals', 'Reports'],
    cta: 'Open Planner',
  },
  {
    id: 'business' as const,
    label: 'Business Store',
    description: 'Manage inventory, track sales, run POS, and oversee all store operations in one place.',
    icon: ShoppingCart,
    accent: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.08)',
    accentBorder: 'rgba(124,58,237,0.2)',
    accentHover: 'rgba(124,58,237,0.13)',
    pills: ['POS', 'Inventory', 'Sales'],
    cta: 'Open Store',
  },
  {
    id: 'enterprise' as const,
    label: 'Enterprise ERP',
    description: 'Full multi-tenant ERP — sales, purchasing, finance, HR, GST compliance and admin console.',
    icon: Building2,
    accent: '#d97706',
    accentBg: 'rgba(217,119,6,0.08)',
    accentBorder: 'rgba(217,119,6,0.2)',
    accentHover: 'rgba(217,119,6,0.13)',
    pills: ['Finance', 'HR', 'GST', 'Multi-tenant'],
    cta: 'Enter ERP',
  },
] as const;

export const SelectionPage: React.FC<SelectionPageProps> = ({ onSelect }) => {
  const logout = useAuthStore((state) => state.logout);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        .sp-page { min-height:100vh; background:#fafaf8; font-family:'Geist','DM Sans',system-ui,sans-serif; display:flex; flex-direction:column; }
        .sp-card { transition:border-color .25s, background .25s, transform .3s, box-shadow .3s; cursor:pointer; }
        .sp-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.08); }
        .sp-icon-wrap { transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
        .sp-card:hover .sp-icon-wrap { transform:scale(1.12); }
        .sp-cta-arrow { transition:transform .25s; display:inline-flex; align-items:center; }
        .sp-card:hover .sp-cta-arrow { transform:translateX(5px); }
        .sp-logout { transition:color .2s, background .2s; }
        .sp-logout:hover { color:#0d0f14 !important; background:rgba(0,0,0,0.04) !important; }
        .sp-pill { font-size:11px; font-family:monospace; border-radius:4px; padding:3px 8px; white-space:nowrap; }
        @keyframes spRise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .sp-anim { animation:spRise .55s cubic-bezier(.22,1,.36,1) both; }
        .sp-anim-1 { animation-delay:.05s }
        .sp-anim-2 { animation-delay:.12s }
        .sp-anim-3 { animation-delay:.2s }
        .sp-anim-4 { animation-delay:.28s }
        .sp-anim-5 { animation-delay:.36s }
      `}</style>

      <div className="sp-page">

        {/* ── Top bar ── */}
        <header style={{ padding:'20px 40px', borderBottom:'1px solid #e8e8e2', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1a56db,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 10px rgba(26,86,219,0.35)' }}>
              <Zap size={18} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize:17, fontWeight:700, color:'#0d0f14', letterSpacing:'-0.02em' }}>
              BizzAI<sup style={{ fontSize:9, color:'#8b909e', fontWeight:400, marginLeft:2 }}>ERP</sup>
            </span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <span style={{ fontSize:13, color:'#8b909e' }}>
              <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 5px #22c55e', marginRight:7, verticalAlign:'middle' }} />
              All systems operational
            </span>
            <button
              onClick={() => logout()}
              className="sp-logout"
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#8b909e', background:'none', border:'1px solid #e8e8e2', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </header>

        {/* ── Hero ── */}
        <div style={{ textAlign:'center', padding:'72px 40px 56px', maxWidth:680, margin:'0 auto' }}>
          <div className="sp-anim sp-anim-1" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontFamily:'monospace', color:'#1a56db', background:'rgba(26,86,219,0.07)', border:'1px solid rgba(26,86,219,0.15)', borderRadius:100, padding:'5px 14px', marginBottom:22, letterSpacing:'0.04em' }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 5px #22c55e' }} />
            Authentication successful
          </div>

          <h1 className="sp-anim sp-anim-2" style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:'clamp(36px,4vw,52px)', fontWeight:400, color:'#0d0f14', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:16 }}>
            Where would you like<br />
            <em style={{ fontStyle:'italic', color:'#8b909e' }}>to go today?</em>
          </h1>

          <p className="sp-anim sp-anim-3" style={{ fontSize:16, color:'#8b909e', lineHeight:1.7, fontWeight:300 }}>
            Your workspace is ready. Select a module to get started.
          </p>
        </div>

        {/* ── Workspace cards ── */}
        <div className="sp-anim sp-anim-4" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20, maxWidth:1040, width:'100%', margin:'0 auto', padding:'0 40px 80px' }}>
          {WORKSPACES.map((ws) => {
            const Icon = ws.icon;
            const isHovered = hovered === ws.id;
            return (
              <button
                key={ws.id}
                className="sp-card"
                onClick={() => onSelect(ws.id)}
                onMouseEnter={() => setHovered(ws.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isHovered ? ws.accentHover : '#fff',
                  border: `1.5px solid ${isHovered ? ws.accentBorder : '#e8e8e2'}`,
                  borderRadius: 20,
                  padding: '36px 32px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: isHovered ? `0 16px 48px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.04)',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  transition: 'all .25s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Icon */}
                <div
                  className="sp-icon-wrap"
                  style={{
                    width: 54, height: 54, borderRadius: 14,
                    background: ws.accentBg,
                    border: `1px solid ${ws.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                    transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
                  }}
                >
                  <Icon size={26} color={ws.accent} />
                </div>

                {/* Title */}
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0d0f14', letterSpacing: '-0.03em', marginBottom: 10 }}>
                  {ws.label}
                </div>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#8b909e', lineHeight: 1.65, fontWeight: 300, marginBottom: 20 }}>
                  {ws.description}
                </p>

                {/* Feature pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                  {ws.pills.map(p => (
                    <span
                      key={p}
                      className="sp-pill"
                      style={{
                        background: ws.accentBg,
                        color: ws.accent,
                        border: `1px solid ${ws.accentBorder}`,
                      }}
                    >{p}</span>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: ws.accent, marginTop: 'auto' }}>
                  <span>{ws.cta}</span>
                  <span
                    className="sp-cta-arrow"
                    style={{ transform: isHovered ? 'translateX(5px)' : 'none', transition: 'transform .25s' }}
                  >
                    <ChevronRight size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Bottom stats bar ── */}
        <div className="sp-anim sp-anim-5" style={{ borderTop:'1px solid #e8e8e2', background:'#fff', padding:'20px 40px', marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:56 }}>
          {[
            { icon: BarChart3,  label: 'Revenue MTD',    value: '₹24.7L',  color: '#1a56db' },
            { icon: ShoppingCart, label: 'Invoices Today', value: '143',     color: '#7c3aed' },
            { icon: TrendingUp, label: 'Growth MoM',     value: '+18%',    color: '#16a34a' },
            { icon: Layers,     label: 'Active Modules', value: '9 / 12',  color: '#d97706' },
          ].map(({ icon: Ic, label, value, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Ic size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'#8b909e', fontFamily:'monospace', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:1 }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#0d0f14', letterSpacing:'-0.03em' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
};
