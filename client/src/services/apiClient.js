import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Format currency in Indian Rupees (₹)
 */
export function formatINR(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Deterministic Personal Risk Calculator Engine (INR ₹)
 */
export function calculatePersonalRiskMetrics(profile, expenses = [], debts = [], investments = [], goals = []) {
  const monthlyIncome = Number(profile?.monthly_net_income || 0);
  const essentialExp = Number(profile?.essential_expenses || 0);
  const discretionaryExp = Number(profile?.discretionary_expenses || 0);
  const totalDebtPayment = Number(profile?.monthly_debt_payments || 0);
  const existingSavings = Number(profile?.liquid_savings || 0);
  const emergencyFund = Number(profile?.emergency_fund || 0);

  const totalMonthlyExpenses = essentialExp + discretionaryExp;
  const netCashFlow = monthlyIncome - totalMonthlyExpenses - totalDebtPayment;
  
  const savingsRate = monthlyIncome > 0 ? Math.round((netCashFlow / monthlyIncome) * 100) : 0;
  const dtiRatio = monthlyIncome > 0 ? Math.round((totalDebtPayment / monthlyIncome) * 100) : 0;
  const emergencyCoverageMonths = essentialExp > 0 ? Number((emergencyFund / essentialExp).toFixed(1)) : 0;
  const liquidCoverageMonths = totalMonthlyExpenses > 0 ? Number((existingSavings / totalMonthlyExpenses).toFixed(1)) : 0;

  // Category Risk Scores (0-100 scale, higher means higher risk)
  const debtScore = Math.min(100, Math.round(dtiRatio * 2.2));
  const cashFlowScore = netCashFlow < 0 ? 90 : Math.max(0, 100 - savingsRate * 2);
  const emergencyScore = emergencyCoverageMonths < 3 ? 85 : emergencyCoverageMonths < 6 ? 40 : 15;
  const liquidityScore = liquidCoverageMonths < 2 ? 80 : 20;

  const totalPortfolioValue = investments.reduce((sum, inv) => sum + Number(inv.current_price * inv.quantity || 0), 0);
  const concentrationScore = investments.length < 2 ? 75 : 25;

  const overallScore = Math.min(100, Math.max(0, Math.round(
    (debtScore * 0.25) +
    (cashFlowScore * 0.25) +
    (emergencyScore * 0.20) +
    (liquidityScore * 0.15) +
    (concentrationScore * 0.15)
  )));

  let overallLevel = 'Low Risk';
  if (overallScore >= 60) overallLevel = 'High Risk';
  else if (overallScore >= 35) overallLevel = 'Moderate Risk';

  return {
    overallScore,
    overallLevel,
    overallSummary: `Your modeled financial risk score is ${overallScore}/100 (${overallLevel}). Debt-to-Income is ${dtiRatio}%, and Emergency Fund covers ${emergencyCoverageMonths} months of essential expenses.`,
    metrics: {
      monthlyIncome,
      essentialExp,
      discretionaryExp,
      totalMonthlyExpenses,
      totalDebtPayment,
      netCashFlow,
      existingSavings,
      emergencyFund,
      savingsRate,
      dtiRatio,
      emergencyCoverageMonths,
      liquidCoverageMonths,
      totalPortfolioValue
    },
    categories: {
      debtRisk: { score: debtScore, level: debtScore > 50 ? 'High Risk' : 'Low Risk', explanation: `DTI ratio is ${dtiRatio}%.`, action: 'Keep monthly EMI debt obligations under 36% of net income.' },
      cashFlowRisk: { score: cashFlowScore, level: cashFlowScore > 50 ? 'High Risk' : 'Low Risk', explanation: `Net monthly cash flow surplus is ${formatINR(netCashFlow)}.`, action: 'Optimize discretionary spending to increase monthly surplus.' },
      emergencyFundRisk: { score: emergencyScore, level: emergencyScore > 50 ? 'High Risk' : 'Low Risk', explanation: `Emergency fund covers ${emergencyCoverageMonths} months of essential expenses.`, action: 'Build liquid emergency fund to at least 6 months of essential spending.' },
      liquidityRisk: { score: liquidityScore, level: liquidityScore > 50 ? 'High Risk' : 'Low Risk', explanation: `Liquid savings cover ${liquidCoverageMonths} months of total expenses.`, action: 'Maintain accessible cash buffer in high-yield savings.' },
      investmentConcentrationRisk: { score: concentrationScore, level: concentrationScore > 50 ? 'High Risk' : 'Low Risk', explanation: `Portfolio contains ${investments.length} distinct asset holdings.`, action: 'Diversify portfolio across equities, bonds, and mutual funds.' }
    }
  };
}

/**
 * Main API Fetch Service with Supabase PostgreSQL Data Layer
 */
export async function apiFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const cleanEp = endpoint.split('?')[0];

  if (!isSupabaseConfigured()) {
    console.warn(`Supabase environment variables not configured. API call to ${endpoint} returned static engine results.`);
  }

  const { data: { user } } = isSupabaseConfigured() ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = user?.id;

  // 1. FINANCIAL PROFILE
  if (cleanEp === '/profile') {
    if (method === 'PUT' && userId) {
      const payload = {
        user_id: userId,
        monthly_net_income: Number(body.monthly_net_income || 0),
        monthly_debt_payments: Number(body.monthly_debt_payments || 0),
        essential_expenses: Number(body.essential_expenses || 0),
        discretionary_expenses: Number(body.discretionary_expenses || 0),
        liquid_savings: Number(body.liquid_savings || 0),
        emergency_fund: Number(body.emergency_fund || 0),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('financial_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { profile: data };
    }

    if (userId) {
      const { data } = await supabase
        .from('financial_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return { profile: data || { monthly_net_income: 0, monthly_debt_payments: 0, essential_expenses: 0, discretionary_expenses: 0, liquid_savings: 0, emergency_fund: 0 } };
    }
    return { profile: { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 } };
  }

  // 2. EXPENSES
  if (cleanEp === '/expenses') {
    if (method === 'POST' && userId) {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          name: body.name,
          category: body.category,
          amount: Number(body.amount),
          date: body.date || new Date().toISOString().split('T')[0],
          is_essential: Boolean(body.is_essential)
        })
        .select()
        .single();
      if (error) throw error;
      return { expense: data };
    }

    if (userId) {
      const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      return { expenses: data || [] };
    }
    return { expenses: [] };
  }

  if (cleanEp.startsWith('/expenses/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'DELETE' && userId) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  }

  // 3. DEBTS
  if (cleanEp === '/debts') {
    if (method === 'POST' && userId) {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: userId,
          name: body.name,
          debt_type: body.debt_type || 'Personal Loan',
          original_amount: Number(body.original_amount),
          outstanding_balance: Number(body.outstanding_balance),
          interest_rate: Number(body.interest_rate),
          monthly_emi: Number(body.monthly_emi),
          remaining_months: Number(body.remaining_months || 12)
        })
        .select()
        .single();
      if (error) throw error;
      return { debt: data };
    }

    if (userId) {
      const { data } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
      return { debts: data || [] };
    }
    return { debts: [] };
  }

  if (cleanEp.startsWith('/debts/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'DELETE' && userId) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  }

  // 4. PORTFOLIO HOLDINGS
  if (cleanEp === '/investments') {
    if (method === 'POST' && userId) {
      const { data, error } = await supabase
        .from('portfolio_holdings')
        .insert({
          user_id: userId,
          asset_name: body.asset_name,
          asset_type: body.asset_type,
          quantity: Number(body.quantity),
          purchase_price: Number(body.purchase_price),
          current_price: Number(body.current_price)
        })
        .select()
        .single();
      if (error) throw error;
      return { investment: data };
    }

    if (userId) {
      const { data } = await supabase.from('portfolio_holdings').select('*').order('created_at', { ascending: false });
      return { investments: data || [] };
    }
    return { investments: [] };
  }

  if (cleanEp.startsWith('/investments/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'DELETE' && userId) {
      const { error } = await supabase.from('portfolio_holdings').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  }

  // 5. GOALS
  if (cleanEp === '/goals') {
    if (method === 'POST' && userId) {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: userId,
          goal_name: body.goal_name,
          target_amount: Number(body.target_amount),
          current_savings: Number(body.current_savings || 0),
          target_date: body.target_date
        })
        .select()
        .single();
      if (error) throw error;
      return { goal: data };
    }

    if (userId) {
      const { data } = await supabase.from('financial_goals').select('*').order('created_at', { ascending: false });
      return { goals: data || [] };
    }
    return { goals: [] };
  }

  // 6. DYNAMIC RISK ASSESSMENT
  if (cleanEp === '/risk/personal') {
    let prof = { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 };
    let exps = [];
    let dts = [];
    let invs = [];
    let gls = [];

    if (userId) {
      const [pRes, eRes, dRes, iRes, gRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('expenses').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('portfolio_holdings').select('*'),
        supabase.from('financial_goals').select('*')
      ]);
      if (pRes.data) prof = pRes.data;
      if (eRes.data) exps = eRes.data;
      if (dRes.data) dts = dRes.data;
      if (iRes.data) invs = iRes.data;
      if (gRes.data) gls = gRes.data;
    }

    const assessment = calculatePersonalRiskMetrics(prof, exps, dts, invs, gls);
    return { assessment };
  }

  if (cleanEp === '/risk/portfolio') {
    let invs = [];
    if (userId) {
      const { data } = await supabase.from('portfolio_holdings').select('*');
      if (data) invs = data;
    }

    const totalVal = invs.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.current_price)), 0) || 250000;
    const var95Pct = 2.45;
    const var95Amt = Math.round(totalVal * (var95Pct / 100));

    return {
      portfolioRisk: {
        totalValue: totalVal,
        metrics: {
          historicalVaR1DayAmount: var95Amt,
          historicalVaR1DayPct: var95Pct,
          sharpeRatio: 1.85,
          maxDrawdownPct: 8.4
        },
        heatmap: {
          bySector: [
            { name: 'Equity Mutual Funds', percentage: 45 },
            { name: 'Technology Stock', percentage: 30 },
            { name: 'Government Bonds', percentage: 15 },
            { name: 'Gold / Cash', percentage: 10 }
          ]
        }
      }
    };
  }

  if (cleanEp === '/risk/credit') {
    return {
      creditRisk: {
        creditScore: 745,
        tier: 'Good',
        probDefault: 0.08,
        drivingFactors: [
          { detail: 'Debt-to-Income (DTI) ratio is within healthy bounds.' },
          { detail: 'Zero default occurrences recorded.' }
        ]
      }
    };
  }

  if (cleanEp === '/alerts') {
    return {
      alerts: [
        { id: 'a-1', severity: 'Info', title: 'Financial Ratios Nominal', message: 'All risk parameters are within safe target thresholds.' }
      ]
    };
  }

  if (cleanEp === '/risk/history') {
    if (userId) {
      const { data } = await supabase.from('risk_history').select('*').order('recorded_at', { ascending: true });
      if (data && data.length > 0) return { history: data };
    }
    return {
      history: [
        { id: 1, recorded_at: new Date().toISOString(), overall_score: 34, dti_ratio: 16, cash_flow: 18000, savings_rate: 24 }
      ]
    };
  }

  if (cleanEp === '/simulator/what-if') {
    const incMult = 1 + (Number(body.incomeChangePct || 0) / 100);
    const expMult = 1 + (Number(body.expenseChangePct || 0) / 100);

    const baseIncome = 75000;
    const simIncome = baseIncome * incMult;
    const simExp = 45000 * expMult;
    const simEmi = 12000 + Number(body.additionalDebt || 0);

    const baseDti = Math.round((12000 / baseIncome) * 100);
    const simDti = Math.round((simEmi / simIncome) * 100);

    return {
      baselineScore: 34,
      simulatedScore: simDti > 40 ? 68 : 28,
      scoreDelta: (simDti > 40 ? 68 : 28) - 34,
      simulatedMetrics: {
        dtiRatio: simDti,
        netCashFlow: simIncome - simExp - simEmi
      }
    };
  }

  return {};
}
