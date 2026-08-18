import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, Zap, Check, Plus, ChevronDown } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Account Chooser State
  const [showGoogleAccounts, setShowGoogleAccounts] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const googleAccounts = [
    { name: 'Neel Kore', email: 'neelkore25@gmail.com', avatar: 'N' },
    { name: 'Financial Risk Analyst', email: 'risk.analyst@gmail.com', avatar: 'F' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (account) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin({ name: account.name, email: account.email });
      navigate('/dashboard');
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    handleSelectGoogleAccount({
      name: customGoogleName.trim() || customGoogleEmail.split('@')[0],
      email: customGoogleEmail.trim()
    });
  };

  const handleQuickDemo = async () => {
    handleSelectGoogleAccount({ name: 'Neel Kore', email: 'neelkore25@gmail.com' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 100% OPAQUE Auth Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 opacity-100 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-inner">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
            FINANCE <span className="text-sky-500">RISK ANALYTICS</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Quantitative Financial Risk Management Platform
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON & ACCOUNT CHOOSER */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowGoogleAccounts(!showGoogleAccounts)}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-between px-4 border border-slate-200 opacity-100"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google Account</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showGoogleAccounts ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Google Account Options */}
          {showGoogleAccounts && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 opacity-100 animate-fadeIn">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Select Google Account:
              </span>

              {!showCustomGoogle ? (
                <>
                  {googleAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectGoogleAccount(acc)}
                      className="w-full p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500 rounded-xl flex items-center justify-between text-left transition-colors opacity-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center border border-sky-400">
                          {acc.avatar}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            {acc.name}
                          </h4>
                          <p className="text-[10px] text-slate-400">{acc.email}</p>
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowCustomGoogle(true)}
                    className="w-full py-2 px-3 bg-slate-900 border border-dashed border-slate-700 hover:border-sky-500 rounded-xl text-[11px] font-bold text-sky-400 flex items-center justify-center gap-1.5 transition-colors opacity-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Enter Custom Gmail Account
                  </button>
                </>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="e.g. Neel Kore"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 opacity-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Gmail Address</label>
                    <input
                      type="email"
                      required
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 opacity-100"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogle(false)}
                      className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-sky-600 text-white font-bold text-xs rounded-lg hover:bg-sky-500"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute">
            or use email
          </span>
        </div>

        {/* EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors opacity-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors disabled:opacity-50 mt-2 opacity-100"
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 opacity-100"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ One-Click Demo Access</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 font-bold hover:underline">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
