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
  Layers
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

export function Dashboard() {
  const [personalRisk, setPersonalRisk] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [creditRisk, setCreditRisk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(getSavedSettings);
  const [dateRange, setDateRange] = useState('May 01, 2025 - May 31, 2025');

  async function loadDashboardData() {
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
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin text-blue-500" />
          Loading Portfolio Risk Intelligence Engine...
        </div>
      </div>
    );
  }

  const { overallScore, overallLevel, metrics } = personalRisk || {};

  // Donut Risk Distribution Data
  const donutData = [
    { name: 'Low Risk (0-40)', value: 3647, color: '#10B981', percentage: '28.4%' },
    { name: 'Medium Risk (41-70)', value: 5997, color: '#2563EB', percentage: '46.7%' },
    { name: 'High Risk (71-100)', value: 3198, color: '#EF4444', percentage: '24.9%' }
  ];

  // Risk Trend Over Time Data
  const trendData = [
    { month: 'Jan', score: 32 },
    { month: 'Feb', score: 51 },
    { month: 'Mar', score: 68 },
    { month: 'Apr', score: 84 },
    { month: 'May', score: 68.4 }
  ];

  // Default Rate by Segment Bar Chart Data
  const defaultRateSegmentData = [
    { segment: 'Self Employed', rate: 5.4 },
    { segment: 'Small Business', rate: 3.8 },
    { segment: 'Salaried', rate: 2.4 },
    { segment: 'Students', rate: 1.8 }
  ];

  // Top Risky Segments
  const riskySegments = [
    { name: 'Self Employed', score: 72.4, color: '#EF4444' },
    { name: 'Small Business', score: 68.7, color: '#F59E0B' },
    { name: 'Salaried', score: 58.3, color: '#2563EB' },
    { name: 'Students', score: 42.1, color: '#10B981' }
  ];

  // Recent Predictions Table Data
  const recentPredictions = [
    { id: 'CUST001', score: 82, level: 'High Risk', prediction: 'Default', isDefault: true },
    { id: 'CUST002', score: 45, level: 'Medium Risk', prediction: 'No Default', isDefault: false },
    { id: 'CUST003', score: 23, level: 'Low Risk', prediction: 'No Default', isDefault: false },
    { id: 'CUST004', score: 67, level: 'Medium Risk', prediction: 'No Default', isDefault: false },
    { id: 'CUST005', score: 91, level: 'High Risk', prediction: 'Default', isDefault: true }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Dashboard Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time insights into your portfolio risk</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0D1724] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
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

      {/* 2. TOP ROW: 4 KPI CARDS (Matching Reference Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Loan Accounts */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Loan Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-display tabular-nums">12,842</span>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ 12.5% from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Loan Amount */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Loan Amount</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-display tabular-nums">
              {formatCurrency(metrics?.totalValue || 256800000)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ 15.8% from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Risk Score */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Risk Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-display tabular-nums">
              {overallScore || '68.4'} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ 5.3% from last month</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Default Rate */}
        <div className="fintech-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Default Rate</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-display tabular-nums">3.24%</span>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>↓ -0.6% from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ROW 2: DONUT RISK DISTRIBUTION & LINE RISK TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Score Distribution (Donut Chart) */}
        <div className="lg:col-span-5 fintech-card space-y-4">
          <h2 className="text-sm font-bold text-white font-display">Risk Score Distribution</h2>
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
                  contentStyle={{ backgroundColor: '#162335', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white font-display">12,842</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-semibold">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.percentage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend Over Time (Line Chart) */}
        <div className="lg:col-span-7 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">Risk Trend Over Time</h2>
            <span className="text-xs text-slate-400 font-semibold px-2.5 py-1 bg-[#162335] rounded-lg border border-white/10">Monthly</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#162335', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
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
          </div>
        </div>
      </div>

      {/* 4. ROW 3: TOP RISKY SEGMENTS, DEFAULT RATE BY SEGMENT & RECENT PREDICTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Risky Segments */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <h2 className="text-sm font-bold text-white font-display">Top Risky Segments</h2>
          <div className="space-y-4 pt-1">
            {riskySegments.map((seg) => (
              <div key={seg.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{seg.name}</span>
                  <span className="font-extrabold text-white">{seg.score}</span>
                </div>
                <div className="w-full bg-[#162335] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${seg.score}%`, backgroundColor: seg.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Default Rate by Segment */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <h2 className="text-sm font-bold text-white font-display">Default Rate by Segment</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultRateSegmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="segment" stroke="#94A3B8" fontSize={9} interval={0} />
                <YAxis stroke="#94A3B8" fontSize={10} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#162335', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="rate" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <div className="lg:col-span-4 fintech-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">Recent Predictions</h2>
            <Link to="/credit-risk" className="text-xs text-blue-400 hover:underline font-semibold">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="pb-2">Customer ID</th>
                  <th className="pb-2 text-center">Score</th>
                  <th className="pb-2 text-center">Level</th>
                  <th className="pb-2 text-right">Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                {recentPredictions.map((row) => (
                  <tr key={row.id} className="hover:bg-[#162335]/50 transition-colors">
                    <td className="py-2.5 font-bold text-white">{row.id}</td>
                    <td className="py-2.5 text-center font-mono font-bold">{row.score}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.level === 'High Risk'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : row.level === 'Medium Risk'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {row.level}
                      </span>
                    </td>
                    <td className={`py-2.5 text-right font-bold ${row.isDefault ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {row.prediction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
