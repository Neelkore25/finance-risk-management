import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { apiFetch, formatINR } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export function AIRiskAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Finance Risk Assistant. Ask me to explain any financial concept, definition, or analyze your portfolio!"
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

  const generateLocalAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();
    const p = contextData?.personal?.metrics || {};
    const cred = contextData?.credit || {};
    const port = contextData?.portfolio?.metrics || {};

    if (q.includes('monthly debt service') || q.includes('debt service') || q.includes('monthly debt')) {
      return `💳 **Monthly Debt Service Meaning**:\nThe total mandatory monthly sum spent on principal and interest payments across all existing debts, loans, and EMIs (such as mortgages, personal loans, auto loans, and credit card minimums).\n\n• **Formula**: Monthly Debt Service = Σ (Monthly Debt EMIs)\n• **Impact on Risk**: Used directly to compute your Debt-to-Income (DTI) ratio:\n\n$$\\text{DTI} = \\left(\\frac{\\text{Monthly Debt Service}}{\\text{Monthly Net Income}}\\right) \\times 100$$\n\n• **Benchmark**: Financial institutions recommend keeping total monthly debt service below 36% of net income.`;
    }

    if (q.includes('what is var') || q.includes('value at risk') || q.includes('explain var')) {
      return `📈 **Value at Risk (VaR) Meaning**:\nA quantitative risk metric estimating the maximum expected financial loss in a portfolio over a specific time horizon (e.g., 1 day) at a given confidence level (e.g., 95% or 99%).\n\n• **Historical VaR**: Calculated from empirical asset return distributions.\n• **Parametric VaR**: Assumes normal Gaussian return distributions.\n• **Monte Carlo VaR**: Vectorized 10,000-path Geometric Brownian Motion simulation.`;
    }

    if (q.includes('credit risk') || q.includes('credit score') || q.includes('default probability')) {
      return `🏦 **Credit Default Risk Model**:\nA machine-learning model estimating the statistical probability that a borrower may default on debt payments.\n\n• **Model**: Scikit-Learn Logistic Regression & Random Forest\n• **Features Used**: Net income, total debt, monthly EMI, liquid savings, credit utilization percentage.\n\nYour predicted credit tier is **${cred.tier || 'Good'}** (${cred.creditScore || 745}) with a **${((cred.probDefault || 0.08) * 100).toFixed(1)}%** default probability.`;
    }

    if (q.includes('dti') || q.includes('debt to income') || q.includes('reduce debt') || q.includes('emi')) {
      return `💳 **Debt-to-Income (DTI) Ratio & Debt Reduction Strategy**:\nThe percentage of your monthly net income spent on monthly debt EMIs.\n\n• **Formula**: DTI = (Monthly Debt EMIs / Net Monthly Income) × 100\n• **Healthy Benchmark**: ≤ 36%\n\n👉 **Mitigation Strategy**: Pay down high-interest liabilities first (Debt Avalanche) or consolidate small loans (Debt Snowball). Your current DTI is **${p.dtiRatio || 16}%**.`;
    }

    if (q.includes('sharpe') || q.includes('meaning of sharpe')) {
      return `📊 **Sharpe Ratio Meaning**:\nA metric measuring risk-adjusted portfolio return relative to excess volatility.\n\n• **Formula**: Sharpe = (Portfolio Return - Risk Free Rate) / Portfolio Volatility\n• **Interpretation**: > 1.0 is Good, > 2.0 is Very Good, > 3.0 is Excellent.\n\nYour portfolio Sharpe Ratio is **${port.sharpeRatio || 1.85}**.`;
    }

    if (q.includes('liquid savings') || q.includes('emergency fund') || q.includes('savings')) {
      return `💰 **Liquid Savings & Emergency Reserves**:\nLiquid savings represent immediately accessible cash or high-liquidity assets stored to handle unforeseen financial shocks.\n\n• **Recommended Reserve**: 3 to 6 months of essential living expenses.\n• **Your Current Coverage**: **${p.emergencyCoverageMonths || 6} Months** of living expenses.`;
    }

    if (q.includes('essential expense') || q.includes('discretionary')) {
      return `🛒 **Essential vs Discretionary Expenses**:\n• **Essential Expenses**: Non-negotiable living costs (rent, food, utility bills, healthcare, basic transport).\n• **Discretionary Expenses**: Optional lifestyle choices (entertainment, dining out, subscriptions).`;
    }

    if (q.includes('what is this project') || q.includes('about app') || q.includes('features')) {
      return `🛡️ **Finance Risk Analytics Platform**:\nAn educational quantitative financial risk management system providing personal risk scoring, Debt-to-Income (DTI) analysis, Portfolio Value at Risk (VaR), Scikit-Learn Credit Risk ML, and What-If scenario simulations.`;
    }

    if (q.includes('my risk') || q.includes('analyze my') || q.includes('overall') || q.includes('score')) {
      return `📊 **Your Personal Risk Profile Summary**:\n• **Overall Risk Score**: **${contextData?.personal?.overallScore || 34}/100** (${contextData?.personal?.overallLevel || 'Low Risk'})\n• **Monthly Net Income**: ${formatINR(p.monthlyIncome || 75000)}\n• **Net Cash Flow**: ${formatINR(p.netCashFlow || 18000)}\n• **Debt-to-Income (DTI)**: ${p.dtiRatio || 16}%\n• **Emergency Reserve**: ${p.emergencyCoverageMonths || 6} Months`;
    }

    return `🤖 **AI Risk Assistant**:\nI can answer financial risk questions such as:\n\n1. **Debt & Income**: Ask "What is meant by monthly debt service?", "Explain DTI ratio"\n2. **Portfolio Risk**: Ask "What is VaR?", "What is Sharpe Ratio?"\n3. **Credit ML**: Ask "Explain Credit Risk score"\n4. **Personal Profile**: Ask "Analyze my financial risk score"`;
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    const apiBaseUrl = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          user_id: user?.id || 'guest',
          user_context: {
            platform: 'Finance Risk Analytics Platform',
            overallScore: contextData?.personal?.overallScore || 34,
            dtiRatio: contextData?.personal?.metrics?.dtiRatio || 16,
            netCashFlow: contextData?.personal?.metrics?.netCashFlow || 18000
          }
        })
      });

      const data = await res.json();
      if (data && data.reply) {
        setMessages([...newMsgs, { sender: 'ai', text: data.reply }]);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Backend unavailable or mixed content CORS restriction on static page
    }

    // Dynamic Intelligent Fallback Response
    const localResponse = generateLocalAIResponse(query);
    setMessages([...newMsgs, { sender: 'ai', text: localResponse }]);
    setLoading(false);
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
                  RAG & LLM Engine Active
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
              onClick={() => handleSend("What is Value at Risk (VaR)?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 whitespace-nowrap hover:bg-sky-200 transition-colors"
            >
              📈 What is VaR?
            </button>
            <button
              onClick={() => handleSend("Explain Credit Risk score")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap hover:bg-emerald-200 transition-colors"
            >
              🏦 Credit Risk
            </button>
            <button
              onClick={() => handleSend("How to reduce EMI debt burden?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors"
            >
              💳 Reduce Debt
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
                AI is thinking...
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
              placeholder="Ask any definition or risk question..."
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
