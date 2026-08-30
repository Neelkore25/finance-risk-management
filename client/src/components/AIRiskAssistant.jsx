import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  RefreshCw, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  SkipForward, 
  Check, 
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
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

// Helper: Check for explicit "zero", "none", or "no" statements
function isZeroOrNone(text) {
  if (!text) return false;
  const str = text.toLowerCase().trim();
  return (
    str === '0' ||
    str === 'none' ||
    str === 'nil' ||
    str === 'no' ||
    str === 'nothing' ||
    str === 'na' ||
    str === 'n/a' ||
    str === 'zero' ||
    /\b(no debt|no loans?|no liabilities|zero debt|zero loans?|no emi|no expenses?|no savings?|no investments?|no portfolio|zero balance)\b/i.test(str)
  );
}

// Helper: Parse numerical amounts with Indian (Crore, Lakh, k) and standard notation
function parseAmountString(str) {
  if (!str) return null;
  const s = str.toLowerCase().replace(/,/g, '').trim();

  // Match crore / cr (10,000,000)
  const crMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

  // Match lakh / lakhs / lac / lacs / l (100,000)
  const lakhMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  // Match k / thousand (1,000)
  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  // Match pure digits / currency
  const rawMatch = s.match(/(?:₹|\$)?\s*(\d+(?:\.\d+)?)/);
  if (rawMatch) {
    const val = parseFloat(rawMatch[1]);
    if (!isNaN(val) && val >= 0) return Math.round(val);
  }

  return null;
}

// Helper: Smart, label-aware entity extractor
function extractLabeledFinancialEntities(text) {
  const str = text.toLowerCase();
  const entities = {};

  // 1. Income
  const incomeRegex = /(?:income|salary|earn(?:ings?)?|monthly net|take home|pay|in hand)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const incomeMatch = str.match(incomeRegex);
  if (incomeMatch) {
    entities.income = parseAmountString(incomeMatch[1]);
  }

  // 2. Savings
  const savingsRegex = /(?:savings?|liquid|buffer|reserve|emergency fund|bank balance|fd|deposit)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const savingsMatch = str.match(savingsRegex);
  if (savingsMatch) {
    entities.savings = parseAmountString(savingsMatch[1]);
  }

  // 3. Essential Expenses
  const essentialRegex = /(?:essential|fixed|rent|utilities|bills|groceries|food|needs)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const essentialMatch = str.match(essentialRegex);
  if (essentialMatch) {
    entities.essential = parseAmountString(essentialMatch[1]);
  }

  // 4. Discretionary Expenses
  const discretionaryRegex = /(?:discretionary|optional|entertainment|shopping|dining|leisure|wants|lifestyle|extra)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const discretionaryMatch = str.match(discretionaryRegex);
  if (discretionaryMatch) {
    entities.discretionary = parseAmountString(discretionaryMatch[1]);
  }

  // 5. Total Debt
  const debtRegex = /(?:total debt|outstanding|loan amount|principal|liability|liabilities|total loan|borrowed|debt)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const debtMatch = str.match(debtRegex);
  if (debtMatch) {
    entities.total_debt = parseAmountString(debtMatch[1]);
  }

  // 6. Monthly EMI
  const emiRegex = /(?:emi|monthly payment|monthly debt|installment|per month)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i;
  const emiMatch = str.match(emiRegex);
  if (emiMatch) {
    entities.monthly_debt = parseAmountString(emiMatch[1]);
  }

  // 7. Portfolio Holdings Breakdown
  const portfolioHoldings = [];
  const stockMatch = str.match(/(?:stocks?|equity|equities|shares)\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (stockMatch) {
    const val = parseAmountString(stockMatch[1]);
    if (val) portfolioHoldings.push({ name: 'Direct Equities / Stocks', type: 'Stocks', amount: val });
  }

  const cryptoMatch = str.match(/(?:crypto|cryptocurrency|bitcoin|btc|eth|ethereum)\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (cryptoMatch) {
    const val = parseAmountString(cryptoMatch[1]);
    if (val) portfolioHoldings.push({ name: 'Crypto Holdings', type: 'Crypto', amount: val });
  }

  const mfMatch = str.match(/(?:mutual funds?|mf|etfs?|index funds?)\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (mfMatch) {
    const val = parseAmountString(mfMatch[1]);
    if (val) portfolioHoldings.push({ name: 'Mutual Funds / ETFs', type: 'Mutual Funds', amount: val });
  }

  const bondMatch = str.match(/(?:bonds?|fd|fixed deposits?|debt funds?|g-secs?)\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (bondMatch) {
    const val = parseAmountString(bondMatch[1]);
    if (val) portfolioHoldings.push({ name: 'Bonds & Fixed Income', type: 'Bonds', amount: val });
  }

  const goldMatch = str.match(/(?:gold|silver|commodit(?:y|ies))\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (goldMatch) {
    const val = parseAmountString(goldMatch[1]);
    if (val) portfolioHoldings.push({ name: 'Gold / Commodities', type: 'Commodities', amount: val });
  }

  if (portfolioHoldings.length > 0) {
    entities.holdings = portfolioHoldings;
    entities.portfolio_total = portfolioHoldings.reduce((sum, h) => sum + h.amount, 0);
  } else {
    const portMatch = str.match(/(?:portfolio|investments?|total assets?)\s*(?:is|of|worth|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
    if (portMatch) {
      entities.portfolio_total = parseAmountString(portMatch[1]);
    }
  }

  // 8. Credit Score
  const scoreMatch = str.match(/\b([3-8]\d{2})\b/);
  if (scoreMatch) {
    const sc = parseInt(scoreMatch[1], 10);
    if (sc >= 300 && sc <= 850) {
      entities.credit_score = sc;
    }
  }
  if (!entities.credit_score) {
    if (/\b(excellent|exceptional)\b/i.test(str)) entities.credit_score = 780;
    else if (/\b(good|very good)\b/i.test(str)) entities.credit_score = 720;
    else if (/\b(fair|average)\b/i.test(str)) entities.credit_score = 650;
    else if (/\b(poor|bad)\b/i.test(str)) entities.credit_score = 550;
  }

  // Generic fallback: all numbers in order
  const allNumbers = [];
  const tokenMatches = [...str.matchAll(/(\d+(?:\.\d+)?)\s*(crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?\b/gi)];
  tokenMatches.forEach(m => {
    const parsed = parseAmountString(m[0]);
    if (parsed !== null && !isNaN(parsed)) {
      allNumbers.push(parsed);
    }
  });
  entities.rawNumbers = allNumbers;

  return entities;
}

// Markdown formatting utility for AI messages
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
          <strong key={pIdx} className="font-bold text-sky-600 dark:text-cyan-400">
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
    prompt: 'What is your total monthly net income and current liquid savings buffer? (e.g. "Income 80k, Savings 2 Lakhs" or "0" if none)' 
  },
  { 
    step: 2, 
    key: 'expenses', 
    title: 'Expense Tracker', 
    prompt: 'What are your average monthly essential expenses (rent, bills) and discretionary spending? (e.g. "Essential 30k, Discretionary 15k")' 
  },
  { 
    step: 3, 
    key: 'debt', 
    title: 'Debt Management', 
    prompt: 'Do you have any active loan liabilities or debt obligations? (e.g. "Debt 5 Lakhs, EMI 12k" or "no debt" if none)' 
  },
  { 
    step: 4, 
    key: 'portfolio', 
    title: 'Portfolio Holdings', 
    prompt: 'What is your investment portfolio value and allocation? (e.g. "50k in stocks, 20k in crypto" or "0" if none)' 
  },
  { 
    step: 5, 
    key: 'credit', 
    title: 'Credit Risk Parameters', 
    prompt: 'What is your estimated credit score range or credit tier? (e.g. "750 Good", "800", or "650 Fair")' 
  },
  { 
    step: 6, 
    key: 'goals', 
    title: 'Financial Goals', 
    prompt: 'What is your primary financial goal and target amount? (e.g. "House Downpayment 10 Lakhs" or "Emergency Fund 3 Lakhs")' 
  }
];

export function AIRiskAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I am your **AI Risk Assistant**, grounded in your real-time risk calculations.\n\nClick **\"🪄 Start 6-Step Onboarding\"** to configure your profile step-by-step, paste a full financial summary in one sentence, or ask any question about your risk metrics!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [llmStatus, setLlmStatus] = useState('checking'); // 'gemini_active' | 'offline_mode' | 'checking'

  // 6-Step Onboarding Wizard State
  const [wizardStep, setWizardStep] = useState(0); // 0=idle, 1..6
  const [wizardData, setWizardData] = useState({});

  // One-shot multi-field pending confirmation state
  const [pendingBatchUpdate, setPendingBatchUpdate] = useState(null);

  const chatEndRef = useRef(null);

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
    } catch (err) {
      console.warn('Could not load live risk context for AI assistant:', err);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadRiskContext();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const start6StepOnboarding = () => {
    setWizardStep(1);
    setPendingBatchUpdate(null);
    const msg = `🪄 **6-Step Interactive Onboarding Wizard**\n\nI will guide you through 6 quick questions to configure your dashboard with real numbers!\n\n**Step 1 of 6 (${STEP_DEFINITIONS[0].title})**:\n${STEP_DEFINITIONS[0].prompt}`;
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
          text: `Skipped **${currentStepObj.title}** (marked as not provided).\n\n**Step ${wizardStep + 1} of 6 (${nextStepObj.title})**:\n${nextStepObj.prompt}`
        }
      ]);
    } else {
      setWizardStep(0);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `🎉 **Onboarding Sequence Complete!** All provided data has been saved and your dashboard is live.`
        }
      ]);
    }
  };

  // Disambiguate question vs answer
  const isPureQuestion = (text, step) => {
    const q = text.toLowerCase().trim();
    const hasQuestionLead = 
      q.startsWith('what is') || 
      q.startsWith('what does') || 
      q.startsWith('explain') || 
      q.startsWith('define') || 
      q.startsWith('meaning of') || 
      q.startsWith('why is') || 
      q.startsWith('how do') || 
      q.startsWith('how is');

    if (!hasQuestionLead) return false;

    // If text also contains an extractable numeric answer for current step, prioritize answer
    const entities = extractLabeledFinancialEntities(text);
    if (isZeroOrNone(text) || (entities.rawNumbers && entities.rawNumbers.length > 0)) {
      return false; // has numbers, so treat as answer
    }

    return true;
  };

  // Local fallback response grounded in user's real loaded metrics
  const generateLocalAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();

    if (!contextData) {
      return "I'm currently loading your live financial data from the database — one moment, please!";
    }

    const { personal, portfolio, credit } = contextData;
    const m = personal?.metrics || {};

    // 1. Debt-to-Income (DTI)
    if (q.includes('dti') || q.includes('debt to income') || q.includes('debt ratio')) {
      const dti = m.dtiRatio !== undefined ? `${m.dtiRatio}%` : 'Not yet calculated';
      const monthlyDebt = m.monthlyDebtPayments !== undefined ? formatINR(m.monthlyDebtPayments) : '₹0';
      const monthlyIncome = m.monthlyNetIncome !== undefined ? formatINR(m.monthlyNetIncome) : '₹0';
      return `💳 **Your Current DTI Ratio is ${dti}**\n\n• **Monthly Debt Service (EMI):** ${monthlyDebt}\n• **Monthly Net Income:** ${monthlyIncome}\n• **Target Benchmark:** Financial guidelines recommend keeping DTI **≤ 36%**. ${
        m.dtiRatio > 36 
          ? '⚠️ Your DTI exceeds recommended levels. Prioritize paying down high-interest liabilities.' 
          : '✅ Your debt service is within healthy prudential limits.'
      }`;
    }

    // 2. Value at Risk (VaR)
    if (q.includes('var') || q.includes('value at risk') || q.includes('portfolio risk')) {
      const totalVal = portfolio?.totalValue ? formatINR(portfolio.totalValue) : '₹0';
      const varPct = portfolio?.metrics?.historicalVaR1DayPct !== undefined ? `${portfolio.metrics.historicalVaR1DayPct}%` : 'N/A';
      const varAmt = portfolio?.metrics?.historicalVaR1DayAmount !== undefined ? formatINR(portfolio.metrics.historicalVaR1DayAmount) : 'N/A';
      return `📈 **Quantitative Value at Risk (VaR) Analysis**\n\n• **Portfolio Asset Value:** ${totalVal}\n• **1-Day Historical VaR (95% Confidence):** ${varPct} (${varAmt})\n\n**What this means:** Under 95% of normal trading days, your estimated 1-day maximum portfolio loss will not exceed ${varAmt}.`;
    }

    // 3. Overall Risk Score
    if (q.includes('risk score') || q.includes('overall risk') || q.includes('my risk')) {
      const score = personal?.overallScore !== undefined ? `${personal.overallScore}/100` : 'Not calculated';
      const level = personal?.overallLevel || 'Evaluating';
      const savingsRate = m.savingsRate !== undefined ? `${m.savingsRate}%` : 'N/A';
      return `🛡️ **Your Overall Risk Assessment: ${score} (${level})**\n\n• **Savings Rate:** ${savingsRate}\n• **Emergency Coverage:** ${m.emergencyCoverageMonths || 0} months of expenses\n• **Net Cash Flow:** ${formatINR(m.netCashFlow || 0)} / month\n\n${personal?.overallSummary || 'Multi-factor quantitative risk model active across 5 deterministic risk categories.'}`;
    }

    // 4. Credit Score
    if (q.includes('credit') || q.includes('score') || q.includes('default probability')) {
      const score = credit?.creditScore || 720;
      const tier = credit?.tier || 'Good';
      const prob = credit?.probDefault !== undefined ? `${credit.probDefault}%` : '8.0%';
      return `📊 **Credit Risk & Underwriting Profile**\n\n• **Credit Score:** ${score} (${tier})\n• **Estimated Default Probability:** ${prob}\n• **Evaluation Model:** Logistic ML underwriting assessment based on income stability, debt obligations, and savings liquidity.`;
    }

    // 5. Emergency Fund & Buffer
    if (q.includes('emergency') || q.includes('savings buffer') || q.includes('reserve')) {
      const fund = formatINR(m.emergencyFund || m.liquidSavings || 0);
      const months = m.emergencyCoverageMonths || 0;
      return `🏦 **Emergency Buffer Status**\n\n• **Current Liquid Reserves:** ${fund}\n• **Expense Runway:** ${months} months of essential expenses\n• **Target Recommendation:** 6 months of essential living expenses for financial resilience.`;
    }

    // Generic Fintech Definition fallback
    return `🤖 **Finance Risk Assistant**:\nI can help you analyze your **DTI ratio**, **1-Day VaR**, **Credit Score**, **Cash Flow**, or guide you through setting up your profile via **"🪄 Start 6-Step Onboarding"**.\n\nYou can also type a full financial summary in one sentence (e.g. *"I earn 80k, have 2 lakhs savings, 5 lakhs debt with 12k EMI, and 3 lakhs in stocks"*).`;
  };

  // Secure Server-side Call to Supabase Edge Function (Gemini Proxy)
  const callAiAssistantService = async (queryText) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pxxqrrnpbpldyslseegy.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__T31MM88-paDjC7ejcFWlw_cejGuMls';

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-assistant`;

      const res = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          prompt: queryText,
          user_context: contextData,
          mode: 'chat'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Supabase Edge Function response not ok:', res.status, errJson);
        setLlmStatus('offline_mode');
        return null;
      }

      const data = await res.json();
      if (data && data.reply) {
        setLlmStatus('gemini_active');
        return data.reply;
      }

      setLlmStatus('offline_mode');
      return null;
    } catch (err) {
      console.warn('Edge Function proxy unavailable, falling back to local engine:', err);
      setLlmStatus('offline_mode');
      return null;
    }
  };

  // Apply pending one-shot multi-field update
  const handleApplyBatchUpdate = async () => {
    if (!pendingBatchUpdate) return;
    setLoading(true);
    try {
      const { income, savings, essential, discretionary, total_debt, monthly_debt, holdings, portfolio_total, credit_score } = pendingBatchUpdate;

      // 1. Profile Update
      const profilePayload = {
        monthly_net_income: income !== undefined ? income : 0,
        liquid_savings: savings !== undefined ? savings : 0,
        emergency_fund: savings !== undefined ? savings : 0,
        essential_expenses: essential !== undefined ? essential : 0,
        discretionary_expenses: discretionary !== undefined ? discretionary : 0,
        total_debt: total_debt !== undefined ? total_debt : 0,
        monthly_debt_payments: monthly_debt !== undefined ? monthly_debt : 0
      };
      await updateFinancialProfile(profilePayload);

      // 2. Debts
      if (total_debt && total_debt > 0) {
        await addDebt({
          name: 'Primary Debt Obligation',
          debt_type: 'Personal Loan',
          original_amount: total_debt,
          outstanding_balance: total_debt,
          interest_rate: 10.5,
          monthly_emi: monthly_debt || Math.round(total_debt * 0.02)
        });
      }

      // 3. Portfolio Holdings
      if (holdings && holdings.length > 0) {
        for (const h of holdings) {
          await addPortfolioHolding({
            asset_name: h.name,
            asset_type: h.type,
            quantity: 1,
            purchase_price: h.amount,
            current_price: h.amount
          });
        }
      } else if (portfolio_total && portfolio_total > 0) {
        await addPortfolioHolding({
          asset_name: 'Diversified Asset Portfolio',
          asset_type: 'Stocks',
          quantity: 1,
          purchase_price: portfolio_total,
          current_price: portfolio_total
        });
      }

      // 4. Credit
      if (credit_score) {
        await updateCreditParams({
          credit_score,
          tier: credit_score >= 750 ? 'Excellent' : credit_score >= 680 ? 'Good' : 'Fair'
        });
      }

      // Dispatch real-time refresh events
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      window.dispatchEvent(new CustomEvent('expensesUpdated'));
      window.dispatchEvent(new CustomEvent('debtUpdated'));
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
      window.dispatchEvent(new CustomEvent('creditUpdated'));

      setPendingBatchUpdate(null);
      await loadRiskContext();

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `🎉 **Financial Profile Successfully Synchronized!**\n\nAll verified numbers have been written to your database and your dashboard risk scores have updated live.`
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `❌ **Update Failed**: ${err.message || 'Error writing to database.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase().trim();

    // Check for user confirming pending batch update
    if (pendingBatchUpdate && (lowerQuery === 'yes' || lowerQuery === 'confirm' || lowerQuery === 'apply' || lowerQuery === 'save' || lowerQuery === 'ok')) {
      setInput('');
      setMessages(prev => [...prev, { sender: 'user', text: query }]);
      await handleApplyBatchUpdate();
      return;
    }

    if (pendingBatchUpdate && (lowerQuery === 'no' || lowerQuery === 'cancel' || lowerQuery === 'discard')) {
      setInput('');
      setPendingBatchUpdate(null);
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: query },
        { sender: 'ai', text: 'Cancelled. What else would you like to check or update?' }
      ]);
      return;
    }

    // 1. Explicit Onboarding Trigger
    if (
      lowerQuery.includes('start onboarding') ||
      lowerQuery.includes('6-step') ||
      lowerQuery.includes('setup wizard') ||
      lowerQuery.includes('fill data')
    ) {
      setMessages(prev => [...prev, { sender: 'user', text: query }]);
      setInput('');
      start6StepOnboarding();
      return;
    }

    // 2. Question Interruption during Wizard
    if (wizardStep > 0 && isPureQuestion(query, wizardStep)) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      const llmReply = await callAiAssistantService(query);
      const reply = llmReply || generateLocalAIResponse(query);

      const stepObj = STEP_DEFINITIONS[wizardStep - 1];
      setMessages([
        ...newMsgs,
        { sender: 'ai', text: reply },
        { sender: 'ai', text: `▶️ **Resuming Step ${wizardStep} of 6 (${stepObj.title})**:\n${stepObj.prompt}` }
      ]);
      setLoading(false);
      return;
    }

    // 3. 6-Step Sequential Onboarding Execution
    if (wizardStep > 0) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      const entities = extractLabeledFinancialEntities(query);
      const isZero = isZeroOrNone(query);
      let ackBadgeText = '';
      let stepSuccessful = false;

      // STEP 1: Financial Profile (Income & Liquid Savings)
      if (wizardStep === 1) {
        let income = entities.income !== undefined ? entities.income : null;
        let savings = entities.savings !== undefined ? entities.savings : null;

        if (income === null && savings === null) {
          if (isZero) {
            income = 0;
            savings = 0;
          } else if (entities.rawNumbers && entities.rawNumbers.length >= 2) {
            income = entities.rawNumbers[0];
            savings = entities.rawNumbers[1];
          } else if (entities.rawNumbers && entities.rawNumbers.length === 1) {
            income = entities.rawNumbers[0];
            savings = 0;
          }
        }

        if (income === null && savings === null) {
          // Could not extract any valid number
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ I couldn't identify your income or savings numbers from that. Could you provide a clear number, e.g. **"Income 80k, Savings 2 Lakhs"** or **"0"** if none?`
            }
          ]);
          setLoading(false);
          return;
        }

        const finalIncome = income !== null ? income : 0;
        const finalSavings = savings !== null ? savings : 0;

        const payload = {
          ...wizardData,
          monthly_net_income: finalIncome,
          liquid_savings: finalSavings,
          emergency_fund: finalSavings
        };
        setWizardData(payload);
        await updateFinancialProfile(payload);
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `Updated Financial Profile (Income: ${formatINR(finalIncome)}, Savings: ${formatINR(finalSavings)})`;
        stepSuccessful = true;
      }

      // STEP 2: Expense Tracker (Essential & Discretionary)
      if (wizardStep === 2) {
        let essential = entities.essential !== undefined ? entities.essential : null;
        let discretionary = entities.discretionary !== undefined ? entities.discretionary : null;

        if (essential === null && discretionary === null) {
          if (isZero) {
            essential = 0;
            discretionary = 0;
          } else if (entities.rawNumbers && entities.rawNumbers.length >= 2) {
            essential = entities.rawNumbers[0];
            discretionary = entities.rawNumbers[1];
          } else if (entities.rawNumbers && entities.rawNumbers.length === 1) {
            essential = entities.rawNumbers[0];
            discretionary = 0;
          }
        }

        if (essential === null && discretionary === null) {
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ I couldn't find your expense amounts. Please provide a breakdown like **"Essential 30k, Discretionary 15k"** or **"0"** if none.`
            }
          ]);
          setLoading(false);
          return;
        }

        const finalEss = essential !== null ? essential : 0;
        const finalDisc = discretionary !== null ? discretionary : 0;

        const payload = {
          ...wizardData,
          essential_expenses: finalEss,
          discretionary_expenses: finalDisc
        };
        setWizardData(payload);
        await updateFinancialProfile(payload);
        if (finalEss > 0) {
          await addExpense({ name: 'Essential Living & Housing', category: 'Housing', amount: finalEss, is_essential: true });
        }
        if (finalDisc > 0) {
          await addExpense({ name: 'Discretionary Spending', category: 'Entertainment', amount: finalDisc, is_essential: false });
        }
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `Updated Expenses (Essential: ${formatINR(finalEss)}, Discretionary: ${formatINR(finalDisc)})`;
        stepSuccessful = true;
      }

      // STEP 3: Debt Management (Total Debt & Monthly EMI)
      if (wizardStep === 3) {
        let totalDebt = entities.total_debt !== undefined ? entities.total_debt : null;
        let emi = entities.monthly_debt !== undefined ? entities.monthly_debt : null;

        if (isZero) {
          totalDebt = 0;
          emi = 0;
        } else if (totalDebt === null && emi === null) {
          if (entities.rawNumbers && entities.rawNumbers.length >= 2) {
            totalDebt = entities.rawNumbers[0];
            emi = entities.rawNumbers[1];
          } else if (entities.rawNumbers && entities.rawNumbers.length === 1) {
            totalDebt = entities.rawNumbers[0];
            emi = Math.round(totalDebt * 0.02); // reasonable 2% monthly service estimate if not provided
          }
        }

        if (totalDebt === null) {
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ I couldn't identify your debt amount. Tell me your outstanding loan and EMI (e.g. **"Debt 5 Lakhs, EMI 12k"**) or type **"no debt"** if you have zero loans.`
            }
          ]);
          setLoading(false);
          return;
        }

        const finalDebt = totalDebt !== null ? totalDebt : 0;
        const finalEmi = emi !== null ? emi : 0;

        const payload = {
          ...wizardData,
          total_debt: finalDebt,
          monthly_debt: finalEmi
        };
        setWizardData(payload);
        await updateFinancialProfile({ ...payload, monthly_debt_payments: finalEmi });
        if (finalDebt > 0) {
          await addDebt({
            name: 'Primary Loan Obligation',
            debt_type: 'Personal Loan',
            original_amount: finalDebt,
            outstanding_balance: finalDebt,
            interest_rate: 10.5,
            monthly_emi: finalEmi
          });
        }
        window.dispatchEvent(new CustomEvent('debtUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = finalDebt === 0 
          ? `Zero Debt Registered (₹0 obligations)` 
          : `Updated Debt (Outstanding: ${formatINR(finalDebt)}, EMI: ${formatINR(finalEmi)})`;
        stepSuccessful = true;
      }

      // STEP 4: Portfolio Holdings (Total Investment & Assets)
      if (wizardStep === 4) {
        let portVal = entities.portfolio_total !== undefined ? entities.portfolio_total : null;
        let holdings = entities.holdings || [];

        if (isZero) {
          portVal = 0;
          holdings = [];
        } else if (portVal === null && holdings.length === 0) {
          if (entities.rawNumbers && entities.rawNumbers.length > 0) {
            portVal = entities.rawNumbers[0];
            holdings = [{ name: 'Direct Equity / Index Fund', type: 'Stocks', amount: portVal }];
          }
        }

        if (portVal === null && holdings.length === 0 && !isZero) {
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ I couldn't find your portfolio numbers. Please specify your asset holdings, e.g. **"50k in stocks, 20k in crypto"** or **"0"** if none.`
            }
          ]);
          setLoading(false);
          return;
        }

        const finalPortVal = portVal !== null ? portVal : holdings.reduce((sum, h) => sum + h.amount, 0);

        if (holdings.length > 0) {
          for (const h of holdings) {
            await addPortfolioHolding({
              asset_name: h.name,
              asset_type: h.type,
              quantity: 1,
              purchase_price: h.amount,
              current_price: h.amount
            });
          }
        } else if (finalPortVal > 0) {
          await addPortfolioHolding({
            asset_name: 'Diversified Equity Fund',
            asset_type: 'Stocks',
            quantity: 1,
            purchase_price: finalPortVal,
            current_price: finalPortVal
          });
        }

        setWizardData(prev => ({ ...prev, portfolio_value: finalPortVal }));
        window.dispatchEvent(new CustomEvent('portfolioUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = finalPortVal === 0
          ? `Zero Portfolio Value Registered`
          : `Updated Portfolio Holdings (Total: ${formatINR(finalPortVal)})`;
        stepSuccessful = true;
      }

      // STEP 5: Credit Risk Parameters (Credit Score Range)
      if (wizardStep === 5) {
        let score = entities.credit_score || null;

        if (isZero) {
          score = 700; // neutral median if user has no formal credit file
        } else if (!score && entities.rawNumbers && entities.rawNumbers.length > 0) {
          const raw = entities.rawNumbers[0];
          if (raw >= 300 && raw <= 850) score = raw;
        }

        if (!score) {
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ Please provide a 3-digit score between **300 and 850** (e.g. **"750"**) or tier like **"Good"** / **"Excellent"**.`
            }
          ]);
          setLoading(false);
          return;
        }

        await updateCreditParams({
          credit_score: score,
          tier: score >= 750 ? 'Excellent' : score >= 680 ? 'Good' : 'Fair'
        });
        window.dispatchEvent(new CustomEvent('creditUpdated'));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `Updated Credit Score (${score} - ${score >= 750 ? 'Excellent' : score >= 680 ? 'Good' : 'Fair'})`;
        stepSuccessful = true;
      }

      // STEP 6: Financial Goals (Short/Long term Goal & Target)
      if (wizardStep === 6) {
        let targetAmt = entities.rawNumbers && entities.rawNumbers.length > 0 ? entities.rawNumbers[0] : null;
        let goalTitle = query.replace(/\d+/g, '').replace(/crore|crores|cr|lakh|lakhs|lac|k|thousand/gi, '').trim();

        if (isZero) {
          targetAmt = 0;
          goalTitle = 'General Financial Buffer';
        }

        if (!targetAmt && !isZero) {
          setMessages([
            ...newMsgs,
            {
              sender: 'ai',
              text: `⚠️ Please specify a target funding amount for your goal, e.g. **"House Downpayment 10 Lakhs"** or type **"skip"**.`
            }
          ]);
          setLoading(false);
          return;
        }

        if (targetAmt > 0) {
          await addFinancialGoal({
            goal_name: goalTitle || 'Primary Financial Milestone',
            target_amount: targetAmt,
            current_savings: Math.round(targetAmt * 0.1),
            target_date: '2028-12-31'
          });
          window.dispatchEvent(new CustomEvent('goalsUpdated'));
          window.dispatchEvent(new CustomEvent('profileUpdated'));
          ackBadgeText = `Created Financial Goal ("${goalTitle || 'Primary Milestone'}" - ${formatINR(targetAmt)})`;
        } else {
          ackBadgeText = 'Goal step acknowledged.';
        }
        stepSuccessful = true;
      }

      // Progress to Next Step or Complete
      if (stepSuccessful) {
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
        await loadRiskContext();
        setMessages([
          ...newMsgs,
          {
            sender: 'ai',
            text: `🎉 **6-Step Interactive Onboarding Completed!**\n\n🟢 **${ackBadgeText}**\n\nAll real financial parameters have been live-synced to your dashboard and analytical risk models!`
          }
        ]);
        setLoading(false);
        return;
      }
    }

    // 4. One-Shot Multi-Field Free-Form Parser (Outside Wizard)
    const entities = extractLabeledFinancialEntities(query);
    const parsedFieldsCount = [
      entities.income, 
      entities.savings, 
      entities.essential, 
      entities.discretionary, 
      entities.total_debt, 
      entities.monthly_debt, 
      entities.portfolio_total, 
      entities.credit_score
    ].filter(v => v !== undefined && v !== null).length;

    if (parsedFieldsCount >= 2) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');

      setPendingBatchUpdate(entities);

      const summaryList = [];
      if (entities.income !== undefined) summaryList.push(`• **Monthly Net Income:** ${formatINR(entities.income)}`);
      if (entities.savings !== undefined) summaryList.push(`• **Liquid Savings Buffer:** ${formatINR(entities.savings)}`);
      if (entities.essential !== undefined) summaryList.push(`• **Essential Expenses:** ${formatINR(entities.essential)}`);
      if (entities.discretionary !== undefined) summaryList.push(`• **Discretionary Spending:** ${formatINR(entities.discretionary)}`);
      if (entities.total_debt !== undefined) summaryList.push(`• **Total Outstanding Debt:** ${formatINR(entities.total_debt)}`);
      if (entities.monthly_debt !== undefined) summaryList.push(`• **Monthly EMI / Debt Service:** ${formatINR(entities.monthly_debt)}`);
      if (entities.holdings && entities.holdings.length > 0) {
        entities.holdings.forEach(h => summaryList.push(`• **Portfolio Asset (${h.name}):** ${formatINR(h.amount)}`));
      } else if (entities.portfolio_total !== undefined) {
        summaryList.push(`• **Total Portfolio Value:** ${formatINR(entities.portfolio_total)}`);
      }
      if (entities.credit_score !== undefined) summaryList.push(`• **Credit Score:** ${entities.credit_score}`);

      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `📋 **I detected the following details from your financial summary:**\n\n${summaryList.join('\n')}\n\n**Would you like me to update your dashboard with these numbers?**\n(Click **"Apply to Profile"** below or reply **"Yes"** to confirm, or **"No"** to cancel.)`
        }
      ]);
      return;
    }

    // 5. Standard Question Answering with Server-side Gemini Edge Function
    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    const llmReply = await callAiAssistantService(query);
    const reply = llmReply || generateLocalAIResponse(query);

    setMessages([...newMsgs, { sender: 'ai', text: reply }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-[#1E293B] text-blue-600 dark:text-cyan-400 rounded-full shadow-xl transition-all duration-200 flex items-center gap-2 border border-slate-200 dark:border-slate-800 group"
          title="Open AI Risk Assistant"
        >
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400 animate-pulse" />
          <span className="text-xs font-extrabold hidden sm:inline pr-1 text-slate-900 dark:text-white">AI Risk Assistant</span>
        </button>
      )}

      {/* AI Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100">
          {/* Header with Step Progress Tracker & LLM Live Badge */}
          <div className="p-4 bg-slate-50 dark:bg-[#0B0F17] flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-sky-950/40 rounded-xl border border-blue-200 dark:border-sky-800">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wide font-display">AI Risk Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {wizardStep > 0 ? (
                      <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold">
                        Step {wizardStep} of 6: {STEP_DEFINITIONS[wizardStep - 1].title}
                      </span>
                    ) : llmStatus === 'gemini_active' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Gemini 2.5 Flash Grounded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live Risk Intelligence Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar when Wizard Active */}
            {wizardStep > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-blue-600 dark:bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${(wizardStep / 6) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Quick Prompt Action Pills */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar">
            <button
              onClick={start6StepOnboarding}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white shadow-sm whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <Wand2 className="w-3 h-3 text-white" />
              🪄 6-Step Onboarding
            </button>

            {wizardStep > 0 && (
              <button
                onClick={handleSkipStep}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap hover:bg-amber-200 transition-colors flex items-center gap-1 shrink-0"
              >
                <SkipForward className="w-3 h-3" />
                ⏩ Skip Step
              </button>
            )}

            <button
              onClick={() => handleSend("What is my current DTI risk and how can I lower it?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-[#111827] text-blue-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
            >
              💳 My DTI Risk?
            </button>
            <button
              onClick={() => handleSend("What is my portfolio Value at Risk (VaR)?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-[#111827] text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-800 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
            >
              📈 My Portfolio VaR?
            </button>
            <button
              onClick={() => handleSend("What is my overall financial risk score?")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
            >
              🛡️ Overall Score?
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/60 dark:bg-[#07080D]/60 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-cyan-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-extrabold text-[10px]">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed text-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 dark:bg-cyan-500 text-white rounded-br-none shadow-sm font-semibold'
                      : 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {formatMessageContent(msg.text)}
                </div>
              </div>
            ))}

            {/* Inline Confirmation Card for One-Shot Multi-Field Input */}
            {pendingBatchUpdate && (
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2.5 my-2">
                <div className="flex items-center gap-2 text-sky-700 dark:text-cyan-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to Update Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyBatchUpdate}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply to Dashboard
                  </button>
                  <button
                    onClick={() => setPendingBatchUpdate(null)}
                    disabled={loading}
                    className="py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-cyan-400" />
                AI is analyzing...
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
            className="p-3 bg-slate-50 dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                wizardStep > 0
                  ? `Step ${wizardStep} of 6 (${STEP_DEFINITIONS[wizardStep - 1].title}): Enter values...`
                  : pendingBatchUpdate
                  ? 'Type "Yes" to confirm or "No" to cancel...'
                  : "Ask about your risk or type your financial details..."
              }
              className="flex-1 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white rounded-xl disabled:opacity-40 transition-colors font-bold shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
