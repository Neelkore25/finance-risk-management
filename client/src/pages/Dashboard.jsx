import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getSavedSettings, formatCurrency } from '../services/apiClient';
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
  CreditCard,
  User,
  Receipt,
  Landmark,
  Briefcase,
  Sliders,
  Calendar,
  Download,
  Users,
  Layers,
  Wallet
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
  CartesianGrid
} from 'recharts';

import { useAuth } from '../context/AuthContext';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 font-sans select-none pointer-events-none">
      {/* 1. TOP HEADER SECTION SKELETON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="h-3.5 w-64 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-36 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* 2. 4 TOP METRIC CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Solvency Risk', sub: 'Composite multi-factor index' },
          { label: 'Monthly Net Cash Flow', sub: 'Surplus after living & debt' },
          { label: 'Debt Burden & EMI', sub: 'Monthly debt service ratio' },
          { label: '1-Day Portfolio VaR', sub: '95% parametric confidence' }
        ].map((card, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#0D1724] border border-slate-200 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</span>
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 animate-pulse" />
            </div>
            <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            <div className="h-3 w-40 bg-slate-200 dark:bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* 3. ROW 2: 2 MAIN CHART CARDS SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0D1724] border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-4 w-44 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-56 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-white/5 animate-pulse" />
          </div>
        </div>
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0D1724] border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-56 flex items-end justify-between gap-3 px-4 pb-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-full bg-slate-200 dark:bg-white/5 rounded-t-lg animate-pulse"
                style={{ height: `${30 + (i % 4) * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. ROW 3: 3 BOTTOM CARDS SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#0D1724] border border-slate-200 dark:border-white/10 space-y-3 shadow-sm">
            <div className="h-4 w-36 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="space-y-2.5 pt-2">
              <div className="h-12 w-full bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [personalRisk, setPersonalRisk] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [creditRisk, setCreditRisk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(getSavedSettings);

  async function loadDashboardData() {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const activeSettings = getSavedSettings();
      setSettings(activeSettings);

      const [pRiskRes, portRiskRes, credRiskRes, alertRes, histRes] = await Promise.all([
        apiFetch('/risk/personal'),
        apiFetch(`/risk/portfolio?confidence=${(activeSettings.varConfidence || 95) / 100}`),
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

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }

    window.addEventListener('profileUpdated', loadDashboardData);
    window.addEventListener('expensesUpdated', loadDashboardData);
    window.addEventListener('debtUpdated', loadDashboardData);
    window.addEventListener('portfolioUpdated', loadDashboardData);
    window.addEventListener('settingsUpdated', loadDashboardData);
    return () => {
      window.removeEventListener('profileUpdated', loadDashboardData);
      window.removeEventListener('expensesUpdated', loadDashboardData);
      window.removeEventListener('debtUpdated', loadDashboardData);
      window.removeEventListener('portfolioUpdated', loadDashboardData);
      window.removeEventListener('settingsUpdated', loadDashboardData);
    };
  }, [user]);

  if (!user || loading) {
    return <DashboardSkeleton />;
  }

  const { overallScore, overallLevel, metrics, categories, overallSummary } = personalRisk || {};

  // Real Risk Category Breakdown for Donut Chart
  const categoryLabels = {
    debtRisk: 'Debt Burden (25%)',
    cashFlowRisk: 'Cash Flow (25%)',
    emergencyFundRisk: 'Emergency Fund (20%)',
    liquidityRisk: 'Liquidity Buffer (15%)',
    investmentConcentrationRisk: 'Concentration (15%)'
  };

  const donutData = Object.entries(categories || {}).map(([key, cat]) => {
    let color = '#10B981'; // Green
    if (cat.score > 50) color = '#EF4444'; // Red
    else if (cat.score > 25) color = '#F59E0B'; // Amber

    return {
      name: categoryLabels[key] || key.replace(/([A-Z])/g, ' $1'),
      score: cat.score,
      value: Math.max(5, cat.score),
      color
    };
  });

  // Top Identified Risk Drivers
  const topRisks = Object.entries(categories || {})
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Real Monthly Cash Flow Breakdown Bar Chart Data
  const cashBreakdownData = [
    { name: 'Income', amount: metrics?.monthlyIncome || 0 },
    { name: 'Essential', amount: metrics?.essentialExp || 0 },
    { name: 'Discretionary', amount: metrics?.discretionaryExp || 0 },
    { name: 'Debt EMI', amount: metrics?.totalDebtPayment || 0 },
    { name: 'Net Surplus', amount: Math.max(0, metrics?.netCashFlow || 0) }
  ];

  // Real Risk Trend Line Chart Data from History Snapshots
  const trendData = (history || []).map((h, i) => ({
    month: h.recorded_at ? new Date(h.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Snapshot ${i + 1}`,
    score: h.overall_score || h.score || 0
  }));

  const totalAssets = (portfolioRisk?.totalValue || 0) + (metrics?.existingSavings || 0) + (metrics?.emergencyFund || 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time risk assessment & portfolio intelligence</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0D1724] border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Evaluated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <Link
            to="/reports"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-colors flex items-center gap-2 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </Link>
        </div>
      </div>

      {/* 2. REAL DYNAMIC ALERTS BAR (Gated by Settings Toggles) */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold transition-all ${
                alert.severity === 'Critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800/80 shadow-lg dark:shadow-rose-950/20'
                  : alert.severity === 'Warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/80 shadow-lg dark:shadow-amber-950/20'
                  : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-current" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">{alert.title}</span>
                  <span className="opacity-90">{alert.message}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border border-current opacity-80 shrink-0">
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. TOP ROW: 4 REAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Liquid & Portfolio Assets */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Liquid & Asset Value</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tabular-nums">
              {formatCurrency(totalAssets)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Savings & Investment Holdings</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Monthly Net Cash Flow */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Net Cash Flow</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tabular-nums ${
              (metrics?.netCashFlow || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(metrics?.netCashFlow || 0)}
            </span>
            <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${
              (metrics?.netCashFlow || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {(metrics?.netCashFlow || 0) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>Savings Rate: {metrics?.savingsRate || 0}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Financial Risk Score */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Risk Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tabular-nums">
                {overallScore || 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ 100</span>
              </span>
              <RiskBadge level={overallLevel || 'Low Risk'} />
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{overallSummary || 'Multi-factor risk evaluation active'}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Debt-to-Income (DTI) Ratio */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Debt-to-Income (DTI)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tabular-nums">
              {metrics?.dtiRatio || 0}%
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Target limit: ≤{settings.dtiLimit || 36}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: REAL RISK CATEGORY DISTRIBUTION & LINE RISK TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Score Category Breakdown (Donut Chart) */}
        <div className="lg:col-span-5 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Risk Category Breakdown</h2>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 bg-slate-100 dark:bg-[#162335] rounded-lg border border-slate-200 dark:border-white/10">0-100 Scale</span>
          </div>

          <div className="h-60 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => [`Score: ${item.payload.score}/100`, item.payload.name]}
                  contentStyle={{ backgroundColor: '#111D2B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">{overallScore || 0}</span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Overall Risk</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{item.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend Over Time (Line Chart) */}
        <div className="lg:col-span-7 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Risk Score Trend Over Time</h2>
            <Link to="/risk-history" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">View History</Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            {trendData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111D2B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 space-y-2">
                <Activity className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Historical Snapshot Log</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Historical trends appear as monthly risk snapshots are recorded. Current baseline assessment is <strong>{overallScore || 0}/100</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. ROW 3: REAL TOP RISK DRIVERS, CASH BREAKDOWN & CREDIT UNDERWRITING SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Financial Risk Drivers */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Top Identified Risk Drivers</h2>
            <Link to="/risk-analysis" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">Deep Dive</Link>
          </div>
          <div className="space-y-3.5 pt-1">
            {topRisks.map((risk, index) => (
              <div key={risk.key} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1724] border border-slate-200 dark:border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    #{index + 1} {risk.key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <RiskBadge level={risk.level} score={risk.score} />
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#162335] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      risk.score > 50 ? 'bg-rose-500' : risk.score > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, risk.score))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight pt-0.5">{risk.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Cash Breakdown */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Monthly Cash Breakdown</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} interval={0} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Amount']}
                  contentStyle={{ backgroundColor: '#111D2B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Risk & Underwriting Summary */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Credit Risk Assessment</h2>
            <Link to="/credit-risk" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">Underwrite</Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0D1724] border border-slate-200 dark:border-white/5 text-center space-y-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums block">
              {creditRisk?.creditScore || 720}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Scale: 300 - 850 (FICO Standard)</span>
            <div className="flex items-center justify-center gap-2 pt-1">
              <RiskBadge level={creditRisk?.tier || 'Good'} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Default Probability: <span className="font-bold text-rose-600 dark:text-rose-400">{creditRisk?.probDefault || 8.0}%</span>
            </p>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
            <span className="font-bold text-slate-900 dark:text-white block">Key Underwriting Factor:</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {creditRisk?.summary || 'Multi-factor logistic regression default prediction active.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
