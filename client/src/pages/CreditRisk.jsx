import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { ShieldAlert, Info, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

export function CreditRisk() {
  const [creditRisk, setCreditRisk] = useState(null);
  const [formData, setFormData] = useState({
    income: 5000,
    existingDebt: 12000,
    creditHistoryMonths: 36,
    paymentHistoryScore: 95,
    missedPayments: 0,
    loanAmount: 15000
  });

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    async function loadCreditProfile() {
      try {
        const res = await apiFetch('/risk/credit');
        if (res.creditRisk) {
          setCreditRisk(res.creditRisk);
          if (res.creditRisk.metrics) {
            setFormData({
              income: res.creditRisk.metrics.income,
              existingDebt: res.creditRisk.metrics.existingDebt,
              creditHistoryMonths: res.creditRisk.metrics.creditHistoryMonths,
              paymentHistoryScore: res.creditRisk.metrics.paymentHistoryScore,
              missedPayments: res.creditRisk.metrics.missedPayments,
              loanAmount: res.creditRisk.metrics.loanAmount
            });
          }
        }
      } catch (err) {
        console.error('Failed to load credit profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCreditProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const res = await apiFetch('/risk/credit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setCreditRisk(res.creditRisk);
    } catch (err) {
      alert(err.message || 'Failed to evaluate credit risk');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Credit Risk Model...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-500" />
            Credit Risk & Underwriting Module
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent logistic regression educational scoring model for loan creditworthiness evaluation.
          </p>
        </div>
      </div>

      {/* Educational Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-3">
        <Info className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white block">Educational Model Disclaimer</span>
          <span>
            This module provides an educational credit-scoring simulation using documented mathematical logistic regression. It does not represent an official FICO or credit bureau score.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Parameters Input Form */}
        <div className="lg:col-span-2 opaque-card">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-500" />
            Underwriting Inputs & Borrowing Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Income ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Existing Outstanding Debt ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.existingDebt}
                  onChange={(e) => setFormData({ ...formData, existingDebt: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Loan Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Credit History Length (Months)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.creditHistoryMonths}
                  onChange={(e) => setFormData({ ...formData, creditHistoryMonths: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment History Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.paymentHistoryScore}
                  onChange={(e) => setFormData({ ...formData, paymentHistoryScore: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recent Missed Payments Count</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.missedPayments}
                  onChange={(e) => setFormData({ ...formData, missedPayments: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={evaluating}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                {evaluating ? 'Evaluating Model...' : 'Calculate Credit Score'}
              </button>
            </div>
          </form>
        </div>

        {/* Credit Risk Scorecard Output */}
        <div className="opaque-card space-y-4 p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            Model Evaluation Output
          </h2>

          <div className="text-center py-6 bg-[#EDF2F7] dark:bg-[#0B0F17] rounded-2xl border border-[#CBD5E1] dark:border-slate-800 opacity-100 space-y-2">
            <span className="text-6xl font-extrabold text-[#0F172A] dark:text-white font-mono tabular-nums block">
              {creditRisk?.creditScore}
            </span>
            <span className="text-xs font-bold text-[#475569] dark:text-slate-400 block">Scale 300 - 850</span>

            <div className="pt-2 flex justify-center">
              <RiskBadge level={creditRisk?.tier || creditRisk?.riskLevel || 'Good'} />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 px-4">
              <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Probability of Default</span>
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">{creditRisk?.probDefault}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">💡 Statistical default probability estimate</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {creditRisk?.summary}
          </p>

          {/* Driving Factors */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Driving Factors Breakdown:</span>
            {creditRisk?.drivingFactors?.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{f.factor}</span>
                  <span className={`font-extrabold ${f.impact === 'Positive' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {f.impact}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400">{f.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
