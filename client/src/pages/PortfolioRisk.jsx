import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { PieChart, ShieldAlert, Info, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

export function PortfolioRisk() {
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [confidence, setConfidence] = useState(0.95);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolioRisk();
  }, [confidence]);

  async function loadPortfolioRisk() {
    setLoading(true);
    try {
      const res = await apiFetch(`/risk/portfolio?confidence=${confidence}`);
      setPortfolioRisk(res.portfolioRisk);
    } catch (err) {
      console.error('Failed to load portfolio risk:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Computing Quantitative Portfolio Risk Models...</div>;
  }

  const { metrics, heatmap, totalValue } = portfolioRisk || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-sky-500" />
            Quantitative Portfolio Risk & VaR Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical Value at Risk (VaR), Expected Shortfall (CVaR), Sharpe Ratio, Beta, and Asset Heatmap.
          </p>
        </div>

        {/* Confidence Level Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 px-2">Confidence:</span>
          <button
            onClick={() => setConfidence(0.95)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              confidence === 0.95
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            95% Confidence
          </button>
          <button
            onClick={() => setConfidence(0.99)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              confidence === 0.99
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            99% Confidence
          </button>
        </div>
      </div>

      {/* Synthetic Data Label Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-3 opacity-100">
        <Info className="w-5 h-5 text-sky-400 shrink-0" />
        <div>
          <span className="font-extrabold text-white block">Synthetic Market Return Model</span>
          <span>
            Quantitative metrics are derived using synthetic asset return covariance vectors locally calculated over 252 trading days. Clearly labeled for demonstration & educational analysis.
          </span>
        </div>
      </div>

      {/* Primary VaR & CVaR Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="opaque-card space-y-2 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-500 block">Historical VaR (1-Day {confidence * 100}%)</span>
          <span className="text-2xl font-extrabold text-rose-500">${metrics?.historicalVaR1DayAmount?.toLocaleString()}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {metrics?.historicalVaR1DayPct}% maximum expected daily portfolio loss under normal market conditions.
          </p>
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
            Formula: 5th/1st percentile of sorted daily return loss distribution.
          </p>
        </div>

        <div className="opaque-card space-y-2 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 block">Parametric VaR (1-Day {confidence * 100}%)</span>
          <span className="text-2xl font-extrabold text-amber-500">${metrics?.parametricVaR1DayAmount?.toLocaleString()}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {metrics?.parametricVaR1DayPct}% loss derived under normal return distribution assumption.
          </p>
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
            Formula: (Mean Return − z · StdDev) × Portfolio Value.
          </p>
        </div>

        <div className="opaque-card space-y-2 border-l-4 border-l-purple-500">
          <span className="text-xs font-semibold text-slate-500 block">CVaR / Expected Shortfall</span>
          <span className="text-2xl font-extrabold text-purple-500">${metrics?.cvar1DayAmount?.toLocaleString()}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {metrics?.cvar1DayPct}% average loss when tail loss exceeds the VaR threshold.
          </p>
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
            Formula: Mean of all portfolio losses exceeding VaR threshold.
          </p>
        </div>
      </div>

      {/* Secondary Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Sharpe Ratio</span>
          <span className="text-xl font-extrabold text-emerald-500">{metrics?.sharpeRatio}</span>
          <span className="text-[10px] text-slate-400 block mt-1">(Annual Return − 4.0% Risk Free) / Volatility</span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Portfolio Beta</span>
          <span className="text-xl font-extrabold text-sky-500">{metrics?.beta}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Sensitivity relative to S&P benchmark</span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Annual Volatility</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics?.annualizedVol}%</span>
          <span className="text-[10px] text-slate-400 block mt-1">Annualized Standard Deviation</span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Maximum Drawdown</span>
          <span className="text-xl font-extrabold text-rose-500">{metrics?.maxDrawdownPct}%</span>
          <span className="text-[10px] text-slate-400 block mt-1">Largest peak-to-trough drop</span>
        </div>
      </div>

      {/* RISK HEATMAP (BY ASSET CLASS & SECTOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap by Asset Class */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Risk Heatmap: Asset Class</span>
            <span className="text-xs font-normal text-slate-500">Color + Value</span>
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {heatmap?.byAssetClass?.map((item) => (
              <div
                key={item.name}
                className={`p-3 rounded-xl border flex items-center justify-between opacity-100 ${
                  item.riskColor === 'red'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : item.riskColor === 'yellow'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-[11px] opacity-80">{item.count} Asset(s) • ${item.exposure.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold block">{item.percentage}%</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 border border-current">
                    {item.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap by Sector */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Risk Heatmap: Sector Breakdown</span>
            <span className="text-xs font-normal text-slate-500">Color + Value</span>
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {heatmap?.bySector?.map((item) => (
              <div
                key={item.name}
                className={`p-3 rounded-xl border flex items-center justify-between opacity-100 ${
                  item.riskColor === 'red'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : item.riskColor === 'yellow'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-[11px] opacity-80">{item.count} Asset(s) • ${item.exposure.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold block">{item.percentage}%</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 border border-current">
                    {item.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
