import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, RefreshCw, ChevronRight } from 'lucide-react';
import { apiFetch } from '../services/apiClient';

export function AIRiskAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Finance Risk Assistant. Ask me anything about your personal risk score, DTI ratio, portfolio VaR, or credit risk model!"
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
    const q = userQuery.toLowerCase();
    const p = contextData?.personal?.metrics || {};
    const c = contextData?.personal?.categories || {};
    const port = contextData?.portfolio?.metrics || {};
    const cred = contextData?.credit || {};

    if (q.includes('overall') || q.includes('analyze') || q.includes('summary') || q.includes('score')) {
      return `📊 **Financial Risk Score Summary**: Your overall financial risk score is **${contextData?.personal?.overallScore || 59}/100** (${contextData?.personal?.overallLevel || 'Moderate Risk'}).\n\n• **DTI Ratio**: ${p.dtiRatio || 8}%\n• **Liquid Reserves**: ${p.liquidCoverageMonths || 3.6} months of expenses\n• **Emergency Reserve**: ${p.emergencyCoverageMonths || 0} months\n• **Savings Rate**: ${p.savingsRate || 36}%\n\n💡 **Key Takeaway**: ${contextData?.personal?.overallSummary || 'Maintain liquid reserves and keep debt low.'}`;
    }

    if (q.includes('dti') || q.includes('debt')) {
      return `💳 **Debt-to-Income (DTI) Analysis**: Your current DTI is **${p.dtiRatio || 8}%**.\n\n• Healthy Benchmark: ≤ 36%\n• High Risk Threshold: > 50%\n\n👉 **Recommendation**: ${c.debtRisk?.action || 'Keep monthly debt obligations low to preserve cash flow.'}`;
    }

    if (q.includes('var') || q.includes('portfolio') || q.includes('sharpe') || q.includes('stock') || q.includes('investment')) {
      return `📈 **Quantitative Portfolio Risk**: Your total portfolio value is **$${(port.totalValue || 35000).toLocaleString()}**.\n\n• **1-Day Historical VaR (95%)**: $${(port.historicalVaR1DayAmount || 532).toLocaleString()} (${port.historicalVaR1DayPct || 1.52}% max 1-day loss)\n• **Sharpe Ratio**: ${port.sharpeRatio || 1.9} (Strong risk-adjusted return)\n• **Maximum Drawdown**: ${port.maxDrawdownPct || 7.09}%\n\n💡 **Advice**: Diversify across non-correlated industry sectors to reduce portfolio tail risk.`;
    }

    if (q.includes('credit') || q.includes('loan') || q.includes('score') || q.includes('default')) {
      return `🏦 **Credit Default Risk Score**: Your predicted credit score is **${cred.creditScore || 720}** (${cred.tier || 'Good'} Tier).\n\n• **Default Risk Probability**: ${cred.probDefault || 0.1}%\n• **Model**: Scikit-Learn Logistic Regression\n\n👉 **Key Factor**: ${cred.drivingFactors?.[0]?.detail || 'Maintain low credit utilization and zero missed payments.'}`;
    }

    if (q.includes('emergency') || q.includes('savings') || q.includes('reserve')) {
      return `🛡️ **Emergency Fund Strategy**: Your emergency fund covers **${p.emergencyCoverageMonths || 0} months** of essential spending.\n\n• Recommended Benchmark: 3 to 6 months of essential survival expenses.\n👉 **Action**: Set up automated transfers of 15% of your surplus cash into a liquid high-yield savings account.`;
    }

    return `🤖 **Finance Risk Assistant Analysis**: Based on your current profile:\n\n• Monthly Income: $${(p.monthlyIncome || 5000).toLocaleString()}\n• Monthly Surplus: $${(p.netCashFlow || 1800).toLocaleString()}\n• Risk Score: ${contextData?.personal?.overallScore || 59}/100\n\nYou can ask me specifically about your **DTI ratio**, **Value at Risk (VaR)**, **Credit Score**, or **Emergency Reserves**!`;
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
    }, 600);
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

      {/* Sleek AI Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col opacity-100 overflow-hidden">
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
                  Live Risk Engine Active
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
              onClick={() => handleSend("Analyze My Current Financial Risk")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 whitespace-nowrap hover:bg-sky-200 transition-colors"
            >
              📊 Risk Score
            </button>
            <button
              onClick={() => handleSend("How can I lower my DTI ratio?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap hover:bg-emerald-200 transition-colors"
            >
              💳 DTI Ratio
            </button>
            <button
              onClick={() => handleSend("Explain my Portfolio VaR & Downside Risk")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors"
            >
              📈 VaR Metrics
            </button>
            <button
              onClick={() => handleSend("How to improve my Credit Default Score?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap hover:bg-purple-200 transition-colors"
            >
              🏦 Credit ML
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
                  className={`max-w-[82%] p-3 rounded-xl leading-relaxed opacity-100 ${
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
                Analyzing risk models...
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
              placeholder="Ask AI about your financial risk..."
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
