"use client";

import React from 'react';
import { useAuthStore, LoginForm, SelectionPage } from '@repo/mfe-auth';
import { User, Briefcase, Building2, ChevronRight, LogOut, Zap } from 'lucide-react';

const apps = [
  {
    id: 'personal',
    label: 'Personal Budget',
    description: 'Track expenses, set saving goals, and visualize your financial health.',
    icon: User,
    color: 'blue',
    href: '/personal/home',
    cta: 'Open Planner',
  },
  {
    id: 'business',
    label: 'Business Store',
    description: 'Manage inventory, track sales, and oversee store operations.',
    icon: Briefcase,
    color: 'purple',
    href: '/business',
    cta: 'Open Store Manager',
  },
  {
    id: 'online-store',
    label: 'Online Storefront',
    description: 'Customer-facing storefront with AI-powered product recommendations.',
    icon: Briefcase,
    color: 'green',
    href: '/business/store',
    cta: 'Open Storefront',
  },
  {
    id: 'enterprise',
    label: 'Enterprise ERP',
    description: 'Multi-tenant ERP — sales, purchasing, finance, HR and admin.',
    icon: Building2,
    color: 'amber',
    href: '/enterprise',
    cta: 'Enter Management',
  },
] as const;

const colorMap = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa' },
  purple: { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)', text: '#a78bfa' },
  green:  { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',  text: '#4ade80' },
  amber:  { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)', text: '#fbbf24' },
};

const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
  if (type === 'personal') window.location.href = '/personal/home';
  else if (type === 'business') window.location.href = '/business';
  else window.location.href = '/enterprise';
};

export default function ShellHome() {
  const { isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (!isAuthenticated) return <LoginForm />;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* background glows */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '60%', background: 'rgba(59,130,246,0.07)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60%', height: '60%', background: 'rgba(139,92,246,0.07)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '960px' }}>
        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            <Zap size={12} /> AI ERP Console
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 0.75rem' }}>
            Where would you like to{' '}
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              go?
            </span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '420px', margin: '0 auto' }}>
            Select a workspace to get started.
          </p>
        </div>

        {/* app cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {apps.map((app) => {
            const Icon = app.icon;
            const c = colorMap[app.color];
            return (
              <a
                key={app.id}
                href={app.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  transition: 'border-color 0.25s, background 0.25s, transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = c.border;
                  (e.currentTarget as HTMLAnchorElement).style.background = c.bg;
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text, marginBottom: '1rem' }}>
                  <Icon size={24} />
                </div>
                <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{app.label}</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 1.25rem', flex: 1 }}>{app.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: c.text, fontSize: '0.82rem', fontWeight: 700 }}>
                  {app.cta} <ChevronRight size={14} />
                </div>
              </a>
            );
          })}
        </div>

        {/* sign out */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button
            onClick={() => { logout(); window.location.href = 'http://localhost:3000/login'; }}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
