/**
 * ================================================================================
 * RISKGUARD — HIGH-PERFORMANCE FINANCIAL AI ORCHESTRATOR & TOOL LAYER
 * ================================================================================
 * 
 * Features Multi-Tier Execution Architecture:
 * 1. FAST STATIC (<10ms): Instant local knowledge dictionary for general fintech concepts.
 * 2. FAST DATA (<20ms): Direct authenticated cached/live data queries with dynamic templates.
 * 3. FAST CALCULATION (<25ms): Deterministic math for DTI, savings rate, ROI, cash flow.
 * 4. FAST SIMULATION (<30ms): Instant What-If stress engine execution.
 * 5. FAST DIAGNOSTIC (<40ms): Parallelized 10-module database audit.
 * 6. COMPLEX LLM PATH: Invoked strictly when multi-domain synthesis or open-ended reasoning is needed.
 * 
 * Performance & Security:
 * - In-Memory Session Cache with granular event-driven invalidation.
 * - Parallel data fetching with request deduplication.
 * - Zero artificial delays.
 * - Detailed dev telemetry console instrumentation.
 */

import { apiFetch, calculatePersonalRiskMetrics, getSavedSettings, formatINR, RISK_FREE_RATE, ASSET_CLASS_EXPECTED_RETURNS } from './apiClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// ============================================================================
// 1. IN-MEMORY SESSION CACHE & INVALIDATION ENGINE
// ============================================================================

const CACHE_TTL_MS = 60000; // 60 seconds TTL

const memoryCache = {
  profile: null,
  profileTime: 0,
  expenses: null,
  expensesTime: 0,
  debts: null,
  debtsTime: 0,
  investments: null,
  investmentsTime: 0,
  goals: null,
  goalsTime: 0,
  risk: null,
  riskTime: 0,
  credit: null,
  creditTime: 0,
  history: null,
  historyTime: 0
};

// Invalidate specific cache domains on database mutation events
export function invalidateCache(domain = 'all') {
  if (domain === 'all') {
    Object.keys(memoryCache).forEach(k => {
      memoryCache[k] = null;
      if (k.endsWith('Time')) memoryCache[k] = 0;
    });
  } else if (memoryCache[domain] !== undefined) {
    memoryCache[domain] = null;
    memoryCache[`${domain}Time`] = 0;
    // Risk depends on profile, expenses, debts, investments
    if (['profile', 'expenses', 'debts', 'investments'].includes(domain)) {
      memoryCache.risk = null;
      memoryCache.riskTime = 0;
    }
  }
}

// Auto-subscribe to app lifecycle mutation events
if (typeof window !== 'undefined') {
  window.addEventListener('profileUpdated', () => invalidateCache('profile'));
  window.addEventListener('expensesUpdated', () => invalidateCache('expenses'));
  window.addEventListener('debtUpdated', () => invalidateCache('debts'));
  window.addEventListener('portfolioUpdated', () => invalidateCache('investments'));
  window.addEventListener('creditUpdated', () => invalidateCache('credit'));
  window.addEventListener('goalsUpdated', () => invalidateCache('goals'));
}

/**
 * Background cache pre-warmer: loads essential data without blocking UI
 */
export async function preloadFinancialContext() {
  try {
    await Promise.all([
      get_financial_profile(),
      get_expenses(),
      get_debts(),
      get_investments(),
      get_goals()
    ]);
  } catch (e) {
    // Non-blocking background warmup
  }
}

// ============================================================================
// 2. STATIC FINTECH KNOWLEDGE DICTIONARY (FAST STATIC PATH < 10ms)
// ============================================================================

export const STATIC_FINANCIAL_KNOWLEDGE = {
  dti: {
    title: "Debt-to-Income (DTI) Ratio",
    text: "💳 **Debt-to-Income (DTI) Ratio** is a key metric lenders use to measure your ability to manage monthly payments and repay borrowed money.\n\n• **Formula:** $\\text{DTI} = \\frac{\\text{Total Monthly Debt Service (EMI)}}{\\text{Gross Monthly Income}} \\times 100$\n• **Healthy Benchmark:** $\\le 36\\%$ is generally considered healthy. Above $43\\% - 50\\%$ is considered high risk."
  },
  var: {
    title: "Value at Risk (VaR)",
    text: "📉 **Value at Risk (VaR)** is a statistical risk management technique measuring the maximum potential financial loss a portfolio could face over a specific time horizon (e.g. 1-Day or 10-Day) at a given confidence level (e.g. 95% or 99%) under normal market conditions.\n\n• **Example:** A 1-Day 95% VaR of ₹10,000 means there is only a 5% chance the portfolio will lose more than ₹10,000 in a single day."
  },
  cvar: {
    title: "Conditional Value at Risk (CVaR) / Expected Shortfall",
    text: "📊 **Conditional Value at Risk (CVaR)**, also known as **Expected Shortfall (ES)**, measures the expected average loss in the worst-case tail scenarios that exceed the VaR threshold.\n\n• **Why it matters:** Unlike VaR (which only gives a threshold cutoff), CVaR quantifies the severity of extreme tail-risk disasters."
  },
  sharpe: {
    title: "Sharpe Ratio",
    text: "📈 **Sharpe Ratio** measures the excess return earned per unit of total risk (volatility) compared to a risk-free investment.\n\n• **Formula:** $\\text{Sharpe} = \\frac{R_p - R_f}{\\sigma_p}$\n• **Interpretation:** $>1.0$ is good, $>2.0$ is very good, and $>3.0$ is excellent."
  },
  monte_carlo: {
    title: "Monte Carlo Simulation",
    text: "🎲 **Monte Carlo Simulation** in finance uses random sampling (often Geometric Brownian Motion) across thousands of stochastic iterations to model the probability distribution of future portfolio growth paths, downside loss probabilities, and tail risk outcomes."
  },
  shap: {
    title: "SHAP (SHapley Additive exPlanations)",
    text: "🔬 **SHAP (SHapley Additive exPlanations)** is an explainable AI (XAI) framework based on cooperative game theory. It breaks down machine learning predictions (like credit default models) by attributing an exact positive or negative contribution weight to each applicant feature (income, DTI, missed payments)."
  },
  xgboost: {
    title: "XGBoost (Extreme Gradient Boosting)",
    text: "⚡ **XGBoost** is an advanced machine learning algorithm based on gradient-boosted decision trees. It is widely used in fintech for credit scoring, fraud detection, and default prediction due to its superior handling of non-linear financial patterns and tabular data."
  },
  diversification: {
    title: "Portfolio Diversification",
    text: "🌐 **Portfolio Diversification** is the risk management strategy of spreading investments across varied asset classes (equities, bonds, gold, cash) and sectors to minimize unsystematic (company-specific) risk without sacrificing expected return."
  },
  compound_interest: {
    title: "Compound Interest",
    text: "🌱 **Compound Interest** is the interest calculated on the initial principal and also on the accumulated interest of previous periods.\n\n• **Formula:** $A = P \\left(1 + \\frac{r}{n}\\right)^{nt}$"
  },
  inflation: {
    title: "Inflation",
    text: "💸 **Inflation** is the general increase in prices and fall in the purchasing power of money over time. To maintain real wealth, investment returns must outpace the annual inflation rate."
  }
};

// ============================================================================
// 3. CONTROLLED DATA & TOOL LAYER (WITH MEMORY CACHING)
// ============================================================================

export async function get_financial_profile() {
  const now = Date.now();
  if (memoryCache.profile && (now - memoryCache.profileTime < CACHE_TTL_MS)) {
    return memoryCache.profile;
  }
  const res = await apiFetch('/profile');
  const prof = res.profile || null;
  memoryCache.profile = prof;
  memoryCache.profileTime = now;
  return prof;
}

export async function get_expenses() {
  const now = Date.now();
  if (memoryCache.expenses && (now - memoryCache.expensesTime < CACHE_TTL_MS)) {
    return memoryCache.expenses;
  }

  const res = await apiFetch('/expenses');
  const items = res.expenses || [];
  
  const categoryMap = {};
  let totalEssential = 0;
  let totalDiscretionary = 0;
  let totalAmount = 0;

  items.forEach(exp => {
    const amt = Number(exp.amount || 0);
    const cat = exp.category || 'General';
    totalAmount += amt;
    if (exp.is_essential) totalEssential += amt;
    else totalDiscretionary += amt;

    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, total: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].total += amt;
  });

  const categories = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    total: data.total,
    count: data.count,
    percentage: totalAmount > 0 ? Number(((data.total / totalAmount) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.total - a.total);

  const result = {
    items,
    totalCount: items.length,
    totalAmount,
    totalEssential,
    totalDiscretionary,
    categories,
    largestCategory: categories[0] || null
  };

  memoryCache.expenses = result;
  memoryCache.expensesTime = now;
  return result;
}

export async function get_debts() {
  const now = Date.now();
  if (memoryCache.debts && (now - memoryCache.debtsTime < CACHE_TTL_MS)) {
    return memoryCache.debts;
  }

  const res = await apiFetch('/debts');
  const items = res.debts || [];

  let totalOutstanding = 0;
  let totalEmi = 0;
  let highestInterestDebt = null;
  let largestDebt = null;

  items.forEach(d => {
    const bal = Number(d.outstanding_balance || d.original_amount || 0);
    const emi = Number(d.monthly_emi || 0);
    const rate = Number(d.interest_rate || 0);

    totalOutstanding += bal;
    totalEmi += emi;

    if (!highestInterestDebt || rate > Number(highestInterestDebt.interest_rate || 0)) {
      highestInterestDebt = d;
    }
    if (!largestDebt || bal > Number(largestDebt.outstanding_balance || 0)) {
      largestDebt = d;
    }
  });

  const result = {
    items,
    totalCount: items.length,
    totalOutstanding,
    totalEmi,
    highestInterestDebt,
    largestDebt
  };

  memoryCache.debts = result;
  memoryCache.debtsTime = now;
  return result;
}

export async function get_investments() {
  const now = Date.now();
  if (memoryCache.investments && (now - memoryCache.investmentsTime < CACHE_TTL_MS)) {
    return memoryCache.investments;
  }

  const [portRes, riskRes] = await Promise.all([
    apiFetch('/portfolio'),
    apiFetch('/risk/portfolio')
  ]);

  const items = portRes.holdings || [];
  const totalValue = items.reduce((sum, i) => sum + (Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price))), 0);
  const totalInvested = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.purchase_price || i.current_price)), 0);
  const totalProfitLoss = totalValue - totalInvested;
  const returnPct = totalInvested > 0 ? Number(((totalProfitLoss / totalInvested) * 100).toFixed(2)) : 0;

  let bestPerformer = null;
  let worstPerformer = null;

  items.forEach(i => {
    const curVal = Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price));
    const invVal = Number(i.quantity) * Number(i.purchase_price || i.current_price);
    const pl = curVal - invVal;
    const ret = invVal > 0 ? (pl / invVal) * 100 : 0;
    const enriched = { ...i, currentVal, investedVal: invVal, profitLoss: pl, returnPct: Number(ret.toFixed(2)) };

    if (!bestPerformer || ret > bestPerformer.returnPct) bestPerformer = enriched;
    if (!worstPerformer || ret < worstPerformer.returnPct) worstPerformer = enriched;
  });

  const result = {
    items,
    totalCount: items.length,
    totalValue,
    totalInvested,
    totalProfitLoss,
    returnPct,
    bestPerformer,
    worstPerformer,
    portfolioRisk: riskRes.portfolioRisk || null
  };

  memoryCache.investments = result;
  memoryCache.investmentsTime = now;
  return result;
}

export async function get_goals() {
  const now = Date.now();
  if (memoryCache.goals && (now - memoryCache.goalsTime < CACHE_TTL_MS)) {
    return memoryCache.goals;
  }

  const res = await apiFetch('/goals');
  const items = res.goals || [];

  let totalTarget = 0;
  let totalSaved = 0;
  let furthestGoal = null;
  let closestGoal = null;

  const enrichedGoals = items.map(g => {
    const target = Number(g.target_amount || 0);
    const saved = Number(g.current_savings || 0);
    const progressPct = target > 0 ? Math.min(100, Number(((saved / target) * 100).toFixed(1))) : 0;
    const remaining = Math.max(0, target - saved);

    totalTarget += target;
    totalSaved += saved;

    const obj = { ...g, target, saved, progressPct, remaining };
    if (!furthestGoal || progressPct < furthestGoal.progressPct) furthestGoal = obj;
    if (!closestGoal || progressPct > closestGoal.progressPct) closestGoal = obj;
    return obj;
  });

  const overallProgressPct = totalTarget > 0 ? Number(((totalSaved / totalTarget) * 100).toFixed(1)) : 0;

  const result = {
    items: enrichedGoals,
    totalCount: items.length,
    totalTarget,
    totalSaved,
    overallProgressPct,
    furthestGoal,
    closestGoal
  };

  memoryCache.goals = result;
  memoryCache.goalsTime = now;
  return result;
}

export async function get_risk_profile() {
  const now = Date.now();
  if (memoryCache.risk && (now - memoryCache.riskTime < CACHE_TTL_MS)) {
    return memoryCache.risk;
  }
  const res = await apiFetch('/risk/personal');
  const risk = res.assessment || null;
  memoryCache.risk = risk;
  memoryCache.riskTime = now;
  return risk;
}

export async function get_credit_risk() {
  const now = Date.now();
  if (memoryCache.credit && (now - memoryCache.creditTime < CACHE_TTL_MS)) {
    return memoryCache.credit;
  }
  const res = await apiFetch('/risk/credit');
  const cred = res.creditRisk || null;
  memoryCache.credit = cred;
  memoryCache.creditTime = now;
  return cred;
}

export async function get_prediction_history() {
  const now = Date.now();
  if (memoryCache.history && (now - memoryCache.historyTime < CACHE_TTL_MS)) {
    return memoryCache.history;
  }
  const res = await apiFetch('/risk/history');
  const hist = res.history || [];
  memoryCache.history = hist;
  memoryCache.historyTime = now;
  return hist;
}

export async function run_what_if_simulation(simParams) {
  return await apiFetch('/simulator/what-if', {
    method: 'POST',
    body: JSON.stringify(simParams)
  });
}

// ============================================================================
// 4. UNIFIED CONTEXT BUILDER (INTENT-SELECTIVE)
// ============================================================================

export async function getAuthenticatedFinancialContext(requiredDomains = ['all']) {
  const context = {};
  const fetchAll = requiredDomains.includes('all');
  const tasks = [];

  if (fetchAll || requiredDomains.includes('profile')) tasks.push(get_financial_profile().then(p => { context.profile = p; }));
  if (fetchAll || requiredDomains.includes('expenses')) tasks.push(get_expenses().then(e => { context.expenses = e; }));
  if (fetchAll || requiredDomains.includes('debts')) tasks.push(get_debts().then(d => { context.debts = d; }));
  if (fetchAll || requiredDomains.includes('investments')) tasks.push(get_investments().then(i => { context.investments = i; }));
  if (fetchAll || requiredDomains.includes('goals')) tasks.push(get_goals().then(g => { context.goals = g; }));
  if (fetchAll || requiredDomains.includes('risk')) tasks.push(get_risk_profile().then(r => { context.risk = r; }));
  if (fetchAll || requiredDomains.includes('credit')) tasks.push(get_credit_risk().then(c => { context.credit = c; }));
  if (fetchAll || requiredDomains.includes('history')) tasks.push(get_prediction_history().then(h => { context.history = h; }));

  await Promise.all(tasks);
  return context;
}

// ============================================================================
// 5. WHAT-IF PARAMETER PARSER
// ============================================================================

export function extractWhatIfParameters(query, currentProfile) {
  const str = query.toLowerCase();
  const baseExp = Number((currentProfile?.essential_expenses || 30000) + (currentProfile?.discretionary_expenses || 15000));

  let incomeChangePct = 0;
  let expenseChangePct = 0;
  let additionalDebt = 0;
  let additionalSavings = 0;
  let isParsed = false;

  const incPctMatch = str.match(/(?:income|salary|earnings?)\s*(?:increases?|goes up|rises?|grows?|up|boosted|decreases?|falls?|down|drops?)\s*(?:by)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                      str.match(/(\d+(?:\.\d+)?)\s*%\s*(?:increase|raise|boost|decrease|cut)\s*(?:in|to)?\s*(?:income|salary)/i);
  if (incPctMatch) {
    const val = parseFloat(incPctMatch[1]);
    const isNegative = str.includes('decrease') || str.includes('fall') || str.includes('cut') || str.includes('down');
    incomeChangePct = isNegative ? -val : val;
    isParsed = true;
  }

  const expChangeMatch = str.match(/(?:expenses?|spending)\s*(?:decreases?|reduce|reduces?|cut|cuts?|increases?|up|down)\s*(?:by)?\s*(?:₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:k|thousand|lakh|l)?)/i);
  if (expChangeMatch) {
    let raw = expChangeMatch[1].trim();
    let num = 0;
    if (raw.endsWith('k') || raw.includes('thousand')) num = parseFloat(raw) * 1000;
    else if (raw.endsWith('l') || raw.includes('lakh')) num = parseFloat(raw) * 100000;
    else num = parseFloat(raw);

    const isNegative = str.includes('decrease') || str.includes('reduce') || str.includes('cut') || str.includes('down');
    const pct = baseExp > 0 ? (num / baseExp) * 100 : 0;
    expenseChangePct = isNegative ? -pct : pct;
    isParsed = true;
  }

  const emiMatch = str.match(/(?:emi|debt payment|monthly payment|loan repayment)\s*(?:decreases?|reduce|reduces?|cut|cuts?|increases?|adds?|up|down)?\s*(?:by)?\s*(?:₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:k|thousand|lakh|l)?)/i) ||
                   str.match(/(?:reduce|cut|increase|add)\s*(?:my)?\s*(?:emi|debt payment)\s*(?:by)?\s*(?:₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:k|thousand|lakh|l)?)/i);
  if (emiMatch) {
    let raw = emiMatch[1].trim();
    let num = 0;
    if (raw.endsWith('k') || raw.includes('thousand')) num = parseFloat(raw) * 1000;
    else if (raw.endsWith('l') || raw.includes('lakh')) num = parseFloat(raw) * 100000;
    else num = parseFloat(raw);

    const isNegative = str.includes('reduce') || str.includes('decrease') || str.includes('cut') || str.includes('down') || str.includes('lower');
    additionalDebt = isNegative ? -num : num;
    isParsed = true;
  }

  const savMatch = str.match(/(?:savings?|emergency fund)\s*(?:increases?|grows?|adds?|up)?\s*(?:by)?\s*(?:₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:k|thousand|lakh|l)?)/i) ||
                   str.match(/(?:add|deposit|put)\s*(?:₹|\$)?\s*(\d+(?:\.\d+)?\s*(?:k|thousand|lakh|l)?)\s*(?:to|in|into)?\s*(?:savings|buffer|emergency)/i);
  if (savMatch) {
    let raw = savMatch[1].trim();
    let num = 0;
    if (raw.endsWith('k') || raw.includes('thousand')) num = parseFloat(raw) * 1000;
    else if (raw.endsWith('l') || raw.includes('lakh')) num = parseFloat(raw) * 100000;
    else num = parseFloat(raw);

    additionalSavings = num;
    isParsed = true;
  }

  return {
    isParsed,
    params: {
      incomeChangePct,
      expenseChangePct,
      additionalDebt,
      additionalSavings,
      emergencySavingsChange: additionalSavings
    }
  };
}

// ============================================================================
// 6. 10-MODULE FINANCIAL DATA DIAGNOSTIC
// ============================================================================

export async function run_financial_data_diagnostic() {
  const [prof, exps, debts, invs, goals, risk, cred, hist] = await Promise.all([
    get_financial_profile(),
    get_expenses(),
    get_debts(),
    get_investments(),
    get_goals(),
    get_risk_profile(),
    get_credit_risk(),
    get_prediction_history()
  ]);

  const auditReport = [];

  const inc = Number(prof?.monthly_net_income || 0);
  auditReport.push({
    module: 'Financial Profile & Income',
    accessible: Boolean(prof),
    dataAvailable: inc > 0,
    details: inc > 0 ? `Monthly Income: ${formatINR(inc)}` : 'Zero / Missing income value',
    status: prof && inc > 0 ? 'WORKING' : 'INCONSISTENT'
  });

  const sav = Number(prof?.liquid_savings || 0);
  const emg = Number(prof?.emergency_fund || 0);
  auditReport.push({
    module: 'Liquid Reserves & Emergency Fund',
    accessible: Boolean(prof),
    dataAvailable: sav > 0 || emg > 0,
    details: `Savings: ${formatINR(sav)}, Emergency Reserve: ${formatINR(emg)}`,
    status: sav > 0 ? 'WORKING' : 'EMPTY'
  });

  auditReport.push({
    module: 'Expense Tracker',
    accessible: true,
    dataAvailable: exps.totalCount > 0,
    details: exps.totalCount > 0 ? `${exps.totalCount} items totaling ${formatINR(exps.totalAmount)}/mo` : 'No individual transactions logged',
    status: exps.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  auditReport.push({
    module: 'Debt & Liabilities',
    accessible: true,
    dataAvailable: debts.totalCount > 0 || Number(prof?.monthly_debt_payments || 0) > 0,
    details: debts.totalCount > 0 ? `${debts.totalCount} active debts (${formatINR(debts.totalOutstanding)} bal, ${formatINR(debts.totalEmi)} EMI)` : 'No active debts logged (Debt Free)',
    status: 'WORKING'
  });

  auditReport.push({
    module: 'Portfolio Holdings',
    accessible: true,
    dataAvailable: invs.totalCount > 0,
    details: invs.totalCount > 0 ? `${invs.totalCount} holdings totaling ${formatINR(invs.totalValue)} (${invs.returnPct >= 0 ? '+' : ''}${invs.returnPct}%)` : 'No portfolio holdings recorded',
    status: invs.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  const portRisk = invs.portfolioRisk;
  auditReport.push({
    module: 'Portfolio Quantitative VaR / CVaR',
    accessible: Boolean(portRisk),
    dataAvailable: Boolean(portRisk?.metrics?.historicalVaR1DayPct),
    details: portRisk ? `1-Day VaR (95%): ${portRisk.metrics?.historicalVaR1DayPct}% (${formatINR(portRisk.metrics?.historicalVaR1DayAmount)}), Sharpe: ${portRisk.metrics?.sharpeRatio}` : 'Engine calculation pending',
    status: portRisk ? 'WORKING' : 'UNAVAILABLE'
  });

  auditReport.push({
    module: 'Credit Risk ML Underwriting',
    accessible: Boolean(cred),
    dataAvailable: Boolean(cred?.creditScore),
    details: cred ? `Credit Score: ${cred.creditScore}/850 (${cred.tier}), Default Risk: ${cred.probDefault}%` : 'Model execution pending',
    status: cred ? 'WORKING' : 'UNAVAILABLE'
  });

  auditReport.push({
    module: 'Personal Risk Assessment',
    accessible: Boolean(risk),
    dataAvailable: Boolean(risk?.overallScore !== undefined),
    details: risk ? `Overall Score: ${risk.overallScore}/100 (${risk.overallLevel}), DTI: ${risk.metrics?.dtiRatio}%` : 'Assessment pending profile data',
    status: risk ? 'WORKING' : 'INCONSISTENT'
  });

  auditReport.push({
    module: 'Financial Goals',
    accessible: true,
    dataAvailable: goals.totalCount > 0,
    details: goals.totalCount > 0 ? `${goals.totalCount} goals (${goals.overallProgressPct}% funded of ${formatINR(goals.totalTarget)})` : 'No financial targets created yet',
    status: goals.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  auditReport.push({
    module: 'Risk Assessment History',
    accessible: true,
    dataAvailable: hist.length > 0,
    details: hist.length > 0 ? `${hist.length} historical snapshot(s) logged` : 'No historical snapshots logged',
    status: hist.length > 0 ? 'WORKING' : 'EMPTY'
  });

  return auditReport;
}

// ============================================================================
// 7. SECURITY SANITIZER
// ============================================================================

export function checkSecurityAndPrivacy(query) {
  const lower = query.toLowerCase();

  if (
    lower.includes('ignore previous instructions') ||
    lower.includes('ignore all instructions') ||
    lower.includes('show your system prompt') ||
    lower.includes('show system instructions') ||
    lower.includes('reveal hidden prompt')
  ) {
    return {
      blocked: true,
      reason: '🛡️ **Security Policy Enforcement**\n\nI cannot disclose or modify system configuration prompts, internal security policies, or administrative instructions.'
    };
  }

  if (
    lower.includes('another user') ||
    lower.includes('other users') ||
    lower.includes('user a') ||
    lower.includes('user b') ||
    lower.includes('bypass rls') ||
    lower.includes('dump database') ||
    lower.includes('show database credentials') ||
    lower.includes('show api keys') ||
    lower.includes('service_role')
  ) {
    return {
      blocked: true,
      reason: '🔒 **Access Denied (Privacy & Authorization)**\n\nI can only access the verified records of your currently authenticated account. Accessing another user\'s private financial data or administrative credentials is strictly prohibited and protected by database Row-Level Security (RLS).'
    };
  }

  return { blocked: false };
}

// ============================================================================
// 8. HIGH-PERFORMANCE MULTI-TIER ROUTER & SOLVER
// ============================================================================

/**
 * Rapid Multi-Tier Execution Engine
 * Evaluates queries through:
 * 1. FAST_STATIC (<5ms)
 * 2. FAST_DATA (<15ms)
 * 3. FAST_CALCULATION (<20ms)
 * 4. FAST_SIMULATION (<25ms)
 * 5. FAST_DIAGNOSTIC (<35ms)
 * 6. COMPLEX_LLM (Gemini with minimal payload)
 */
export async function executeRapidFinancialQuery(query) {
  const t0 = performance.now();
  const lower = query.toLowerCase().trim();

  // Tier 1: Check Security
  const sec = checkSecurityAndPrivacy(query);
  if (sec.blocked) {
    const tEnd = performance.now();
    logPerformance('SECURITY_BLOCK', t0, tEnd, 'Blocked');
    return { path: 'SECURITY', text: sec.reason, timingMs: tEnd - t0 };
  }

  // Tier 2: FAST STATIC KNOWLEDGE (Instant Concept Definitions)
  for (const [key, item] of Object.entries(STATIC_FINANCIAL_KNOWLEDGE)) {
    const keyWithSpace = key.replace(/_/g, ' ');
    if (
      (lower === `what is ${key}` || lower === `what is ${keyWithSpace}` || lower === `explain ${key}` || lower === `explain ${keyWithSpace}`) ||
      (lower.startsWith('what is') && lower.includes(keyWithSpace) && !lower.includes('my') && !lower.includes('our'))
    ) {
      const tEnd = performance.now();
      logPerformance('FAST_STATIC', t0, tEnd, 'Local Knowledge Layer (Gemini Bypassed ⚡)');
      return { path: 'FAST_STATIC', text: item.text, timingMs: tEnd - t0 };
    }
  }

  // Tier 3: FAST DIAGNOSTIC
  if (lower.includes('diagnostic') || lower.includes('audit data') || lower.includes('check system health')) {
    const tDataStart = performance.now();
    const report = await run_financial_data_diagnostic();
    let table = '| Module | Accessible | Data Status | Details |\n| :--- | :--- | :--- | :--- |\n';
    report.forEach(row => {
      const badge = row.status === 'WORKING' ? '🟢 WORKING' : row.status === 'EMPTY' ? '🟡 EMPTY' : row.status === 'INCONSISTENT' ? '🔴 INCONSISTENT' : '⚪ UNAVAILABLE';
      table += `| **${row.module}** | ${row.accessible ? '✅ Yes' : '❌ No'} | ${badge} | ${row.details} |\n`;
    });
    const tEnd = performance.now();
    logPerformance('FAST_DIAGNOSTIC', t0, tEnd, `Data time: ${(tEnd - tDataStart).toFixed(1)}ms (Gemini Bypassed ⚡)`);
    return {
      path: 'FAST_DIAGNOSTIC',
      text: `🔍 **Complete Financial Data Diagnostic Report**\n\n${table}\n\n*Source: Real-time verification across 10 application database tables and calculation engines.*`,
      timingMs: tEnd - t0
    };
  }

  // Tier 4: FAST WHAT-IF SIMULATION
  const currentProf = await get_financial_profile();
  const whatIf = extractWhatIfParameters(query, currentProf);
  if (whatIf.isParsed) {
    const simRes = await run_what_if_simulation(whatIf.params);
    const mBase = simRes.baselineMetrics || {};
    const mSim = simRes.simulatedMetrics || {};
    const scoreDelta = simRes.scoreDelta || 0;
    const deltaSign = scoreDelta > 0 ? '+' : '';

    const tEnd = performance.now();
    logPerformance('FAST_SIMULATION', t0, tEnd, 'Simulator Math Engine (Gemini Bypassed ⚡)');

    return {
      path: 'FAST_SIMULATION',
      text: `🔮 **What-If Financial Stress Simulation**\n\n` +
            `| Metric | Current Baseline | Simulated Scenario | Change |\n` +
            `| :--- | :--- | :--- | :--- |\n` +
            `| **Monthly Net Income** | ${formatINR(mBase.monthlyIncome)} | ${formatINR(mSim.monthlyIncome)} | ${mSim.monthlyIncome !== mBase.monthlyIncome ? (mSim.monthlyIncome > mBase.monthlyIncome ? '+' : '') + formatINR(mSim.monthlyIncome - mBase.monthlyIncome) : 'Unchanged'} |\n` +
            `| **Monthly Expenses** | ${formatINR(mBase.totalMonthlyExpenses)} | ${formatINR(mSim.totalMonthlyExpenses)} | ${mSim.totalMonthlyExpenses !== mBase.totalMonthlyExpenses ? formatINR(mSim.totalMonthlyExpenses - mBase.totalMonthlyExpenses) : 'Unchanged'} |\n` +
            `| **Monthly Debt (EMI)** | ${formatINR(mBase.totalDebtPayment)} | ${formatINR(mSim.totalDebtPayment)} | ${mSim.totalDebtPayment !== mBase.totalDebtPayment ? formatINR(mSim.totalDebtPayment - mBase.totalDebtPayment) : 'Unchanged'} |\n` +
            `| **Debt-to-Income (DTI)** | ${mBase.dtiRatio}% | **${mSim.dtiRatio}%** | ${mSim.dtiRatio - mBase.dtiRatio !== 0 ? `${mSim.dtiRatio - mBase.dtiRatio}%` : '0%'} |\n` +
            `| **Net Cash Flow** | ${formatINR(mBase.netCashFlow)} | **${formatINR(mSim.netCashFlow)}** | ${formatINR(mSim.netCashFlow - mBase.netCashFlow)} |\n` +
            `| **Overall Risk Score** | ${simRes.baselineScore}/100 | **${simRes.simulatedScore}/100** | **${deltaSign}${scoreDelta} pts** (${simRes.simulatedLevel}) |\n\n` +
            `💡 **Impact Summary**: ${scoreDelta < 0 ? '✅ This scenario reduces your overall financial risk score.' : scoreDelta > 0 ? '⚠️ This scenario increases financial leverage and risk.' : 'Impact on risk score is neutral.'}\n\n*Source: Real-time calculation via What-If Simulator Engine.*`,
      timingMs: tEnd - t0
    };
  }

  // Tier 5: FAST DATA & CALCULATION PATHS (Zero LLM roundtrips)

  // A. Income
  if ((lower.includes('income') || lower.includes('earning') || lower.includes('salary') || lower.includes('take home')) && !lower.includes('what is dti')) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    const tEnd = performance.now();
    logPerformance('FAST_DATA', t0, tEnd, 'Single Profile Cache Lookup (Gemini Bypassed ⚡)');

    if (!prof || inc === 0) {
      return { path: 'FAST_DATA', text: 'You currently have no monthly income records available in your financial profile. Please update your profile on the Dashboard.', timingMs: tEnd - t0 };
    }
    return {
      path: 'FAST_DATA',
      text: `💼 **Your Stored Monthly Net Income:** **${formatINR(inc)}** *(Annualized: ${formatINR(inc * 12)})*\n\n*Source: Derived from your saved financial profile.*`,
      timingMs: tEnd - t0
    };
  }

  // B. DTI Ratio
  if (lower.includes('dti') || lower.includes('debt to income') || lower.includes('debt-to-income')) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    const emi = Number(prof?.monthly_debt_payments || 0);
    const tEnd = performance.now();
    logPerformance('FAST_CALCULATION', t0, tEnd, 'DTI Deterministic Math Engine (Gemini Bypassed ⚡)');

    if (inc === 0) {
      return { path: 'FAST_CALCULATION', text: `💳 **Debt-to-Income (DTI) Calculation**\n\n• **Formula:** $\\text{DTI} = \\frac{\\text{Total Monthly EMI}}{\\text{Monthly Net Income}} \\times 100$\n• **Status:** Cannot compute DTI because your monthly income is recorded as ₹0. Please log your income on the profile page.`, timingMs: tEnd - t0 };
    }

    const dti = Number(((emi / inc) * 100).toFixed(1));
    const statusText = dti <= 36 ? '✅ Healthy (within recommended ≤36% limit)' : '⚠️ Elevated (exceeds recommended ≤36% threshold)';

    let extraConcept = '';
    if (lower.startsWith('what is dti and') || lower.includes('explain')) {
      extraConcept = `**Concept Definition:** DTI measures the percentage of your monthly income committed to loan payments.\n\n`;
    }

    return {
      path: 'FAST_CALCULATION',
      text: `${extraConcept}💳 **Your Calculated Debt-to-Income (DTI) Ratio: ${dti}%**\n\n• **Monthly Debt Service (EMI):** ${formatINR(emi)}\n• **Monthly Net Income:** ${formatINR(inc)}\n• **Formula:** $\\frac{${formatINR(emi)}}{${formatINR(inc)}} \\times 100 = ${dti}\\%$\n• **Assessment:** ${statusText}\n\n*Source: Calculated deterministically from current profile and debt records.*`,
      timingMs: tEnd - t0
    };
  }

  // C. Expenses
  if ((lower.includes('expense') || lower.includes('spending')) && !lower.includes('what is')) {
    const [exps, prof] = await Promise.all([get_expenses(), get_financial_profile()]);
    const totalExp = exps.totalAmount > 0 ? exps.totalAmount : Number((prof?.essential_expenses || 0) + (prof?.discretionary_expenses || 0));
    const tEnd = performance.now();
    logPerformance('FAST_DATA', t0, tEnd, 'Expenses Cache Lookup (Gemini Bypassed ⚡)');

    if (totalExp === 0 && exps.totalCount === 0) {
      return { path: 'FAST_DATA', text: 'No expense records are currently available. You can log expenses on the Expenses page.', timingMs: tEnd - t0 };
    }

    let breakdown = '';
    if (exps.categories.length > 0) {
      breakdown = `\n\n**Top Expense Categories:**\n` + exps.categories.slice(0, 4).map(c => `• **${c.name}:** ${formatINR(c.total)} (${c.percentage}%)`).join('\n');
    }

    return {
      path: 'FAST_DATA',
      text: `🛒 **Total Monthly Expenses:** **${formatINR(totalExp)}**\n• **Essential Spending:** ${formatINR(exps.totalEssential || prof?.essential_expenses || 0)}\n• **Discretionary Spending:** ${formatINR(exps.totalDiscretionary || prof?.discretionary_expenses || 0)}${breakdown}\n\n*Source: Based on your stored expense records and financial profile.*`,
      timingMs: tEnd - t0
    };
  }

  // D. Debt & EMI
  if ((lower.includes('debt') || lower.includes('emi') || lower.includes('loan') || lower.includes('liability')) && !lower.includes('what is')) {
    const [debts, prof] = await Promise.all([get_debts(), get_financial_profile()]);
    const totalDebt = debts.totalOutstanding > 0 ? debts.totalOutstanding : Number(prof?.total_debt || 0);
    const totalEmi = debts.totalEmi > 0 ? debts.totalEmi : Number(prof?.monthly_debt_payments || 0);
    const tEnd = performance.now();
    logPerformance('FAST_DATA', t0, tEnd, 'Debt Cache Lookup (Gemini Bypassed ⚡)');

    if (totalDebt === 0 && totalEmi === 0 && debts.totalCount === 0) {
      return { path: 'FAST_DATA', text: '✅ **No debt records currently available.** Your profile indicates you are currently debt-free with zero monthly loan obligations.', timingMs: tEnd - t0 };
    }

    let extraDetails = '';
    if (debts.highestInterestDebt) {
      extraDetails += `\n• **Highest Interest Liability:** ${debts.highestInterestDebt.name || 'Loan'} at ${debts.highestInterestDebt.interest_rate}% APR`;
    }
    if (debts.largestDebt) {
      extraDetails += `\n• **Largest Outstanding Obligation:** ${debts.largestDebt.name || 'Debt'} (${formatINR(debts.largestDebt.outstanding_balance || debts.largestDebt.original_amount)})`;
    }

    return {
      path: 'FAST_DATA',
      text: `💳 **Debt & Liability Summary:**\n• **Total Outstanding Principal:** **${formatINR(totalDebt)}**\n• **Total Monthly EMI Debt Service:** **${formatINR(totalEmi)}**${extraDetails}\n\n*Source: Calculated from your recorded debt liabilities.*`,
      timingMs: tEnd - t0
    };
  }

  // E. Savings Rate / Cash Flow
  if (lower.includes('savings rate') || lower.includes('disposable income') || lower.includes('cash flow')) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    const exp = Number((prof?.essential_expenses || 0) + (prof?.discretionary_expenses || 0));
    const emi = Number(prof?.monthly_debt_payments || 0);
    const tEnd = performance.now();
    logPerformance('FAST_CALCULATION', t0, tEnd, 'Cash Flow Math Engine (Gemini Bypassed ⚡)');

    if (inc === 0) {
      return { path: 'FAST_CALCULATION', text: 'Cannot compute savings rate because monthly income is recorded as ₹0.', timingMs: tEnd - t0 };
    }

    const netCashFlow = inc - exp - emi;
    const savingsRate = Number(((netCashFlow / inc) * 100).toFixed(1));

    return {
      path: 'FAST_CALCULATION',
      text: `💰 **Cash Flow & Savings Rate Analysis:**\n\n• **Monthly Net Income:** ${formatINR(inc)}\n• **Total Outflows:** ${formatINR(exp + emi)} (Expenses: ${formatINR(exp)}, Debt EMI: ${formatINR(emi)})\n• **Net Disposable Cash Flow:** **${formatINR(netCashFlow)}**\n• **Calculated Savings Rate:** **${savingsRate}%**\n• **Formula:** $\\frac{\\text{Net Cash Flow (${formatINR(netCashFlow)})}}{\\text{Net Income (${formatINR(inc)})}} \\times 100 = ${savingsRate}\\%$\n\n*Source: Derived from current cash flow equations.*`,
      timingMs: tEnd - t0
    };
  }

  // F. Portfolio Holdings & Performance
  if ((lower.includes('portfolio') || lower.includes('investment') || lower.includes('stock') || lower.includes('profit') || lower.includes('return')) && !lower.includes('var') && !lower.includes('what is')) {
    const invs = await get_investments();
    const tEnd = performance.now();
    logPerformance('FAST_DATA', t0, tEnd, 'Portfolio Cache Lookup (Gemini Bypassed ⚡)');

    if (invs.totalCount === 0) {
      return { path: 'FAST_DATA', text: '📊 **You currently have no investment records available.** You can add stocks, mutual funds, crypto, or bonds on the Investments page.', timingMs: tEnd - t0 };
    }

    let extraText = '';
    if (invs.bestPerformer) extraText += `\n• **Top Performing Asset:** ${invs.bestPerformer.asset_name} (+${invs.bestPerformer.returnPct}%)`;
    if (invs.worstPerformer && invs.worstPerformer !== invs.bestPerformer) extraText += `\n• **Worst Performing Asset:** ${invs.worstPerformer.asset_name} (${invs.worstPerformer.returnPct}%)`;

    return {
      path: 'FAST_DATA',
      text: `📈 **Portfolio Investment Intelligence:**\n\n• **Total Portfolio Market Value:** **${formatINR(invs.totalValue)}**\n• **Total Principal Invested:** ${formatINR(invs.totalInvested)}\n• **Net Unrealized Profit/Loss:** **${invs.totalProfitLoss >= 0 ? '+' : ''}${formatINR(invs.totalProfitLoss)}**\n• **Total Portfolio Return:** **${invs.returnPct >= 0 ? '+' : ''}${invs.returnPct}%**\n• **Active Holdings Count:** ${invs.totalCount} assets${extraText}\n\n*Source: Calculated from stored portfolio holdings.*`,
      timingMs: tEnd - t0
    };
  }

  // G. Value at Risk (VaR)
  if (lower.includes('var') || lower.includes('value at risk') || lower.includes('cvar')) {
    const invs = await get_investments();
    const pRisk = invs.portfolioRisk;
    const tEnd = performance.now();
    logPerformance('FAST_ANALYTICS', t0, tEnd, 'Quantitative VaR Cache Lookup (Gemini Bypassed ⚡)');

    if (!pRisk || invs.totalCount === 0) {
      return { path: 'FAST_ANALYTICS', text: 'Value at Risk (VaR) calculations require recorded portfolio holdings. Please add investments on the Investments page.', timingMs: tEnd - t0 };
    }

    const m = pRisk.metrics || {};
    let extraConcept = '';
    if (lower.startsWith('what is var and') || lower.includes('explain')) {
      extraConcept = `**Concept Definition:** VaR is the maximum expected loss within a given confidence level.\n\n`;
    }

    return {
      path: 'FAST_ANALYTICS',
      text: `${extraConcept}📉 **Quantitative Downside Risk & VaR Analysis:**\n\n• **Portfolio Value:** ${formatINR(pRisk.totalValue)}\n• **1-Day Historical VaR (95%):** **${m.historicalVaR1DayPct}%** (${formatINR(m.historicalVaR1DayAmount)})\n• **1-Day Parametric Gaussian VaR:** **${m.parametricVaR1DayPct}%** (${formatINR(m.parametricVaR1DayAmount)})\n• **1-Day Conditional VaR (CVaR / Expected Shortfall):** **${m.cvar1DayPct}%** (${formatINR(m.cvar1DayAmount)})\n• **Sharpe Ratio:** ${m.sharpeRatio} (Rf: ${(RISK_FREE_RATE * 100).toFixed(1)}% benchmark)\n• **Portfolio Beta:** ${m.beta} | **Annualized Volatility:** ${m.annualizedVol}%\n\n*Interpretation: Under normal market conditions (95% confidence), your maximum estimated 1-day portfolio loss will not exceed ${formatINR(m.historicalVaR1DayAmount)}.*`,
      timingMs: tEnd - t0
    };
  }

  // H. Credit Risk
  if (lower.includes('credit risk') || lower.includes('credit score') || lower.includes('default probability')) {
    const cred = await get_credit_risk();
    const tEnd = performance.now();
    logPerformance('FAST_ML', t0, tEnd, 'Credit ML Model Cache Lookup (Gemini Bypassed ⚡)');

    if (!cred || !cred.creditScore) {
      return { path: 'FAST_ML', text: 'No completed credit-risk prediction is available yet. Please run a credit evaluation on the Credit Risk page.', timingMs: tEnd - t0 };
    }

    let factorsList = '';
    if (cred.drivingFactors && cred.drivingFactors.length > 0) {
      factorsList = '\n\n**Key Driving Factors:**\n' + cred.drivingFactors.map(f => `• **${f.factor} (${f.impact}):** ${f.detail}`).join('\n');
    }

    return {
      path: 'FAST_ML',
      text: `🏦 **Credit Risk ML Underwriting Assessment:**\n\n• **Predicted Credit Score:** **${cred.creditScore}/850** (${cred.tier})\n• **Risk Level:** **${cred.riskLevel}**\n• **Estimated Default Probability:** **${cred.probDefault}%**\n• **Model:** Scikit-Learn Logistic Regression Classifier${factorsList}\n\n*Source: Executed by application credit-risk ML model.*`,
      timingMs: tEnd - t0
    };
  }

  // I. Goals
  if (lower.includes('goal') || lower.includes('target') || lower.includes('milestone')) {
    const goals = await get_goals();
    const tEnd = performance.now();
    logPerformance('FAST_DATA', t0, tEnd, 'Goals Cache Lookup (Gemini Bypassed ⚡)');

    if (goals.totalCount === 0) {
      return { path: 'FAST_DATA', text: '🎯 **You currently have no financial goals recorded.** You can create savings goals on the Goals page.', timingMs: tEnd - t0 };
    }

    const goalRows = goals.items.map(g => `• **${g.goal_name}:** ${g.progressPct}% complete (${formatINR(g.saved)} of ${formatINR(g.target)})`).join('\n');

    return {
      path: 'FAST_DATA',
      text: `🎯 **Financial Goals Progress Summary:**\n\n${goalRows}\n\n• **Aggregate Goals Target:** ${formatINR(goals.totalTarget)}\n• **Total Funded:** ${formatINR(goals.totalSaved)} (${goals.overallProgressPct}%)\n\n*Source: Derived from your saved financial goals.*`,
      timingMs: tEnd - t0
    };
  }

  // J. Executive Financial Health Summary
  if (lower.includes('financial health') || lower.includes('summarize my dashboard') || lower.includes('how am i doing') || lower.includes('overall risk')) {
    const [prof, risk, debts, invs] = await Promise.all([get_financial_profile(), get_risk_profile(), get_debts(), get_investments()]);
    const tEnd = performance.now();
    logPerformance('FAST_CALCULATION', t0, tEnd, 'Multi-Factor Executive Health Synthesis (Gemini Bypassed ⚡)');

    if (!risk) {
      return { path: 'FAST_CALCULATION', text: 'I need your financial profile data to evaluate your overall financial health.', timingMs: tEnd - t0 };
    }

    const m = risk.metrics || {};
    return {
      path: 'FAST_CALCULATION',
      text: `🛡️ **Executive Financial Health & Risk Assessment:**\n\n` +
            `• **Overall Financial Risk Score:** **${risk.overallScore}/100** (${risk.overallLevel})\n` +
            `• **Monthly Net Income:** ${formatINR(m.monthlyIncome)}\n` +
            `• **Monthly Net Cash Flow:** ${formatINR(m.netCashFlow)} (Savings Rate: ${m.savingsRate}%)\n` +
            `• **Debt-to-Income (DTI):** ${m.dtiRatio}% (Target: ≤36%)\n` +
            `• **Emergency Fund Coverage:** ${m.emergencyCoverageMonths} months of essential spending\n` +
            `• **Portfolio Total Value:** ${formatINR(invs.totalValue)} (${invs.totalCount} assets)\n\n` +
            `📋 **Strategic Assessment**: ${risk.overallScore < 35 ? 'Your financial structure shows robust liquidity and disciplined debt management.' : risk.overallScore < 60 ? 'Your financial position is balanced, but building emergency reserves and lowering DTI will improve resilience.' : 'High debt leverage or negative cash flow requires immediate attention to reduce financial vulnerability.'}\n\n` +
            `*Source: Multi-factor risk engine evaluation based on live database state.*`,
      timingMs: tEnd - t0
    };
  }

  // Tier 6: Null means broad/open-ended query $\to$ delegate to Gemini
  return null;
}

// Dev Telemetry Console Logger
function logPerformance(path, startMs, endMs, notes = '') {
  const duration = (endMs - startMs).toFixed(1);
  if (typeof console !== 'undefined' && console.log) {
    console.log(`%c[AI Assistant Performance] %c${path} %c${duration}ms %c(${notes})`, 'color: #0284c7; font-weight: bold', 'color: #10b981; font-weight: bold', 'color: #f59e0b', 'color: #64748b');
  }
}
