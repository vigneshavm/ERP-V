"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/authApi';
import {
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(3, 'Email or username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  live?: boolean;
  animClass: string;
  style?: React.CSSProperties;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, live, animClass, style }) => (
  <div
    className={animClass}
    style={{
      position: 'absolute',
      background: 'rgba(255,255,255,0.055)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      padding: '14px 18px',
      minWidth: 155,
      zIndex: 2,
      ...style,
    }}
  >
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.33)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
      {live && <span className="bz-blink" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />}
      {sub}
    </div>
  </div>
);

export const LoginForm: React.FC = () => {
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const { mutate: login, isPending, error, isError } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    const email = data.email.replace(/^["']|["']$/g, '').trim();
    login({ username: email, password: data.password }, { onSuccess: () => setSuccess(true) });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        .bz-page  { min-height:100vh; display:flex; font-family:'Geist','DM Sans',system-ui,sans-serif; background:#fafaf8; overflow:hidden; }
        .bz-canvas{ flex:1; background:#0d0f14; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:48px 52px; }
        .bz-panel { width:460px; flex-shrink:0; background:#fff; border-left:1px solid #e8e8e2; display:flex; flex-direction:column; overflow-y:auto; }
        .bz-inner { flex:1; display:flex; flex-direction:column; justify-content:center; padding:56px 52px; }
        .bz-ring  { position:absolute; border-radius:50%; border:1px solid rgba(255,255,255,0.07); pointer-events:none; animation:bzBreath 8s ease-in-out infinite; }
        .bz-fc1   { animation:bzFloat1 6s ease-in-out infinite; }
        .bz-fc2   { animation:bzFloat2 7s ease-in-out 2s infinite; }
        .bz-fc3   { animation:bzFloat3 5s ease-in-out 4s infinite; }
        .bz-blink { animation:bzBlink 2s ease-in-out infinite; }
        .bz-tag   { font-size:11px; font-family:monospace; color:rgba(255,255,255,.28); background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:5px; padding:4px 9px; cursor:default; transition:color .2s,border-color .2s; }
        .bz-tag:hover { color:rgba(255,255,255,.7); border-color:rgba(255,255,255,.2); }
        .bz-field input { display:block; width:100%; height:50px; border-radius:10px; font-family:inherit; font-size:14px; color:#0d0f14; padding:0 44px 0 42px; transition:border-color .2s,background .2s,box-shadow .2s; box-sizing:border-box; }
        .bz-field input:focus { outline:none; border-color:#1a56db !important; background:#fff !important; box-shadow:0 0 0 3px rgba(26,86,219,0.09) !important; }
        .bz-btn  { transition:background .2s,box-shadow .2s,transform .1s; }
        .bz-btn:hover:not(:disabled) { background:#1040b0 !important; box-shadow:0 4px 18px rgba(26,86,219,0.35) !important; }
        .bz-btn:active { transform:scale(.99); }
        .bz-social { transition:border-color .2s,background .2s; }
        .bz-social:hover { border-color:#9ca3af !important; background:#fafaf8 !important; }
        @keyframes bzBlink  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes bzFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bzFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bzFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes bzBreath { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes bzSpin   { to{transform:rotate(360deg)} }
        @keyframes bzRise   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bzPop    { from{transform:scale(0.4);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes bzLoad   { to{width:100%} }
        @keyframes bzShake  { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-3px)} 40%,60%{transform:translateX(3px)} }
        .bz-success { display:flex; flex-direction:column; align-items:center; text-align:center; animation:bzRise .5s cubic-bezier(.22,1,.36,1); }
        .bz-success-ring { width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;margin-bottom:20px;animation:bzPop .4s cubic-bezier(.34,1.56,.64,1); }
        .bz-err { animation:bzShake .35s cubic-bezier(.36,.07,.19,.97); }
        @media(max-width:860px) { .bz-canvas{display:none!important} .bz-panel{width:100%!important;border:none!important} }
      `}</style>

      <div className="bz-page">

        {/* ══ LEFT CANVAS ══ */}
        <section className="bz-canvas">
          {/* Rings */}
          <div className="bz-ring" style={{ width:520, height:520, top:-180, right:-200, animationDelay:'0s' }} />
          <div className="bz-ring" style={{ width:370, height:370, top:-100, right:-120, animationDelay:'-2s' }} />
          <div className="bz-ring" style={{ width:220, height:220, top:-30, right:-55, animationDelay:'-4s' }} />
          <div className="bz-ring" style={{ width:700, height:700, bottom:-300, left:-240, border:'1px solid rgba(255,255,255,0.04)', animationDelay:'-1s' }} />
          {/* Dot grid */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize:'28px 28px', maskImage:'radial-gradient(ellipse 90% 90% at 50% 50%, black 40%, transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 90% 90% at 50% 50%, black 40%, transparent 100%)' }} />
          {/* Splash */}
          <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(26,86,219,0.22) 0%, transparent 65%)', bottom:-200, left:-100, pointerEvents:'none' }} />

          {/* Stat cards */}
          <StatCard label="Revenue MTD" value="₹24.7L" sub="Live · updated now" live animClass="bz-fc1" style={{ top:'19%', right:'5%' }} />
          <StatCard label="Invoices Today" value="143" sub="↑ 18% vs yesterday" animClass="bz-fc2" style={{ top:'43%', right:'9%' }} />
          <StatCard label="GST Filed" value="100%" sub="GSTR-3B · Mar 2025" animClass="bz-fc3" style={{ bottom:'20%', right:'5%' }} />

          {/* Logo */}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#1a56db,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(26,86,219,0.45)' }}>
                <Zap size={20} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>
                BizzAI<sup style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:400, marginLeft:2 }}>ERP</sup>
              </span>
            </div>
          </div>

          {/* Hero */}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:100, padding:'5px 13px', marginBottom:20, letterSpacing:'0.04em' }}>
              <span className="bz-blink" style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 5px #22c55e' }} />
              Enterprise · v2.4.0
            </div>
            <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:'clamp(34px,3.8vw,54px)', fontWeight:400, color:'#fff', lineHeight:1.08, letterSpacing:'-0.01em', marginBottom:18 }}>
              Run your entire<br />business from<br />
              <em style={{ fontStyle:'italic', color:'rgba(255,255,255,0.45)' }}>one dashboard.</em>
            </h1>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.35)', lineHeight:1.7, maxWidth:360, fontWeight:300 }}>
              Sales, inventory, finance, HR, and AI analytics — unified for the modern Indian enterprise.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:30 }}>
              {['POS & Billing','Inventory','Finance','GST','Payroll','Reports','Multi-tenant','AI Insights'].map(t => (
                <span key={t} className="bz-tag">{t}</span>
              ))}
            </div>
          </div>

          <div style={{ position:'relative', zIndex:2, fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,0.17)', letterSpacing:'0.05em' }}>
            © 2025 BizzAI Technologies · SOC 2 Type II · ISO 27001
          </div>
        </section>

        {/* ══ RIGHT PANEL ══ */}
        <main className="bz-panel">
          <div className="bz-inner">

            {success ? (
              <div className="bz-success">
                <div className="bz-success-ring"><CheckCircle2 size={32} color="#1a56db" /></div>
                <h3 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', marginBottom:8 }}>You're signed in</h3>
                <p style={{ fontSize:14, color:'#8b909e', fontWeight:300 }}>Redirecting to your workspace…</p>
                <div style={{ width:180, height:3, background:'#e8e8e2', borderRadius:2, marginTop:24, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'#1a56db', borderRadius:2, width:'0%', animation:'bzLoad 1.4s ease-out .3s forwards' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Step dots */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:36 }}>
                  {[true, false, false].map((a, i) => (
                    <div key={i} style={{ height:6, borderRadius:3, width:a?22:6, background:a?'#1a56db':'#e2e2dc', transition:'all .3s' }} />
                  ))}
                </div>

                <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.03em', color:'#0d0f14', marginBottom:6 }}>Welcome back</h1>
                <p style={{ fontSize:14, color:'#8b909e', marginBottom:32, fontWeight:300, lineHeight:1.5 }}>Sign in to your BizzAI workspace to continue.</p>

                {isError && (
                  <div className="bz-err" style={{ background:'#fef2f2', border:'1.5px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'13px 16px', fontSize:13, color:'#dc2626', display:'flex', alignItems:'flex-start', gap:10, marginBottom:20 }}>
                    <AlertCircle size={16} style={{ flexShrink:0, marginTop:1 }} />
                    <span>{(error as Error)?.message ?? 'Invalid credentials. Please try again.'}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>

                  {/* Email */}
                  <div className="bz-field" style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#3d4350', letterSpacing:'0.01em', marginBottom:7 }}>Email address</label>
                    <div style={{ position:'relative' }}>
                      <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#8b909e', pointerEvents:'none' }} />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="username"
                        style={{ border:`1.5px solid ${errors.email?'#dc2626':'#e2e2dc'}`, background:errors.email?'#fef2f2':'#fafaf8', paddingLeft:42, paddingRight:14 }}
                      />
                    </div>
                    {errors.email && <p style={{ fontSize:12, color:'#dc2626', marginTop:5, paddingLeft:2 }}>{errors.email.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="bz-field" style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <label style={{ fontSize:12, fontWeight:500, color:'#3d4350', letterSpacing:'0.01em' }}>Password</label>
                      <a href="/forgot-password" style={{ fontSize:12, color:'#1a56db', textDecoration:'none', fontWeight:400 }}>Forgot password?</a>
                    </div>
                    <div style={{ position:'relative' }}>
                      <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#8b909e', pointerEvents:'none' }} />
                      <input
                        {...register('password')}
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        style={{ border:`1.5px solid ${errors.password?'#dc2626':'#e2e2dc'}`, background:errors.password?'#fef2f2':'#fafaf8', paddingLeft:42, paddingRight:44 }}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} aria-label="Toggle password" style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8b909e', padding:4, display:'flex' }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p style={{ fontSize:12, color:'#dc2626', marginTop:5, paddingLeft:2 }}>{errors.password.message}</p>}
                  </div>

                  {/* Remember */}
                  <label style={{ display:'flex', alignItems:'center', gap:9, margin:'4px 0 22px', cursor:'pointer', userSelect:'none' }}>
                    <input {...register('remember')} type="checkbox" style={{ width:16, height:16, accentColor:'#1a56db', cursor:'pointer', flexShrink:0, padding:0, border:'none', background:'none' }} />
                    <span style={{ fontSize:13, color:'#3d4350', fontWeight:400 }}>Keep me signed in for 30 days</span>
                  </label>

                  {/* Submit */}
                  <button type="submit" disabled={isPending} className="bz-btn" style={{ width:'100%', height:50, background:'#1a56db', border:'none', borderRadius:10, color:'#fff', fontFamily:'inherit', fontSize:15, fontWeight:600, letterSpacing:'-0.01em', cursor:isPending?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9, opacity:isPending?0.6:1 }}>
                    {isPending ? <Loader2 size={18} style={{ animation:'bzSpin .65s linear infinite' }} /> : <><span>Sign In</span><ArrowRight size={16} /></>}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:14, margin:'24px 0', fontSize:12, color:'#8b909e' }}>
                  <div style={{ flex:1, height:1, background:'#e8e8e2' }} />
                  or sign in with
                  <div style={{ flex:1, height:1, background:'#e8e8e2' }} />
                </div>

                {/* Social */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <button type="button" className="bz-social" style={{ height:46, border:'1.5px solid #e2e2dc', borderRadius:10, background:'#fff', fontFamily:'inherit', fontSize:13, fontWeight:500, color:'#3d4350', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button type="button" className="bz-social" style={{ height:46, border:'1.5px solid #e2e2dc', borderRadius:10, background:'#fff', fontFamily:'inherit', fontSize:13, fontWeight:500, color:'#3d4350', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <ShieldCheck size={16} color="#3d4350" />
                    SSO / SAML
                  </button>
                </div>

                <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'#8b909e', fontWeight:300 }}>
                  Don't have an account?{' '}
                  <a href="/signup" style={{ color:'#1a56db', textDecoration:'none', fontWeight:600 }}>Request access</a>
                </p>
              </>
            )}
          </div>

          {/* Legal footer */}
          <div style={{ padding:'16px 52px', borderTop:'1px solid #e8e8e2', fontSize:11, fontFamily:'monospace', color:'#8b909e', display:'flex', alignItems:'center', justifyContent:'space-between', letterSpacing:'0.03em' }}>
            <span>© 2025 BizzAI Technologies</span>
            <span style={{ display:'flex', gap:12 }}>
              {['Privacy','Terms','Security'].map(l => <a key={l} href="#" style={{ color:'#8b909e', textDecoration:'none' }}>{l}</a>)}
            </span>
          </div>
        </main>

      </div>
    </>
  );
};
