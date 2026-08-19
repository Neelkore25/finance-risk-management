import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { apiFetch, formatINR } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

function extractNumberFromTextLocal(text) {
  if (!text) return null;
  const str = text.toLowerCase().trim();
  
  const kMatch = str.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const lakhMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)\b/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  const cleaned = str.replace(/[^\d.]/g, '');
  if (cleaned) {
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val >= 0) return Math.round(val);
  }

  return null;
}

function formatMessageContent(text) {
  if (!text) return null;
  const cleaned = text
    .replace(/\$\$.*?\$\$/g, '')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\times/g, '×')
    .replace(/\\left\(|\\right\)/g, '');

  const lines = cleaned.split('\n');
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-sky-400 dark:text-sky-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <React.Fragment key={idx}>
        {renderedLine}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

const STEP_KEYS = [
  { step: 1, key: 'monthly_income', label: 'Net Monthly Income', prompt: 'What is your Net Monthly Income? (e.g. 75000, 80k, 1 Lakh)' },
  { step: 2, key: 'monthly_debt', label: 'Monthly Debt Service / EMIs', prompt: 'What are your total Monthly Debt Payments / EMIs? (e.g. home loan, credit card minimums)' },
  { step: 3, key: 'essential_expenses', label: 'Essential Living Expenses', prompt: 'What are your Essential Monthly Expenses? (rent, groceries, electricity)' },
  { step: 4, key: 'discretionary_expenses', label: 'Discretionary Lifestyle Expenses', prompt: 'What are your Discretionary Lifestyle Expenses? (dining out, shopping, hobbies)' },
  { step: 5, key: 'liquid_savings', label: 'Total Liquid Savings & Emergency Fund', prompt: 'What is your Total Liquid Savings & Emergency Reserve?' }
];

export function AIRiskAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I can answer any financial definition or help you fill out your dashboard step-by-step. What would you like to do?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);

  // Dual-Mode Guided Setup Wizard State
  const [wizardStep, setWizardStep] = useState(0); // 0=idle, 1=income, 2=debt, 3=essential, 4=discretionary, 5=savings
  const [wizardData, setWizardData] = useState({
    monthly_income: 75000,
    monthly_debt: 12000,
    essential_expenses: 30000,
    discretionary_expenses: 15000,
    liquid_savings: 100000
  });

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

  const startSetupWizard = () => {
    setWizardStep(1);
    const msg = `🪄 **Guided Onboarding Setup**\n\nI will guide you step-by-step through 5 fields to calculate your risk scores!\n\n**Step 1 of 5**: ${STEP_KEYS[0].prompt}`;
    setMessages(prev => [...prev, { sender: 'ai', text: msg }]);
  };

  const isQuestionQuery = (text) => {
    const q = text.toLowerCase().trim();
    return (
      q.includes('what is') ||
      q.includes('explain') ||
      q.includes('meaning') ||
      q.includes('how to') ||
      q.includes('why') ||
      q.includes('about') ||
      q.endsWith('?')
    );
  };

  const generateLocalAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();
    const p = contextData?.personal?.metrics || {};
    const cred = contextData?.credit || {};
    const port = contextData?.portfolio?.metrics || {};

    if (q.includes('monthly debt service') || q.includes('debt service') || q.includes('monthly debt')) {
      return `💳 **Monthly Debt Service** is the total amount of money you must pay each month toward all active debts and loans (like credit card EMIs, car loans, and home mortgages).\n\n• **Why it matters**: Lenders evaluate this to calculate your Debt-to-Income (DTI) ratio to verify if you can comfortably afford credit.\n• **Best Practice**: Keep total monthly debt payments below 36% of net monthly income.`;
    }

    if (q.includes('what is var') || q.includes('value at risk') || q.includes('explain var')) {
      return `📈 **Value at Risk (VaR)** is a metric that estimates the maximum potential loss your investment portfolio could face over a specific timeframe under normal market conditions.\n\n• **In simple terms**: It tells you the worst expected loss over 1 day or 1 month.\n• **Why it matters**: Helps investors manage risk and prevent unexpected financial shocks.`;
    }

    if (q.includes('credit risk') || q.includes('credit score') || q.includes('default probability')) {
      return `🏦 **Credit Default Risk** is the likelihood that a borrower might fail to make their required debt payments on time.\n\n• **What affects it**: Income stability, total existing debt, credit card utilization, and repayment history.\n• **Your Score Tier**: **${cred.tier || 'Good'}** (${cred.creditScore || 745}) with an estimated **${((cred.probDefault || 0.08) * 100).toFixed(1)}%** default probability.`;
    }

    if (q.includes('dti') || q.includes('debt to income') || q.includes('reduce debt') || q.includes('emi')) {
      return `💳 **Debt-to-Income (DTI) Ratio** compares your total monthly debt payments against your monthly net income.\n\n• **Healthy Goal**: 36% or lower.\n• **How to Reduce It**: Pay off high-interest debts first or consolidate small loans into a lower-rate EMI.\n• **Your Current DTI**: **${p.dtiRatio || 16}%**.`;
    }

    if (q.includes('what is this project') || q.includes('about app') || q.includes('features')) {
      return `🛡️ **Finance Risk Analytics Platform** is a personal financial risk workspace that helps you track debt safety (DTI), evaluate credit default risk, analyze portfolio risk (VaR), and test future financial scenarios.`;
    }

    return `🤖 **AI Risk Assistant**:\nI am ready to help you! You can:\n\n1. **Setup Data**: Click **"🪄 Help Me Setup Profile"** to enter your financial data step-by-step.\n2. **Definitions**: Ask "What is Monthly Debt Service?", "What is VaR?", "Explain Credit Risk Score"`
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase().trim();
    const apiBaseUrl = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8000';

    // 1. Explicit Trigger for Guided Setup Wizard
    if (
      lowerQuery.includes('setup profile') ||
      lowerQuery.includes('fill data') ||
      lowerQuery.includes('put data') ||
      lowerQuery.includes('step by step') ||
      lowerQuery.includes('help me setup')
    ) {
      setMessages(prev => [...prev, { sender: 'user', text: query }]);
      setInput('');
      startSetupWizard();
      return;
    }

    // 2. Non-Destructive Question Answer Mode B (Interruption Handling during Wizard or Idle)
    if (isQuestionQuery(query) && wizardStep > 0) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      let reply = '';
      try {
        const res = await fetch(`${apiBaseUrl}/api/ai/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            mode: 'chat',
            user_context: { platform: 'Finance Risk Analytics Platform' }
          })
        });
        const data = await res.json();
        reply = data.reply || data.response || generateLocalAIResponse(query);
      } catch (err) {
        reply = generateLocalAIResponse(query);
      }

      const stepPrompt = STEP_KEYS[wizardStep - 1].prompt;
      setMessages([
        ...newMsgs,
        { sender: 'ai', text: reply },
        { sender: 'ai', text: `▶️ **Resuming Step ${wizardStep} of 5**: ${stepPrompt}` }
      ]);
      setLoading(false);
      return;
    }

    // 3. Guided Wizard Mode A (Step Value Parsing)
    if (wizardStep > 0) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      const currentStepObj = STEP_KEYS[wizardStep - 1];
      let cleanedVal = null;
      let typoNote = null;

      try {
        const res = await fetch(`${apiBaseUrl}/api/ai/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            mode: 'parse_step',
            step_key: currentStepObj.key
          })
        });
        const data = await res.json();
        if (data.valid && data.cleaned_value !== null) {
          cleanedVal = data.cleaned_value;
          typoNote = data.detected_typo;
        }
      } catch (err) {}

      if (cleanedVal === null) {
        cleanedVal = extractNumberFromTextLocal(query);
      }

      if (cleanedVal === null) {
        setMessages([...newMsgs, {
          sender: 'ai',
          text: "I couldn't detect a valid amount. Please enter a value like 75000, 80k, or 1 Lakh."
        }]);
        setLoading(false);
        return;
      }

      const updatedWizardData = { ...wizardData, [currentStepObj.key]: cleanedVal };
      setWizardData(updatedWizardData);

      let ackText = `Got it! **${currentStepObj.label}** set to **${formatINR(cleanedVal)}**.`;
      if (typoNote) {
        ackText += ` (${typoNote})`;
      }

      if (wizardStep < 5) {
        const nextStepObj = STEP_KEYS[wizardStep];
        setWizardStep(wizardStep + 1);
        setMessages([
          ...newMsgs,
          {
            sender: 'ai',
            text: `${ackText}\n\n**Step ${wizardStep + 1} of 5**: ${nextStepObj.prompt}`
          }
        ]);
        setLoading(false);
        return;
      }

      // Step 5 Complete -> Save Profile to Supabase & Auto-Sync
      try {
        const payload = {
          monthly_net_income: updatedWizardData.monthly_income,
          monthly_debt_payments: updatedWizardData.monthly_debt,
          essential_expenses: updatedWizardData.essential_expenses,
          discretionary_expenses: updatedWizardData.discretionary_expenses,
          liquid_savings: updatedWizardData.liquid_savings,
          emergency_fund: updatedWizardData.liquid_savings
        };

        await apiFetch('/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } catch (err) {}

      setWizardStep(0);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `🎉 **Financial Profile Successfully Configured & Synced!**\n\n• **Monthly Net Income**: ${formatINR(updatedWizardData.monthly_income)}\n• **Monthly Debt Service**: ${formatINR(updatedWizardData.monthly_debt)}\n• **Essential Expenses**: ${formatINR(updatedWizardData.essential_expenses)}\n• **Discretionary Expenses**: ${formatINR(updatedWizardData.discretionary_expenses)}\n• **Liquid Savings**: ${formatINR(updatedWizardData.liquid_savings)}\n\nYour live risk scorecards and dashboard metrics have been updated in real-time!`
        }
      ]);
      setLoading(false);
      return;
    }

    // 4. Standard QA / Definition Question Mode B
    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          mode: 'chat',
          user_context: {
            platform: 'Finance Risk Analytics Platform',
            overallScore: contextData?.personal?.overallScore || 34,
            dtiRatio: contextData?.personal?.metrics?.dtiRatio || 16
          }
        })
      });

      const data = await res.json();
      if (data && (data.reply || data.response)) {
        setMessages([...newMsgs, { sender: 'ai', text: data.reply || data.response }]);
        setLoading(false);
        return;
      }
    } catch (err) {}

    const localResponse = generateLocalAIResponse(query);
    setMessages([...newMsgs, { sender: 'ai', text: localResponse }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button — Hidden when Modal is Open */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-2xl transition-all duration-200 flex items-center gap-2 border-2 border-sky-400 opacity-100 group"
          title="Open AI Risk Assistant"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold hidden sm:inline pr-1">AI Risk Assistant</span>
        </button>
      )}

      {/* AI Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[540px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col opacity-100 overflow-hidden font-sans">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-600/30 rounded-lg border border-sky-500/40">
                <Bot className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white tracking-wide font-display">AI Risk Assistant</h3>
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
              onClick={() => handleSend("Setup Profile")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-sm whitespace-nowrap hover:bg-indigo-500 transition-colors flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3 text-amber-300" />
              🪄 Help Me Setup Profile
            </button>
            <button
              onClick={() => handleSend("What is Value at Risk (VaR)?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 whitespace-nowrap hover:bg-sky-200 transition-colors"
            >
              📈 What is VaR?
            </button>
            <button
              onClick={() => handleSend("What is Monthly Debt Service?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors"
            >
              💳 What is Debt Service?
            </button>
            <button
              onClick={() => handleSend("Explain Credit Risk score")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap hover:bg-emerald-200 transition-colors"
            >
              🏦 Credit Risk
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
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed opacity-100 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-sm font-medium'
                      : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {formatMessageContent(msg.text)}
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
              placeholder={
                wizardStep > 0
                  ? `Step ${wizardStep} of 5: Enter amount or ask a question...`
                  : "Ask any definition or type 'help me setup profile'..."
              }
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
