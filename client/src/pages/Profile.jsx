import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { User, Save, DollarSign, Wallet, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function Profile() {
  const [profile, setProfile] = useState({
    monthly_income: 5000,
    monthly_essential_expenses: 2000,
    monthly_discretionary_expenses: 800,
    existing_savings: 10000,
    emergency_fund: 6000,
    monthly_debt_payment: 400
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiFetch('/profile');
        if (res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    window.addEventListener('settingsUpdated', loadProfile);
    return () => {
      window.removeEventListener('profileUpdated', loadProfile);
      window.removeEventListener('settingsUpdated', loadProfile);
    };
  }, []);

  const handleChange = (field, val) => {
    setProfile(prev => ({
      ...prev,
      [field]: Math.max(0, Number(val || 0))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      setProfile(res.profile);
      setMessage('Financial profile successfully updated and risk engine re-evaluated.');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // Live Metrics Calculations
  const income = Math.max(0, Number(profile.monthly_income || 0));
  const essential = Math.max(0, Number(profile.monthly_essential_expenses || 0));
  const discretionary = Math.max(0, Number(profile.monthly_discretionary_expenses || 0));
  const debt = Math.max(0, Number(profile.monthly_debt_payment || 0));
  const totalExp = essential + discretionary;
  const netCashFlow = income - (totalExp + debt);
  const savingsRate = income > 0 ? (netCashFlow / income) * 100 : 0;
  const dti = income > 0 ? (debt / income) * 100 : 0;
  const emergencyMonths = essential > 0 ? profile.emergency_fund / essential : 0;

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Financial Profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-sky-500" />
            Financial Profile Setup
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure baseline income, living costs, emergency reserves, and debt payments.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 opacity-100">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 opacity-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Entry Form */}
        <div className="lg:col-span-2 opaque-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Net Income ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.monthly_income}
                  onChange={(e) => handleChange('monthly_income', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Debt Service ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.monthly_debt_payment}
                  onChange={(e) => handleChange('monthly_debt_payment', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Essential Living Expenses ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.monthly_essential_expenses}
                  onChange={(e) => handleChange('monthly_essential_expenses', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discretionary Expenses ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.monthly_discretionary_expenses}
                  onChange={(e) => handleChange('monthly_discretionary_expenses', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Liquid Savings ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.existing_savings}
                  onChange={(e) => handleChange('existing_savings', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Fund Reserve ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.emergency_fund}
                  onChange={(e) => handleChange('emergency_fund', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Updating Profile...' : 'Save Financial Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Derived Key Metrics Card */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            Live Derived Ratios
          </h2>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Total Monthly Expenses</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">${totalExp.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Net Monthly Cash Flow</span>
              <span className={`text-sm font-bold ${netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ${netCashFlow.toLocaleString()} / mo
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Savings Rate</span>
              <span className="text-sm font-bold text-sky-500">{savingsRate.toFixed(1)}%</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Debt-to-Income (DTI) Ratio</span>
              <span className={`text-sm font-bold ${dti > 36 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                {dti.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Emergency Reserve Buffer</span>
              <span className="text-sm font-bold text-amber-500">{emergencyMonths.toFixed(1)} Months</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
