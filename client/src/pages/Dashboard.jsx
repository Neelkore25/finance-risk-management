import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiClient';
import { RiskBadge } from '../components/RiskBadge';
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function Dashboard() {
  const [personalRisk, setPersonalRisk] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [creditRisk, setCreditRisk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [pRiskRes, portRiskRes, credRiskRes, alertRes, histRes] = await Promise.all([
          apiFetch('/risk/personal'),
          apiFetch('/risk/portfolio'),
          apiFetch('/risk/credit'),
          apiFetch('/alerts'),
          apiFetch('/risk/history')
        ]);

        setPersonalRisk(pRiskRes.assessment);
        setPortfolioRisk(portRiskRes.portfolioRisk);
        setCreditRisk(credRiskRes.creditRisk);
        setAlerts(alertRes.alerts || []);
        setHistory(histRes.history || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin text-sky-500" />
          Evaluating Risk Engine Models...
        </div>
      </div>
    );
  }

  const { overallScore, overallLevel, overallSummary, metrics, categories } = personalRisk || {};

  // Compute Top 3 Financial Risks dynamically from highest category scores
  const topRisks = Object.entries(categories || {})
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Income vs Expenses Chart Data
  const incExpData = [
    { name: 'Income', amount: metrics?.monthlyIncome || 0 },
    { name: 'Essential Exp', amount: metrics?.essentialExp || 0 },
    { name: 'Discretionary', amount: metrics?.discretionaryExp || 0 },
    { name: 'Debt Service', amount: metrics?.totalDebtPayment || 0 },
    { name: 'Net Surplus', amount: Math.max(0, metrics?.netCashFlow || 0) }
  ];

  // Investment Sector Allocation Chart Data
  const sectorData = portfolioRisk?.heatmap?.bySector || [];

  // Risk Score History Chart Data
  const historyData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: h.overall_score
  }));

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE SUMMARY TOP CARD */}
      <div className="opaque-card bg-slate-900 border-slate-800 text-white relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-sky-400 stroke-[2.5]" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Overall Financial Risk Score
                </span>
                <h1 className="text-3xl font-extrabold flex items-center gap-3">
                  <span>{overallScore} / 100</span>
                  <RiskBadge level={overallLevel} />
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {overallSummary}
            </p>
            <p className="text-[11px] text-slate-400">
              Last Evaluated: {new Date().toLocaleDateString()} • Powered by RiskGuard Deterministic Engine
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3 w-full lg:w-auto">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-w-[160px]">
              <span className="text-[11px] text-slate-400 font-semibold block">Monthly Cash Flow</span>
              <span className={`text-lg font-bold flex items-center gap-1 ${metrics?.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics?.netCashFlow >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                ${Math.abs(metrics?.netCashFlow || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-w-[160px]">
              <span className="text-[11px] text-slate-400 font-semibold block">Emergency Reserve</span>
              <span className="text-lg font-bold text-sky-400">
                {metrics?.emergencyCoverageMonths || 0} Months
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ALERTS BAR */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold opacity-100 ${
                alert.severity === 'Critical'
                  ? 'bg-rose-950 text-rose-200 border-rose-800'
                  : alert.severity === 'Warning'
                  ? 'bg-amber-950 text-amber-200 border-amber-800'
                  : 'bg-sky-950 text-sky-200 border-sky-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-extrabold block">{alert.title}</span>
                  <span className="opacity-90">{alert.message}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-current opacity-80">
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. KEY METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Monthly Income</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">${metrics?.monthlyIncome?.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">
            Savings Rate: {metrics?.savingsRate}%
          </span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Total Monthly Expenses</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">${metrics?.totalMonthlyExpenses?.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Essential: ${metrics?.essentialExp?.toLocaleString()}
          </span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Debt-to-Income (DTI)</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics?.dtiRatio}%</span>
          <span className={`text-[11px] font-semibold block mt-1 ${metrics?.dtiRatio > 36 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {metrics?.dtiRatio > 36 ? 'High Debt Burden' : 'Healthy DTI Ratio'}
          </span>
        </div>

        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Liquid Savings Buffer</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics?.liquidCoverageMonths} Mos</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Total Savings: ${metrics?.existingSavings?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4. QUANTITATIVE PORTFOLIO & CREDIT WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Quantitative Widget */}
        <div className="lg:col-span-2 opaque-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-sky-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quantitative Portfolio Risk Metrics</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Synthetic Market Models</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Portfolio Value</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">${portfolioRisk?.totalValue?.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Historical VaR (95%)</span>
              <span className="text-sm font-bold text-rose-500">
                ${portfolioRisk?.metrics?.historicalVaR1DayAmount?.toLocaleString()} ({portfolioRisk?.metrics?.historicalVaR1DayPct}%)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Sharpe Ratio</span>
              <span className="text-sm font-bold text-emerald-500">{portfolioRisk?.metrics?.sharpeRatio}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Max Drawdown</span>
              <span className="text-sm font-bold text-amber-500">{portfolioRisk?.metrics?.maxDrawdownPct}%</span>
            </div>
          </div>
        </div>

        {/* Credit Risk Widget */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Credit Risk Score</h2>
            </div>
            <span className="text-[11px] text-slate-500">Logistic Model</span>
          </div>

          <div className="text-center py-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{creditRisk?.creditScore || 720}</span>
            <div className="mt-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Tier: {creditRisk?.tier || 'Good'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Default Risk Probability: <span className="font-bold text-slate-800 dark:text-slate-200">{creditRisk?.probDefault}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* 5. TOP 3 FINANCIAL RISKS SECTION */}
      <div className="opaque-card">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-500" />
          Top 3 Identified Financial Risk Drivers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRisks.map((risk, index) => (
            <div key={risk.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 opacity-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">#{index + 1} Driver</span>
                <RiskBadge level={risk.level} score={risk.score} />
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                {risk.key.replace(/([A-Z])/g, ' $1')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {risk.explanation}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 block">Recommended Action:</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{risk.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. INTERACTIVE CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Cash Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incExpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation Breakdown */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Sector Allocation</h2>
          <div className="h-64">
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="percentage" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                No investment sector holdings recorded yet. Add holdings in Portfolio page.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
