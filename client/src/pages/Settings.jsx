import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Sun, Moon, Info, ShieldCheck } from 'lucide-react';

export function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-sky-500" />
            System & Theme Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure UI appearance, zero-transparency preferences, and view platform model specs.
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Theme Switching Card */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">UI Theme Preference (100% Zero-Transparency Mandate)</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 opacity-100">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Active UI Mode</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Current theme: <span className="font-extrabold capitalize text-sky-500">{theme} Mode</span>
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        {/* Legal & Educational Disclaimer Card */}
        <div className="opaque-card space-y-3 border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Educational Model & Legal Disclaimer
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            "RiskGuard is an educational financial risk-analysis tool and does not provide professional financial advice."
          </p>
          <p className="text-[11px] text-slate-400">
            All quantitative VaR, Monte Carlo, and credit risk models are computed deterministically using standard mathematical formulations.
          </p>
        </div>
      </div>
    </div>
  );
}
