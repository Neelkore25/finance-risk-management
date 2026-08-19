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
  const emergencyFund = Number(profile?.emergency_fund || profile?.liquid_savings || 0);

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
      debtRisk: { score: debtScore, level: debtScore > 50 ? 'High Risk' : 'Low Risk', weight: '25%', impact: Number((debtScore * 0.25).toFixed(1)), metric: `${dtiRatio}% DTI`, explanation: `DTI ratio is ${dtiRatio}%.`, action: 'Keep monthly EMI debt obligations under 36% of net income.' },
      cashFlowRisk: { score: cashFlowScore, level: cashFlowScore > 50 ? 'High Risk' : 'Low Risk', weight: '25%', impact: Number((cashFlowScore * 0.25).toFixed(1)), metric: formatINR(netCashFlow), explanation: `Net monthly cash flow surplus is ${formatINR(netCashFlow)}.`, action: 'Optimize discretionary spending to increase monthly surplus.' },
      emergencyFundRisk: { score: emergencyScore, level: emergencyScore > 50 ? 'High Risk' : 'Low Risk', weight: '20%', impact: Number((emergencyScore * 0.20).toFixed(1)), metric: `${emergencyCoverageMonths} Months`, explanation: `Emergency fund covers ${emergencyCoverageMonths} months of essential expenses.`, action: 'Build liquid emergency fund to at least 6 months of essential spending.' },
      liquidityRisk: { score: liquidityScore, level: liquidityScore > 50 ? 'High Risk' : 'Low Risk', weight: '15%', impact: Number((liquidityScore * 0.15).toFixed(1)), metric: `${liquidCoverageMonths} Months`, explanation: `Liquid savings cover ${liquidCoverageMonths} months of total expenses.`, action: 'Maintain accessible cash buffer in high-yield savings.' },
      investmentConcentrationRisk: { score: concentrationScore, level: concentrationScore > 50 ? 'High Risk' : 'Low Risk', weight: '15%', impact: Number((concentrationScore * 0.15).toFixed(1)), metric: `${investments.length} Asset Holdings`, explanation: `Portfolio contains ${investments.length} distinct asset holdings.`, action: 'Diversify portfolio across equities, bonds, and mutual funds.' }
    }
  };
}

/**
 * Main API Fetch Service with Supabase PostgreSQL Data Layer & Local Cache Sync
 */
export async function apiFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const cleanEp = endpoint.split('?')[0];

  const { data: { user } } = isSupabaseConfigured() ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = user?.id;

  // 1. FINANCIAL PROFILE
  if (cleanEp === '/profile') {
    if (method === 'PUT') {
      const payload = {
        monthly_net_income: Number(body.monthly_net_income || 0),
        monthly_debt_payments: Number(body.monthly_debt_payments || 0),
        essential_expenses: Number(body.essential_expenses || 0),
        discretionary_expenses: Number(body.discretionary_expenses || 0),
        liquid_savings: Number(body.liquid_savings || 0),
        emergency_fund: Number(body.emergency_fund || body.liquid_savings || 0),
        updated_at: new Date().toISOString()
      };

      // Always save to localStorage so guest / offline engine mode updates immediately
      localStorage.setItem('riskguard_local_profile', JSON.stringify(payload));

      if (userId && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('financial_profiles')
            .upsert({ ...payload, user_id: userId }, { onConflict: 'user_id' })
            .select()
            .single();
          if (!error && data) return { profile: data };
        } catch (err) {}
      }

      return { profile: payload };
    }

    // GET /profile
    if (userId && isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('financial_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (data) {
          localStorage.setItem('riskguard_local_profile', JSON.stringify(data));
          return { profile: data };
        }
      } catch (err) {}
    }

    const cached = localStorage.getItem('riskguard_local_profile');
    if (cached) {
      try {
        return { profile: JSON.parse(cached) };
      } catch (err) {}
    }

    return { profile: { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 } };
  }

  // 2. EXPENSES
  if (cleanEp === '/expenses') {
    if (method === 'POST' && userId && isSupabaseConfigured()) {
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

    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      return { expenses: data || [] };
    }
    return { expenses: [] };
  }

  if (cleanEp.startsWith('/expenses/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'DELETE' && userId && isSupabaseConfigured()) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  }

  // 3. DEBTS
  if (cleanEp === '/debts') {
    if (method === 'POST' && userId && isSupabaseConfigured()) {
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

    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
      return { debts: data || [] };
    }
    return { debts: [] };
  }

  // 4. PORTFOLIO HOLDINGS
  if (cleanEp === '/portfolio') {
    if (method === 'POST' && userId && isSupabaseConfigured()) {
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
      return { holding: data };
    }

    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('portfolio_holdings').select('*').order('created_at', { ascending: false });
      return { holdings: data || [] };
    }
    return { holdings: [] };
  }

  // 5. FINANCIAL GOALS
  if (cleanEp === '/goals') {
    if (method === 'POST' && userId && isSupabaseConfigured()) {
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

    if (userId && isSupabaseConfigured()) {
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

    if (userId && isSupabaseConfigured()) {
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
    } else {
      const cached = localStorage.getItem('riskguard_local_profile');
      if (cached) {
        try {
          prof = JSON.parse(cached);
        } catch (err) {}
      }
    }

    const assessment = calculatePersonalRiskMetrics(prof, exps, dts, invs, gls);
    return { assessment };
  }

  if (cleanEp === '/risk/portfolio') {
    let invs = [];
    if (userId && isSupabaseConfigured()) {
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
          parametricVaR1DayAmount: Math.round(totalVal * 0.021),
          parametricVaR1DayPct: 2.1,
          cvar1DayAmount: Math.round(totalVal * 0.034),
          cvar1DayPct: 3.4,
          beta: 1.12,
          sharpeRatio: 1.85,
          annualizedVol: 14.2,
          maxDrawdown: 8.4
        },
        heatmap: {
          byAssetClass: [
            { class: 'Equities', weightPct: 60, varContributionPct: 68 },
            { class: 'Fixed Income', weightPct: 25, varContributionPct: 12 },
            { class: 'Cash Reserves', weightPct: 15, varContributionPct: 0 }
          ],
          bySector: [
            { sector: 'Technology', weightPct: 40, varContributionPct: 48 },
            { sector: 'Financial Services', weightPct: 35, varContributionPct: 32 },
            { sector: 'Government Securities', weightPct: 25, varContributionPct: 20 }
          ]
        }
      }
    };
  }

  if (cleanEp === '/risk/credit') {
    let prof = { monthly_net_income: 75000, monthly_debt_payments: 12000, liquid_savings: 100000 };
    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (data) prof = data;
    } else {
      const cached = localStorage.getItem('riskguard_local_profile');
      if (cached) {
        try {
          prof = JSON.parse(cached);
        } catch (err) {}
      }
    }

    const income = Number(prof.monthly_net_income || 75000);
    const debt = Number(prof.monthly_debt_payments || 12000);
    const dti = income > 0 ? (debt / income) * 100 : 0;

    let score = 745;
    let prob = 0.08;
    let tier = 'Good';

    if (dti > 45) {
      score = 580;
      prob = 0.38;
      tier = 'Poor';
    } else if (dti > 35) {
      score = 660;
      prob = 0.18;
      tier = 'Fair';
    }

    return {
      creditRisk: {
        creditScore: score,
        tier: tier,
        probDefault: prob,
        modelFeatures: {
          dtiRatio: Number(dti.toFixed(1)),
          monthlyIncome: income,
          totalDebtPayment: debt
        }
      }
    };
  }

  if (cleanEp === '/alerts') {
    return {
      alerts: [
        { id: '1', title: 'Debt-to-Income Stable', message: 'DTI is currently within safe target parameters.', type: 'info', timestamp: 'Just now' }
      ]
    };
  }

  if (cleanEp === '/risk/history') {
    return {
      history: [
        { recorded_at: '2026-08-01', overall_score: 38, dti_ratio: 18, cash_flow: 15000, savings_rate: 20 },
        { recorded_at: '2026-08-15', overall_score: 34, dti_ratio: 16, cash_flow: 18000, savings_rate: 24 }
      ]
    };
  }

  if (cleanEp === '/simulator/what-if') {
    const incPct = body?.incomeChangePct || 0;
    const expPct = body?.expenseChangePct || 0;
    const addDebt = body?.additionalDebt || 0;

    let prof = { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 };
    const cached = localStorage.getItem('riskguard_local_profile');
    if (cached) {
      try {
        prof = JSON.parse(cached);
      } catch (err) {}
    }

    const baseInc = Number(prof.monthly_net_income || 75000);
    const baseExp = Number(prof.essential_expenses || 30000) + Number(prof.discretionary_expenses || 15000);
    const baseDebt = Number(prof.monthly_debt_payments || 12000);

    const simInc = baseInc * (1 + incPct / 100);
    const simExp = baseExp * (1 + expPct / 100);
    const simDebt = baseDebt + addDebt;

    const baseDti = baseInc > 0 ? Math.round((baseDebt / baseInc) * 100) : 0;
    const simDti = simInc > 0 ? Math.round((simDebt / simInc) * 100) : 0;

    const baseScore = Math.min(100, Math.round(baseDti * 2.2));
    const simScore = Math.min(100, Math.round(simDti * 2.2));

    let baseLevel = 'Low Risk';
    if (baseScore >= 60) baseLevel = 'High Risk';
    else if (baseScore >= 35) baseLevel = 'Moderate Risk';

    let simLevel = 'Low Risk';
    if (simScore >= 60) simLevel = 'High Risk';
    else if (simScore >= 35) simLevel = 'Moderate Risk';

    return {
      baselineScore: baseScore,
      baselineLevel: baseLevel,
      simulatedScore: simScore,
      simulatedLevel: simLevel,
      scoreDelta: simScore - baseScore,
      baselineCategories: {
        debtRisk: { score: baseScore, level: baseLevel }
      },
      simulatedCategories: {
        debtRisk: { score: simScore, level: simLevel }
      }
    };
  }

  if (cleanEp === '/risk/monte-carlo') {
    return {
      simulation: {
        percentiles: { p10: 28000, p50: 34000, p90: 42000 },
        paths: [
          [25000, 25500, 26100, 27000, 28200, 29500, 31000, 32500, 34000],
          [25000, 24800, 25200, 25800, 26400, 27100, 28000, 28900, 30000]
        ]
      }
    };
  }

  return {};
}

export function updateFinancialProfile(profileData) {
  return apiFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

export function addExpense(expenseData) {
  return apiFetch('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData)
  });
}

export function addDebt(debtData) {
  return apiFetch('/debts', {
    method: 'POST',
    body: JSON.stringify(debtData)
  });
}

export function addPortfolioHolding(holdingData) {
  return apiFetch('/portfolio', {
    method: 'POST',
    body: JSON.stringify(holdingData)
  });
}

export function addFinancialGoal(goalData) {
  return apiFetch('/goals', {
    method: 'POST',
    body: JSON.stringify(goalData)
  });
}

export function updateCreditParams(creditData) {
  try {
    localStorage.setItem('riskguard_credit_params', JSON.stringify(creditData));
  } catch (err) {}
  return Promise.resolve({ success: true });
}
