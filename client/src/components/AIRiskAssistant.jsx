import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, Wand2, CheckCircle2, ArrowRight, SkipForward } from 'lucide-react';
import { 
  apiFetch, 
  updateFinancialProfile, 
  addExpense, 
  addDebt, 
  addPortfolioHolding, 
  addFinancialGoal, 
  updateCreditParams, 
  formatINR 
} from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

function extractNumbersFromTextLocal(text) {
  if (!text) return [];
  const str = text.toLowerCase().trim();
  
  const results = [];
  
  // Shorthand match 80k, 1.5 lakh
  const kMatches = [...str.matchAll(/(\d+(?:\.\d+)?)\s*k\b/g)];
  kMatches.forEach(m => results.push(Math.round(parseFloat(m[1]) * 1000)));

  const lakhMatches = [...str.matchAll(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)\b/g)];
  lakhMatches.forEach(m => results.push(Math.round(parseFloat(m[1]) * 100000)));

  if (results.length > 0) return results;

  // Raw digits
  const rawDigits = str.match(/\d+(?:\.\d+)?/g);
  if (rawDigits) {
    rawDigits.forEach(d => {
      const val = parseFloat(d);
      if (!isNaN(val) && val >= 0) results.push(Math.round(val));
    });
  }

  return results;
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
          <strong key={pIdx} className="font-bold text-[#00F5FF]">
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

const STEP_DEFINITIONS = [
  { 
    step: 1, 
    key: 'profile', 
    title: 'Financial Profile', 
    prompt: 'What is your total monthly net income and current liquid savings buffer? (e.g. Income 80k, Savings 2 Lakhs)' 
  },
  { 
    step: 2, 
    key: 'expenses', 
    title: 'Expense Tracker', 
    prompt: 'What are your average monthly essential expenses (rent, utilities) and discretionary spending? (e.g. Essential 30k, Discretionary 15k)' 
  },
  { 
    step: 3, 
    key: 'debt', 
    title: 'Debt Management', 
    prompt: 'Do you have any active loan liabilities or debt obligations? (List total outstanding debt & monthly EMI payments, e.g. Debt 5 Lakhs, EMI 12k)' 
  },
  { 
    step: 4, 
    key: 'portfolio', 
    title: 'Portfolio Holdings', 
    prompt: 'What is the total value of your investment portfolio and asset distribution? (e.g. Stocks 2.5 Lakhs, Crypto 50k)' 
  },
  { 
    step: 5, 
    key: 'credit', 
    title: 'Credit Risk Parameters', 
    prompt: 'What is your estimated credit score range or credit tier? (e.g. 750 Good, 800 Excellent, or 650 Fair)' 
  },
  { 
    step: 6, 
    key: 'goals', 
    title: 'Financial Goals', 
    prompt: 'What is your primary short-term or long-term financial goal and target funding amount? (e.g. House Downpayment 10 Lakhs)' 
  }
];

export function AIRiskAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I am your AI Risk Assistant. Click **\"🪄 Start 6-Step Onboarding\"** to set up your dashboard step-by-step or ask any financial risk question!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);

  // 6-Step Onboarding Wizard State
  const [wizardStep, setWizardStep] = useState(0); // 0=idle, 1..6
  const [wizardData, setWizardData] = useState({
    monthly_income: 75000,
    liquid_savings: 100000,
    essential_expenses: 30000,
    discretionary_expenses: 15000,
    monthly_debt: 12000,
    total_debt: 500000,
    portfolio_value: 250000,
    credit_score: 745,
    goal_name: 'Emergency Fund',
    goal_target: 300000
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

  const start6StepOnboarding = () => {
    setWizardStep(1);
    const msg = `🪄 **6-Step Interactive Onboarding Wizard**\n\nI will guide you through 6 targeted questions to configure your dashboard in real-time!\n\n**Step 1 of 6 (${STEP_DEFINITIONS[0].title})**:\n${STEP_DEFINITIONS[0].prompt}`;
    setMessages(prev => [...prev, { sender: 'ai', text: msg }]);
  };

  const handleSkipStep = () => {
    if (wizardStep === 0) return;
    const currentStepObj = STEP_DEFINITIONS[wizardStep - 1];
    const newMsgs = [...messages, { sender: 'user', text: '⏩ Skip Step' }];

    if (wizardStep < 6) {
      const nextStepObj = STEP_DEFINITIONS[wizardStep];
      setWizardStep(wizardStep + 1);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `Skipped **${currentStepObj.title}**.\n\n**Step ${wizardStep + 1} of 6 (${nextStepObj.title})**:\n${nextStepObj.prompt}`
        }
      ]);
    } else {
      setWizardStep(0);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `🎉 **Onboarding Sequence Complete!** All configured parameters have been live-synced to your dashboard.`
        }
      ]);
    }
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
    if (q.includes('debt service') || q.includes('monthly debt')) {
      return `💳 **Monthly Debt Service** is the total amount of money you pay each month toward all active loan EMIs and credit cards.\n\n• **DTI Benchmark**: Financial advisors recommend keeping total monthly debt service below 36% of net income.`;
    }
    if (q.includes('var') || q.includes('value at risk')) {
      return `📈 **Value at Risk (VaR)** estimates the maximum potential loss your investment portfolio could face over 1 day or 1 month under normal market conditions.`;
    }
    return `🤖 **AI Risk Assistant**: Click **"🪄 Start 6-Step Onboarding"** to set up your financial data step-by-step or ask any risk analytics question.`;
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase().trim();
    const apiBaseUrl = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8000';

    // 1. Explicit Onboarding Trigger
    if (
      lowerQuery.includes('onboarding') ||
      lowerQuery.includes('setup profile') ||
      lowerQuery.includes('start step') ||
      lowerQuery.includes('6-step') ||
      lowerQuery.includes('fill data')
    ) {
      setMessages(prev => [...prev, { sender: 'user', text: query }]);
      setInput('');
      start6StepOnboarding();
      return;
    }

    // 2. Question Interruption during Wizard
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
        reply = data.reply || generateLocalAIResponse(query);
      } catch (err) {
        reply = generateLocalAIResponse(query);
      }

      const stepObj = STEP_DEFINITIONS[wizardStep - 1];
      setMessages([
        ...newMsgs,
        { sender: 'ai', text: reply },
        { sender: 'ai', text: `▶️ **Resuming Step ${wizardStep} of 6 (${stepObj.title})**:\n${stepObj.prompt}` }
      ]);
      setLoading(false);
      return;
    }

    // 3. 6-Step Sequential Onboarding Execution Mode A
    if (wizardStep > 0) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      const currentStepObj = STEP_DEFINITIONS[wizardStep - 1];
      const extractedVals = extractNumbersFromTextLocal(query);

      let ackBadgeText = '';

      // STEP 1: Financial Profile (Income & Liquid Savings)
      if (wizardStep === 1) {
        const income = extractedVals[0] || 75000;
        const savings = extractedVals[1] || extractedVals[0] || 100000;
        const payload = {
          ...wizardData,
          monthly_net_income: income,
          liquid_savings: savings,
          emergency_fund: savings
        };
        setWizardData(payload);
        await updateFinancialProfile(payload);
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Updated Financial Profile (Income: ${formatINR(income)}, Savings: ${formatINR(savings)})`;
      }

      // STEP 2: Expense Tracker (Essential & Discretionary)
      if (wizardStep === 2) {
        const essential = extractedVals[0] || 30000;
        const discretionary = extractedVals[1] || 15000;
        const payload = {
          ...wizardData,
          essential_expenses: essential,
          discretionary_expenses: discretionary
        };
        setWizardData(payload);
        await updateFinancialProfile(payload);
        await addExpense({ name: 'Housing & Rent', category: 'Housing', amount: essential, is_essential: true });
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Updated Expense Tracker (Essential: ${formatINR(essential)}, Discretionary: ${formatINR(discretionary)})`;
      }

      // STEP 3: Debt Management (Total Debt & Monthly EMI)
      if (wizardStep === 3) {
        const totalDebt = extractedVals[0] || 500000;
        const emi = extractedVals[1] || 12000;
        const payload = {
          ...wizardData,
          monthly_debt: emi,
          total_debt: totalDebt
        };
        setWizardData(payload);
        await updateFinancialProfile({ ...payload, monthly_debt_payments: emi });
        await addDebt({ name: 'Primary Loan Liability', debt_type: 'Personal Loan', original_amount: totalDebt, outstanding_balance: totalDebt, interest_rate: 10.5, monthly_emi: emi });
        window.dispatchEvent(new CustomEvent('debtUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Updated Debt Liabilities (Outstanding: ${formatINR(totalDebt)}, Monthly EMI: ${formatINR(emi)})`;
      }

      // STEP 4: Portfolio Holdings (Total Investment & Assets)
      if (wizardStep === 4) {
        const portVal = extractedVals[0] || 250000;
        const payload = { ...wizardData, portfolio_value: portVal };
        setWizardData(payload);
        await addPortfolioHolding({ asset_name: 'Diversified Index Fund', asset_type: 'Stocks', quantity: 1, purchase_price: portVal, current_price: portVal });
        window.dispatchEvent(new CustomEvent('portfolioUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Updated Portfolio Holdings (Total Value: ${formatINR(portVal)})`;
      }

      // STEP 5: Credit Risk Parameters (Credit Score Range)
      if (wizardStep === 5) {
        const score = extractedVals[0] || 750;
        const payload = { ...wizardData, credit_score: score };
        setWizardData(payload);
        await updateCreditParams({ credit_score: score, tier: score >= 750 ? 'Excellent' : score >= 680 ? 'Good' : 'Fair' });
        window.dispatchEvent(new CustomEvent('creditUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Updated Credit Parameters (Estimated Score: ${score})`;
      }

      // STEP 6: Financial Goals (Short/Long term Goal & Target)
      if (wizardStep === 6) {
        const targetAmt = extractedVals[0] || 300000;
        const goalTitle = query.replace(/\d+/g, '').replace(/lakh|lakhs|k/gi, '').trim() || 'Financial Freedom Reserve';
        await addFinancialGoal({ goal_name: goalTitle, target_amount: targetAmt, current_savings: 50000, target_date: '2027-12-31' });
        window.dispatchEvent(new CustomEvent('goalsUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✓ Created Financial Goal Card ("${goalTitle}" - ${formatINR(targetAmt)})`;
      }

      // Progress to Next Step or Complete
      if (wizardStep < 6) {
        const nextStepObj = STEP_DEFINITIONS[wizardStep];
        setWizardStep(wizardStep + 1);
        setMessages([
          ...newMsgs,
          {
            sender: 'ai',
            text: `🟢 **${ackBadgeText}**\n\n**Step ${wizardStep + 1} of 6 (${nextStepObj.title})**:\n${nextStepObj.prompt}`
          }
        ]);
        setLoading(false);
        return;
      }

      // Onboarding Finished
      setWizardStep(0);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `🎉 **6-Step Interactive Onboarding Fully Completed!**\n\n🟢 **${ackBadgeText}**\n\nAll 6 modules (Profile, Expenses, Debts, Portfolio, Credit Risk, and Goals) have been updated live across your active dashboard screens!`
        }
      ]);
      setLoading(false);
      return;
    }

    // 4. Standard Definition Question Answering Mode B
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
          user_context: { platform: 'Finance Risk Analytics Platform' }
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
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#0D111A] hover:bg-[#1E293B] text-[#00F5FF] rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all duration-200 flex items-center gap-2 border-2 border-[#00F5FF]/50 opacity-100 group"
          title="Open AI Risk Assistant"
        >
          <Sparkles className="w-5 h-5 text-[#00F5FF] animate-pulse" />
          <span className="text-xs font-extrabold hidden sm:inline pr-1">AI Risk Assistant</span>
        </button>
      )}

      {/* AI Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[430px] h-[560px] bg-[#0D111A] border border-[#00F5FF]/40 rounded-2xl shadow-[0_0_30px_rgba(0,245,255,0.2)] flex flex-col opacity-100 overflow-hidden font-sans">
          {/* Header with Step Progress Tracker */}
          <div className="p-4 bg-[#07080D] text-white flex flex-col gap-2 border-b border-[#00F5FF]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#00F5FF]/10 rounded-lg border border-[#00F5FF]/30">
                  <Bot className="w-5 h-5 text-[#00F5FF]" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white tracking-wide font-display">AI Risk Assistant</h3>
                  <span className="text-[10px] text-[#00F5A0] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-ping" />
                    {wizardStep > 0 ? `Step ${wizardStep} of 6: ${STEP_DEFINITIONS[wizardStep - 1].title}` : 'Gemini 2.5 LLM Active'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#A0AEC0] hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar when Wizard Active */}
            {wizardStep > 0 && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-gradient-to-r from-[#00F5FF] to-[#00F5A0] h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,245,255,0.8)]"
                  style={{ width: `${(wizardStep / 6) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Quick Prompt Action Pills */}
          <div className="p-2.5 bg-[#07080D] border-b border-[#00F5FF]/20 overflow-x-auto flex gap-1.5 no-scrollbar">
            <button
              onClick={start6StepOnboarding}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#00F5FF] text-[#0A0B10] shadow-[0_0_10px_rgba(0,245,255,0.4)] whitespace-nowrap hover:bg-[#00F5A0] transition-colors flex items-center gap-1 shrink-0"
            >
              <Wand2 className="w-3 h-3 text-[#0A0B10]" />
              🪄 Start 6-Step Onboarding
            </button>

            {wizardStep > 0 && (
              <button
                onClick={handleSkipStep}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap hover:bg-amber-500/30 transition-colors flex items-center gap-1 shrink-0"
              >
                <SkipForward className="w-3 h-3" />
                ⏩ Skip Step
              </button>
            )}

            <button
              onClick={() => handleSend("What is Value at Risk (VaR)?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#0D111A] text-[#00F5FF] border border-[#00F5FF]/30 whitespace-nowrap hover:bg-[#1E293B] transition-colors shrink-0"
            >
              📈 What is VaR?
            </button>
            <button
              onClick={() => handleSend("What is Monthly Debt Service?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#0D111A] text-amber-300 border border-amber-500/30 whitespace-nowrap hover:bg-[#1E293B] transition-colors shrink-0"
            >
              💳 Debt Service
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#07080D]/60 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-[#00F5FF] text-[#0A0B10] flex items-center justify-center shrink-0 mt-0.5 font-extrabold text-[10px]">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed opacity-100 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#00F5FF] text-[#0A0B10] rounded-br-none shadow-sm font-bold'
                      : 'bg-[#0A0B10] text-[#FFFFFF] border border-[#00F5FF]/20 rounded-bl-none shadow-sm'
                  }`}
                >
                  {formatMessageContent(msg.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[#A0AEC0] text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00F5FF]" />
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
            className="p-3 bg-[#07080D] border-t border-[#00F5FF]/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                wizardStep > 0
                  ? `Step ${wizardStep} of 6 (${STEP_DEFINITIONS[wizardStep - 1].title}): Enter values...`
                  : "Ask any definition or click 'Start 6-Step Onboarding'..."
              }
              className="flex-1 px-3 py-2 bg-[#0D111A] border border-[#00F5FF]/30 rounded-xl text-xs text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00F5FF]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-[#00F5FF] hover:bg-[#00F5A0] text-[#0A0B10] rounded-xl disabled:opacity-40 transition-colors font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
