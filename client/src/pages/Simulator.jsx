import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { RiskBadge } from '../components/RiskBadge';
import { Sliders, Activity, ArrowRight, Play, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export function Simulator() {
  const [activeTab, setActiveTab] = useState('whatif'); // 'whatif' | 'montecarlo'

  // What-If State
  const [whatIfInputs, setWhatIfInputs] = useState({
    incomeChangePct: 0,
    expenseChangePct: 0,
    additionalSavings: 0,
    additionalDebt: 0,
    emergencySavingsChange: 0
  });

  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Monte Carlo State
  const [mcInputs, setMcInputs] = useState({
    numSimulations: 1000,
    horizonMonths: 12,
    initialValue: 25000,
    monthlyContribution: 500
  });

  const [mcResult, setMcResult] = useState(null);
  const [runningMc, setRunningMc] = useState(false);

  useEffect(() => {
    runWhatIfSimulation();
    runMonteCarlo();
  }, []);

  async function runWhatIfSimulation() {
    setSimulating(true);
    try {
      const res = await apiFetch('/simulator/what-if', {
        method: 'POST',
        body: JSON.stringify(whatIfInputs)
      });
      setSimResult(res);
    } catch (err) {
      console.error('Failed to run what-if simulation:', err);
    } finally {
      setSimulating(false);
    }
  }

  async function runMonteCarlo() {
    setRunningMc(true);
    try {
      const res = await apiFetch('/risk/monte-carlo', {
        method: 'POST',
        body: JSON.stringify(mcInputs)
      });
      setMcResult(res.simulation);
    } catch (err) {
      console.error('Failed to run Monte Carlo:', err);
    } finally {
      setRunningMc(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-500" />
            What-If Scenario & Monte Carlo Simulator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test hypothetical budget/income adjustments or run 1,000+ stochastic portfolio trajectories.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'whatif'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            What-If Scenario Engine
          </button>
          <button
            onClick={() => setActiveTab('montecarlo')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'montecarlo'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Monte Carlo (1,000+ Paths)
          </button>
        </div>
      </div>

      {activeTab === 'whatif' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="opaque-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span>Hypothetical Inputs</span>
              <button
                onClick={() => {
                  setWhatIfInputs({ incomeChangePct: 0, expenseChangePct: 0, additionalSavings: 0, additionalDebt: 0, emergencySavingsChange: 0 });
                }}
                className="text-[11px] font-bold text-sky-500 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Income Adjustment (%): {whatIfInputs.incomeChangePct > 0 ? `+${whatIfInputs.incomeChangePct}%` : `${whatIfInputs.incomeChangePct}%`}
                </label>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  step="5"
                  value={whatIfInputs.incomeChangePct}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, incomeChangePct: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expenses Adjustment (%): {whatIfInputs.expenseChangePct > 0 ? `+${whatIfInputs.expenseChangePct}%` : `${whatIfInputs.expenseChangePct}%`}
                </label>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  step="5"
                  value={whatIfInputs.expenseChangePct}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expenseChangePct: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Liquid Savings ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={whatIfInputs.additionalSavings}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, additionalSavings: Number(e.target.value.replace(/^0+(?=\d)/, '') || 0) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Monthly Debt Service ($)
                </label>
                <input
                  type="number"
                  step="100"
                  value={whatIfInputs.additionalDebt}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, additionalDebt: Number(e.target.value.replace(/^0+(?=\d)/, '') || 0) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Fund Deposit ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={whatIfInputs.emergencySavingsChange}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, emergencySavingsChange: Number(e.target.value.replace(/^0+(?=\d)/, '') || 0) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={runWhatIfSimulation}
              disabled={simulating}
              className="w-full py-3 bg-[#2563EB] dark:bg-[#0EA5E9] hover:bg-blue-700 dark:hover:bg-sky-400 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {simulating ? 'Computing What-If...' : 'Run What-If Simulation'}
            </button>
          </div>

          {/* Results Comparison Output */}
          <div className="lg:col-span-2 space-y-6">
            <div className="opaque-card grid grid-cols-1 sm:grid-cols-2 gap-6 items-center p-6">
              <div className="p-5 rounded-2xl bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 text-center opacity-100 space-y-2">
                <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] uppercase block tracking-wider">Baseline Score</span>
                <span className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] dark:text-white font-mono tabular-nums block">
                  {simResult?.baselineScore}<span className="text-2xl text-slate-400 font-sans">/100</span>
                </span>
                <div className="pt-2 flex justify-center">
                  <RiskBadge level={simResult?.baselineLevel} score={simResult?.baselineScore} />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-sky-950/40 border border-blue-200 dark:border-[#0EA5E9] text-center space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-[#0EA5E9] uppercase block tracking-wider">Simulated Score</span>
                <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums block">
                  {simResult?.simulatedScore}<span className="text-2xl text-slate-400 font-sans">/100</span>
                </span>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <RiskBadge level={simResult?.simulatedLevel} score={simResult?.simulatedScore} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${simResult?.scoreDelta <= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'}`}>
                    ({simResult?.scoreDelta <= 0 ? `${simResult?.scoreDelta} pts` : `+${simResult?.scoreDelta} pts`})
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-1">💡 Delta indicates risk score shift</span>
              </div>
            </div>

            {/* Changed Categories Detail */}
            <div className="opaque-card space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Simulated Category Impacts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(simResult?.simulatedCategories || {}).map(([key, cat]) => {
                  const baseCat = simResult?.baselineCategories[key];
                  const diff = cat.score - (baseCat?.score || 0);
                  return (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 opacity-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`font-extrabold ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {diff === 0 ? 'No Change' : (diff < 0 ? `${diff} pts` : `+${diff} pts`)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cat.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MONTE CARLO TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="opaque-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Monte Carlo Parameters
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Simulations Iteration Count</label>
                <select
                  value={mcInputs.numSimulations}
                  onChange={(e) => setMcInputs({ ...mcInputs, numSimulations: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
                >
                  <option value={1000}>1,000 Simulations</option>
                  <option value={2500}>2,500 Simulations</option>
                  <option value={5000}>5,000 Simulations</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horizon (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={mcInputs.horizonMonths}
                  onChange={(e) => setMcInputs({ ...mcInputs, horizonMonths: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Portfolio Principal ($)</label>
                <input
                  type="number"
                  min="1000"
                  value={mcInputs.initialValue}
                  onChange={(e) => setMcInputs({ ...mcInputs, initialValue: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Contribution ($)</label>
                <input
                  type="number"
                  min="0"
                  value={mcInputs.monthlyContribution}
                  onChange={(e) => setMcInputs({ ...mcInputs, monthlyContribution: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={runMonteCarlo}
              disabled={runningMc}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              {runningMc ? 'Simulating 1,000+ Paths...' : 'Execute Monte Carlo Run'}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="opaque-card">
                <span className="text-[11px] font-semibold text-slate-500 block">Expected Mean Ending</span>
                <span className="text-sm font-extrabold text-emerald-500">${mcResult?.summary?.meanEndingValue?.toLocaleString()}</span>
              </div>
              <div className="opaque-card">
                <span className="text-[11px] font-semibold text-slate-500 block">5th Percentile (Worst)</span>
                <span className="text-sm font-extrabold text-rose-500">${mcResult?.summary?.p5Worst?.toLocaleString()}</span>
              </div>
              <div className="opaque-card">
                <span className="text-[11px] font-semibold text-slate-500 block">95th Percentile (Best)</span>
                <span className="text-sm font-extrabold text-sky-500">${mcResult?.summary?.p95Best?.toLocaleString()}</span>
              </div>
              <div className="opaque-card">
                <span className="text-[11px] font-semibold text-slate-500 block">Probability of Loss</span>
                <span className="text-sm font-extrabold text-amber-500">{mcResult?.summary?.probabilityOfLoss}%</span>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="opaque-card space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Outcome Distribution Histogram ({mcInputs.numSimulations} Paths)</h2>
              <div className="h-64">
                {mcResult?.histogram ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mcResult.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="binLabel" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">Loading simulation histogram...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
