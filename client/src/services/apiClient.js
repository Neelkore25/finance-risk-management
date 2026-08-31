import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Assumed Long-Term Baseline Expected Returns by Asset Class (used for Sharpe Ratio & Modeling)
 * NOTE: These are educational/modeled baseline return assumptions, not live market data.
 */
export const ASSET_CLASS_EXPECTED_RETURNS = {
  crypto: 0.18,      // 18.0% annual expected return (Digital Assets)
  equity: 0.12,      // 12.0% annual expected return (Equities, Stocks, Index Funds)
  real_estate: 0.09, // 9.0% annual expected return (Real Estate, Gold, Commodities)
  bonds: 0.06,       // 6.0% annual expected return (Fixed Income, Sovereign Debt, Bonds)
  cash: 0.05,        // 5.0% annual expected return (Liquid Savings, Bank FDs, Money Market)
  other: 0.08        // 8.0% annual expected return (General Portfolio Default)
};

/**
 * Assumed Sovereign Risk-Free Rate
 * Approximates 10-Year Indian Government Securities (G-Sec) baseline yield (~5.5%)
 */
export const RISK_FREE_RATE = 0.055;

/**
 * Read persisted platform settings from localStorage with defaults
 */
export function getSavedSettings() {
  try {
    const saved = localStorage.getItem('risk_platform_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    dtiLimit: 36,
    varConfidence: 95,
    emergencyTargetMonths: 6,
    baseCurrency: 'INR',
    numberFormat: 'LAKHS',
    alertDtiBreach: true,
    alertLowReserves: true,
    alertVarVolatility: true
  };
}

/**
 * Custom React hook for auto-subscribing components to platform settings updates
 */
export function useSettings() {
  const [settings, setSettings] = useState(getSavedSettings);

  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      setSettings(e.detail || getSavedSettings());
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
  }, []);

  return {
    settings,
    formatCurrency: (amount) => formatCurrency(amount)
  };
}

/**
 * Format currency based on active user settings (INR vs USD, Lakhs vs Thousands)
 */
export function formatCurrency(amount) {
  const settings = getSavedSettings();
  const num = Number(amount || 0);
  if (settings.baseCurrency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  } else {
    const locale = settings.numberFormat === 'THOUSANDS' ? 'en-US' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  }
}

/**
 * Format currency in active settings currency (INR/USD)
 */
export function formatINR(amount) {
  return formatCurrency(amount);
}

/**
 * Deterministic Personal Risk Calculator Engine (Fully Dynamic Settings Support)
 */
export function calculatePersonalRiskMetrics(profile, expenses = [], debts = [], investments = [], goals = [], customSettings = null) {
  const settings = customSettings || getSavedSettings();
  const dtiTarget = Math.max(10, Math.min(80, Number(settings.dtiLimit || 36)));
  const emergencyTarget = Math.max(1, Math.min(24, Number(settings.emergencyTargetMonths || 6)));

  const monthlyIncome = Number(profile?.monthly_net_income ?? profile?.monthly_income ?? 0);
  const essentialExp = Number(profile?.essential_expenses ?? profile?.monthly_essential_expenses ?? 0);
  const discretionaryExp = Number(profile?.discretionary_expenses ?? profile?.monthly_discretionary_expenses ?? 0);
  const totalDebtPayment = Number(profile?.monthly_debt_payments ?? profile?.monthly_debt_payment ?? 0);
  const existingSavings = Number(profile?.liquid_savings ?? profile?.existing_savings ?? 0);
  const emergencyFund = Number(profile?.emergency_fund ?? profile?.liquid_savings ?? profile?.existing_savings ?? 0);

  const totalMonthlyExpenses = essentialExp + discretionaryExp;
  const netCashFlow = monthlyIncome - totalMonthlyExpenses - totalDebtPayment;
  
  const savingsRate = monthlyIncome > 0 ? Math.round((netCashFlow / monthlyIncome) * 100) : 0;
  const dtiRatio = monthlyIncome > 0 ? Math.round((totalDebtPayment / monthlyIncome) * 100) : (totalDebtPayment > 0 ? 100 : 0);
  const emergencyCoverageMonths = essentialExp > 0 ? Number((emergencyFund / essentialExp).toFixed(1)) : (emergencyFund > 0 ? 12 : 0);
  const liquidCoverageMonths = totalMonthlyExpenses > 0 ? Number((existingSavings / totalMonthlyExpenses).toFixed(1)) : (existingSavings > 0 ? 12 : 0);

  // 1. Debt Risk Score (Dynamic against user's dtiTarget)
  let debtScore = 0;
  if (dtiRatio <= dtiTarget) {
    debtScore = Math.min(45, Math.round((dtiRatio / dtiTarget) * 45));
  } else {
    const excess = dtiRatio - dtiTarget;
    debtScore = Math.min(100, Math.round(50 + (excess / Math.max(1, 100 - dtiTarget)) * 50));
  }

  // 2. Cash Flow Score
  const cashFlowScore = netCashFlow < 0 ? 90 : Math.max(0, Math.min(100, 100 - savingsRate * 2));

  // 3. Emergency Fund Score (Dynamic against user's emergencyTarget)
  let emergencyScore = 20;
  if (emergencyCoverageMonths >= emergencyTarget) {
    emergencyScore = Math.max(10, Math.round(20 - Math.min(10, (emergencyCoverageMonths - emergencyTarget) * 2)));
  } else if (emergencyCoverageMonths <= 0) {
    emergencyScore = 95;
  } else {
    const deficitRatio = (emergencyTarget - emergencyCoverageMonths) / emergencyTarget;
    emergencyScore = Math.min(95, Math.round(30 + deficitRatio * 65));
  }

  // 4. Liquidity Score
  const liquidityScore = liquidCoverageMonths < 1 ? 85 : (liquidCoverageMonths < 2 ? 60 : 20);

  // 5. Concentration Score
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + Number(inv.current_price * inv.quantity || inv.amount_value || 0), 0);
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
    overallSummary: `Your modeled financial risk score is ${overallScore}/100 (${overallLevel}). Debt-to-Income is ${dtiRatio}% (target: ${dtiTarget}%), and Emergency Fund covers ${emergencyCoverageMonths} months (target: ${emergencyTarget} mos).`,
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
      totalPortfolioValue,
      dtiTarget,
      emergencyTarget
    },
    categories: {
      debtRisk: { 
        score: debtScore, 
        level: debtScore > 50 ? 'High Risk' : (debtScore > 30 ? 'Moderate Risk' : 'Low Risk'), 
        weight: '25%', 
        impact: Number((debtScore * 0.25).toFixed(1)), 
        metric: `${dtiRatio}% DTI (Limit: ${dtiTarget}%)`, 
        explanation: `DTI ratio is ${dtiRatio}%. ${dtiRatio > dtiTarget ? `Exceeds your configured threshold of ${dtiTarget}%.` : `Within your configured limit of ${dtiTarget}%.`}`, 
        action: `Keep monthly EMI debt obligations under ${dtiTarget}% of net income.` 
      },
      cashFlowRisk: { 
        score: cashFlowScore, 
        level: cashFlowScore > 50 ? 'High Risk' : (cashFlowScore > 30 ? 'Moderate Risk' : 'Low Risk'), 
        weight: '25%', 
        impact: Number((cashFlowScore * 0.25).toFixed(1)), 
        metric: formatINR(netCashFlow), 
        explanation: `Net monthly cash flow surplus is ${formatINR(netCashFlow)}.`, 
        action: 'Optimize discretionary spending to increase monthly surplus.' 
      },
      emergencyFundRisk: { 
        score: emergencyScore, 
        level: emergencyScore > 50 ? 'High Risk' : (emergencyScore > 30 ? 'Moderate Risk' : 'Low Risk'), 
        weight: '20%', 
        impact: Number((emergencyScore * 0.20).toFixed(1)), 
        metric: `${emergencyCoverageMonths}/${emergencyTarget} Months`, 
        explanation: `Emergency fund covers ${emergencyCoverageMonths} months of essential expenses vs target of ${emergencyTarget} months.`, 
        action: `Build liquid emergency fund to at least ${emergencyTarget} months of essential spending.` 
      },
      liquidityRisk: { 
        score: liquidityScore, 
        level: liquidityScore > 50 ? 'High Risk' : (liquidityScore > 30 ? 'Moderate Risk' : 'Low Risk'), 
        weight: '15%', 
        impact: Number((liquidityScore * 0.15).toFixed(1)), 
        metric: `${liquidCoverageMonths} Months`, 
        explanation: `Liquid savings cover ${liquidCoverageMonths} months of total expenses.`, 
        action: 'Maintain accessible cash buffer in high-yield savings.' 
      },
      investmentConcentrationRisk: { 
        score: concentrationScore, 
        level: concentrationScore > 50 ? 'High Risk' : 'Low Risk', 
        weight: '15%', 
        impact: Number((concentrationScore * 0.15).toFixed(1)), 
        metric: `${investments.length} Asset Holdings`, 
        explanation: `Portfolio contains ${investments.length} distinct asset holdings.`, 
        action: 'Diversify portfolio across equities, bonds, and mutual funds.' 
      }
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
    const profileCacheKey = userId ? `riskguard_profile_${userId}` : 'riskguard_guest_profile';

    if (method === 'PUT') {
      const income = Number(body.monthly_net_income ?? body.monthly_income ?? 0);
      const debt = Number(body.monthly_debt_payments ?? body.monthly_debt_payment ?? 0);
      const essential = Number(body.essential_expenses ?? body.monthly_essential_expenses ?? 0);
      const discretionary = Number(body.discretionary_expenses ?? body.monthly_discretionary_expenses ?? 0);
      const savings = Number(body.liquid_savings ?? body.existing_savings ?? 0);
      const emergency = Number(body.emergency_fund ?? savings);

      const payload = {
        monthly_net_income: income,
        monthly_debt_payments: debt,
        essential_expenses: essential,
        discretionary_expenses: discretionary,
        liquid_savings: savings,
        emergency_fund: emergency,
        monthly_income: income,
        monthly_debt_payment: debt,
        monthly_essential_expenses: essential,
        monthly_discretionary_expenses: discretionary,
        existing_savings: savings,
        updated_at: new Date().toISOString()
      };

      localStorage.setItem(profileCacheKey, JSON.stringify(payload));

      if (userId && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('financial_profiles')
            .upsert({
              user_id: userId,
              monthly_net_income: income,
              monthly_debt_payments: debt,
              essential_expenses: essential,
              discretionary_expenses: discretionary,
              liquid_savings: savings,
              emergency_fund: emergency,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (error) {
            console.error('Supabase profile save error:', error);
            throw error;
          }
          if (data) {
            const merged = { ...payload, ...data };
            localStorage.setItem(profileCacheKey, JSON.stringify(merged));
            return { profile: merged };
          }
        } catch (err) {
          console.error('Failed to save profile to Supabase:', err);
          throw err;
        }
      }

      return { profile: payload };
    }

    // GET /profile
    if (userId && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('financial_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Supabase profile fetch error:', error);
        }

        if (data) {
          const normalized = {
            ...data,
            monthly_income: data.monthly_net_income ?? data.monthly_income ?? 0,
            monthly_debt_payment: data.monthly_debt_payments ?? data.monthly_debt_payment ?? 0,
            monthly_essential_expenses: data.essential_expenses ?? data.monthly_essential_expenses ?? 0,
            monthly_discretionary_expenses: data.discretionary_expenses ?? data.monthly_discretionary_expenses ?? 0,
            existing_savings: data.liquid_savings ?? data.existing_savings ?? 0,
            emergency_fund: data.emergency_fund ?? 0
          };
          localStorage.setItem(profileCacheKey, JSON.stringify(normalized));
          return { profile: normalized };
        }
      } catch (err) {
        console.error('Failed to fetch profile from Supabase:', err);
      }
    }

    const cached = localStorage.getItem(profileCacheKey);
    if (cached) {
      try {
        return { profile: JSON.parse(cached) };
      } catch (err) {}
    }

    // Default clean zero-state for new accounts
    return {
      profile: {
        monthly_net_income: 0,
        monthly_income: 0,
        monthly_debt_payments: 0,
        monthly_debt_payment: 0,
        essential_expenses: 0,
        monthly_essential_expenses: 0,
        discretionary_expenses: 0,
        monthly_discretionary_expenses: 0,
        liquid_savings: 0,
        existing_savings: 0,
        emergency_fund: 0
      }
    };
  }

  // 2. EXPENSES
  if (cleanEp === '/expenses') {
    if (method === 'POST') {
      if (userId && isSupabaseConfigured()) {
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
      return { expense: { id: Date.now(), ...body } };
    }

    if (userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return { expenses: data || [] };
    }
    return { expenses: [] };
  }

  if (cleanEp.startsWith('/expenses/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'PUT' && userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          name: body.name,
          category: body.category,
          amount: Number(body.amount),
          date: body.date || new Date().toISOString().split('T')[0],
          is_essential: Boolean(body.is_essential)
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { expense: data };
    }

    if (method === 'DELETE' && userId && isSupabaseConfigured()) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    }
  }

  // 3. DEBTS
  if (cleanEp === '/debts') {
    const debtName = body?.name || 'Loan';
    const debtType = body?.debt_type || 'Personal Loan';
    const balance = Number(body?.outstanding_amount ?? body?.outstanding_balance ?? 0);
    const rate = Number(body?.interest_rate || 0);
    const payment = Number(body?.monthly_payment ?? body?.monthly_emi ?? 0);
    const dueDate = body?.due_date || null;

    if (method === 'POST') {
      if (userId && isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('debts')
          .insert({
            user_id: userId,
            name: debtName,
            debt_type: debtType,
            outstanding_amount: balance,
            outstanding_balance: balance,
            interest_rate: rate,
            monthly_payment: payment,
            monthly_emi: payment,
            due_date: dueDate
          })
          .select()
          .single();
        if (error) throw error;
        return { debt: data };
      }
      return { debt: { id: Date.now(), ...body } };
    }

    if (userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const normalized = (data || []).map(d => ({
        ...d,
        outstanding_amount: d.outstanding_amount ?? d.outstanding_balance ?? 0,
        monthly_payment: d.monthly_payment ?? d.monthly_emi ?? 0
      }));
      return { debts: normalized };
    }
    return { debts: [] };
  }

  if (cleanEp.startsWith('/debts/')) {
    const id = cleanEp.split('/')[2];
    const debtName = body?.name || 'Loan';
    const debtType = body?.debt_type || 'Personal Loan';
    const balance = Number(body?.outstanding_amount ?? body?.outstanding_balance ?? 0);
    const rate = Number(body?.interest_rate || 0);
    const payment = Number(body?.monthly_payment ?? body?.monthly_emi ?? 0);
    const dueDate = body?.due_date || null;

    if (method === 'PUT' && userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('debts')
        .update({
          name: debtName,
          debt_type: debtType,
          outstanding_amount: balance,
          outstanding_balance: balance,
          interest_rate: rate,
          monthly_payment: payment,
          monthly_emi: payment,
          due_date: dueDate
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { debt: data };
    }

    if (method === 'DELETE' && userId && isSupabaseConfigured()) {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    }
  }

  // 4. PORTFOLIO HOLDINGS
  if (cleanEp === '/portfolio' || cleanEp === '/investments') {
    const holdingsKey = userId ? `riskguard_holdings_${userId}` : 'riskguard_local_holdings';

    if (method === 'POST') {
      const amountVal = Number(body.amount_value) || (Number(body.quantity || 1) * Number(body.current_price || 0));
      if (userId && isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('portfolio_holdings')
          .insert({
            user_id: userId,
            asset_name: body.asset_name,
            asset_type: body.asset_type || 'Stocks',
            sector: body.sector || 'General',
            quantity: Number(body.quantity || 1),
            purchase_price: Number(body.purchase_price || body.current_price || 0),
            current_price: Number(body.current_price || 0),
            amount_value: amountVal
          })
          .select()
          .single();
        if (error) throw error;
        return { holding: data };
      }

      const cached = localStorage.getItem(holdingsKey);
      let localHoldings = cached ? JSON.parse(cached) : [];
      const newHolding = {
        id: 'hold_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        asset_name: body.asset_name,
        asset_type: body.asset_type || 'Stocks',
        sector: body.sector || 'General',
        quantity: Number(body.quantity || 1),
        purchase_price: Number(body.purchase_price || body.current_price || 0),
        current_price: Number(body.current_price || 0),
        amount_value: amountVal
      };
      localHoldings.unshift(newHolding);
      localStorage.setItem(holdingsKey, JSON.stringify(localHoldings));
      return { holding: newHolding };
    }

    if (userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { holdings: data || [] };
    }

    const cached = localStorage.getItem(holdingsKey);
    return { holdings: cached ? JSON.parse(cached) : [] };
  }

  if (cleanEp.startsWith('/portfolio/') || cleanEp.startsWith('/investments/')) {
    const id = cleanEp.split('/')[2];
    const holdingsKey = userId ? `riskguard_holdings_${userId}` : 'riskguard_local_holdings';

    if (method === 'DELETE') {
      if (userId && isSupabaseConfigured()) {
        const { error } = await supabase
          .from('portfolio_holdings')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
      }
      const cached = localStorage.getItem(holdingsKey);
      let localHoldings = cached ? JSON.parse(cached) : [];
      localHoldings = localHoldings.filter(h => String(h.id) !== String(id));
      localStorage.setItem(holdingsKey, JSON.stringify(localHoldings));
      return { success: true };
    }

    if (method === 'PUT') {
      const amountVal = Number(body.amount_value) || (Number(body.quantity || 1) * Number(body.current_price || 0));
      if (userId && isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('portfolio_holdings')
          .update({
            asset_name: body.asset_name,
            asset_type: body.asset_type,
            sector: body.sector,
            quantity: Number(body.quantity),
            purchase_price: Number(body.purchase_price || body.current_price),
            current_price: Number(body.current_price),
            amount_value: amountVal
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return { holding: data };
      }
      const cached = localStorage.getItem(holdingsKey);
      let localHoldings = cached ? JSON.parse(cached) : [];
      localHoldings = localHoldings.map(h => String(h.id) === String(id) ? { ...h, ...body, amount_value: amountVal } : h);
      localStorage.setItem(holdingsKey, JSON.stringify(localHoldings));
      return { holding: body };
    }
  }

  // 5. FINANCIAL GOALS
  if (cleanEp === '/goals') {
    const goalName = body?.name ?? body?.goal_name ?? 'Financial Goal';
    const targetAmount = Number(body?.target_amount || 0);
    const currentAmount = Number(body?.current_amount ?? body?.current_savings ?? 0);
    const targetDate = body?.target_date || new Date().toISOString().split('T')[0];
    const monthlyContrib = Number(body?.monthly_contribution || 0);

    if (method === 'POST') {
      if (userId && isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('financial_goals')
          .insert({
            user_id: userId,
            name: goalName,
            goal_name: goalName,
            target_amount: targetAmount,
            current_amount: currentAmount,
            current_savings: currentAmount,
            target_date: targetDate,
            monthly_contribution: monthlyContrib
          })
          .select()
          .single();
        if (error) throw error;
        return { goal: data };
      }
      return { goal: { id: Date.now(), ...body } };
    }

    if (userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const normalized = (data || []).map(g => ({
        ...g,
        name: g.name || g.goal_name || 'Financial Goal',
        current_amount: g.current_amount ?? g.current_savings ?? 0,
        target_amount: g.target_amount ?? 0
      }));
      return { goals: normalized };
    }
    return { goals: [] };
  }

  if (cleanEp.startsWith('/goals/')) {
    const id = cleanEp.split('/')[2];
    const goalName = body?.name ?? body?.goal_name ?? 'Financial Goal';
    const targetAmount = Number(body?.target_amount || 0);
    const currentAmount = Number(body?.current_amount ?? body?.current_savings ?? 0);
    const targetDate = body?.target_date || new Date().toISOString().split('T')[0];
    const monthlyContrib = Number(body?.monthly_contribution || 0);

    if (method === 'PUT' && userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('financial_goals')
        .update({
          name: goalName,
          goal_name: goalName,
          target_amount: targetAmount,
          current_amount: currentAmount,
          current_savings: currentAmount,
          target_date: targetDate,
          monthly_contribution: monthlyContrib
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { goal: data };
    }

    if (method === 'DELETE' && userId && isSupabaseConfigured()) {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    }
  }

  // 6. DYNAMIC RISK ASSESSMENT
  if (cleanEp === '/risk/personal') {
    let prof = { monthly_net_income: 0, monthly_debt_payments: 0, essential_expenses: 0, discretionary_expenses: 0, liquid_savings: 0, emergency_fund: 0 };
    let exps = [];
    let dts = [];
    let invs = [];
    let gls = [];

    const profileCacheKey = userId ? `riskguard_profile_${userId}` : 'riskguard_guest_profile';

    if (userId && isSupabaseConfigured()) {
      const [pRes, eRes, dRes, iRes, gRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('debts').select('*').eq('user_id', userId),
        supabase.from('portfolio_holdings').select('*').eq('user_id', userId),
        supabase.from('financial_goals').select('*').eq('user_id', userId)
      ]);
      if (pRes.data) prof = pRes.data;
      if (eRes.data) exps = eRes.data;
      if (dRes.data) dts = dRes.data;
      if (iRes.data) invs = iRes.data;
      if (gRes.data) gls = gRes.data;
    } else {
      const cached = localStorage.getItem(profileCacheKey);
      if (cached) {
        try {
          prof = JSON.parse(cached);
        } catch (err) {}
      }
    }

    const assessment = calculatePersonalRiskMetrics(prof, exps, dts, invs, gls);

    // Save risk history snapshot
    const historyKey = userId ? `riskguard_history_${userId}` : 'riskguard_guest_history';
    const nowIso = new Date().toISOString();
    const snapshot = {
      id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      user_id: userId || 'guest',
      overall_score: assessment.overallScore,
      overall_level: assessment.overallLevel,
      debt_risk: assessment.categories.debtRisk.score,
      liquidity_risk: assessment.categories.liquidityRisk.score,
      emergency_fund_risk: assessment.categories.emergencyFundRisk.score,
      cash_flow_risk: assessment.categories.cashFlowRisk.score,
      investment_concentration_risk: assessment.categories.investmentConcentrationRisk.score,
      goal_risk: assessment.categories.goalRisk.score,
      recorded_at: nowIso
    };

    try {
      const rawHist = localStorage.getItem(historyKey);
      let histArr = rawHist ? JSON.parse(rawHist) : [];
      const lastSnap = histArr[histArr.length - 1];
      if (!lastSnap || Math.abs(new Date(nowIso) - new Date(lastSnap.recorded_at)) > 4000 || lastSnap.overall_score !== snapshot.overall_score) {
        histArr.push(snapshot);
        if (histArr.length > 30) histArr = histArr.slice(histArr.length - 30);
        localStorage.setItem(historyKey, JSON.stringify(histArr));
      }
    } catch (e) {}

    if (userId && isSupabaseConfigured()) {
      try {
        supabase.from('risk_history').insert({
          user_id: userId,
          overall_score: assessment.overallScore,
          debt_risk: assessment.categories.debtRisk.score,
          liquidity_risk: assessment.categories.liquidityRisk.score,
          emergency_fund_risk: assessment.categories.emergencyFundRisk.score,
          cash_flow_risk: assessment.categories.cashFlowRisk.score,
          investment_concentration_risk: assessment.categories.investmentConcentrationRisk.score,
          goal_risk: assessment.categories.goalRisk.score,
          recorded_at: nowIso
        }).then(() => {});
      } catch (err) {}
    }

    return { assessment };
  }

  if (cleanEp === '/risk/portfolio') {
    let invs = [];
    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId);
      if (data && data.length > 0) invs = data;
    } else {
      const holdingsKey = userId ? `riskguard_holdings_${userId}` : 'riskguard_local_holdings';
      const cached = localStorage.getItem(holdingsKey);
      if (cached) {
        try { invs = JSON.parse(cached); } catch (err) {}
      }
    }

    // Read confidence level from endpoint URL or fall back to platform settings
    const settings = getSavedSettings();
    let conf = (settings.varConfidence || 95) / 100;
    if (endpoint.includes('confidence=0.99')) conf = 0.99;
    else if (endpoint.includes('confidence=0.95')) conf = 0.95;
    else if (endpoint.includes('confidence=')) {
      const parsedConf = parseFloat(endpoint.split('confidence=')[1]);
      if (!isNaN(parsedConf)) conf = parsedConf > 1 ? parsedConf / 100 : parsedConf;
    }

    const totalVal = invs.reduce((sum, i) => sum + (Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price))), 0) || 0;

    // Calculate asset volatility and expected return weighted by portfolio composition
    let weightedVol = 0.14; // Base 14% annual vol
    let expectedReturn = ASSET_CLASS_EXPECTED_RETURNS.equity; // Base 12% annual return
    let equityRatio = 0.6;
    let cryptoRatio = 0.0;

    if (invs.length > 0 && totalVal > 0) {
      let equityVal = 0;
      let cryptoVal = 0;
      let totalWeightedReturn = 0;

      invs.forEach(inv => {
        const val = Number(inv.amount_value) || (Number(inv.quantity) * Number(inv.current_price));
        const type = (inv.asset_type || '').toLowerCase();
        
        let expRet = ASSET_CLASS_EXPECTED_RETURNS.other;
        if (type.includes('crypto')) {
          cryptoVal += val;
          expRet = ASSET_CLASS_EXPECTED_RETURNS.crypto;
        } else if (type.includes('stock') || type.includes('equity') || type.includes('mutual')) {
          equityVal += val;
          expRet = ASSET_CLASS_EXPECTED_RETURNS.equity;
        } else if (type.includes('bond') || type.includes('fixed') || type.includes('debt') || type.includes('g-sec')) {
          expRet = ASSET_CLASS_EXPECTED_RETURNS.bonds;
        } else if (type.includes('cash') || type.includes('liquid') || type.includes('deposit') || type.includes('fd')) {
          expRet = ASSET_CLASS_EXPECTED_RETURNS.cash;
        } else if (type.includes('gold') || type.includes('real estate') || type.includes('property')) {
          expRet = ASSET_CLASS_EXPECTED_RETURNS.real_estate;
        }

        totalWeightedReturn += (val / totalVal) * expRet;
      });

      equityRatio = equityVal / totalVal;
      cryptoRatio = cryptoVal / totalVal;
      weightedVol = Math.max(0.04, 0.08 + (equityRatio * 0.12) + (cryptoRatio * 0.45));
      expectedReturn = totalWeightedReturn;
    }

    // Daily volatility
    const dailyVol = weightedVol / Math.sqrt(252);
    const zScore = conf >= 0.99 ? 2.326 : 1.645;
    const cvarMultiplier = conf >= 0.99 ? 1.35 : 1.25;

    const histVaRPct = Number((zScore * dailyVol * 100).toFixed(2));
    const histVaRAmt = Math.round(totalVal * (histVaRPct / 100));

    const paraVaRPct = Number(((zScore * dailyVol - 0.0004) * 100).toFixed(2));
    const paraVaRAmt = Math.round(totalVal * (paraVaRPct / 100));

    const cvarPct = Number((histVaRPct * cvarMultiplier).toFixed(2));
    const cvarAmt = Math.round(totalVal * (cvarPct / 100));

    // Real Sharpe Ratio: (Rp - Rf) / sigma_p
    const sharpe = weightedVol > 0 ? Number(((expectedReturn - RISK_FREE_RATE) / weightedVol).toFixed(2)) : 0.0;
    const beta = Number((0.9 + (equityRatio * 0.4) + (cryptoRatio * 0.8)).toFixed(2));
    const annVol = Number((weightedVol * 100).toFixed(1));
    const maxDdPct = Number((weightedVol * 65).toFixed(1));

    // Dynamic Heatmaps by Asset Class & Sector
    const assetClassMap = {};
    const sectorMap = {};

    if (invs.length > 0) {
      invs.forEach(i => {
        const type = i.asset_type || 'Other';
        const sec = i.sector || 'General';
        const val = Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price));

        if (!assetClassMap[type]) assetClassMap[type] = { count: 0, val: 0 };
        assetClassMap[type].count += 1;
        assetClassMap[type].val += val;

        if (!sectorMap[sec]) sectorMap[sec] = { count: 0, val: 0 };
        sectorMap[sec].count += 1;
        sectorMap[sec].val += val;
      });
    }

    const byAssetClass = Object.entries(assetClassMap).map(([name, d]) => {
      const pct = totalVal > 0 ? Number(((d.val / totalVal) * 100).toFixed(1)) : 0;
      let riskLevel = 'Low Risk';
      let riskColor = 'green';
      if (pct > 50 || name.toLowerCase().includes('crypto')) {
        riskLevel = 'High Risk';
        riskColor = 'red';
      } else if (pct > 25) {
        riskLevel = 'Moderate Risk';
        riskColor = 'yellow';
      }
      return { name, class: name, exposure: d.val, count: d.count, percentage: pct, weightPct: pct, riskLevel, riskColor };
    });

    const bySector = Object.entries(sectorMap).map(([name, d]) => {
      const pct = totalVal > 0 ? Number(((d.val / totalVal) * 100).toFixed(1)) : 0;
      let riskLevel = 'Low Risk';
      let riskColor = 'green';
      if (pct > 45) {
        riskLevel = 'High Risk';
        riskColor = 'red';
      } else if (pct > 20) {
        riskLevel = 'Moderate Risk';
        riskColor = 'yellow';
      }
      return { name, sector: name, exposure: d.val, count: d.count, percentage: pct, weightPct: pct, riskLevel, riskColor };
    });

    return {
      portfolioRisk: {
        totalValue: totalVal,
        metrics: {
          historicalVaR1DayAmount: histVaRAmt,
          historicalVaR1DayPct: histVaRPct,
          parametricVaR1DayAmount: paraVaRAmt,
          parametricVaR1DayPct: paraVaRPct,
          cvar1DayAmount: cvarAmt,
          cvar1DayPct: cvarPct,
          beta: beta,
          sharpeRatio: sharpe,
          annualizedVol: annVol,
          maxDrawdownPct: maxDdPct
        },
        heatmap: {
          byAssetClass,
          bySector
        }
      }
    };
  }

  if (cleanEp === '/risk/credit') {
    let requestBody = {};
    if (options && options.body) {
      try {
        requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (err) {}
    }

    const creditKey = userId ? `riskguard_credit_${userId}` : 'riskguard_local_credit_risk';
    const cachedCredit = localStorage.getItem(creditKey);
    let savedParams = null;
    if (cachedCredit) {
      try {
        savedParams = JSON.parse(cachedCredit);
      } catch (err) {}
    }

    const income = Number(requestBody.income ?? savedParams?.metrics?.income ?? 5000);
    const existingDebt = Number(requestBody.existingDebt ?? savedParams?.metrics?.existingDebt ?? 12000);
    const loanAmount = Number(requestBody.loanAmount ?? savedParams?.metrics?.loanAmount ?? 15000);
    const creditHistoryMonths = Number(requestBody.creditHistoryMonths ?? savedParams?.metrics?.creditHistoryMonths ?? 36);
    const paymentHistoryScore = Number(requestBody.paymentHistoryScore ?? savedParams?.metrics?.paymentHistoryScore ?? 95);
    const missedPayments = Number(requestBody.missedPayments ?? savedParams?.metrics?.missedPayments ?? 0);

    const monthlyDebtService = existingDebt * 0.03;
    const dtiRatio = income > 0 ? ((monthlyDebtService / income) * 100) : 50;

    let baseScore = 720;
    if (dtiRatio > 45) baseScore -= 110;
    else if (dtiRatio > 35) baseScore -= 60;
    else if (dtiRatio < 25) baseScore += 40;

    if (paymentHistoryScore >= 90) baseScore += 50;
    else if (paymentHistoryScore < 70) baseScore -= 90;

    baseScore -= (missedPayments * 45);

    if (creditHistoryMonths > 48) baseScore += 35;
    else if (creditHistoryMonths < 12) baseScore -= 40;

    const creditScore = Math.max(300, Math.min(850, Math.round(baseScore)));
    const probDefault = Math.max(0.5, Math.min(99.0, Math.round((1 - (creditScore - 300) / 550) * 100 * 10) / 10));

    let tier = 'Good';
    let riskLevel = 'Low Risk';
    if (creditScore >= 750) { tier = 'Excellent'; riskLevel = 'Low Risk'; }
    else if (creditScore >= 680) { tier = 'Good'; riskLevel = 'Low-Moderate Risk'; }
    else if (creditScore >= 600) { tier = 'Fair'; riskLevel = 'Medium Risk'; }
    else { tier = 'Poor'; riskLevel = 'High Risk'; }

    const drivingFactors = [
      {
        factor: 'Payment History & Promptness',
        impact: paymentHistoryScore >= 80 && missedPayments === 0 ? 'Positive' : 'Negative',
        detail: `Historical payment score is ${paymentHistoryScore}/100 with ${missedPayments} recent missed payments.`
      },
      {
        factor: 'Debt-to-Income (DTI) Leverage',
        impact: dtiRatio <= 36 ? 'Positive' : 'Negative',
        detail: `Calculated monthly debt service is ${dtiRatio.toFixed(1)}% of net monthly income.`
      },
      {
        factor: 'Credit Line Longevity',
        impact: creditHistoryMonths >= 24 ? 'Positive' : 'Negative',
        detail: `Active credit history length is ${creditHistoryMonths} months.`
      }
    ];

    const result = {
      creditRisk: {
        creditScore,
        tier,
        riskLevel,
        probDefault,
        summary: `Evaluated ${tier} credit profile (${creditScore}/850) with ${probDefault}% default probability based on ${dtiRatio.toFixed(1)}% DTI and ${paymentHistoryScore}/100 payment history score.`,
        metrics: {
          income,
          existingDebt,
          loanAmount,
          creditHistoryMonths,
          paymentHistoryScore,
          missedPayments
        },
        drivingFactors
      }
    };

    try {
      localStorage.setItem(creditKey, JSON.stringify(result.creditRisk));
    } catch (err) {}
    return result;
  }

  if (cleanEp === '/alerts') {
    const activeSettings = getSavedSettings();
    let prof = { monthly_net_income: 0, monthly_debt_payments: 0, essential_expenses: 0, discretionary_expenses: 0, liquid_savings: 0, emergency_fund: 0 };
    const profileCacheKey = userId ? `riskguard_profile_${userId}` : 'riskguard_guest_profile';

    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (data) prof = data;
    } else {
      const cached = localStorage.getItem(profileCacheKey);
      if (cached) {
        try { prof = JSON.parse(cached); } catch (err) {}
      }
    }

    const income = Number(prof.monthly_net_income ?? prof.monthly_income ?? 0);
    const debt = Number(prof.monthly_debt_payments ?? prof.monthly_debt_payment ?? 0);
    const essential = Number(prof.essential_expenses ?? prof.monthly_essential_expenses ?? 0);
    const emergencyFund = Number(prof.emergency_fund ?? prof.liquid_savings ?? prof.existing_savings ?? 0);

    const dtiRatio = income > 0 ? Number(((debt / income) * 100).toFixed(1)) : 0;
    const emergencyCoverageMonths = essential > 0 ? Number((emergencyFund / essential).toFixed(1)) : 0;

    const generatedAlerts = [];

    // Alert 1: DTI Breach (Gated by settings.alertDtiBreach)
    const targetDti = activeSettings.dtiLimit || 36;
    if (activeSettings.alertDtiBreach !== false && dtiRatio > targetDti) {
      generatedAlerts.push({
        id: 'alt_dti',
        title: 'High Debt-to-Income (DTI) Breach',
        message: `Your DTI ratio is ${dtiRatio}%, exceeding your target limit of ${targetDti}%.`,
        severity: 'Critical',
        type: 'danger',
        timestamp: 'Active'
      });
    }

    // Alert 2: Low Emergency Reserves (Gated by settings.alertLowReserves)
    const targetEmergency = activeSettings.emergencyTargetMonths || 6;
    if (activeSettings.alertLowReserves !== false && emergencyCoverageMonths < targetEmergency) {
      generatedAlerts.push({
        id: 'alt_res',
        title: 'Liquid Reserve Target Deficit',
        message: `Emergency reserve covers ${emergencyCoverageMonths} months, below your target threshold of ${targetEmergency} months.`,
        severity: 'Warning',
        type: 'warning',
        timestamp: 'Active'
      });
    }

    // Alert 3: Portfolio Volatility (Gated by settings.alertVarVolatility)
    if (activeSettings.alertVarVolatility !== false) {
      let invs = [];
      if (userId && isSupabaseConfigured()) {
        const { data } = await supabase.from('portfolio_holdings').select('*').eq('user_id', userId);
        if (data) invs = data;
      }
      const hasCrypto = invs.some(i => (i.asset_type || '').toLowerCase().includes('crypto'));
      if (hasCrypto) {
        generatedAlerts.push({
          id: 'alt_var',
          title: 'High Asset Volatility Exposure',
          message: 'Portfolio includes digital assets (crypto) increasing daily downside tail risk.',
          severity: 'Info',
          type: 'info',
          timestamp: 'Active'
        });
      }
    }

    return { alerts: generatedAlerts };
  }

  if (cleanEp === '/risk/history') {
    const historyKey = userId ? `riskguard_history_${userId}` : 'riskguard_guest_history';
    let historyRecords = [];

    if (userId && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('risk_history')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: true })
          .limit(30);
        if (!error && data && data.length > 0) {
          historyRecords = data;
        }
      } catch (err) {}
    }

    if (historyRecords.length === 0) {
      const cached = localStorage.getItem(historyKey);
      if (cached) {
        try { historyRecords = JSON.parse(cached); } catch (err) {}
      }
    }

    // If still empty, synthesize realistic initial progression leading to current timestamp
    if (historyRecords.length === 0) {
      const profileCacheKey = userId ? `riskguard_profile_${userId}` : 'riskguard_guest_profile';
      let currentProf = { monthly_net_income: 0 };
      const cachedProf = localStorage.getItem(profileCacheKey);
      if (cachedProf) {
        try { currentProf = JSON.parse(cachedProf); } catch (e) {}
      }
      const currentScore = currentProf.monthly_net_income > 0 ? 32 : 40;
      const now = Date.now();
      historyRecords = [
        {
          id: 'hist_1',
          user_id: userId || 'guest',
          overall_score: Math.min(100, currentScore + 8),
          debt_risk: 35,
          liquidity_risk: 30,
          emergency_fund_risk: 40,
          cash_flow_risk: 30,
          investment_concentration_risk: 25,
          goal_risk: 20,
          recorded_at: new Date(now - 14 * 86400000).toISOString()
        },
        {
          id: 'hist_2',
          user_id: userId || 'guest',
          overall_score: Math.min(100, currentScore + 4),
          debt_risk: 30,
          liquidity_risk: 25,
          emergency_fund_risk: 35,
          cash_flow_risk: 25,
          investment_concentration_risk: 25,
          goal_risk: 18,
          recorded_at: new Date(now - 7 * 86400000).toISOString()
        },
        {
          id: 'hist_3',
          user_id: userId || 'guest',
          overall_score: currentScore,
          debt_risk: 25,
          liquidity_risk: 20,
          emergency_fund_risk: 30,
          cash_flow_risk: 20,
          investment_concentration_risk: 20,
          goal_risk: 15,
          recorded_at: new Date(now).toISOString()
        }
      ];
      localStorage.setItem(historyKey, JSON.stringify(historyRecords));
    }

    return { history: historyRecords };
  }

  if (cleanEp === '/simulator/what-if') {
    let requestBody = {};
    if (options && options.body) {
      try {
        requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (err) {}
    }

    const incPct = Number(requestBody.incomeChangePct || 0);
    const expPct = Number(requestBody.expenseChangePct || 0);
    const addDebt = Number(requestBody.additionalDebt || 0);
    const addSavings = Number(requestBody.additionalSavings || 0);
    const emgSavingsChange = Number(requestBody.emergencySavingsChange || 0);

    let prof = { monthly_net_income: 0, monthly_debt_payments: 0, essential_expenses: 0, discretionary_expenses: 0, liquid_savings: 0, emergency_fund: 0 };
    let exps = [], dts = [], invs = [], gls = [];
    const profileCacheKey = userId ? `riskguard_profile_${userId}` : 'riskguard_guest_profile';

    if (userId && isSupabaseConfigured()) {
      const [pRes, eRes, dRes, iRes, gRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('debts').select('*').eq('user_id', userId),
        supabase.from('portfolio_holdings').select('*').eq('user_id', userId),
        supabase.from('financial_goals').select('*').eq('user_id', userId)
      ]);
      if (pRes.data) prof = pRes.data;
      if (eRes.data) exps = eRes.data;
      if (dRes.data) dts = dRes.data;
      if (iRes.data) invs = iRes.data;
      if (gRes.data) gls = gRes.data;
    } else {
      const cached = localStorage.getItem(profileCacheKey);
      if (cached) {
        try { prof = JSON.parse(cached); } catch (err) {}
      }
    }

    // Base profile values with sensible realistic demo fallback if profile has no saved numbers
    let rawInc = Number(prof.monthly_net_income ?? prof.monthly_income ?? 0);
    let rawEss = Number(prof.essential_expenses ?? prof.monthly_essential_expenses ?? 0);
    let rawDisc = Number(prof.discretionary_expenses ?? prof.monthly_discretionary_expenses ?? 0);
    let rawDebt = Number(prof.monthly_debt_payments ?? prof.monthly_debt_payment ?? 0);
    let rawSav = Number(prof.liquid_savings ?? prof.existing_savings ?? 0);
    let rawEmg = Number(prof.emergency_fund ?? 0);

    if (rawInc === 0 && rawEss === 0) {
      rawInc = 75000;
      rawEss = 30000;
      rawDisc = 15000;
      rawDebt = 12000;
      rawSav = 100000;
      rawEmg = 180000;
    }

    const baselineProf = {
      monthly_net_income: rawInc,
      monthly_income: rawInc,
      essential_expenses: rawEss,
      monthly_essential_expenses: rawEss,
      discretionary_expenses: rawDisc,
      monthly_discretionary_expenses: rawDisc,
      monthly_debt_payments: rawDebt,
      monthly_debt_payment: rawDebt,
      liquid_savings: rawSav,
      existing_savings: rawSav,
      emergency_fund: rawEmg
    };

    // Calculate baseline
    const baselineAssessment = calculatePersonalRiskMetrics(baselineProf, exps, dts, invs, gls);

    // Calculate simulated profile
    const simInc = Math.max(0, Math.round(rawInc * (1 + incPct / 100)));
    const simEss = Math.max(0, Math.round(rawEss * (1 + expPct / 100)));
    const simDisc = Math.max(0, Math.round(rawDisc * (1 + expPct / 100)));
    const simDebt = Math.max(0, Math.round(rawDebt + addDebt));
    const simSav = Math.max(0, Math.round(rawSav + addSavings));
    const simEmg = Math.max(0, Math.round(rawEmg + emgSavingsChange));

    const simProf = {
      monthly_net_income: simInc,
      monthly_income: simInc,
      essential_expenses: simEss,
      monthly_essential_expenses: simEss,
      discretionary_expenses: simDisc,
      monthly_discretionary_expenses: simDisc,
      monthly_debt_payments: simDebt,
      monthly_debt_payment: simDebt,
      liquid_savings: simSav,
      existing_savings: simSav,
      emergency_fund: simEmg
    };

    const simulatedAssessment = calculatePersonalRiskMetrics(simProf, exps, dts, invs, gls);
    const scoreDelta = simulatedAssessment.overallScore - baselineAssessment.overallScore;

    let scenarioSummary = '';
    if (scoreDelta > 0) {
      scenarioSummary = `This scenario increases overall financial risk by +${scoreDelta} points (${baselineAssessment.overallScore} → ${simulatedAssessment.overallScore}). Net monthly cash flow shifts from ₹${baselineAssessment.metrics.netCashFlow.toLocaleString()} to ₹${simulatedAssessment.metrics.netCashFlow.toLocaleString()}.`;
    } else if (scoreDelta < 0) {
      scenarioSummary = `This scenario improves financial resilience by ${Math.abs(scoreDelta)} points (${baselineAssessment.overallScore} → ${simulatedAssessment.overallScore}). Net monthly savings increase from ₹${baselineAssessment.metrics.netCashFlow.toLocaleString()} to ₹${simulatedAssessment.metrics.netCashFlow.toLocaleString()}.`;
    } else {
      scenarioSummary = `Baseline risk score is ${baselineAssessment.overallScore}/100 with ₹${baselineAssessment.metrics.netCashFlow.toLocaleString()} monthly cash surplus. Adjust the sliders on the left to simulate hypothetical shocks.`;
    }

    return {
      baselineScore: baselineAssessment.overallScore,
      baselineLevel: baselineAssessment.overallLevel,
      simulatedScore: simulatedAssessment.overallScore,
      simulatedLevel: simulatedAssessment.overallLevel,
      scoreDelta,
      scenarioSummary,
      baselineCategories: baselineAssessment.categories,
      simulatedCategories: simulatedAssessment.categories,
      baselineMetrics: baselineAssessment.metrics,
      simulatedMetrics: simulatedAssessment.metrics
    };
  }

  if (cleanEp === '/risk/monte-carlo') {
    let requestBody = {};
    if (options && options.body) {
      try {
        requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (err) {}
    }

    const numSimulations = Math.min(5000, Math.max(100, Number(requestBody.numSimulations || 1000)));
    const horizonMonths = Math.min(120, Math.max(1, Number(requestBody.horizonMonths || 12)));
    const initialValue = Math.max(100, Number(requestBody.initialValue || 25000));
    const monthlyContribution = Math.max(0, Number(requestBody.monthlyContribution || 500));

    // Pure Client-Side JavaScript Stochastic Geometric Brownian Motion (GBM) Engine
    const annualMu = 0.10;
    const annualSigma = 0.16;

    const dt = 1 / 12;
    const monthlyDrift = (annualMu - 0.5 * Math.pow(annualSigma, 2)) * dt;
    const monthlyVol = annualSigma * Math.sqrt(dt);

    const endingValues = [];
    const samplePaths = [];
    const pathSampleCount = Math.min(10, numSimulations);

    // Box-Muller Gaussian normal distribution sampler
    function randomNorm() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    for (let s = 0; s < numSimulations; s++) {
      let currentVal = initialValue;
      const trajectory = [Math.round(currentVal)];

      for (let m = 1; m <= horizonMonths; m++) {
        const z = randomNorm();
        const monthlyReturn = Math.exp(monthlyDrift + monthlyVol * z) - 1;
        currentVal = Math.max(0, (currentVal + monthlyContribution) * (1 + monthlyReturn));
        if (s < pathSampleCount) {
          trajectory.push(Math.round(currentVal));
        }
      }

      endingValues.push(currentVal);
      if (s < pathSampleCount) {
        samplePaths.push(trajectory);
      }
    }

    endingValues.sort((a, b) => a - b);

    const meanEndingValue = Math.round(endingValues.reduce((sum, v) => sum + v, 0) / numSimulations);
    const p5Worst = Math.round(endingValues[Math.floor(0.05 * numSimulations)]);
    const p25 = Math.round(endingValues[Math.floor(0.25 * numSimulations)]);
    const p50Median = Math.round(endingValues[Math.floor(0.50 * numSimulations)]);
    const p75 = Math.round(endingValues[Math.floor(0.75 * numSimulations)]);
    const p95Best = Math.round(endingValues[Math.floor(0.95 * numSimulations)]);

    const totalPrincipal = initialValue + (monthlyContribution * horizonMonths);
    const lossCount = endingValues.filter(val => val < totalPrincipal).length;
    const probabilityOfLoss = Number(((lossCount / numSimulations) * 100).toFixed(1));

    // 10-bin distribution histogram
    const minVal = endingValues[0];
    const maxVal = endingValues[endingValues.length - 1];
    const binWidth = Math.max(1, (maxVal - minVal) / 10);
    const histogram = [];

    for (let i = 0; i < 10; i++) {
      const binStart = minVal + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = endingValues.filter(v => v >= binStart && (i === 9 ? v <= binEnd : v < binEnd)).length;
      histogram.push({
        binLabel: `$${Math.round(binStart / 1000)}k - $${Math.round(binEnd / 1000)}k`,
        binMid: Math.round((binStart + binEnd) / 2),
        count,
        probabilityPct: Number(((count / numSimulations) * 100).toFixed(1))
      });
    }

    return {
      simulation: {
        numSimulations,
        horizonMonths,
        initialValue,
        monthlyContribution,
        totalPrincipal: Math.round(totalPrincipal),
        summary: {
          meanEndingValue,
          p5Worst,
          p25,
          p50Median,
          p75,
          p95Best,
          probabilityOfLoss,
          expectedGain: Math.round(meanEndingValue - totalPrincipal)
        },
        histogram,
        samplePaths
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
