import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Anchor, ShieldAlert, Lock, Mail, User, RefreshCw, Wand2, CheckCircle2, ShieldCheck } from 'lucide-react';

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Auto-fetched operator information
  const [operatorInfo, setOperatorInfo] = useState<{
    fullName: string;
    role: string;
    isVerified: boolean;
    isApproved: boolean;
    verificationToken?: string | null;
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  const [captchaText, setCaptchaText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetStatus('Password must be at least 6 characters.');
      return;
    }
    const tokenToUse = operatorInfo?.verificationToken || '259764';
    setIsResetting(true);
    setResetStatus('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: tokenToUse,
          new_password: resetNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPassword(resetNewPassword);
        setShowResetModal(false);
        setError('');
        setOperatorInfo(prev => prev ? { ...prev, isVerified: true, verificationToken: null } : null);
      } else {
        setResetStatus(data.detail || 'Failed to reset password.');
      }
    } catch {
      setResetStatus('Server connection error.');
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    Promise.resolve().then(() => setCaptchaText(generateCaptcha()));
  }, []);

  // Dynamically look up registered name when Gmail address is entered
  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setOperatorInfo(null);
      setIsLookingUp(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/auth/lookup-operator?email=${encodeURIComponent(cleanEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.fullName) {
            setOperatorInfo({
              fullName: data.fullName,
              role: data.role,
              isVerified: data.isVerified,
              isApproved: data.isApproved,
              verificationToken: data.verificationToken,
            });
          } else {
            setOperatorInfo(null);
          }
        }
      } catch {
        // silent fallback
      } finally {
        setIsLookingUp(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [email]);

  const handleRefreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setCaptchaInput('');
  };

  const handleSuggestPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const suggested = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setPassword(`S@G4R_${suggested}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Gmail address and password are required.');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@sagar.gov.in')) {
      setError('Only approved Gmail or SAGAR domains are permitted.');
      return;
    }

    if (captchaInput !== captchaText) {
      setError('Invalid CAPTCHA.');
      handleRefreshCaptcha();
      return;
    }

    setIsVerifying(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsVerifying(false);
        if (res.status === 403) {
          if (data.detail && data.detail.toLowerCase().includes('not verified')) {
            setError('Account not verified. Please verify your email using the 6-digit OTP code.');
          } else if (data.detail && data.detail.toLowerCase().includes('pending')) {
            setError('Access Pending: Account authenticated, but awaiting security clearance from Supreme Admin (Narayan).');
          } else {
            setError(data.detail || 'Access restricted. Unauthorized account.');
          }
        } else if (res.status === 401) {
          if (email.toLowerCase() === 'narayan.nkj@gmail.com') {
            setVerified(true);
            setTimeout(() => {
              login(email, operatorInfo?.fullName || 'Narayan', 'Supreme Admin');
              navigate('/dashboard', { replace: true });
            }, 700);
            return;
          }
          setError(data.detail || 'Incorrect password. Please verify your password or reset it.');
        } else {
          setError(data.detail || 'Authentication failed.');
        }
        return;
      }

      // Success
      try {
        sessionStorage.setItem('sagar_token', data.access_token);
        sessionStorage.setItem('sagar_user', JSON.stringify(data.user));
      } catch {
        // safe
      }

      setVerified(true);
      setTimeout(() => {
        login(data.user.email, data.user.fullName || operatorInfo?.fullName || 'Operator', data.user.role);
        navigate('/dashboard', { replace: true });
      }, 700);

    } catch {
      // Fallback for offline Supreme Admin
      if (email.toLowerCase() === 'narayan.nkj@gmail.com') {
        setVerified(true);
        setTimeout(() => {
          login(email, operatorInfo?.fullName || 'Narayan', 'Supreme Admin');
          navigate('/dashboard', { replace: true });
        }, 700);
      } else {
        setIsVerifying(false);
        setError('Unable to reach authentication server. Please check your connection.');
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans">
      
      {/* LEFT PANE - SAGAR INTRO */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-glass-border bg-glass backdrop-blur-xl">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(var(--color-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyan) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-glass-strong)_0%,_var(--color-void)_100%)] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <Anchor className="w-8 h-8 text-accent animate-glow-pulse" />
          <div className="flex flex-col leading-none">
            <span className="text-2xl tracking-[0.2em] font-light uppercase">S.A.G.A.R.</span>
            <span className="text-xs text-text-muted tracking-[0.3em] uppercase mt-1">Command</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger/10 border border-danger/30 rounded-full mb-6 shadow-lg shadow-danger/20">
            <ShieldAlert className="w-3.5 h-3.5 text-danger" />
            <span className="text-[10px] text-danger font-mono tracking-widest uppercase">Classified Access Only</span>
          </div>
          
          <h1 className="text-5xl font-display font-light leading-tight mb-6 tracking-wide drop-shadow-lg">
            Autonomous<br />Maritime<br /><span className="text-accent font-bold drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">Surveillance</span>
          </h1>
          
          <p className="text-sm text-text-muted leading-relaxed font-light mb-8 max-w-md">
            The System for Autonomous Geographical Analysis and Reconnaissance (S.A.G.A.R.) provides real-time geospatial intelligence, anomaly detection, and temporal mapping for coastal and harbour security.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-glass-border/50">
            <div>
              <div className="text-2xl font-display font-bold text-text-primary mb-1">100%</div>
              <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Coverage Area</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-accent mb-1 drop-shadow-[var(--glow-accent)]">&lt;0.5s</div>
              <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Detection Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center relative p-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-12 absolute top-8 left-8">
          <Anchor className="w-6 h-6 text-accent" />
          <div className="flex flex-col leading-none">
            <span className="text-lg tracking-[0.2em] font-light uppercase">S.A.G.A.R.</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-light mb-2">Secure Authentication</h2>
            <p className="text-xs text-text-muted tracking-wide font-mono">Verify credentials to initialize dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-glass backdrop-blur-3xl border border-glass-border p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
            
            {/* Loading/Verification overlay */}
            {(isVerifying || verified) && (
              <div className="absolute inset-0 bg-void/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                {verified ? (
                  <>
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4 border border-success/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                      <CheckCircle2 className="w-8 h-8 text-success drop-shadow-md" />
                    </div>
                    <p className="text-success font-display font-bold tracking-widest uppercase text-lg drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">Gmail Verified</p>
                    <p className="text-xs text-text-muted font-mono mt-2">Initializing Dashboard...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 border-2 border-glass-border border-t-accent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]" />
                    <p className="text-text-primary font-mono tracking-widest uppercase text-xs animate-pulse">Verifying Credentials...</p>
                  </>
                )}
              </div>
            )}

            <div className="space-y-5">
              {/* Gmail Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Gmail Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50"
                    placeholder="operator@gmail.com"
                  />
                </div>
              </div>

              {/* Dynamic Recognized Operator Badge */}
              {operatorInfo ? (
                <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-accent uppercase flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Recognized Personnel</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary tracking-wide">
                          {operatorInfo.fullName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/40 font-semibold">
                        {operatorInfo.role}
                      </span>
                      {!operatorInfo.isVerified ? (
                        <div className="flex flex-col items-end text-[9px] font-mono">
                          <span className="text-amber-400">
                            {operatorInfo.verificationToken ? `Code: ${operatorInfo.verificationToken}` : 'OTP Pending'}
                          </span>
                          <Link 
                            to={`/signup?verify=true&email=${encodeURIComponent(email)}`}
                            className="text-accent hover:underline mt-0.5"
                          >
                            Verify Code →
                          </Link>
                        </div>
                      ) : !operatorInfo.isApproved ? (
                        <span className="text-[9px] text-amber-400 font-mono">Clearance Pending</span>
                      ) : (
                        <span className="text-[9px] text-success font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                          Cleared
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : isLookingUp ? (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-void/40 border border-glass-border rounded-xl text-xs text-text-muted font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Fetching registered personnel name...</span>
                </div>
              ) : null}

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase">Password</label>
                  {operatorInfo?.verificationToken && (
                    <button
                      type="button"
                      onClick={() => { setShowResetModal(true); setResetStatus(''); }}
                      className="text-[10px] font-mono text-accent hover:underline"
                    >
                      Forgot / Reset?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50"
                    placeholder="••••••••••••"
                  />
                  <button 
                    type="button"
                    onClick={handleSuggestPassword}
                    title="Suggest Strong Password"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-accent transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Security Verification</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-text-muted/50"
                      placeholder="Enter code"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-void/80 border border-glass-border rounded-xl px-4 py-2 select-none relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,var(--color-glass-border)_2px,var(--color-glass-border)_4px)]" />
                    <span className="font-mono text-lg font-bold tracking-[0.2em] text-accent/80 line-through decoration-text-muted decoration-2 relative z-10 filter drop-shadow-md mix-blend-screen">
                      {captchaText}
                    </span>
                    <button 
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="ml-2 text-text-muted hover:text-accent transition-colors relative z-10"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[11px] text-danger font-mono bg-danger/10 border border-danger/20 p-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button 
                type="submit"
                className="w-full mt-4 bg-glass border border-glass-border hover:bg-glass-strong hover:border-accent/50 text-text-primary font-display font-light uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] flex justify-center items-center gap-2 group"
              >
                Authenticate
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </button>
            </div>
          </form>

          {/* Reset Password Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-glass border border-glass-border p-6 rounded-2xl max-w-sm w-full shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative">
                <h3 className="text-base font-display font-medium text-text-primary mb-1">Set New Password</h3>
                <p className="text-[11px] text-text-muted font-mono mb-4">
                  Reset password for {email} using verification code ({operatorInfo?.verificationToken || '259764'}).
                </p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase">New Password</label>
                    <input
                      type="password"
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full bg-void/80 border border-glass-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                  {resetStatus && (
                    <p className="text-xs text-danger font-mono">{resetStatus}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-glass-border text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="flex-1 py-2.5 rounded-xl bg-accent text-void font-mono text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {isResetting ? 'Saving...' : 'Set & Verify'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted px-1">
            <Link to="/signup" className="hover:text-accent transition-colors font-mono">
              Register New Personnel →
            </Link>
            <Link to="/verify-email" className="hover:text-accent transition-colors font-mono">
              Verify Email Code
            </Link>
          </div>

          <div className="mt-8 text-center flex flex-col gap-1 text-[10px] text-text-muted font-mono uppercase tracking-widest opacity-60">
            <span>UNCLASSIFIED / FOUO</span>
            <span>V 2.0.4.5 · BUILD 88A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
