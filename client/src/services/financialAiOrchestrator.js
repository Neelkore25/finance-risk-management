/**
 * ================================================================================
 * RISKGUARD — SECURE FINANCIAL AI ORCHESTRATOR & TOOL LAYER
 * ================================================================================
 * 
 * Provides a controlled, strictly typed tool/data layer and deterministic
 * calculation engines over real application data from Supabase & API services.
 * 
 * Architectural Principles:
 * 1. Single Source of Truth: Database, existing API engines, and authenticated user session.
 * 2. Zero-Hallucination & Zero-Fake Data: Honest empty states when records are missing.
 * 3. Deterministic Mathematics: Calculations performed by proven financial logic.
 * 4. User Isolation & Security: Enforced via Supabase RLS and token derivation.
 */

import { apiFetch, calculatePersonalRiskMetrics, getSavedSettings, formatINR, RISK_FREE_RATE, ASSET_CLASS_EXPECTED_RETURNS } from './apiClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// ============================================================================
// 1. CONTROLLED DATA & TOOL LAYER
// ============================================================================

/**
 * Fetch authenticated user profile
 */
export async function get_user_profile() {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      return data || { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'User' };
    }
  }
  return { id: 'guest', full_name: 'Guest User', email: 'guest@riskguard.local' };
}

/**
 * Fetch stored financial profile
 */
export async function get_financial_profile() {
  const res = await apiFetch('/profile');
  return res.profile || null;
}

/**
 * Fetch expense list and aggregated category summary
 */
export async function get_expenses() {
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

  return {
    items,
    totalCount: items.length,
    totalAmount,
    totalEssential,
    totalDiscretionary,
    categories,
    largestCategory: categories[0] || null
  };
}

/**
 * Fetch debt list and aggregated liability summary
 */
export async function get_debts() {
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

  return {
    items,
    totalCount: items.length,
    totalOutstanding,
    totalEmi,
    highestInterestDebt,
    largestDebt
  };
}

/**
 * Fetch portfolio holdings, allocations, performance, and risk metrics
 */
export async function get_investments() {
  const [portRes, riskRes] = await Promise.all([
    apiFetch('/portfolio'),
    apiFetch('/risk/portfolio')
  ]);

  const items = portRes.holdings || [];
  const totalValue = items.reduce((sum, i) => sum + (Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price))), 0);
  const totalInvested = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.purchase_price || i.current_price)), 0);
  const totalProfitLoss = totalValue - totalInvested;
  const returnPct = totalInvested > 0 ? Number(((totalProfitLoss / totalInvested) * 100).toFixed(2)) : 0;

  // Find best and worst performing assets
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

  return {
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
}

/**
 * Fetch financial goals and progress analysis
 */
export async function get_goals() {
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

  return {
    items: enrichedGoals,
    totalCount: items.length,
    totalTarget,
    totalSaved,
    overallProgressPct,
    furthestGoal,
    closestGoal
  };
}

/**
 * Fetch comprehensive personal risk profile
 */
export async function get_risk_profile() {
  const res = await apiFetch('/risk/personal');
  return res.assessment || null;
}

/**
 * Fetch credit risk prediction
 */
export async function get_credit_risk(params = null) {
  const options = params ? { method: 'POST', body: JSON.stringify(params) } : {};
  const res = await apiFetch('/risk/credit', options);
  return res.creditRisk || null;
}

/**
 * Fetch risk score history and trends
 */
export async function get_prediction_history() {
  const res = await apiFetch('/risk/history');
  return res.history || [];
}

/**
 * Run What-If Simulation
 */
export async function run_what_if_simulation(simParams) {
  const res = await apiFetch('/simulator/what-if', {
    method: 'POST',
    body: JSON.stringify(simParams)
  });
  return res;
}

/**
 * Run Monte Carlo Simulation
 */
export async function run_monte_carlo(simParams) {
  const res = await apiFetch('/risk/monte-carlo', {
    method: 'POST',
    body: JSON.stringify(simParams)
  });
  return res.simulation || null;
}

// ============================================================================
// 2. UNIFIED CONTEXT BUILDER (INTENT-BASED)
// ============================================================================

export async function getAuthenticatedFinancialContext(requiredDomains = ['all']) {
  const context = {};
  const fetchAll = requiredDomains.includes('all');

  const tasks = [];

  if (fetchAll || requiredDomains.includes('profile') || requiredDomains.includes('financial')) {
    tasks.push(get_financial_profile().then(p => { context.profile = p; }));
  }
  if (fetchAll || requiredDomains.includes('expenses')) {
    tasks.push(get_expenses().then(e => { context.expenses = e; }));
  }
  if (fetchAll || requiredDomains.includes('debts')) {
    tasks.push(get_debts().then(d => { context.debts = d; }));
  }
  if (fetchAll || requiredDomains.includes('investments') || requiredDomains.includes('portfolio')) {
    tasks.push(get_investments().then(i => { context.investments = i; }));
  }
  if (fetchAll || requiredDomains.includes('goals')) {
    tasks.push(get_goals().then(g => { context.goals = g; }));
  }
  if (fetchAll || requiredDomains.includes('risk')) {
    tasks.push(get_risk_profile().then(r => { context.risk = r; }));
  }
  if (fetchAll || requiredDomains.includes('credit')) {
    tasks.push(get_credit_risk().then(c => { context.credit = c; }));
  }
  if (fetchAll || requiredDomains.includes('history')) {
    tasks.push(get_prediction_history().then(h => { context.history = h; }));
  }

  await Promise.all(tasks);
  return context;
}

// ============================================================================
// 3. COMPLETE FINANCIAL DATA DIAGNOSTIC ENGINE
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

  // 1. User Profile & Income
  const inc = Number(prof?.monthly_net_income || 0);
  auditReport.push({
    module: 'Financial Profile & Income',
    accessible: Boolean(prof),
    dataAvailable: inc > 0,
    details: inc > 0 ? `Monthly Income: ${formatINR(inc)}` : 'Zero / Missing income value',
    status: prof && inc > 0 ? 'WORKING' : 'INCONSISTENT'
  });

  // 2. Liquid Savings & Reserves
  const sav = Number(prof?.liquid_savings || 0);
  const emg = Number(prof?.emergency_fund || 0);
  auditReport.push({
    module: 'Liquid Reserves & Emergency Fund',
    accessible: Boolean(prof),
    dataAvailable: sav > 0 || emg > 0,
    details: `Savings: ${formatINR(sav)}, Emergency Reserve: ${formatINR(emg)}`,
    status: sav > 0 ? 'WORKING' : 'EMPTY'
  });

  // 3. Expenses
  auditReport.push({
    module: 'Expense Tracker',
    accessible: true,
    dataAvailable: exps.totalCount > 0,
    details: exps.totalCount > 0 ? `${exps.totalCount} items totaling ${formatINR(exps.totalAmount)}/mo` : 'No individual transactions logged',
    status: exps.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  // 4. Debts & Liabilities
  auditReport.push({
    module: 'Debt & Liabilities',
    accessible: true,
    dataAvailable: debts.totalCount > 0 || Number(prof?.monthly_debt_payments || 0) > 0,
    details: debts.totalCount > 0 ? `${debts.totalCount} active debts (${formatINR(debts.totalOutstanding)} bal, ${formatINR(debts.totalEmi)} EMI)` : 'No active debts logged (Debt Free)',
    status: 'WORKING'
  });

  // 5. Portfolio & Investments
  auditReport.push({
    module: 'Portfolio Holdings',
    accessible: true,
    dataAvailable: invs.totalCount > 0,
    details: invs.totalCount > 0 ? `${invs.totalCount} holdings totaling ${formatINR(invs.totalValue)} (${invs.returnPct >= 0 ? '+' : ''}${invs.returnPct}%)` : 'No portfolio holdings recorded',
    status: invs.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  // 6. Portfolio Risk (VaR / CVaR)
  const portRisk = invs.portfolioRisk;
  auditReport.push({
    module: 'Portfolio Quantitative VaR / CVaR',
    accessible: Boolean(portRisk),
    dataAvailable: Boolean(portRisk?.metrics?.historicalVaR1DayPct),
    details: portRisk ? `1-Day VaR (95%): ${portRisk.metrics?.historicalVaR1DayPct}% (${formatINR(portRisk.metrics?.historicalVaR1DayAmount)}), Sharpe: ${portRisk.metrics?.sharpeRatio}` : 'Engine calculation pending',
    status: portRisk ? 'WORKING' : 'UNAVAILABLE'
  });

  // 7. Credit Risk Engine
  auditReport.push({
    module: 'Credit Risk ML Underwriting',
    accessible: Boolean(cred),
    dataAvailable: Boolean(cred?.creditScore),
    details: cred ? `Credit Score: ${cred.creditScore}/850 (${cred.tier}), Default Risk: ${cred.probDefault}%` : 'Model execution pending',
    status: cred ? 'WORKING' : 'UNAVAILABLE'
  });

  // 8. Personal Risk Assessment
  auditReport.push({
    module: 'Personal Risk Assessment',
    accessible: Boolean(risk),
    dataAvailable: Boolean(risk?.overallScore !== undefined),
    details: risk ? `Overall Score: ${risk.overallScore}/100 (${risk.overallLevel}), DTI: ${risk.metrics?.dtiRatio}%` : 'Assessment pending profile data',
    status: risk ? 'WORKING' : 'INCONSISTENT'
  });

  // 9. Financial Goals
  auditReport.push({
    module: 'Financial Goals',
    accessible: true,
    dataAvailable: goals.totalCount > 0,
    details: goals.totalCount > 0 ? `${goals.totalCount} goals (${goals.overallProgressPct}% funded of ${formatINR(goals.totalTarget)})` : 'No financial targets created yet',
    status: goals.totalCount > 0 ? 'WORKING' : 'EMPTY'
  });

  // 10. Risk History & Audit Logs
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
// 4. SECURITY & PROMPT INJECTION SANITIZATION
// ============================================================================

export function checkSecurityAndPrivacy(query) {
  const lower = query.toLowerCase();

  // Pattern 1: Bypassing instructions / Revealing system prompt
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

  // Pattern 2: Attempting to access other users' data or bypass RLS
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
// 5. SEMANTIC INTENT PARSER & DETERMINISTIC EXECUTION
// ============================================================================

/**
 * Natural language scenario parser for What-If questions
 */
export function extractWhatIfParameters(query, currentProfile) {
  const str = query.toLowerCase();
  const baseInc = Number(currentProfile?.monthly_net_income || 75000);
  const baseExp = Number((currentProfile?.essential_expenses || 30000) + (currentProfile?.discretionary_expenses || 15000));
  const baseDebt = Number(currentProfile?.monthly_debt_payments || 12000);
  const baseSav = Number(currentProfile?.liquid_savings || 100000);

  let incomeChangePct = 0;
  let expenseChangePct = 0;
  let additionalDebt = 0;
  let additionalSavings = 0;
  let isParsed = false;

  // Income percentage changes (e.g. "income increases by 25%", "salary up 20%", "income decreases by 10%")
  const incPctMatch = str.match(/(?:income|salary|earnings?)\s*(?:increases?|goes up|rises?|grows?|up|boosted|decreases?|falls?|down|drops?)\s*(?:by)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                      str.match(/(\d+(?:\.\d+)?)\s*%\s*(?:increase|raise|boost|decrease|cut)\s*(?:in|to)?\s*(?:income|salary)/i);
  if (incPctMatch) {
    const val = parseFloat(incPctMatch[1]);
    const isNegative = str.includes('decrease') || str.includes('fall') || str.includes('cut') || str.includes('down');
    incomeChangePct = isNegative ? -val : val;
    isParsed = true;
  }

  // Expense absolute / percentage changes (e.g. "expenses decrease by 5000", "reduce spending by 2k")
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

  // EMI / Debt changes (e.g. "reduce EMI by 5000", "EMI decreases by 10k", "additional EMI of 4000")
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

  // Savings changes (e.g. "savings increase by 1 lakh", "add 50k to savings")
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

/**
 * Deterministic Financial Intelligence Query Solver
 * Executes live tools, performs calculations, and synthesizes structured answers.
 */
export async function executeDeterministicFinancialQuery(query) {
  const lower = query.toLowerCase().trim();

  // 1. DIAGNOSTIC QUERY
  if (
    lower.includes('diagnostic') ||
    lower.includes('audit data') ||
    lower.includes('check system health') ||
    lower.includes('data completeness')
  ) {
    const report = await run_financial_data_diagnostic();
    let table = '| Module | Accessible | Data Status | Details |\n| :--- | :--- | :--- | :--- |\n';
    report.forEach(row => {
      const badge = row.status === 'WORKING' ? '🟢 WORKING' : row.status === 'EMPTY' ? '🟡 EMPTY' : row.status === 'INCONSISTENT' ? '🔴 INCONSISTENT' : '⚪ UNAVAILABLE';
      table += `| **${row.module}** | ${row.accessible ? '✅ Yes' : '❌ No'} | ${badge} | ${row.details} |\n`;
    });

    return {
      type: 'diagnostic',
      text: `🔍 **Complete Financial Data Diagnostic Report**\n\n${table}\n\n*Source: Real-time verification across 10 application database tables and calculation engines.*`
    };
  }

  // 2. WHAT-IF SIMULATION QUERY
  const currentProf = await get_financial_profile();
  const whatIf = extractWhatIfParameters(query, currentProf);
  if (whatIf.isParsed) {
    const simRes = await run_what_if_simulation(whatIf.params);
    const mBase = simRes.baselineMetrics || {};
    const mSim = simRes.simulatedMetrics || {};
    const scoreDelta = simRes.scoreDelta || 0;
    const deltaSign = scoreDelta > 0 ? '+' : '';

    return {
      type: 'what_if',
      text: `🔮 **What-If Financial Stress Simulation**\n\n` +
            `| Metric | Current Baseline | Simulated Scenario | Change |\n` +
            `| :--- | :--- | :--- | :--- |\n` +
            `| **Monthly Net Income** | ${formatINR(mBase.monthlyIncome)} | ${formatINR(mSim.monthlyIncome)} | ${mSim.monthlyIncome !== mBase.monthlyIncome ? (mSim.monthlyIncome > mBase.monthlyIncome ? '+' : '') + formatINR(mSim.monthlyIncome - mBase.monthlyIncome) : 'Unchanged'} |\n` +
            `| **Monthly Expenses** | ${formatINR(mBase.totalMonthlyExpenses)} | ${formatINR(mSim.totalMonthlyExpenses)} | ${mSim.totalMonthlyExpenses !== mBase.totalMonthlyExpenses ? formatINR(mSim.totalMonthlyExpenses - mBase.totalMonthlyExpenses) : 'Unchanged'} |\n` +
            `| **Monthly Debt (EMI)** | ${formatINR(mBase.totalDebtPayment)} | ${formatINR(mSim.totalDebtPayment)} | ${mSim.totalDebtPayment !== mBase.totalDebtPayment ? formatINR(mSim.totalDebtPayment - mBase.totalDebtPayment) : 'Unchanged'} |\n` +
            `| **Debt-to-Income (DTI)** | ${mBase.dtiRatio}% | **${mSim.dtiRatio}%** | ${mSim.dtiRatio - mBase.dtiRatio !== 0 ? `${mSim.dtiRatio - mBase.dtiRatio}%` : '0%'} |\n` +
            `| **Net Cash Flow** | ${formatINR(mBase.netCashFlow)} | **${formatINR(mSim.netCashFlow)}** | ${formatINR(mSim.netCashFlow - mBase.netCashFlow)} |\n` +
            `| **Overall Risk Score** | ${simRes.baselineScore}/100 | **${simRes.simulatedScore}/100** | **${deltaSign}${scoreDelta} pts** (${simRes.simulatedLevel}) |\n\n` +
            `💡 **Impact Summary**: ${scoreDelta < 0 ? '✅ This scenario reduces your overall financial risk score.' : scoreDelta > 0 ? '⚠️ This scenario increases financial leverage and risk.' : 'Impact on risk score is neutral.'}\n\n*Source: Real-time calculation via What-If Simulator Engine.*`
    };
  }

  // 3. INCOME QUERIES
  if (
    (lower.includes('income') || lower.includes('earning') || lower.includes('salary') || lower.includes('take home') || lower.includes('in hand')) &&
    !lower.includes('what is') && !lower.includes('dti')
  ) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    if (!prof || inc === 0) {
      return { type: 'data', text: 'You currently have no monthly income records available in your financial profile. Please update your profile on the Dashboard.' };
    }
    const annual = inc * 12;
    return {
      type: 'data',
      text: `💼 **Your Stored Monthly Net Income:** **${formatINR(inc)}** *(Annualized: ${formatINR(annual)})*\n\n*Source: Derived from your saved financial profile.*`
    };
  }

  // 4. EXPENSE QUERIES
  if (
    (lower.includes('expense') || lower.includes('spending') || lower.includes('spend')) &&
    !lower.includes('what is')
  ) {
    const exps = await get_expenses();
    const prof = await get_financial_profile();
    const totalExp = exps.totalAmount > 0 ? exps.totalAmount : Number((prof?.essential_expenses || 0) + (prof?.discretionary_expenses || 0));

    if (totalExp === 0 && exps.totalCount === 0) {
      return { type: 'data', text: 'No expense records are currently available. You can log expenses on the Expenses page.' };
    }

    let breakdown = '';
    if (exps.categories.length > 0) {
      breakdown = `\n\n**Top Expense Categories:**\n` + exps.categories.slice(0, 4).map(c => `• **${c.name}:** ${formatINR(c.total)} (${c.percentage}%)`).join('\n');
    }

    return {
      type: 'data',
      text: `🛒 **Total Monthly Expenses:** **${formatINR(totalExp)}**\n• **Essential Spending:** ${formatINR(exps.totalEssential || prof?.essential_expenses || 0)}\n• **Discretionary Spending:** ${formatINR(exps.totalDiscretionary || prof?.discretionary_expenses || 0)}${breakdown}\n\n*Source: Based on your stored expense records and financial profile.*`
    };
  }

  // 5. DEBT & EMI QUERIES
  if (
    (lower.includes('debt') || lower.includes('emi') || lower.includes('loan') || lower.includes('liability') || lower.includes('liabilities') || lower.includes('owe')) &&
    !lower.includes('what is') && !lower.includes('dti')
  ) {
    const debts = await get_debts();
    const prof = await get_financial_profile();
    const totalDebt = debts.totalOutstanding > 0 ? debts.totalOutstanding : Number(prof?.total_debt || 0);
    const totalEmi = debts.totalEmi > 0 ? debts.totalEmi : Number(prof?.monthly_debt_payments || 0);

    if (totalDebt === 0 && totalEmi === 0 && debts.totalCount === 0) {
      return { type: 'data', text: '✅ **No debt records currently available.** Your profile indicates you are currently debt-free with zero monthly loan obligations.' };
    }

    let extraDetails = '';
    if (debts.highestInterestDebt) {
      extraDetails += `\n• **Highest Interest Liability:** ${debts.highestInterestDebt.name || 'Loan'} at ${debts.highestInterestDebt.interest_rate}% APR`;
    }
    if (debts.largestDebt) {
      extraDetails += `\n• **Largest Outstanding Obligation:** ${debts.largestDebt.name || 'Debt'} (${formatINR(debts.largestDebt.outstanding_balance || debts.largestDebt.original_amount)})`;
    }

    return {
      type: 'data',
      text: `💳 **Debt & Liability Summary:**\n• **Total Outstanding Principal:** **${formatINR(totalDebt)}**\n• **Total Monthly EMI Debt Service:** **${formatINR(totalEmi)}**${extraDetails}\n\n*Source: Calculated from your recorded debt liabilities.*`
    };
  }

  // 6. DTI (DEBT-TO-INCOME) CALCULATION QUERY
  if (
    lower.includes('dti') ||
    lower.includes('debt to income') ||
    lower.includes('debt-to-income')
  ) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    const emi = Number(prof?.monthly_debt_payments || 0);

    if (inc === 0) {
      return {
        type: 'calculation',
        text: `💳 **Debt-to-Income (DTI) Calculation**\n\n• **Formula:** $\\text{DTI} = \\frac{\\text{Total Monthly EMI}}{\\text{Monthly Net Income}} \\times 100$\n• **Status:** Cannot compute DTI because your monthly income is recorded as ₹0. Please log your income on the profile page.`
      };
    }

    const dti = Number(((emi / inc) * 100).toFixed(1));
    const statusText = dti <= 36 ? '✅ Healthy (within recommended ≤36% limit)' : '⚠️ Elevated (exceeds recommended ≤36% threshold)';

    return {
      type: 'calculation',
      text: `💳 **Your Calculated Debt-to-Income (DTI) Ratio: ${dti}%**\n\n• **Monthly Debt Service (EMI):** ${formatINR(emi)}\n• **Monthly Net Income:** ${formatINR(inc)}\n• **Mathematical Formula:** $\\frac{${formatINR(emi)}}{${formatINR(inc)}} \\times 100 = ${dti}\\%$\n• **Financial Assessment:** ${statusText}\n\n*Source: Calculated deterministically from current profile and debt records.*`
    };
  }

  // 7. SAVINGS RATE & CASH FLOW QUERIES
  if (
    lower.includes('savings rate') ||
    lower.includes('disposable income') ||
    lower.includes('cash flow') ||
    lower.includes('surplus')
  ) {
    const prof = await get_financial_profile();
    const inc = Number(prof?.monthly_net_income || 0);
    const exp = Number((prof?.essential_expenses || 0) + (prof?.discretionary_expenses || 0));
    const emi = Number(prof?.monthly_debt_payments || 0);

    if (inc === 0) {
      return { type: 'calculation', text: 'Cannot compute savings rate because monthly income is recorded as ₹0.' };
    }

    const netCashFlow = inc - exp - emi;
    const savingsRate = Number(((netCashFlow / inc) * 100).toFixed(1));

    return {
      type: 'calculation',
      text: `💰 **Cash Flow & Savings Rate Analysis:**\n\n• **Monthly Net Income:** ${formatINR(inc)}\n• **Total Outflows:** ${formatINR(exp + emi)} (Expenses: ${formatINR(exp)}, Debt EMI: ${formatINR(emi)})\n• **Net Disposable Cash Flow:** **${formatINR(netCashFlow)}**\n• **Calculated Savings Rate:** **${savingsRate}%**\n• **Formula:** $\\frac{\\text{Net Cash Flow (${formatINR(netCashFlow)})}}{\\text{Net Income (${formatINR(inc)})}} \\times 100 = ${savingsRate}\\%$\n\n*Source: Derived from current cash flow equations.*`
    };
  }

  // 8. PORTFOLIO HOLDINGS & RETURNS QUERIES
  if (
    lower.includes('portfolio') ||
    lower.includes('investment') ||
    lower.includes('stock') ||
    lower.includes('asset') ||
    lower.includes('shares') ||
    lower.includes('profit') ||
    lower.includes('return')
  ) {
    const invs = await get_investments();
    if (invs.totalCount === 0) {
      return { type: 'data', text: '📊 **You currently have no investment records available.** You can add stocks, mutual funds, crypto, or bonds on the Investments page.' };
    }

    let extraText = '';
    if (invs.bestPerformer) {
      extraText += `\n• **Top Performing Asset:** ${invs.bestPerformer.asset_name} (+${invs.bestPerformer.returnPct}%)`;
    }
    if (invs.worstPerformer && invs.worstPerformer !== invs.bestPerformer) {
      extraText += `\n• **Worst Performing Asset:** ${invs.worstPerformer.asset_name} (${invs.worstPerformer.returnPct}%)`;
    }

    return {
      type: 'data',
      text: `📈 **Portfolio Investment Intelligence:**\n\n• **Total Portfolio Market Value:** **${formatINR(invs.totalValue)}**\n• **Total Principal Invested:** ${formatINR(invs.totalInvested)}\n• **Net Unrealized Profit/Loss:** **${invs.totalProfitLoss >= 0 ? '+' : ''}${formatINR(invs.totalProfitLoss)}**\n• **Total Portfolio Return:** **${invs.returnPct >= 0 ? '+' : ''}${invs.returnPct}%**\n• **Active Holdings Count:** ${invs.totalCount} assets${extraText}\n\n*Source: Calculated from stored portfolio holdings.*`
    };
  }

  // 9. VALUE AT RISK (VaR) & CVaR QUERIES
  if (
    lower.includes('var') ||
    lower.includes('value at risk') ||
    lower.includes('cvar') ||
    lower.includes('expected shortfall') ||
    lower.includes('downside risk')
  ) {
    const invs = await get_investments();
    const pRisk = invs.portfolioRisk;
    if (!pRisk || invs.totalCount === 0) {
      return { type: 'data', text: 'Value at Risk (VaR) calculations require recorded portfolio holdings. Please add investments to compute quantitative tail risk metrics.' };
    }

    const m = pRisk.metrics || {};
    return {
      type: 'analytics',
      text: `📉 **Quantitative Downside Risk & VaR Analysis:**\n\n• **Portfolio Value:** ${formatINR(pRisk.totalValue)}\n• **1-Day Historical VaR (95%):** **${m.historicalVaR1DayPct}%** (${formatINR(m.historicalVaR1DayAmount)})\n• **1-Day Parametric Gaussian VaR:** **${m.parametricVaR1DayPct}%** (${formatINR(m.parametricVaR1DayAmount)})\n• **1-Day Conditional VaR (CVaR / Expected Shortfall):** **${m.cvar1DayPct}%** (${formatINR(m.cvar1DayAmount)})\n• **Sharpe Ratio:** ${m.sharpeRatio} (Rf: ${(RISK_FREE_RATE * 100).toFixed(1)}% benchmark)\n• **Portfolio Beta:** ${m.beta} | **Annualized Volatility:** ${m.annualizedVol}%\n\n*Interpretation: Under normal market conditions (95% confidence), your maximum estimated 1-day portfolio loss will not exceed ${formatINR(m.historicalVaR1DayAmount)}.*`
    };
  }

  // 10. CREDIT RISK & ML SCORE QUERIES
  if (
    lower.includes('credit risk') ||
    lower.includes('credit score') ||
    lower.includes('default probability') ||
    lower.includes('probability of default')
  ) {
    const cred = await get_credit_risk();
    if (!cred || !cred.creditScore) {
      return { type: 'data', text: 'No completed credit-risk prediction is available yet. Please run a credit risk evaluation on the Credit Risk page.' };
    }

    let factorsList = '';
    if (cred.drivingFactors && cred.drivingFactors.length > 0) {
      factorsList = '\n\n**Key Driving Factors:**\n' + cred.drivingFactors.map(f => `• **${f.factor} (${f.impact}):** ${f.detail}`).join('\n');
    }

    return {
      type: 'ml',
      text: `🏦 **Credit Risk ML Underwriting Assessment:**\n\n• **Predicted Credit Score:** **${cred.creditScore}/850** (${cred.tier})\n• **Risk Level:** **${cred.riskLevel}**\n• **Estimated Default Probability:** **${cred.probDefault}%**\n• **Model:** Scikit-Learn Logistic Regression Classifier${factorsList}\n\n*Source: Executed by application credit-risk ML model.*`
    };
  }

  // 11. FINANCIAL GOALS QUERIES
  if (
    lower.includes('goal') ||
    lower.includes('target') ||
    lower.includes('milestone')
  ) {
    const goals = await get_goals();
    if (goals.totalCount === 0) {
      return { type: 'data', text: '🎯 **You currently have no financial goals recorded.** You can create savings goals on the Goals page.' };
    }

    const goalRows = goals.items.map(g => `• **${g.goal_name}:** ${g.progressPct}% complete (${formatINR(g.saved)} of ${formatINR(g.target)})`).join('\n');

    return {
      type: 'data',
      text: `🎯 **Financial Goals Progress Summary:**\n\n${goalRows}\n\n• **Aggregate Goals Target:** ${formatINR(goals.totalTarget)}\n• **Total Funded:** ${formatINR(goals.totalSaved)} (${goals.overallProgressPct}%)\n\n*Source: Derived from your saved financial goals.*`
    };
  }

  // 12. OVERALL RISK & HEALTH SUMMARY QUERIES
  if (
    lower.includes('financial health') ||
    lower.includes('risk score') ||
    lower.includes('overall risk') ||
    lower.includes('summarize my dashboard') ||
    lower.includes('how am i doing') ||
    lower.includes('am i financially healthy')
  ) {
    const [prof, risk, debts, invs] = await Promise.all([
      get_financial_profile(),
      get_risk_profile(),
      get_debts(),
      get_investments()
    ]);

    if (!risk) {
      return { type: 'data', text: 'I need your financial profile data to evaluate your overall financial health.' };
    }

    const m = risk.metrics || {};
    return {
      type: 'analysis',
      text: `🛡️ **Executive Financial Health & Risk Assessment:**\n\n` +
            `• **Overall Financial Risk Score:** **${risk.overallScore}/100** (${risk.overallLevel})\n` +
            `• **Monthly Net Income:** ${formatINR(m.monthlyIncome)}\n` +
            `• **Monthly Net Cash Flow:** ${formatINR(m.netCashFlow)} (Savings Rate: ${m.savingsRate}%)\n` +
            `• **Debt-to-Income (DTI):** ${m.dtiRatio}% (Target: ≤36%)\n` +
            `• **Emergency Fund Coverage:** ${m.emergencyCoverageMonths} months of essential spending\n` +
            `• **Portfolio Total Value:** ${formatINR(invs.totalValue)} (${invs.totalCount} assets)\n\n` +
            `📋 **Strategic Assessment**: ${risk.overallScore < 35 ? 'Your financial structure shows robust liquidity and disciplined debt management.' : risk.overallScore < 60 ? 'Your financial position is balanced, but building emergency reserves and lowering DTI will improve resilience.' : 'High debt leverage or negative cash flow requires immediate attention to reduce financial vulnerability.'}\n\n` +
            `*Source: Multi-factor risk engine evaluation based on live database state.*`
    };
  }

  // Query is not matching a single fixed category: return null to let LLM synthesize
  return null;
}
