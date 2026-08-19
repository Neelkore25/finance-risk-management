import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Play, BookOpen, Activity, PieChart, ShieldAlert, 
  Sliders, TrendingUp, Cpu, Layers, ExternalLink, ArrowRight,
  ShieldCheck, Database
} from 'lucide-react';

const SHOWCASE_ITEMS = [
  {
    id: 'var-engine',
    title: 'Quantitative VaR Engine',
    category: 'Analytics',
    status: 'Active',
    statusColor: 'emerald',
    desc: 'Simulate 1-day & 10-day Value at Risk using historical, parametric, and Monte Carlo stochastic algorithms.',
    route: '/portfolio-risk',
    icon: PieChart,
    techStack: ['SciPy VaR', 'Historical Simulation', 'Parametric Variance']
  },
  {
    id: 'credit-scoring',
    title: 'Credit Risk Scoring',
    category: 'Risk Models',
    status: 'Beta',
    statusColor: 'amber',
    desc: 'Automated credit risk modeling with custom default probability (PD) scoring and credit score tiering.',
    route: '/credit-risk',
    icon: ShieldAlert,
    techStack: ['Scikit-Learn ML', 'Default Probability', 'DTI Analysis']
  },
  {
    id: 'what-if-simulator',
    title: 'What-If Stress Simulator',
    category: 'Simulators',
    status: 'New',
    statusColor: 'cyan',
    desc: 'Test portfolio & budget resilience against market crashes, interest rate hikes, and sudden income shocks.',
    route: '/simulator',
    icon: Sliders,
    techStack: ['Scenario Engine', 'Income Shocks', 'Debt Service Delta']
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo GBM Engine',
    category: 'Simulators',
    status: 'Active',
    statusColor: 'emerald',
    desc: 'Run 1,000+ Geometric Brownian Motion paths to forecast 12-month wealth distribution percentiles (P10, P50, P90).',
    route: '/simulator',
    icon: Activity,
    techStack: ['GBM Stochastic', '1000+ Trajectories', 'Confidence Bands']
  },
  {
    id: 'personal-risk',
    title: 'Personal Risk Assessment',
    category: 'Risk Models',
    status: 'Active',
    statusColor: 'emerald',
    desc: 'Deterministic multi-factor risk scorecard evaluating debt safety, net cash flow, and emergency liquidity coverage.',
    route: '/risk-analysis',
    icon: ShieldCheck,
    techStack: ['Scorecard 0-100', 'DTI Benchmark', 'Emergency Buffer']
  },
  {
    id: 'portfolio-holdings',
    title: 'Portfolio Holdings & Heatmap',
    category: 'Analytics',
    status: 'Active',
    statusColor: 'emerald',
    desc: 'Asset allocation tracking, Sharpe ratio calculation, volatility metrics, and sector concentration heatmaps.',
    route: '/investments',
    icon: TrendingUp,
    techStack: ['Sharpe Ratio', 'Vol Heatmaps', 'Sector Breakdown']
  },
  {
    id: 'ai-assistant',
    title: 'Dual-Mode AI Risk Assistant',
    category: 'Analytics',
    status: 'Active',
    statusColor: 'cyan',
    desc: 'Google Gemini 2.5 Flash SDK integration for conversational setup wizard and plain-English financial definitions.',
    route: '/dashboard',
    icon: Cpu,
    techStack: ['Gemini 2.5 Flash', 'Step Onboarding', 'Typo Parser']
  },
  {
    id: 'goal-horizon',
    title: 'Financial Goal Horizon Predictor',
    category: 'Risk Models',
    status: 'Experimental',
    statusColor: 'purple',
    desc: 'Goal milestone tracking with monthly target saving requirements and compound interest projection models.',
    route: '/goals',
    icon: Layers,
    techStack: ['Compound Yield', 'Milestone Target', 'Time Horizons']
  }
];

export function AntigravityShowcase() {
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  const tabs = ['All', 'Risk Models', 'Simulators', 'Analytics'];

  const filteredItems = SHOWCASE_ITEMS.filter((item) => {
    if (activeTab === 'All') return true;
    return item.category === activeTab;
  });

  const getStatusStyle = (statusColor) => {
    switch (statusColor) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#FFFFFF] p-6 sm:p-8 font-sans selection:bg-[#00F5FF]/30">
      {/* HEADER SECTION */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-xs font-bold shadow-[0_0_15px_rgba(0,245,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          ANTIGRAVITY DESIGN SYSTEM
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
          <span className="bg-gradient-to-r from-[#00F5FF] via-cyan-300 to-[#9D4EDD] bg-clip-text text-transparent">
            Antigravity Showcase
          </span>
        </h1>

        <p className="text-sm text-[#A0AEC0] max-w-2xl leading-relaxed font-medium">
          Interactive financial modeling, risk analysis tools, and real-time simulation engines.
        </p>
      </div>

      {/* FILTER / CATEGORY TABS */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 border ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white border-transparent shadow-[0_0_15px_rgba(0,245,255,0.3)] scale-105'
                : 'bg-white/[0.03] text-[#A0AEC0] border-white/10 hover:border-[#00F5FF]/40 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FEATURE CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-cyan-500/20 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,245,255,0.18)] flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Status Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusStyle(item.statusColor)}`}>
                    • {item.status}
                  </span>
                </div>

                {/* Title with Icon */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#A0AEC0] leading-relaxed mb-4">
                  {item.desc}
                </p>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(item.route)}
                  className="py-2 px-3.5 bg-cyan-500/10 hover:bg-[#00F5FF] text-cyan-300 hover:text-[#090A0F] border border-cyan-500/30 font-bold text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center gap-1.5 group-hover:shadow-[0_0_12px_rgba(0,245,255,0.4)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Launch Module
                </button>

                <button
                  onClick={() => navigate('/methodology')}
                  className="p-2 text-[#A0AEC0] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="View Documentation"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AntigravityShowcase;
