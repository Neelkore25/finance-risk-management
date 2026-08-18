import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { RiskBadge } from '../components/RiskBadge';
import { Activity, Info, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';

export function RiskAnalysis() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRiskAssessment() {
      try {
        const res = await apiFetch('/risk/personal');
        setAssessment(res.assessment);
      } catch (err) {
        console.error('Failed to load risk analysis:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRiskAssessment();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Personal Risk Analysis Models...</div>;
  }

  const { overallScore, overallLevel, overallSummary, categories } = assessment || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-500" />
            Explainable Risk Score Decomposition
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent mathematical evaluation breakdown answering: "Why is my overall risk score {overallScore}?"
          </p>
        </div>
      </div>

      {/* Overview Score Explanation Header */}
      <div className="opaque-card bg-slate-900 text-white border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Aggregate Composite Risk Score</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-extrabold">{overallScore} / 100</span>
              <RiskBadge level={overallLevel} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">Deterministic Weighting Model</span>
            <span className="text-[11px] text-sky-400">Debt (25%) + Liquidity (20%) + Emergency (20%) + Cash Flow (20%) + Concentration (10%) + Goals (5%)</span>
          </div>
        </div>
        <p className="text-xs text-slate-300 border-t border-slate-800 pt-3">
          {overallSummary}
        </p>
      </div>

      {/* 6 Category Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(categories || {}).map(([key, cat]) => (
          <div key={key} className="opaque-card space-y-3 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Weight: {cat.weight} • Impact: +{cat.impact.toFixed(1)} pts
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </h3>
                </div>
                <RiskBadge level={cat.level} score={cat.score} />
              </div>

              <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Active Metric Value:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{cat.metric}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Explanation & Cause:</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{cat.explanation}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 block mb-0.5">Recommended Mitigation Action:</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{cat.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
