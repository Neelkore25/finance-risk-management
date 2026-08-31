import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  ShieldAlert,
  Activity,
  Trash2,
  Maximize2,
  Minimize2,
  Minus,
  Zap
} from 'lucide-react';
import { 
  updateFinancialProfile, 
  addExpense, 
  addDebt, 
  addPortfolioHolding, 
  addFinancialGoal, 
  updateCreditParams, 
  formatINR 
} from '../services/apiClient';
import { 
  checkSecurityAndPrivacy, 
  executeRapidFinancialQuery, 
  getAuthenticatedFinancialContext,
  get_financial_profile,
  preloadFinancialContext
} from '../services/financialAiOrchestrator';
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

  const crMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

  const lakhMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

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

  const incomeMatch = str.match(/(?:income|salary|earn(?:ings?)?|monthly net|take home|pay|in hand)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (incomeMatch) entities.income = parseAmountString(incomeMatch[1]);

  const savingsMatch = str.match(/(?:savings?|liquid|buffer|reserve|emergency fund|bank balance|fd|deposit)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (savingsMatch) entities.savings = parseAmountString(savingsMatch[1]);

  const essentialMatch = str.match(/(?:essential|fixed|rent|utilities|bills|groceries|food|needs)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (essentialMatch) entities.essential = parseAmountString(essentialMatch[1]);

  const discretionaryMatch = str.match(/(?:discretionary|optional|entertainment|shopping|dining|leisure|wants|lifestyle|extra)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (discretionaryMatch) entities.discretionary = parseAmountString(discretionaryMatch[1]);

  const debtMatch = str.match(/(?:total debt|outstanding|loan amount|principal|liability|liabilities|total loan|borrowed|debt)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (debtMatch) entities.total_debt = parseAmountString(debtMatch[1]);

  const emiMatch = str.match(/(?:emi|monthly payment|monthly debt|installment|per month)\s*(?:is|of|around|about|:|=|₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?)/i);
  if (emiMatch) entities.monthly_debt = parseAmountString(emiMatch[1]);

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

  const scoreMatch = str.match(/\b([3-8]\d{2})\b/);
  if (scoreMatch) {
    const sc = parseInt(scoreMatch[1], 10);
    if (sc >= 300 && sc <= 850) entities.credit_score = sc;
  }
  if (!entities.credit_score) {
    if (/\b(excellent|exceptional)\b/i.test(str)) entities.credit_score = 780;
    else if (/\b(good|very good)\b/i.test(str)) entities.credit_score = 720;
    else if (/\b(fair|average)\b/i.test(str)) entities.credit_score = 650;
    else if (/\b(poor|bad)\b/i.test(str)) entities.credit_score = 550;
  }

  const allNumbers = [];
  const tokenMatches = [...str.matchAll(/(\d+(?:\.\d+)?)\s*(crore|crores|cr|lakh|lakhs|lac|lacs|l|k|thousand|thousands)?\b/gi)];
  tokenMatches.forEach(m => {
    const parsed = parseAmountString(m[0]);
    if (parsed !== null && !isNaN(parsed)) allNumbers.push(parsed);
  });
  entities.rawNumbers = allNumbers;

  return entities;
}

// Markdown and Table Formatter for Chat Bubble Rendering
function formatMessageContent(text) {
  if (!text) return null;

  // Render markdown tables if present
  if (text.includes('|') && text.includes('\n|')) {
    const lines = text.split('\n');
    const tableLines = [];
    const beforeTable = [];
    const afterTable = [];
    let inTable = false;
    let tableDone = false;

    lines.forEach(line => {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable) {
        tableDone = true;
        afterTable.push(line);
      } else {
        beforeTable.push(line);
      }
    });

    if (tableLines.length >= 3) {
      const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
      const rows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

      return (
        <div className="space-y-3">
          {beforeTable.length > 0 && <div>{renderFormattedLines(beforeTable.join('\n'))}</div>}
          <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold">
                  {headerCells.map((h, i) => (
                    <th key={i} className="p-2">{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-200/40 dark:hover:bg-slate-900/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 text-slate-800 dark:text-slate-300">
                        {renderFormattedInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {afterTable.length > 0 && <div>{renderFormattedLines(afterTable.join('\n'))}</div>}
        </div>
      );
    }
  }

  return renderFormattedLines(text);
}

function renderFormattedInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={pIdx} className="font-bold text-sky-600 dark:text-cyan-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderFormattedLines(text) {
  const cleaned = text
    .replace(/\$\$.*?\$\$/g, '')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\times/g, '×')
    .replace(/\\left\(|\\right\)/g, '');

  const lines = cleaned.split('\n');
  return lines.map((line, idx) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const isHeading = line.trim().startsWith('###') || line.trim().startsWith('##');

    return (
      <React.Fragment key={idx}>
        <span className={isHeading ? 'font-bold text-sm text-slate-900 dark:text-white block mt-2 mb-1' : isBullet ? 'pl-2 block my-0.5' : ''}>
          {renderFormattedInline(line)}
        </span>
        {idx < lines.length - 1 && !isBullet && <br />}
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "⚡ **Financial Intelligence Engine Active**\n\nInstant queries enabled for income, DTI, debt, portfolio returns, and What-If simulations. Click a quick action below or ask any question!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [llmStatus, setLlmStatus] = useState('ready');

  // 6-Step Onboarding Wizard State
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({});

  // Pending One-shot batch update state
  const [pendingBatchUpdate, setPendingBatchUpdate] = useState(null);

  const location = useLocation();

  // Auto-minimize assistant when user changes pages/tabs so it doesn't block content
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Asynchronous background pre-warming of financial context cache
  useEffect(() => {
    preloadFinancialContext();

    const loadRiskContext = async () => {
      try {
        const fullContext = await getAuthenticatedFinancialContext(['all']);
        setContextData(fullContext);
      } catch (err) {}
    };

    loadRiskContext();

    const handleSync = () => loadRiskContext();
    window.addEventListener('profileUpdated', handleSync);
    window.addEventListener('expensesUpdated', handleSync);
    window.addEventListener('debtUpdated', handleSync);
    window.addEventListener('portfolioUpdated', handleSync);
    window.addEventListener('creditUpdated', handleSync);

    return () => {
      window.removeEventListener('profileUpdated', handleSync);
      window.removeEventListener('expensesUpdated', handleSync);
      window.removeEventListener('debtUpdated', handleSync);
      window.removeEventListener('portfolioUpdated', handleSync);
      window.removeEventListener('creditUpdated', handleSync);
    };
  }, [user]);

  // Call Supabase Edge Function with Google Gemini 2.5 Flash
  const callAiAssistantService = async (queryText) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pxxqrrnpbpldyslseegy.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__T31MM88-paDjC7ejcFWlw_cejGuMls';

      const res = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          prompt: queryText,
          user_context: contextData
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          return data.reply;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // 6-Step Onboarding Starter
  const start6StepOnboarding = () => {
    setWizardStep(1);
    setWizardData({});
    setPendingBatchUpdate(null);
    const step1 = STEP_DEFINITIONS[0];
    setMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `🪄 **Starting 6-Step Guided Financial Setup**\n\n**Step 1 of 6: ${step1.title}**\n${step1.prompt}`
      }
    ]);
  };

  // Skip Active Wizard Step
  const handleSkipStep = async () => {
    if (wizardStep === 0) return;
    const nextStep = wizardStep + 1;
    if (nextStep <= 6) {
      setWizardStep(nextStep);
      const nextDef = STEP_DEFINITIONS[nextStep - 1];
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: '⏩ Skipped step.' },
        { sender: 'ai', text: `⏩ Skipped. Moving to **Step ${nextStep} of 6: ${nextDef.title}**\n${nextDef.prompt}` }
      ]);
    } else {
      setWizardStep(0);
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: '⏩ Skipped step.' },
        { sender: 'ai', text: `🎉 **Guided Setup Complete!** Your dashboard metrics and risk scores are synchronized.` }
      ]);
      const fullContext = await getAuthenticatedFinancialContext(['all']);
      setContextData(fullContext);
    }
  };

  // Apply Batch Multi-field update
  const handleApplyBatchUpdate = async () => {
    if (!pendingBatchUpdate) return;
    setLoading(true);
    try {
      const { income, savings, essential, discretionary, total_debt, monthly_debt, holdings, portfolio_total, credit_score } = pendingBatchUpdate;

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

      if (credit_score) {
        await updateCreditParams({
          credit_score,
          tier: credit_score >= 750 ? 'Excellent' : credit_score >= 680 ? 'Good' : 'Fair'
        });
      }

      window.dispatchEvent(new CustomEvent('profileUpdated'));
      window.dispatchEvent(new CustomEvent('expensesUpdated'));
      window.dispatchEvent(new CustomEvent('debtUpdated'));
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
      window.dispatchEvent(new CustomEvent('creditUpdated'));

      setPendingBatchUpdate(null);
      const fullContext = await getAuthenticatedFinancialContext(['all']);
      setContextData(fullContext);

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

  // Main Handler for User Messages (Instant Execution Paths)
  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase().trim();

    // 1. Security & Privacy Check
    const security = checkSecurityAndPrivacy(query);
    if (security.blocked) {
      setInput('');
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: query },
        { sender: 'ai', text: security.reason }
      ]);
      return;
    }

    // 2. Check for Batch Confirmation
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
        { sender: 'ai', text: 'Cancelled. What else would you like to check or analyze?' }
      ]);
      return;
    }

    // 3. Onboarding Trigger
    if (lowerQuery.includes('start onboarding') || lowerQuery.includes('6-step') || lowerQuery.includes('setup wizard')) {
      setInput('');
      start6StepOnboarding();
      return;
    }

    // 4. Sequential Wizard Execution
    if (wizardStep > 0) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');

      const entities = extractLabeledFinancialEntities(query);
      const isZero = isZeroOrNone(query);
      let stepSuccessful = false;
      let ackBadgeText = '';

      if (wizardStep === 1) {
        let income = entities.income !== undefined ? entities.income : null;
        let savings = entities.savings !== undefined ? entities.savings : null;
        if (income === null && savings === null) {
          if (isZero) { income = 0; savings = 0; }
          else if (entities.rawNumbers?.length >= 2) { income = entities.rawNumbers[0]; savings = entities.rawNumbers[1]; }
          else if (entities.rawNumbers?.length === 1) { income = entities.rawNumbers[0]; savings = 0; }
        }

        if (income === null && savings === null) {
          setMessages([...newMsgs, { sender: 'ai', text: '⚠️ I couldn\'t extract your income or savings. Please reply with numbers (e.g. "Income 80k, Savings 2 Lakhs" or "0" if none).' }]);
          return;
        }

        await updateFinancialProfile({ monthly_net_income: income || 0, liquid_savings: savings || 0, emergency_fund: savings || 0 });
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        ackBadgeText = `✅ Saved Income: ${formatINR(income || 0)}, Savings: ${formatINR(savings || 0)}`;
        stepSuccessful = true;
      } else if (wizardStep === 2) {
        let essential = entities.essential !== undefined ? entities.essential : null;
        let discretionary = entities.discretionary !== undefined ? entities.discretionary : null;
        if (essential === null && discretionary === null) {
          if (isZero) { essential = 0; discretionary = 0; }
          else if (entities.rawNumbers?.length >= 2) { essential = entities.rawNumbers[0]; discretionary = entities.rawNumbers[1]; }
          else if (entities.rawNumbers?.length === 1) { essential = entities.rawNumbers[0]; discretionary = 0; }
        }

        if (essential === null && discretionary === null) {
          setMessages([...newMsgs, { sender: 'ai', text: '⚠️ I couldn\'t detect your expenses. Please reply with amounts (e.g. "Essential 30k, Discretionary 15k" or "0").' }]);
          return;
        }

        await updateFinancialProfile({ essential_expenses: essential || 0, discretionary_expenses: discretionary || 0 });
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        ackBadgeText = `✅ Saved Essential: ${formatINR(essential || 0)}, Discretionary: ${formatINR(discretionary || 0)}`;
        stepSuccessful = true;
      } else if (wizardStep === 3) {
        let totalDebt = entities.total_debt !== undefined ? entities.total_debt : null;
        let emi = entities.monthly_debt !== undefined ? entities.monthly_debt : null;
        if (totalDebt === null && emi === null) {
          if (isZero) { totalDebt = 0; emi = 0; }
          else if (entities.rawNumbers?.length >= 2) { totalDebt = entities.rawNumbers[0]; emi = entities.rawNumbers[1]; }
          else if (entities.rawNumbers?.length === 1) { totalDebt = entities.rawNumbers[0]; emi = Math.round(totalDebt * 0.025); }
        }

        if (totalDebt === null && emi === null) {
          setMessages([...newMsgs, { sender: 'ai', text: '⚠️ Please provide your total loan and EMI (e.g. "Debt 5 Lakhs, EMI 12k" or "no debt").' }]);
          return;
        }

        await updateFinancialProfile({ total_debt: totalDebt || 0, monthly_debt_payments: emi || 0 });
        if (totalDebt > 0) {
          await addDebt({ name: 'Primary Loan', debt_type: 'Personal Loan', original_amount: totalDebt, outstanding_balance: totalDebt, interest_rate: 10.5, monthly_emi: emi || Math.round(totalDebt * 0.025) });
        }
        window.dispatchEvent(new CustomEvent('debtUpdated'));
        ackBadgeText = totalDebt === 0 ? '✅ Recorded: Debt Free (₹0)' : `✅ Saved Debt: ${formatINR(totalDebt)}, EMI: ${formatINR(emi || 0)}`;
        stepSuccessful = true;
      } else if (wizardStep === 4) {
        if (isZero) {
          ackBadgeText = '✅ Recorded: No current investment holdings (₹0)';
          stepSuccessful = true;
        } else if (entities.holdings?.length > 0) {
          for (const h of entities.holdings) {
            await addPortfolioHolding({ asset_name: h.name, asset_type: h.type, quantity: 1, purchase_price: h.amount, current_price: h.amount });
          }
          window.dispatchEvent(new CustomEvent('portfolioUpdated'));
          ackBadgeText = `✅ Added ${entities.holdings.length} assets totaling ${formatINR(entities.portfolio_total)}`;
          stepSuccessful = true;
        } else if (entities.portfolio_total || entities.rawNumbers?.length > 0) {
          const val = entities.portfolio_total || entities.rawNumbers[0];
          await addPortfolioHolding({ asset_name: 'Diversified Portfolio', asset_type: 'Stocks', quantity: 1, purchase_price: val, current_price: val });
          window.dispatchEvent(new CustomEvent('portfolioUpdated'));
          ackBadgeText = `✅ Recorded Portfolio Value: ${formatINR(val)}`;
          stepSuccessful = true;
        } else {
          setMessages([...newMsgs, { sender: 'ai', text: '⚠️ Please specify your investments (e.g. "50k in stocks, 20k in crypto" or "0" if none).' }]);
          return;
        }
      } else if (wizardStep === 5) {
        let score = entities.credit_score || (entities.rawNumbers?.find(n => n >= 300 && n <= 850));
        if (!score && isZero) score = 700;

        if (!score) {
          setMessages([...newMsgs, { sender: 'ai', text: '⚠️ Please provide a credit score between 300 and 850 (e.g. "750 Good" or "680").' }]);
          return;
        }

        await updateCreditParams({ credit_score: score, tier: score >= 750 ? 'Excellent' : score >= 680 ? 'Good' : 'Fair' });
        window.dispatchEvent(new CustomEvent('creditUpdated'));
        ackBadgeText = `✅ Saved Credit Score: ${score}/850 (${score >= 750 ? 'Excellent' : score >= 680 ? 'Good' : 'Fair'})`;
        stepSuccessful = true;
      } else if (wizardStep === 6) {
        const goalAmount = entities.rawNumbers?.[0] || 500000;
        await addFinancialGoal({ goal_name: 'Primary Financial Goal', target_amount: goalAmount, current_savings: 0, target_date: '2028-12-31' });
        window.dispatchEvent(new CustomEvent('goalsUpdated'));
        ackBadgeText = `✅ Saved Financial Target: ${formatINR(goalAmount)}`;
        stepSuccessful = true;
      }

      if (stepSuccessful) {
        const nextStep = wizardStep + 1;
        if (nextStep <= 6) {
          setWizardStep(nextStep);
          const nextDef = STEP_DEFINITIONS[nextStep - 1];
          setMessages([
            ...newMsgs,
            { sender: 'ai', text: `${ackBadgeText}\n\n**Step ${nextStep} of 6: ${nextDef.title}**\n${nextDef.prompt}` }
          ]);
        } else {
          setWizardStep(0);
          setMessages([
            ...newMsgs,
            { sender: 'ai', text: `${ackBadgeText}\n\n🎉 **Onboarding Complete!** Your entire financial profile has been synchronized with the risk engine.` }
          ]);
          const fullContext = await getAuthenticatedFinancialContext(['all']);
          setContextData(fullContext);
        }
      }
      return;
    }

    // 5. Free-form Multi-field summary detection
    const entities = extractLabeledFinancialEntities(query);
    const populatedFields = ['income', 'savings', 'essential', 'discretionary', 'total_debt', 'monthly_debt', 'portfolio_total', 'credit_score'].filter(f => entities[f] !== undefined);

    if (populatedFields.length >= 3) {
      const newMsgs = [...messages, { sender: 'user', text: query }];
      setMessages(newMsgs);
      setInput('');
      setPendingBatchUpdate(entities);

      const previewRows = [];
      if (entities.income !== undefined) previewRows.push(`• **Monthly Net Income:** ${formatINR(entities.income)}`);
      if (entities.savings !== undefined) previewRows.push(`• **Liquid Savings:** ${formatINR(entities.savings)}`);
      if (entities.essential !== undefined) previewRows.push(`• **Essential Spending:** ${formatINR(entities.essential)}`);
      if (entities.discretionary !== undefined) previewRows.push(`• **Discretionary Spending:** ${formatINR(entities.discretionary)}`);
      if (entities.total_debt !== undefined) previewRows.push(`• **Total Debt:** ${formatINR(entities.total_debt)}`);
      if (entities.monthly_debt !== undefined) previewRows.push(`• **Monthly EMI:** ${formatINR(entities.monthly_debt)}`);
      if (entities.portfolio_total !== undefined) previewRows.push(`• **Portfolio Total:** ${formatINR(entities.portfolio_total)}`);
      if (entities.credit_score !== undefined) previewRows.push(`• **Credit Score:** ${entities.credit_score}/850`);

      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `📋 **Detected Multi-Field Financial Summary:**\n\n${previewRows.join('\n')}\n\nWould you like me to apply these updates to your database and recalculate your live risk score?`
        }
      ]);
      return;
    }

    // 6. INSTANT / RAPID EXECUTION PATHS (Zero LLM roundtrips for data/calc/what-if/static)
    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');

    try {
      const rapidResult = await executeRapidFinancialQuery(query);
      if (rapidResult && rapidResult.text) {
        setMessages([...newMsgs, { sender: 'ai', text: rapidResult.text }]);
        return;
      }

      // Tier 6: Complex LLM synthesis (Gemini 2.5 Flash)
      setLoading(true);
      const llmReply = await callAiAssistantService(query);
      if (llmReply) {
        setMessages([...newMsgs, { sender: 'ai', text: llmReply }]);
      } else {
        setMessages([
          ...newMsgs,
          {
            sender: 'ai',
            text: `🤖 **Financial Intelligence Assistant**\n\nI can analyze your financial position, calculate metrics, and simulate scenarios:\n\n• **DTI & Debt Burden:** *"Calculate my DTI"* or *"What is my EMI?"*\n• **Portfolio Risk & VaR:** *"What is my 1-day VaR?"* or *"How are my stocks doing?"*\n• **Credit ML Model:** *"What is my default risk score?"*\n• **What-If Simulations:** *"What happens if my income increases by 25%?"*\n• **System Diagnostic:** *"Run a complete financial data diagnostic"*`
          }
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMsgs,
        { sender: 'ai', text: `⚠️ **Notice**: ${err.message || 'Error communicating with assistant services.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: "⚡ **Conversation reset.** What financial metrics, calculations, or scenarios would you like to explore?"
      }
    ]);
    setWizardStep(0);
    setPendingBatchUpdate(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-2xl transition-all duration-300 hover:scale-105 z-50 flex items-center gap-2.5 font-bold text-sm group"
          title="Open Instant Financial Intelligence Assistant"
        >
          <Zap className="w-5 h-5 transition-transform group-hover:scale-110 text-amber-300" />
          <span className="hidden sm:inline">AI Financial Assistant</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 right-4 ${isExpanded ? 'w-[95vw] md:w-[720px] h-[88vh]' : 'w-[95vw] sm:w-[460px] h-[640px]'} max-h-[92vh] bg-white dark:bg-[#0D1724] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-200`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111C2D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Financial Intelligence Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Instant Fast-Path
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Sub-20ms Deterministic Math & Live Data Grounding
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={isExpanded ? "Collapse Window" : "Expand Window"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Minimize / Dock Assistant"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Instant Action Pills */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-[#0A121E] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSend('What is my monthly income?')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              💼 My Income
            </button>
            <button
              onClick={() => handleSend('Calculate my DTI')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              💳 Calculate DTI
            </button>
            <button
              onClick={() => handleSend('What is my portfolio return and VaR?')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              📈 VaR & Portfolio
            </button>
            <button
              onClick={() => handleSend('What happens if my income increases by 25%?')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              🔮 What-If: Income +25%
            </button>
            <button
              onClick={() => handleSend('What if I reduce my EMI by ₹5,000?')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              🔮 What-If: EMI -₹5k
            </button>
            <button
              onClick={() => handleSend('Run a complete financial data diagnostic.')}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              🔍 Data Diagnostic
            </button>
            <button
              onClick={start6StepOnboarding}
              className="px-2.5 py-1 rounded-full whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors font-medium flex items-center gap-1"
            >
              🪄 6-Step Setup
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-800 dark:text-slate-200">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[86%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-md font-medium'
                      : 'bg-slate-100 dark:bg-[#131F30] border border-slate-200 dark:border-slate-800/80 rounded-bl-none text-slate-900 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  {formatMessageContent(m.text)}
                </div>
              </div>
            ))}

            {/* Pending Batch Update Confirmation Card */}
            {pendingBatchUpdate && (
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2.5">
                <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">
                  Confirm Database Synchronization
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Click below to write these values to your account and re-run live dashboard calculations.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApplyBatchUpdate}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply to Dashboard
                  </button>
                  <button
                    onClick={() => setPendingBatchUpdate(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Active Step Indicator */}
            {wizardStep > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                  Guided Step {wizardStep} of 6: {STEP_DEFINITIONS[wizardStep - 1].title}
                </span>
                <button
                  onClick={handleSkipStep}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 border border-indigo-200 dark:border-indigo-700"
                >
                  <SkipForward className="w-3 h-3" /> Skip Step
                </button>
              </div>
            )}

            {/* Loading / Processing Indicator */}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 pl-8">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[11px] text-slate-500 ml-1">Synthesizing AI analysis...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Controls */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111C2D]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={wizardStep > 0 ? "Enter value or '0' if none..." : "Ask any financial question (instant responses active)..."}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#0A121E] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder-slate-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
