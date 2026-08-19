import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, Eye, EyeOff, Check, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleLogin, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Password Security Meter calculation
  const getPasswordScore = (pw) => {
    if (!pw) return { score: 0, label: 'WEAK', color: 'bg-rose-500', text: 'text-rose-500' };
    let s = 0;
    if (pw.length >= 6) s += 25;
    if (pw.length >= 10) s += 20;
    if (/[A-Z]/.test(pw)) s += 20;
    if (/[0-9]/.test(pw)) s += 20;
    if (/[^A-Za-z0-9]/.test(pw)) s += 15;
    s = Math.min(s, 100);

    if (s < 40) return { score: s, label: 'WEAK', color: 'bg-rose-500', text: 'text-rose-500' };
    if (s < 75) return { score: s, label: 'MODERATE', color: 'bg-amber-500', text: 'text-amber-500' };
    return { score: s, label: 'STRONG', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const pwMeter = getPasswordScore(regPassword);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
      setSuccess('Signed in — redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regPassword !== regConfirm) {
      setError("Passwords don't match.");
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(regEmail, regPassword, regName);
      setSuccess('Account created — redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex opacity-100 selection:bg-sky-600 selection:text-white font-sans">
      <div className="flex w-full min-h-screen">
        
        {/* ============ LEFT BRAND & RISK GAUGE PANEL ============ */}
        <aside className="hidden lg:flex flex-col justify-between flex-1 max-w-[620px] p-12 border-r border-slate-800 bg-slate-900/60 relative overflow-hidden">
          {/* Animated Background Ticker SVG */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="w-[200%] h-full animate-[pulse_6s_infinite]">
              <polyline
                points="0,80 40,60 80,70 120,40 160,55 200,20 240,45 280,30 320,50 360,25 400,42 440,15 480,38 520,22 560,48 600,30"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Logo Row */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Shield className="w-6 h-6 stroke-[2.5] text-white" />
            </div>
            <div>
              <div className="text-base font-black tracking-wider text-white">
                FINANCE <span className="text-cyan-400">RISK</span> ANALYTICS
              </div>
              <div className="text-[9.5px] tracking-widest text-slate-400 font-bold uppercase">
                Quantitative Analytics Suite
              </div>
            </div>
          </div>

          {/* Brand Copy & Interactive Gauge */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              SYSTEM SECURE
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4 font-display">
              Know your exposure <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                before the market does.
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Sign in to track your portfolio VaR, credit risk, and stress-test scenarios in one unified executive workspace.
            </p>

            {/* Overall Risk Score Live Gauge Card */}
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl opacity-100">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
                <span>OVERALL FINANCIAL RISK SCORE</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="6"
                      strokeDasharray="163.3"
                      strokeDashoffset="99"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    39 <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-xs text-slate-400">Debt-to-income steady at 16%</div>
                  <span className="inline-block mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    MODERATE RISK
                  </span>
                </div>
              </div>
            </div>

            {/* Bullet Feature List */}
            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                Real-time Value-at-Risk (VaR) modeling
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                Credit default risk scoring
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                What-if portfolio stress testing
              </li>
            </ul>
          </div>

          {/* Footer Security Badge */}
          <div className="relative z-10 text-xs text-slate-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            256-bit encrypted • Your credentials never leave this device unhashed
          </div>
        </aside>

        {/* ============ RIGHT FORM PANEL ============ */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-slate-950">
          
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          <div className="w-full max-w-[420px]">
            
            {/* Mobile Header Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-base font-black tracking-wider text-white">
                FINANCE <span className="text-cyan-400">RISK</span> ANALYTICS
              </div>
            </div>

            {/* TAB SWITCHER HEADER ([ Sign In ] | [ Create Account ]) */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6 opacity-100">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alert Banners */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 opacity-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 opacity-100">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* OAUTH BUTTONS SECTION (Single Continue with Google & GitHub) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 border border-slate-800"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-950 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute">
                or continue with email
              </span>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">Password</label>
                    <Link to="/forgot-password" className="text-[11px] font-semibold text-cyan-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="text-center text-xs text-slate-400 pt-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-cyan-400 font-bold hover:underline"
                  >
                    Create one
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Security Score Meter */}
                  {regPassword && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 mt-2 opacity-100">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">SECURITY SCORE</span>
                        <span className={pwMeter.text}>{pwMeter.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pwMeter.color}`} style={{ width: `${pwMeter.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      required
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center text-xs text-slate-400 pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-cyan-400 font-bold hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
