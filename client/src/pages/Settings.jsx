import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, ShieldCheck, Sliders, DollarSign, 
  Bell, RefreshCw, RotateCcw, CheckCircle2, AlertCircle, Database
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function Settings() {
  // Section A: Risk Model & Benchmark Thresholds
  const [dtiLimit, setDtiLimit] = useState(36);
  const [varConfidence, setVarConfidence] = useState(95);
  const [emergencyTargetMonths, setEmergencyTargetMonths] = useState(6);

  // Section B: Currency & Regional Formatting
  const [baseCurrency, setBaseCurrency] = useState('INR'); // INR vs USD
  const [numberFormat, setNumberFormat] = useState('LAKHS'); // LAKHS vs THOUSANDS

  // Section C: Automated Risk Alert Triggers
  const [alertDtiBreach, setAlertDtiBreach] = useState(true);
  const [alertLowReserves, setAlertLowReserves] = useState(true);
  const [alertVarVolatility, setAlertVarVolatility] = useState(true);

  // Status & Feedback Toasts
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('ok');

  useEffect(() => {
    // Load persisted settings if any
    try {
      const saved = localStorage.getItem('risk_platform_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dtiLimit) setDtiLimit(parsed.dtiLimit);
        if (parsed.varConfidence) setVarConfidence(parsed.varConfidence);
        if (parsed.emergencyTargetMonths) setEmergencyTargetMonths(parsed.emergencyTargetMonths);
        if (parsed.baseCurrency) setBaseCurrency(parsed.baseCurrency);
        if (parsed.numberFormat) setNumberFormat(parsed.numberFormat);
        if (parsed.alertDtiBreach !== undefined) setAlertDtiBreach(parsed.alertDtiBreach);
        if (parsed.alertLowReserves !== undefined) setAlertLowReserves(parsed.alertLowReserves);
        if (parsed.alertVarVolatility !== undefined) setAlertVarVolatility(parsed.alertVarVolatility);
      }
    } catch (err) {}
  }, []);

  const saveSettings = (updated) => {
    try {
      localStorage.setItem('risk_platform_settings', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updated }));
      setToastType('ok');
      setToastMsg('Settings saved successfully.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {}
  };

  const handleForceReSync = () => {
    try {
      localStorage.removeItem('riskguard_users_db');
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      setToastType('ok');
      setToastMsg('Supabase state re-synchronized cleanly.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      setToastType('error');
      setToastMsg('Re-sync failed.');
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      dtiLimit: 36,
      varConfidence: 95,
      emergencyTargetMonths: 6,
      baseCurrency: 'INR',
      numberFormat: 'LAKHS',
      alertDtiBreach: true,
      alertLowReserves: true,
      alertVarVolatility: true
    };
    setDtiLimit(36);
    setVarConfidence(95);
    setEmergencyTargetMonths(6);
    setBaseCurrency('INR');
    setNumberFormat('LAKHS');
    setAlertDtiBreach(true);
    setAlertLowReserves(true);
    setAlertVarVolatility(true);
    saveSettings(defaults);
    setToastType('ok');
    setToastMsg('Platform settings reset to defaults.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <SettingsIcon className="w-7 h-7 text-[#2563EB] dark:text-[#0EA5E9]" />
            Platform & Risk Model Settings
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#9CA3AF] mt-1 font-medium">
            Configure quantitative risk parameters, benchmark thresholds, regional formatting, and database sync.
          </p>
        </div>

        {toastMsg && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-sm ${
            toastType === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950 border-rose-300 text-rose-600 dark:text-rose-400'
          }`}>
            {toastType === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toastMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION A: RISK MODEL & BENCHMARK THRESHOLDS */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            Section A: Risk Model & Benchmark Thresholds
          </div>

          <div className="space-y-3 pt-1">
            {/* Target DTI Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Target Debt-to-Income (DTI) Limit
                </label>
                <span className="font-extrabold text-sky-500">{dtiLimit}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                value={dtiLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDtiLimit(val);
                  saveSettings({ dtiLimit: val, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                }}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recommended maximum target ratio of monthly debt service to net monthly income (Default: 36%).
              </p>
            </div>

            {/* VaR Default Confidence Level */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Value at Risk (VaR) Default Confidence Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVarConfidence(95);
                    saveSettings({ dtiLimit, varConfidence: 95, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors ${
                    varConfidence === 95
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  95% Confidence Level
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVarConfidence(99);
                    saveSettings({ dtiLimit, varConfidence: 99, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors ${
                    varConfidence === 99
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  99% Confidence Level
                </button>
              </div>
            </div>

            {/* Emergency Reserve Coverage Target */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Emergency Reserve Coverage Target
              </label>
              <select
                value={emergencyTargetMonths}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEmergencyTargetMonths(val);
                  saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths: val, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                }}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value={3}>3 Months Essential Expenses</option>
                <option value={6}>6 Months Essential Expenses (Recommended)</option>
                <option value={12}>12 Months Essential Expenses (Conservative)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION B: CURRENCY & REGIONAL FORMATTING */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            Section B: Currency & Regional Formatting
          </div>

          <div className="space-y-4 pt-1">
            {/* Base Currency Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Base Display Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBaseCurrency('INR');
                    saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency: 'INR', numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                    baseCurrency === 'INR'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  INR (₹ Indian Rupee)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBaseCurrency('USD');
                    saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency: 'USD', numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                    baseCurrency === 'USD'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  USD ($ US Dollar)
                </button>
              </div>
            </div>

            {/* Number Formatting Standard */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Number Formatting Standard
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNumberFormat('LAKHS');
                    saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat: 'LAKHS', alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors ${
                    numberFormat === 'LAKHS'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Lakhs / Crores (en-IN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNumberFormat('THOUSANDS');
                    saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat: 'THOUSANDS', alertDtiBreach, alertLowReserves, alertVarVolatility });
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-colors ${
                    numberFormat === 'THOUSANDS'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Thousands / Millions (en-US)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: AUTOMATED RISK ALERT TRIGGERS */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
            <Bell className="w-4 h-4" />
            Section C: Automated Risk Alert Triggers
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Alert when Debt-to-Income exceeds 40%
              </span>
              <input
                type="checkbox"
                checked={alertDtiBreach}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAlertDtiBreach(val);
                  saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach: val, alertLowReserves, alertVarVolatility });
                }}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Alert when Cash Reserves drop below threshold
              </span>
              <input
                type="checkbox"
                checked={alertLowReserves}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAlertLowReserves(val);
                  saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves: val, alertVarVolatility });
                }}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Portfolio Volatility & VaR Breach Alerts
              </span>
              <input
                type="checkbox"
                checked={alertVarVolatility}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAlertVarVolatility(val);
                  saveSettings({ dtiLimit, varConfidence, emergencyTargetMonths, baseCurrency, numberFormat, alertDtiBreach, alertLowReserves, alertVarVolatility: val });
                }}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* SECTION D: SYSTEM HEALTH & SUPABASE SYNC */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
            <Database className="w-4 h-4" />
            Section D: System Health & Database Sync
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Database Engine Status
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold text-[10px] border border-emerald-500/20">
                {isSupabaseConfigured() ? 'Supabase RLS DB • Connected' : 'Local Sandbox Engine Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleForceReSync}
                className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Force Re-Sync Supabase
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="w-full py-2.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 text-slate-800 dark:text-slate-200 hover:text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
