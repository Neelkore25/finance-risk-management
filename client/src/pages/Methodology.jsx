import React from 'react';
import { BookOpen, ShieldAlert, PieChart, Activity, Sliders, CheckCircle } from 'lucide-react';

export function Methodology() {
  return (
    <div className="space-y-6">
      <div className="opaque-card bg-slate-900 border-slate-800 text-white space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-sky-400" />
          <div>
            <h1 className="text-2xl font-extrabold">Educational Methodology & Risk Framework</h1>
            <p className="text-xs text-slate-400">
              Quantitative Models, Financial Ratios, Value at Risk (VaR), and Academic Disclaimers
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Financial Ratios */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Core Personal Risk Ratios (INR ₹)
          </h2>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">1. Debt-to-Income (DTI) Ratio</span>
              <p className="font-mono text-sky-400 text-[11px]">DTI = (Monthly Debt Payments / Monthly Net Income) × 100</p>
              <p className="text-slate-400 text-[11px]">Measures percentage of income committed to loan EMIs. Target: ≤ 36%.</p>
            </li>
            <li className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">2. Net Monthly Cash Flow</span>
              <p className="font-mono text-sky-400 text-[11px]">Net Cash Flow = Net Income - Total Expenses - Monthly Debt Payments</p>
              <p className="text-slate-400 text-[11px]">Surplus available for savings or investments after meeting all obligations.</p>
            </li>
            <li className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">3. Savings Rate</span>
              <p className="font-mono text-sky-400 text-[11px]">Savings Rate = (Net Cash Flow / Monthly Net Income) × 100</p>
              <p className="text-slate-400 text-[11px]">Target: ≥ 20% of net monthly income allocated to savings/investments.</p>
            </li>
            <li className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">4. Emergency Reserve Coverage</span>
              <p className="font-mono text-sky-400 text-[11px]">Coverage = Emergency Fund / Essential Monthly Expenses</p>
              <p className="text-slate-400 text-[11px]">Target: 3 to 6 months of essential living expenses reserved in liquid cash.</p>
            </li>
          </ul>
        </div>

        {/* Quantitative VaR & Credit ML */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Quantitative VaR & Credit Machine Learning
          </h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">Value at Risk (VaR 95% / 99%)</span>
              <p className="text-slate-400 text-[11px]">
                Quantifies maximum expected portfolio loss over a 1-day or 10-day time horizon at a given confidence level using historical market volatility vectors.
              </p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-white block">Logistic Regression Default ML Model</span>
              <p className="text-slate-400 text-[11px]">
                Scikit-Learn Logistic Regression binary classifier evaluating borrower default probability based on income, DTI ratio, debt burden, and savings reserves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers & Project Limitations */}
      <div className="opaque-card bg-slate-900 border-slate-800 text-white space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          Academic Project Limitations & Educational Disclaimer
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          This web application is developed solely for educational and analytical academic demonstration purposes. All calculated risk scores, Value at Risk (VaR) figures, and credit default probabilities are simulated model estimates. They must NOT be treated as regulated credit scores, formal lending decisions, or professional financial advice.
        </p>
      </div>
    </div>
  );
}
