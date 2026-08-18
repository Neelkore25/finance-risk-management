import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function RiskHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiFetch('/risk/history');
        setHistory(res.history || []);
      } catch (err) {
        console.error('Failed to load risk history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Risk Assessment Log...</div>;
  }

  const chartData = history.map(item => ({
    date: new Date(item.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: item.overall_score
  }));

  // Determine trend status from last two entries
  let trendStatus = 'Stable';
  let trendIcon = <Minus className="w-4 h-4 text-slate-400" />;

  if (history.length >= 2) {
    const latest = history[history.length - 1].overall_score;
    const previous = history[history.length - 2].overall_score;
    if (latest < previous) {
      trendStatus = 'Improving (Risk Score Decreasing)';
      trendIcon = <TrendingDown className="w-4 h-4 text-emerald-500" />;
    } else if (latest > previous) {
      trendStatus = 'Deteriorating (Risk Score Increasing)';
      trendIcon = <TrendingUp className="w-4 h-4 text-rose-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-sky-500" />
            Risk Assessment History & Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit log of calculated historical financial risk scores over time.
          </p>
        </div>
      </div>

      {/* Trend Status Card */}
      <div className="opaque-card flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">Current Trajectory Trend</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            {trendIcon}
            {trendStatus}
          </span>
        </div>
        <span className="text-xs text-slate-400">Total Recorded Snapshots: {history.length}</span>
      </div>

      {/* Line Chart */}
      <div className="opaque-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Historical Risk Score Trajectory</h2>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#0284c7' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">No historical risk snapshots logged yet.</div>
          )}
        </div>
      </div>

      {/* History Log Table */}
      <div className="opaque-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Historical Assessment Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Assessment Date</th>
                <th className="p-3 text-center">Overall Score</th>
                <th className="p-3 text-center">Debt Risk</th>
                <th className="p-3 text-center">Liquidity Risk</th>
                <th className="p-3 text-center">Emergency Risk</th>
                <th className="p-3 text-center">Cash Flow Risk</th>
                <th className="p-3 text-center">Concentration Risk</th>
                <th className="p-3 text-center">Goal Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {new Date(item.recorded_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-center font-extrabold text-sky-500">{item.overall_score}</td>
                  <td className="p-3 text-center">{item.debt_risk}</td>
                  <td className="p-3 text-center">{item.liquidity_risk}</td>
                  <td className="p-3 text-center">{item.emergency_fund_risk}</td>
                  <td className="p-3 text-center">{item.cash_flow_risk}</td>
                  <td className="p-3 text-center">{item.investment_concentration_risk}</td>
                  <td className="p-3 text-center">{item.goal_risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
