import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '146655864682-1pbmqo9padrgtd07r57l13vu2c6kjhe2.apps.googleusercontent.com';

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({ isOpen = true }) {
  const { googleLogin, signInWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'ok' });

  const showToastMsg = (msg, type = 'ok') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'ok' }), 5000);
  };

  // Initialize Google Identity Services (GIS) on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              try {
                showToastMsg('Authenticating with Google...', 'ok');
                await signInWithGoogleIdToken(response.credential);
              } catch (err) {
                showToastMsg(err.message || 'Google authentication failed.', 'error');
              } finally {
                setLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (e) {
        // Fallback to standard OAuth
      }
    }
  }, [signInWithGoogleIdToken]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.prompt(async (notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to OAuth redirect if popup was suppressed
            await googleLogin();
          }
        });
      } else {
        await googleLogin();
      }
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.message?.includes('validation_failed')) {
        showToastMsg('Google provider is not enabled in Supabase Dashboard. Under Authentication -> Providers -> Google, toggle it ON.', 'error');
      } else {
        showToastMsg(err.message || 'Google sign in failed. Please try again.', 'error');
      }
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-250 ease-out ${
        isOpen 
          ? 'opacity-100 pointer-events-auto bg-[#07090D]/25 backdrop-blur-[8px]' 
          : 'opacity-0 pointer-events-none bg-transparent backdrop-blur-none'
      }`}
    >
      {/* Floating Error/Info Toast */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2.5 border transition-all duration-300 ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'
        } ${
          toast.type === 'ok'
            ? 'bg-[#0D1724]/90 border-cyan-500/40 text-cyan-300 backdrop-blur-md'
            : 'bg-[#0D1724]/90 border-rose-500/40 text-rose-300 backdrop-blur-md'
        }`}
      >
        <span className="shrink-0">
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
        </span>
        <span>{toast.msg}</span>
      </div>

      {/* Centered Glass Modal Card */}
      <div 
        className="w-full max-w-[380px] rounded-2xl bg-[#0D1724]/75 dark:bg-[#07090D]/80 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-8 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-2xl transition-transform duration-250 ease-out transform scale-100"
      >
        {/* Subtle Obsidian Aurora Gradient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-cyan-500/25 via-violet-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Logo Badge */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[1.5px] shadow-lg shadow-cyan-500/25 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-[#07090D]/90 rounded-[10px] flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* App Title */}
        <h2 className="text-xl font-bold text-white tracking-tight">
          Finance Risk Analytics
        </h2>

        {/* Workspace Subtitle */}
        <p className="text-xs text-slate-300/90 mt-1 mb-6">
          Sign in to your risk workspace
        </p>

        {/* Continue with Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-white/10 hover:scale-[1.01] active:scale-[0.99] border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
          )}
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        {/* Optional Small Terms / Privacy Footer */}
        <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer">Terms of Service</span>
          {' '}&{' '}
          <span className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
