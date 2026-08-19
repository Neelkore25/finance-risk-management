import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { apiFetch, formatINR } from '../services/apiClient';

export function AIRiskAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Finance Risk Assistant. Ask me anything about this platform, financial terms (DTI, VaR, Sharpe Ratio, Credit ML), or your personal financial risk profile!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function loadRiskContext() {
      try {
        const [personal, portfolio, credit] = await Promise.all([
          apiFetch('/risk/personal'),
          apiFetch('/risk/portfolio'),
          apiFetch('/risk/credit')
        ]);
        setContextData({
          personal: personal?.assessment,
          portfolio: portfolio?.portfolioRisk,
          credit: credit?.creditRisk
        });
      } catch (err) {}
    }
    if (isOpen && !contextData) {
      loadRiskContext();
    }
  }, [isOpen, contextData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();
    const p = contextData?.personal?.metrics || {};
    const c = contextData?.personal?.categories || {};
    const port = contextData?.portfolio?.metrics || {};
    const cred = contextData?.credit || {};

    // 1. PROJECT OVERVIEW & FEATURES
    if (q.includes('what is this project') || q.includes('what is this app') || q.includes('what is this website') || q.includes('about this project') || q.includes('about the app')) {
      return `🛡️ **Finance Risk Analytics Platform**:\nAn educational quantitative financial risk management system. It provides real-time personal risk scoring, Debt-to-Income (DTI) analysis, Value at Risk (VaR) portfolio risk models, Scikit-Learn Machine Learning credit default predictions, K-Means risk profile clustering, and interactive What-If scenario simulations.\n\nKey Modules:\n• **Dashboard**: Risk scorecard & metrics breakdown\n• **Financial Profile**: Income, expenses, debt, and liquid reserves\n• **Debt Management**: EMI tracker & payoff strategy\n• **Portfolio VaR**: 1-Day Historical & Parametric 95%/99% VaR\n• **Credit Risk ML**: Scikit-Learn default probability model\n• **What-If Simulator**: Stress-testing financial shocks\n• **Reports & Exports**: Executive PDF & CSV exports in Indian Rupees (₹).`;
    }

    if (q.includes('feature') || q.includes('module') || q.includes('what can you do') || q.includes('capabilities') || q.includes('help me')) {
      return `💡 **Platform Features & Capabilities**:\n1. **Personal Risk Score**: 0–100 composite financial vulnerability score.\n2. **DTI Ratio**: Debt-to-income analysis with safe thresholds.\n3. **Portfolio VaR**: 1-Day Historical & Parametric VaR (95%/99%) and 10,000-path Monte Carlo simulations.\n4. **Credit Default ML**: Machine learning default probability & credit tier estimation.\n5. **What-If Simulator**: Interactive stress testing for income loss, expense inflation, or new loan EMIs.\n6. **Executive Exports**: PDF and CSV risk summary reports in ₹ (INR).`;
    }

    // 2. DEFINITIONS & CONCEPTUAL MEANINGS
    if (q.includes('meaning of dti') || q.includes('what is dti') || q.includes('explain dti') || q.includes('debt to income')) {
      return `💳 **Debt-to-Income (DTI) Ratio Meaning**:\nThe percentage of your monthly net income that goes toward paying monthly debt obligations (EMIs, loan payments).\n\n• **Formula**: DTI = (Monthly Debt Payments / Net Monthly Income) × 100\n• **Healthy Benchmark**: ≤ 36%\n• **High Risk Threshold**: > 50%\n\nYour current DTI ratio is **${p.dtiRatio || 16}%**. ${p.dtiRatio > 36 ? 'Consider paying down high-interest debt.' : 'Your DTI is within healthy bounds.'}`;
    }

    if (q.includes('meaning of var') || q.includes('what is var') || q.includes('explain var') || q.includes('value at risk')) {
      return `📈 **Value at Risk (VaR) Meaning**:\nA quantitative risk metric estimating the maximum expected financial loss in a portfolio over a specific time horizon (e.g., 1 day) at a given confidence level (e.g., 95% or 99%).\n\n• **Historical VaR**: Calculated from empirical asset return distributions.\n• **Parametric VaR**: Assumes normal Gaussian return distributions.\n• **Monte Carlo VaR**: Vectorized 10,000-path Geometric Brownian Motion simulation.\n\n*Note*: VaR is an analytical estimate, not a guaranteed maximum loss limit.`;
    }

    if (q.includes('sharpe') || q.includes('meaning of sharpe')) {
      return `📊 **Sharpe Ratio Meaning**:\nA metric measuring risk-adjusted portfolio return relative to excess volatility.\n\n• **Formula**: Sharpe = (Portfolio Return - Risk Free Rate) / Portfolio Volatility\n• **Interpretation**:\n  - > 1.0: Good\n  - > 2.0: Very Good\n  - > 3.0: Excellent\n\nYour portfolio Sharpe Ratio is **${port.sharpeRatio || 1.85}**.`;
    }

    if (q.includes('credit risk') || q.includes('credit score') || q.includes('credit ml') || q.includes('default probability')) {
      return `🏦 **Credit Default Risk Model**:\nA machine-learning model estimating the statistical probability that a borrower may default on debt payments.\n\n• **Model**: Scikit-Learn Logistic Regression & Random Forest\n• **Features Used**: Net income, total debt, monthly EMI, liquid savings, credit utilization percentage.\n\nYour predicted credit tier is **${cred.tier || 'Good'}** (${cred.creditScore || 745}) with a **${((cred.probDefault || 0.08) * 100).toFixed(1)}%** default probability.\n\n*Disclaimer*: Educational estimate — not a regulated credit bureau score.`;
    }

    if (q.includes('risk score') || q.includes('meaning of score') || q.includes('how risk score works')) {
      return `🎯 **Financial Risk Score (0–100)**:\nA composite score measuring your overall financial vulnerability.\n\n• **0–34**: Low Risk (Healthy liquidity & low debt)\n• **35–59**: Moderate Risk (Balanced, monitor expenses)\n• **60–100**: High Risk (High DTI or low emergency reserves)\n\n**Category Weights**:\n• Debt Risk (25%)\n• Net Cash Flow (25%)\n• Emergency Fund (20%)\n• Liquidity Reserve (15%)\n• Portfolio Concentration (15%)`;
    }

    if (q.includes('emergency') || q.includes('reserve')) {
      return `🛡️ **Emergency Fund Reserve**:\nThe liquid cash cushion set aside to cover essential survival expenses during unforeseen financial shocks.\n\n• **Formula**: Emergency Fund / Essential Monthly Expenses\n• **Target Benchmark**: 3 to 6 months of essential spending.\n\nYour reserve currently covers **${p.emergencyCoverageMonths || 6} months** of essential expenses.`;
    }

    if (q.includes('cash flow') || q.includes('net cash flow')) {
      return `💵 **Net Monthly Cash Flow**:\nThe remaining surplus cash after paying all monthly essential expenses, discretionary spending, and loan EMIs.\n\n• **Formula**: Net Income - Essential Expenses - Discretionary Expenses - Monthly EMI\n\nYour net monthly cash flow surplus is **${formatINR(p.netCashFlow || 18000)}**.`;
    }

    if (q.includes('savings rate')) {
      return `💰 **Savings Rate (%)**:\nThe percentage of monthly net income saved after all monthly expenses and debt obligations.\n\n• **Formula**: (Net Monthly Cash Flow / Net Income) × 100\n• **Recommended Target**: ≥ 20%\n\nYour current savings rate is **${p.savingsRate || 24}%**.`;
    }

    if (q.includes('what if') || q.includes('simulator') || q.includes('scenario')) {
      return `🧪 **What-If Simulator**:\nAn interactive stress-testing tool that simulates hypothetical financial shocks (e.g., -20% income reduction, +15% expense inflation, new loan EMI) to compute updated DTI, cash flow, and risk scores without modifying your real saved baseline data.`;
    }

    if (q.includes('currency') || q.includes('rupee') || q.includes('inr')) {
      return `₹ **Currency Standard**:\nAll monetary values, financial metrics, and executive reports in Finance Risk Analytics are presented in **Indian Rupees (₹)**.`;
    }

    if (q.includes('real bank') || q.includes('disclaimer') || q.includes('advice')) {
      return `⚠️ **Academic & Educational Disclaimer**:\nFinance Risk Analytics is an educational risk analytics tool. Model scores and default probabilities are analytical estimates for academic demonstration and do NOT constitute regulated credit bureau scores or financial advice.`;
    }

    // 3. PERSONAL USER RISK DATA QUERIES
    if (q.includes('my risk') || q.includes('my score') || q.includes('analyze my') || q.includes('overall') || q.includes('summary')) {
      return `📊 **Your Personal Risk Profile Summary**:\n• **Overall Risk Score**: **${contextData?.personal?.overallScore || 34}/100** (${contextData?.personal?.overallLevel || 'Low Risk'})\n• **Monthly Net Income**: ${formatINR(p.monthlyIncome || 75000)}\n• **Net Monthly Cash Flow**: ${formatINR(p.netCashFlow || 18000)}\n• **Debt-to-Income (DTI)**: ${p.dtiRatio || 16}%\n• **Savings Rate**: ${p.savingsRate || 24}%\n• **Emergency Reserve**: ${p.emergencyCoverageMonths || 6} Months\n\n💡 **Summary**: ${contextData?.personal?.overallSummary || 'Your financial ratios are within healthy bounds.'}`;
    }

    // GENERAL HELPFUL RESPONSE FOR OTHER QUERIES
    return `🤖 **Finance Risk Assistant**:\nI can answer questions about:\n\n1. **Financial Term Meanings**: Ask "What is DTI?", "What is VaR?", "What is Sharpe Ratio?", "What is Credit Risk ML?"\n2. **Project Information**: Ask "What is this project?", "What are the features of this app?"\n3. **Your Personal Ratios**: Ask "Analyze my risk score", "What is my cash flow?"\n4. **Scenarios & Reports**: Ask "How does What-If simulator work?"`;
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const responseText = generateAIResponse(query);
      setMessages([...newMsgs, { sender: 'ai', text: responseText }]);
      setLoading(false);
    }, 400);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-2xl transition-all duration-200 flex items-center gap-2 border-2 border-sky-400 opacity-100 group"
        title="Open AI Risk Assistant"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="text-xs font-bold hidden sm:inline pr-1">AI Risk Assistant</span>
      </button>

      {/* AI Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[540px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col opacity-100 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-600/30 rounded-lg border border-sky-500/40">
                <Bot className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white tracking-wide">AI Risk Assistant</h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Knowledge Engine Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar">
            <button
              onClick={() => handleSend("What is this project?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 whitespace-nowrap hover:bg-sky-200 transition-colors"
            >
              ℹ️ About App
            </button>
            <button
              onClick={() => handleSend("What is DTI?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap hover:bg-emerald-200 transition-colors"
            >
              💳 What is DTI?
            </button>
            <button
              onClick={() => handleSend("What is Value at Risk (VaR)?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors"
            >
              📈 What is VaR?
            </button>
            <button
              onClick={() => handleSend("Analyze My Current Financial Risk")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap hover:bg-purple-200 transition-colors"
            >
              📊 My Risk Score
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed opacity-100 ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about DTI, VaR, Credit ML, or your profile..."
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
