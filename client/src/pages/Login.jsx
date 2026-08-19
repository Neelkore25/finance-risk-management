import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, Mail, Lock, User, Eye, EyeOff, Check, AlertCircle, 
  Sun, Moon, ShieldCheck, CheckCircle2, LockKeyhole
} from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmailErr, setLoginEmailErr] = useState('');
  const [loginPasswordErr, setLoginPasswordErr] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regEmailErr, setRegEmailErr] = useState('');
  const [regConfirmErr, setRegConfirmErr] = useState('');

  // Toast State
  const [toast, setToast] = useState({ show: false, msg: '', type: 'ok' });

  const { login, register, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showToastMsg = (msg, type = 'ok') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'ok' }), 3200);
  };

  // Password Security Meter calculation
  const getPasswordScore = (v) => {
    if (!v) return 0;
    let score = 0;
    if (v.length >= 6) score += 25;
    if (v.length >= 10) score += 20;
    if (/[A-Z]/.test(v)) score += 20;
    if (/[0-9]/.test(v)) score += 20;
    if (/[^A-Za-z0-9]/.test(v)) score += 15;
    return Math.min(score, 100);
  };

  const pwScore = getPasswordScore(regPassword);
  let pwColor = '#f0576b';
  let pwLabel = 'WEAK';
  if (pwScore >= 75) {
    pwColor = '#34d399';
    pwLabel = 'STRONG';
  } else if (pwScore >= 40) {
    pwColor = '#f5a524';
    pwLabel = 'MODERATE';
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginEmailErr('');
    setLoginPasswordErr('');

    let valid = true;
    if (!emailRe.test(loginEmail.trim())) {
      setLoginEmailErr('Enter a valid email address.');
      valid = false;
    }
    if (!loginPassword) {
      setLoginPasswordErr('Please enter your password.');
      valid = false;
    }
    if (!valid) return;

    setLoginLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      showToastMsg('Signed in — redirecting to your dashboard…', 'ok');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setLoginEmailErr('Incorrect email or password.');
      setLoginPasswordErr('Incorrect email or password.');
      showToastMsg(err.message || 'Incorrect email or password.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegEmailErr('');
    setRegConfirmErr('');

    let valid = true;
    if (!regName.trim()) valid = false;
    if (!emailRe.test(regEmail.trim())) {
      setRegEmailErr('Enter a valid email address.');
      valid = false;
    }
    if (regPassword.length < 6) {
      showToastMsg('Password must be at least 6 characters.', 'error');
      valid = false;
    }
    if (regConfirm !== regPassword) {
      setRegConfirmErr("Passwords don't match.");
      valid = false;
    }
    if (!valid) return;

    setRegLoading(true);
    try {
      await register(regEmail.trim(), regPassword, regName.trim());
      showToastMsg('Account created — signing you in...', 'ok');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setRegEmailErr(err.message || 'This email is already registered.');
      showToastMsg(err.message || 'Registration failed.', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !emailRe.test(loginEmail.trim())) {
      showToastMsg('Please enter your valid email address first.', 'error');
      return;
    }
    try {
      await resetPassword(loginEmail.trim());
      showToastMsg('Password reset link sent to your registered email.', 'ok');
    } catch (err) {
      showToastMsg('Password reset link sent if the account exists.', 'ok');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex transition-colors duration-350 overflow-x-hidden font-sans">
      {/* Toast Notification */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2.5 border transition-all duration-400 ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'
        } ${
          toast.type === 'ok'
            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900 border-rose-500/40 text-rose-300'
        }`}
      >
        <span className="shrink-0 p-1 rounded-full bg-current/10">
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
        </span>
        <span>{toast.msg}</span>
      </div>

      <div className="flex w-full min-h-screen">
        {/* ============ LEFT: BRAND PANEL ============ */}
        <aside className="hidden lg:flex flex-col justify-between flex-1 max-w-[620px] p-12 border-r border-slate-800/80 relative overflow-hidden bg-slate-950">
          {/* Animated Grid Pattern Background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-950 to-slate-950" />

          {/* Logo Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white tracking-wide font-display">
                FINANCE <span className="text-cyan-400">RISK</span> ANALYTICS
              </div>
              <div className="text-[9.5px] tracking-[2px] text-slate-400 font-bold uppercase mt-0.5">
                QUANTITATIVE ANALYTICS SUITE
              </div>
            </div>
          </div>

          {/* Brand Headline & Copy */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
              SYSTEM SECURE
            </div>

            <h1 className="text-3xl font-extrabold text-white leading-tight font-display tracking-tight mb-4">
              Know your exposure<br />
              before the market does<span className="text-cyan-400">.</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Sign in to track your portfolio VaR, credit risk models, and stress-test scenarios in one integrated workspace.
            </p>

            {/* Risk Gauge Scorecard Card */}
            <div className="mt-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-[10.5px] font-bold tracking-wider">
                <span className="text-slate-400">OVERALL FINANCIAL RISK SCORE</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="6"
                      strokeDasharray="188.5"
                      strokeDashoffset="115"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-sm font-black text-white font-display">39</span>
                </div>

                <div>
                  <div className="text-2xl font-bold font-display text-white">
                    39<span className="text-xs text-slate-500 font-medium">/100</span>
                  </div>
                  <div className="text-[11.5px] text-slate-400 mt-0.5">Debt-to-income steady at 16%</div>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950/60 text-amber-400 border border-amber-500/30 tracking-wide">
                    MODERATE RISK
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Bullet List */}
            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                <span>Real-time Value-at-Risk modeling</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                <span>Credit default risk scoring</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                <span>What-if portfolio stress testing</span>
              </li>
            </ul>
          </div>

          {/* Footer Security Disclaimer */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-500">
            <LockKeyhole className="w-3.5 h-3.5" />
            <span>256-bit encrypted • Your credentials never leave this device unhashed</span>
          </div>
        </aside>

        {/* ============ RIGHT: FORM PANEL ============ */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-slate-950">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-full max-w-[400px]">
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
                <Shield className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="text-base font-extrabold text-white tracking-wide font-display">
                FINANCE <span className="text-cyan-400">RISK</span> ANALYTICS
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="relative flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-sky-500 to-cyan-400 rounded-lg shadow-lg shadow-sky-500/30 transition-transform duration-300 ease-out ${
                  activeTab === 'register' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-bold transition-colors z-10 ${
                  activeTab === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-bold transition-colors z-10 ${
                  activeTab === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* SIGN IN FORM PANE */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Welcome back</h2>
                  <p className="text-xs text-slate-400 mt-1">Sign in to your risk workspace to continue.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors ${
                        loginEmailErr ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                  </div>
                  {loginEmailErr && <p className="text-[11px] text-rose-400">{loginEmailErr}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-semibold text-cyan-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`w-full pl-9 pr-9 py-2.5 bg-slate-900 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors ${
                        loginPasswordErr ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginPasswordErr && <p className="text-[11px] text-rose-400">{loginPasswordErr}</p>}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all duration-200 disabled:opacity-50 font-display tracking-wide mt-2"
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="text-center text-xs text-slate-400 pt-4">
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

            {/* CREATE ACCOUNT FORM PANE */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Create your account</h2>
                  <p className="text-xs text-slate-400 mt-1">Set up access to the analytics suite in under a minute.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Jordan Ellis"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors ${
                        regEmailErr ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                  </div>
                  {regEmailErr && <p className="text-[11px] text-rose-400">{regEmailErr}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Security Score Meter */}
                  {regPassword && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 tracking-wider">SECURITY SCORE</span>
                        <span
                          className="px-2 py-0.5 rounded-full font-extrabold text-[9.5px]"
                          style={{ color: pwColor, backgroundColor: `${pwColor}20` }}
                        >
                          {pwLabel}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${pwScore}%`, backgroundColor: pwColor }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      required
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-9 pr-9 py-2.5 bg-slate-900 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors ${
                        regConfirmErr ? 'border-rose-500/60' : 'border-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regConfirmErr && <p className="text-[11px] text-rose-400">{regConfirmErr}</p>}
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all duration-200 disabled:opacity-50 font-display tracking-wide mt-2"
                >
                  {regLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center text-xs text-slate-400 pt-3">
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

            {/* Footer Legal Links */}
            <div className="mt-8 text-center text-[11px] text-slate-500 space-x-2">
              <a href="#" className="hover:text-slate-300 underline">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-300 underline">Terms</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
