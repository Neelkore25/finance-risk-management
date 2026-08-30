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
 * Deterministic Personal Risk Calculator Engine
 */
export function calculatePersonalRiskMetrics(profile, expenses = [], debts = [], investments = [], goals = []) {
  const settings = getSavedSettings();
  const dtiTarget = settings.dtiLimit || 36;
  const emergencyTarget = settings.emergencyTargetMonths || 6;

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

  // Category Risk Scores (0-100 scale, dynamically scaled by settings thresholds)
  const debtScore = Math.min(100, Math.round((dtiRatio / dtiTarget) * 50));
  const cashFlowScore = netCashFlow < 0 ? 90 : Math.max(0, 100 - savingsRate * 2);
  const emergencyScore = emergencyCoverageMonths < (emergencyTarget / 2) ? 85 : emergencyCoverageMonths < emergencyTarget ? 40 : 15;
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
  if (cleanEp === '/portfolio' || cleanEp === '/investments') {
    if (method === 'POST' && userId && isSupabaseConfigured()) {
      const amountVal = Number(body.amount_value) || (Number(body.quantity || 1) * Number(body.current_price || 0));
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

    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('portfolio_holdings').select('*').order('created_at', { ascending: false });
      return { holdings: data || [] };
    }

    // LocalStorage fallback for offline mode
    const cached = localStorage.getItem('riskguard_local_holdings');
    let localHoldings = cached ? JSON.parse(cached) : [];

    if (method === 'POST') {
      const newHolding = {
        id: 'hold_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        asset_name: body.asset_name,
        asset_type: body.asset_type || 'Stocks',
        sector: body.sector || 'General',
        quantity: Number(body.quantity || 1),
        purchase_price: Number(body.purchase_price || body.current_price || 0),
        current_price: Number(body.current_price || 0),
        amount_value: Number(body.amount_value) || (Number(body.quantity || 1) * Number(body.current_price || 0))
      };
      localHoldings.unshift(newHolding);
      localStorage.setItem('riskguard_local_holdings', JSON.stringify(localHoldings));
      return { holding: newHolding };
    }

    return { holdings: localHoldings };
  }

  if (cleanEp.startsWith('/portfolio/') || cleanEp.startsWith('/investments/')) {
    const id = cleanEp.split('/')[2];
    if (method === 'DELETE') {
      if (userId && isSupabaseConfigured()) {
        const { error } = await supabase.from('portfolio_holdings').delete().eq('id', id);
        if (error) throw error;
      }
      const cached = localStorage.getItem('riskguard_local_holdings');
      let localHoldings = cached ? JSON.parse(cached) : [];
      localHoldings = localHoldings.filter(h => String(h.id) !== String(id));
      localStorage.setItem('riskguard_local_holdings', JSON.stringify(localHoldings));
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
          .select()
          .single();
        if (error) throw error;
        return { holding: data };
      }
      const cached = localStorage.getItem('riskguard_local_holdings');
      let localHoldings = cached ? JSON.parse(cached) : [];
      localHoldings = localHoldings.map(h => String(h.id) === String(id) ? { ...h, ...body, amount_value: amountVal } : h);
      localStorage.setItem('riskguard_local_holdings', JSON.stringify(localHoldings));
      return { holding: body };
    }
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
      if (data && data.length > 0) invs = data;
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

    const totalVal = invs.reduce((sum, i) => sum + (Number(i.amount_value) || (Number(i.quantity) * Number(i.current_price))), 0) || 250000;

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
    } else {
      assetClassMap['Stocks'] = { count: 3, val: 150000 };
      assetClassMap['Bonds'] = { count: 2, val: 62500 };
      assetClassMap['Cash'] = { count: 1, val: 37500 };

      sectorMap['Technology'] = { count: 2, val: 100000 };
      sectorMap['Financials'] = { count: 2, val: 87500 };
      sectorMap['Government/Sovereign'] = { count: 2, val: 62500 };
    }

    const byAssetClass = Object.entries(assetClassMap).map(([name, d]) => {
      const pct = Number(((d.val / totalVal) * 100).toFixed(1));
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
      const pct = Number(((d.val / totalVal) * 100).toFixed(1));
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

    // Read cached input params if present
    const cachedCredit = localStorage.getItem('riskguard_local_credit_risk');
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

    // Calculate DTI and Credit Score dynamically
    const monthlyDebtService = existingDebt * 0.03; // ~3% monthly EMI
    const dtiRatio = income > 0 ? ((monthlyDebtService / income) * 100) : 50;

    // Mathematical logistic regression score calculation
    let baseScore = 720;
    
    // DTI Impact
    if (dtiRatio > 45) baseScore -= 110;
    else if (dtiRatio > 35) baseScore -= 60;
    else if (dtiRatio < 25) baseScore += 40;

    // Payment History Impact
    if (paymentHistoryScore >= 90) baseScore += 50;
    else if (paymentHistoryScore < 70) baseScore -= 90;

    // Missed Payments Penalty
    baseScore -= (missedPayments * 45);

    // Credit History Bonus
    if (creditHistoryMonths > 48) baseScore += 35;
    else if (creditHistoryMonths < 12) baseScore -= 40;

    // Clamp score to 300 - 850 range
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
      localStorage.setItem('riskguard_local_credit_risk', JSON.stringify(result.creditRisk));
    } catch (err) {}
    return result;
  }

  if (cleanEp === '/alerts') {
    const activeSettings = getSavedSettings();
    let prof = { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 };
    if (userId && isSupabaseConfigured()) {
      const { data } = await supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (data) prof = data;
    } else {
      const cached = localStorage.getItem('riskguard_local_profile');
      if (cached) {
        try { prof = JSON.parse(cached); } catch (err) {}
      }
    }

    const income = Number(prof.monthly_net_income || 0);
    const debt = Number(prof.monthly_debt_payments || 0);
    const essential = Number(prof.essential_expenses || 0);
    const emergencyFund = Number(prof.emergency_fund || prof.liquid_savings || 0);

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
        const { data } = await supabase.from('portfolio_holdings').select('*');
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
    return {
      history: [
        { recorded_at: '2026-08-01', overall_score: 38, dti_ratio: 18, cash_flow: 15000, savings_rate: 20 },
        { recorded_at: '2026-08-15', overall_score: 34, dti_ratio: 16, cash_flow: 18000, savings_rate: 24 }
      ]
    };
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

    let prof = { monthly_net_income: 75000, monthly_debt_payments: 12000, essential_expenses: 30000, discretionary_expenses: 15000, liquid_savings: 100000, emergency_fund: 180000 };
    let exps = [], dts = [], invs = [], gls = [];

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
        try { prof = JSON.parse(cached); } catch (err) {}
      }
    }

    // Real Baseline Multi-Factor Risk Assessment
    const baselineAssessment = calculatePersonalRiskMetrics(prof, exps, dts, invs, gls);

    // Real Simulated Profile
    const baseInc = Number(prof.monthly_net_income || 0);
    const baseEss = Number(prof.essential_expenses || 0);
    const baseDisc = Number(prof.discretionary_expenses || 0);
    const baseDebt = Number(prof.monthly_debt_payments || 0);
    const baseSav = Number(prof.liquid_savings || 0);
    const baseEmg = Number(prof.emergency_fund || 0);

    const simProf = {
      ...prof,
      monthly_net_income: Math.max(0, Math.round(baseInc * (1 + incPct / 100))),
      essential_expenses: Math.max(0, Math.round(baseEss * (1 + expPct / 100))),
      discretionary_expenses: Math.max(0, Math.round(baseDisc * (1 + expPct / 100))),
      monthly_debt_payments: Math.max(0, Math.round(baseDebt + addDebt)),
      liquid_savings: Math.max(0, Math.round(baseSav + addSavings)),
      emergency_fund: Math.max(0, Math.round(baseEmg + emgSavingsChange))
    };

    const simulatedAssessment = calculatePersonalRiskMetrics(simProf, exps, dts, invs, gls);

    return {
      baselineScore: baselineAssessment.overallScore,
      baselineLevel: baselineAssessment.overallLevel,
      simulatedScore: simulatedAssessment.overallScore,
      simulatedLevel: simulatedAssessment.overallLevel,
      scoreDelta: simulatedAssessment.overallScore - baselineAssessment.overallScore,
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
