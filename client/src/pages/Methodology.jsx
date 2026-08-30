import React from 'react';
import { BookOpen, PieChart, Activity } from 'lucide-react';

export function Methodology() {
  return (
    <div className="space-y-6 font-sans">
      <div className="opaque-card bg-[#F8FAFC] dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#1F2937] text-[#0F172A] dark:text-white space-y-2 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#2563EB] dark:text-[#0EA5E9]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">Quantitative Risk Methodology & Mathematical Framework</h1>
            <p className="text-xs text-[#475569] dark:text-[#9CA3AF] mt-1 font-medium">
              Statistical Models, Personal Financial Ratios, Value at Risk (VaR), and Stochastic Engine Specifications
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Financial Ratios */}
        <div className="opaque-card space-y-4 p-6">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Core Personal Risk Formulations (INR ₹)
          </h2>
          <ul className="space-y-3 text-xs text-[#475569] dark:text-slate-300">
            <li className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">1. Debt-to-Income (DTI) Ratio</span>
              <p className="font-mono text-[#2563EB] dark:text-[#0EA5E9] text-[11px] tabular-nums">DTI = (Monthly Debt Payments / Monthly Net Income) × 100</p>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">Percentage of monthly income committed to debt EMIs. Target: ≤ 36%.</p>
            </li>
            <li className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">2. Net Monthly Cash Flow</span>
              <p className="font-mono text-[#2563EB] dark:text-[#0EA5E9] text-[11px] tabular-nums">Net Cash Flow = Net Income - Total Expenses - Monthly Debt Payments</p>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">Surplus cash available for savings or investments after meeting all obligations.</p>
            </li>
            <li className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">3. Savings Rate</span>
              <p className="font-mono text-[#2563EB] dark:text-[#0EA5E9] text-[11px] tabular-nums">Savings Rate = (Net Cash Flow / Monthly Net Income) × 100</p>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">Target: ≥ 20% of net monthly income allocated to savings/investments.</p>
            </li>
            <li className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">4. Emergency Reserve Coverage</span>
              <p className="font-mono text-[#2563EB] dark:text-[#0EA5E9] text-[11px] tabular-nums">Coverage = Emergency Fund / Essential Monthly Expenses</p>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">Target: 3 to 6 months of essential living expenses reserved in liquid cash.</p>
            </li>
          </ul>
        </div>

        {/* Quantitative VaR, Sharpe Ratio & Stochastic Models */}
        <div className="opaque-card space-y-4 p-6">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2563EB] dark:text-[#0EA5E9]" />
            Quantitative VaR, Sharpe Ratio & Stochastic Models
          </h2>
          <div className="space-y-3 text-xs text-[#475569] dark:text-slate-300">
            <div className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">1. Sharpe Ratio Formulation & Assumptions</span>
              <p className="font-mono text-[#2563EB] dark:text-[#0EA5E9] text-[11px] tabular-nums">Sharpe Ratio = (Expected Portfolio Return - Risk-Free Rate) / Annualized Volatility</p>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">
                <strong>Assumed Baseline Parameters:</strong> Risk-free rate is assumed at 5.5% (approx. Indian 10-Year G-Sec sovereign yield). Baseline expected asset class returns are modeled assumptions (Crypto: 18%, Equities/Stocks: 12%, Real Estate/Gold: 9%, Bonds: 6%, Cash/FDs: 5%) used for deterministic portfolio risk modeling.
              </p>
            </div>
            <div className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">2. Value at Risk (VaR 95% / 99%) & CVaR</span>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">
                Quantifies maximum expected portfolio loss over a 1-day or 10-day time horizon at 95% or 99% confidence level. Conditional VaR (Expected Shortfall) computes the average tail loss beyond the VaR threshold.
              </p>
            </div>
            <div className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">3. Geometric Brownian Motion (GBM) Monte Carlo Engine</span>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">
                Runs 1,000+ stochastic simulated trajectories using client-side Box-Muller Gaussian normal drift and volatility steps to compute outcome percentiles (P5, P25, P50, P75, P95) and probability of principal loss.
              </p>
            </div>
            <div className="p-3 bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-extrabold text-[#0F172A] dark:text-white block">4. Logistic Regression Default Risk Model</span>
              <p className="text-[#475569] dark:text-slate-400 text-[11px]">
                Transparent logistic regression classifier mapping income, DTI ratio, debt burden, credit longevity, and payment scores to standard credit scores (300-850) and default probabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
