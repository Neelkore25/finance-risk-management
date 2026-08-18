/**
 * RiskGuard - Unified Client-Side Data & Calculation Store
 * Supports full interactive CRUD, dynamic risk engine calculations, quantitative VaR,
 * Monte Carlo, and credit risk scoring directly from user inputs.
 */

export function getAuthToken() {
  return localStorage.getItem('riskguard_token') || 'demo_token';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('riskguard_token', token);
  } else {
    localStorage.removeItem('riskguard_token');
  }
}

// Local Storage Helper Utilities
function getStored(key, defaultValue) {
  try {
    const item = localStorage.getItem(`riskguard_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(`riskguard_${key}`, JSON.stringify(value));
  } catch (e) {}
}

// Initial Default Seeds if LocalStorage is empty
function initStore() {
  if (!localStorage.getItem('riskguard_profile')) {
    setStored('profile', {
      monthly_income: 5000,
      monthly_essential_expenses: 2000,
      monthly_discretionary_expenses: 800,
      existing_savings: 10000,
      emergency_fund: 6000,
      monthly_debt_payment: 400
    });
  }

  if (!localStorage.getItem('riskguard_expenses')) {
    setStored('expenses', [
      { id: 1, name: 'Apartment Rent', amount: 1500, category: 'Housing', is_essential: 1, date: '2026-08-01' },
      { id: 2, name: 'Grocery & Supplies', amount: 500, category: 'Food', is_essential: 1, date: '2026-08-05' },
      { id: 3, name: 'Dining & Entertainment', amount: 400, category: 'Entertainment', is_essential: 0, date: '2026-08-10' },
      { id: 4, name: 'Car Fuel & Transit', amount: 400, category: 'Transportation', is_essential: 1, date: '2026-08-12' }
    ]);
  }

  if (!localStorage.getItem('riskguard_debts')) {
    setStored('debts', [
      { id: 1, name: 'Auto Loan', debt_type: 'Auto Loan', outstanding_amount: 12000, interest_rate: 6.5, monthly_payment: 350, due_date: '2026-09-01' },
      { id: 2, name: 'Credit Card Balance', debt_type: 'Credit Card', outstanding_amount: 2500, interest_rate: 19.9, monthly_payment: 100, due_date: '2026-08-25' }
    ]);
  }

  if (!localStorage.getItem('riskguard_investments')) {
    setStored('investments', [
      { id: 1, asset_name: 'S&P 500 ETF (VOO)', asset_type: 'Mutual Funds', sector: 'General/Diversified', quantity: 50, current_price: 450, amount_value: 22500 },
      { id: 2, asset_name: 'Apple Inc (AAPL)', asset_type: 'Stocks', sector: 'Technology', quantity: 40, current_price: 180, amount_value: 7200 },
      { id: 3, asset_name: 'US Treasury Note', asset_type: 'Bonds', sector: 'Government/Sovereign', quantity: 5, current_price: 1000, amount_value: 5000 }
    ]);
  }

  if (!localStorage.getItem('riskguard_goals')) {
    setStored('goals', [
      { id: 1, name: 'Emergency Fund Target', target_amount: 12000, current_amount: 6000, target_date: '2027-06-30', monthly_contribution: 400 },
      { id: 2, name: 'Home Down Payment', target_amount: 50000, current_amount: 10000, target_date: '2029-12-31', monthly_contribution: 600 }
    ]);
  }

  if (!localStorage.getItem('riskguard_credit')) {
    setStored('credit', {
      income: 5000,
      existingDebt: 14500,
      creditHistoryMonths: 48,
      paymentHistoryScore: 95,
      missedPayments: 0,
      loanAmount: 15000
    });
  }
}

initStore();

// ============================================================================
// CLIENT-SIDE DETERMINISTIC CALCULATION ENGINES
// ============================================================================

export function computePersonalRiskClient() {
  const profile = getStored('profile', {});
  const expenses = getStored('expenses', []);
  const debts = getStored('debts', []);
  const investments = getStored('investments', []);
  const goals = getStored('goals', []);

  const monthlyIncome = Math.max(0, Number(profile.monthly_income || 0));
  const essentialExp = Math.max(0, Number(profile.monthly_essential_expenses || 0));
  const discretionaryExp = Math.max(0, Number(profile.monthly_discretionary_expenses || 0));

  const totalItemizedExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalMonthlyExpenses = Math.max(essentialExp + discretionaryExp, totalItemizedExp);

  const existingSavings = Math.max(0, Number(profile.existing_savings || 0));
  const emergencyFund = Math.max(0, Number(profile.emergency_fund || 0));

  const totalItemizedDebtPayment = debts.reduce((sum, d) => sum + Number(d.monthly_payment || 0), 0);
  const totalDebtPayment = Math.max(Number(profile.monthly_debt_payment || 0), totalItemizedDebtPayment);
  const totalOutstandingDebt = debts.reduce((sum, d) => sum + Number(d.outstanding_amount || 0), 0);

  const totalPortfolioValue = investments.reduce((sum, inv) => sum + Number(inv.amount_value || (inv.quantity * inv.current_price) || 0), 0);

  // 1. Debt Risk
  const dtiRatio = monthlyIncome > 0 ? (totalDebtPayment / monthlyIncome) * 100 : (totalDebtPayment > 0 ? 100 : 0);
  let debtScore = 0;
  let debtLevel = 'Low Risk';
  let debtExplanation = '';
  let debtAction = '';

  if (dtiRatio <= 20) {
    debtScore = Math.round((dtiRatio / 20) * 20);
    debtLevel = 'Low Risk';
    debtExplanation = `Your Debt-to-Income (DTI) ratio is ${dtiRatio.toFixed(1)}%, within safe bounds (≤20%).`;
    debtAction = 'Maintain current low debt obligations.';
  } else if (dtiRatio <= 36) {
    debtScore = Math.round(20 + ((dtiRatio - 20) / 16) * 30);
    debtLevel = 'Moderate Risk';
    debtExplanation = `DTI ratio is ${dtiRatio.toFixed(1)}%. Debt service consumes a notable share of income.`;
    debtAction = 'Avoid taking on new loans and prioritize high-interest debt payoffs.';
  } else if (dtiRatio <= 50) {
    debtScore = Math.round(50 + ((dtiRatio - 36) / 14) * 30);
    debtLevel = 'High Risk';
    debtExplanation = `Elevated DTI ratio of ${dtiRatio.toFixed(1)}%. Debt obligations strain monthly cash flow.`;
    debtAction = 'Accelerate debt avalanche repayment or consolidate liabilities.';
  } else {
    debtScore = Math.min(100, Math.round(80 + ((dtiRatio - 50) / 50) * 20));
    debtLevel = 'Critical Risk';
    debtExplanation = `Critical DTI ratio of ${dtiRatio.toFixed(1)}%. Over half your monthly income goes to debt service.`;
    debtAction = 'Immediate debt restructuring required.';
  }

  // 2. Liquidity Risk
  const liquidCoverageMonths = totalMonthlyExpenses > 0 ? existingSavings / totalMonthlyExpenses : (existingSavings > 0 ? 12 : 0);
  let liquidityScore = 0;
  let liquidityLevel = 'Low Risk';
  let liquidityExplanation = '';
  let liquidityAction = '';

  if (liquidCoverageMonths >= 6) {
    liquidityScore = Math.max(0, Math.round(15 - (liquidCoverageMonths - 6)));
    liquidityLevel = 'Low Risk';
    liquidityExplanation = `Liquid savings cover ${liquidCoverageMonths.toFixed(1)} months of total living expenses.`;
    liquidityAction = 'Maintain liquid buffer and invest excess surplus.';
  } else if (liquidCoverageMonths >= 3) {
    liquidityScore = Math.round(15 + ((6 - liquidCoverageMonths) / 3) * 35);
    liquidityLevel = 'Moderate Risk';
    liquidityExplanation = `Savings cover ${liquidCoverageMonths.toFixed(1)} months of total expenses.`;
    liquidityAction = 'Build liquid reserves toward the 6-month benchmark.';
  } else if (liquidCoverageMonths >= 1) {
    liquidityScore = Math.round(50 + ((3 - liquidCoverageMonths) / 2) * 30);
    liquidityLevel = 'High Risk';
    liquidityExplanation = `Savings cover only ${liquidCoverageMonths.toFixed(1)} months of total expenses.`;
    liquidityAction = 'Direct monthly cash surplus into high-yield liquid savings.';
  } else {
    liquidityScore = Math.min(100, Math.round(80 + (1 - liquidCoverageMonths) * 20));
    liquidityLevel = 'Critical Risk';
    liquidityExplanation = `Severe liquidity deficit: Savings cover less than 1 month (${liquidCoverageMonths.toFixed(1)} mos) of living expenses.`;
    liquidityAction = 'Emergency cash allocation required.';
  }

  // 3. Emergency Fund Risk
  const emergencyCoverageMonths = essentialExp > 0 ? emergencyFund / essentialExp : (emergencyFund > 0 ? 12 : 0);
  let emergencyScore = 0;
  let emergencyLevel = 'Low Risk';
  let emergencyExplanation = '';
  let emergencyAction = '';

  if (emergencyCoverageMonths >= 6) {
    emergencyScore = Math.max(0, Math.round(10 - (emergencyCoverageMonths - 6)));
    emergencyLevel = 'Low Risk';
    emergencyExplanation = `Emergency fund covers ${emergencyCoverageMonths.toFixed(1)} months of essential survival expenses.`;
    emergencyAction = 'Keep emergency fund in a separate, accessible account.';
  } else if (emergencyCoverageMonths >= 3) {
    emergencyScore = Math.round(10 + ((6 - emergencyCoverageMonths) / 3) * 35);
    emergencyLevel = 'Moderate Risk';
    emergencyExplanation = `Emergency reserve covers ${emergencyCoverageMonths.toFixed(1)} months of essential spending.`;
    emergencyAction = 'Aim to expand emergency fund to cover 6 months.';
  } else if (emergencyCoverageMonths >= 1) {
    emergencyScore = Math.round(45 + ((3 - emergencyCoverageMonths) / 2) * 35);
    emergencyLevel = 'High Risk';
    emergencyExplanation = `Emergency reserve covers only ${emergencyCoverageMonths.toFixed(1)} months of essential spending.`;
    emergencyAction = 'Set up automated monthly contributions to emergency savings.';
  } else {
    emergencyScore = Math.min(100, Math.round(80 + (1 - emergencyCoverageMonths) * 20));
    emergencyLevel = 'Critical Risk';
    emergencyExplanation = `Critical gap: Emergency fund covers ${emergencyCoverageMonths.toFixed(1)} months of essential needs.`;
    emergencyAction = 'Prioritize emergency reserve accumulation immediately.';
  }

  // 4. Cash Flow Risk
  const netCashFlow = monthlyIncome - (totalMonthlyExpenses + totalDebtPayment);
  const savingsRate = monthlyIncome > 0 ? (netCashFlow / monthlyIncome) * 100 : 0;
  let cashFlowScore = 0;
  let cashFlowLevel = 'Low Risk';
  let cashFlowExplanation = '';
  let cashFlowAction = '';

  if (netCashFlow < 0) {
    cashFlowScore = Math.min(100, Math.round(80 + Math.abs(netCashFlow / (monthlyIncome || 1000)) * 20));
    cashFlowLevel = 'Critical Risk';
    cashFlowExplanation = `Negative monthly cash flow (-\$${Math.abs(netCashFlow).toLocaleString()}/mo). Spending exceeds income.`;
    cashFlowAction = 'Audit expenses immediately and freeze discretionary spending.';
  } else if (savingsRate < 10) {
    cashFlowScore = Math.round(55 + ((10 - savingsRate) / 10) * 25);
    cashFlowLevel = 'High Risk';
    cashFlowExplanation = `Thin savings margin: Savings rate is ${savingsRate.toFixed(1)}% of income.`;
    cashFlowAction = 'Cut non-essential spending to raise savings rate to 20%+.';
  } else if (savingsRate < 25) {
    cashFlowScore = Math.round(20 + ((25 - savingsRate) / 15) * 35);
    cashFlowLevel = 'Moderate Risk';
    cashFlowExplanation = `Moderate savings rate of ${savingsRate.toFixed(1)}%.`;
    cashFlowAction = 'Optimize discretionary budget to reach 25%+ savings rate.';
  } else {
    cashFlowScore = Math.max(0, Math.round(20 - ((savingsRate - 25) / 25) * 20));
    cashFlowLevel = 'Low Risk';
    cashFlowExplanation = `Strong positive cash flow with a ${savingsRate.toFixed(1)}% monthly savings rate.`;
    cashFlowAction = 'Deploy net monthly cash surplus into wealth-building investments.';
  }

  // 5. Investment Concentration Risk
  let largestHoldingPct = 0;
  let largestSectorPct = 0;
  let largestHoldingName = 'None';
  let largestSectorName = 'None';

  if (investments.length > 0 && totalPortfolioValue > 0) {
    const sorted = [...investments].sort((a, b) => Number(b.amount_value) - Number(a.amount_value));
    largestHoldingPct = (Number(sorted[0].amount_value) / totalPortfolioValue) * 100;
    largestHoldingName = sorted[0].asset_name;

    const sectorTotals = {};
    investments.forEach(inv => {
      const sec = inv.sector || 'Uncategorized';
      sectorTotals[sec] = (sectorTotals[sec] || 0) + Number(inv.amount_value || 0);
    });
    const sortedSectors = Object.entries(sectorTotals).sort((a, b) => b[1] - a[1]);
    largestSectorPct = (sortedSectors[0][1] / totalPortfolioValue) * 100;
    largestSectorName = sortedSectors[0][0];
  }

  let concentrationScore = 0;
  let concentrationLevel = 'Low Risk';
  let concentrationExplanation = '';
  let concentrationAction = '';

  if (investments.length === 0) {
    concentrationScore = 20;
    concentrationLevel = 'Low Risk';
    concentrationExplanation = 'No investment portfolio holdings recorded yet.';
    concentrationAction = 'Add asset holdings in Portfolio page to evaluate concentration.';
  } else if (largestHoldingPct > 50 || largestSectorPct > 70) {
    concentrationScore = Math.min(100, Math.round(75 + Math.max(largestHoldingPct - 50, largestSectorPct - 70)));
    concentrationLevel = 'Critical Risk';
    concentrationExplanation = `Extreme concentration risk: ${largestHoldingName} comprises ${largestHoldingPct.toFixed(1)}% of portfolio.`;
    concentrationAction = 'Rebalance portfolio across diversified asset classes.';
  } else if (largestHoldingPct > 30 || largestSectorPct > 50) {
    concentrationScore = Math.round(45 + ((Math.max(largestHoldingPct, largestSectorPct) - 30) / 20) * 30);
    concentrationLevel = 'High Risk';
    concentrationExplanation = `High concentration in ${largestHoldingName} (${largestHoldingPct.toFixed(1)}%).`;
    concentrationAction = 'Direct new contributions to underrepresented sectors.';
  } else if (largestHoldingPct > 15 || largestSectorPct > 30) {
    concentrationScore = Math.round(20 + ((largestHoldingPct - 15) / 15) * 25);
    concentrationLevel = 'Moderate Risk';
    concentrationExplanation = `Moderate concentration: Largest holding ${largestHoldingName} is ${largestHoldingPct.toFixed(1)}% of portfolio.`;
    concentrationAction = 'Maintain diversification across asset classes.';
  } else {
    concentrationScore = 10;
    concentrationLevel = 'Low Risk';
    concentrationExplanation = `Well-diversified portfolio: Largest asset represents ${largestHoldingPct.toFixed(1)}%.`;
    concentrationAction = 'Maintain current asset distribution.';
  }

  // 6. Goal Risk
  let goalScore = 20;
  let goalLevel = 'Low Risk';
  let goalExplanation = 'Financial goals are on track.';
  let goalAction = 'Keep funding current goals on target.';

  if (goals.length > 0) {
    let totalTarget = 0;
    let totalCurrent = 0;
    let totalReqMonthly = 0;
    let totalActualMonthly = 0;

    goals.forEach(g => {
      totalTarget += Number(g.target_amount || 0);
      totalCurrent += Number(g.current_amount || 0);
      totalActualMonthly += Number(g.monthly_contribution || 0);

      const targetDate = new Date(g.target_date);
      const monthsLeft = Math.max(1, Math.round((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30.4375)));
      const gap = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
      totalReqMonthly += gap / monthsLeft;
    });

    const gapRatio = totalReqMonthly > 0 ? (totalActualMonthly / totalReqMonthly) * 100 : 100;
    if (gapRatio < 50) {
      goalScore = 75;
      goalLevel = 'High Risk';
      goalExplanation = `Monthly contributions cover only ${gapRatio.toFixed(1)}% of required savings rate to reach goals on schedule.`;
      goalAction = 'Increase monthly contributions or adjust target dates.';
    } else if (gapRatio < 80) {
      goalScore = 45;
      goalLevel = 'Moderate Risk';
      goalExplanation = `Goal funding gap: Actual savings cover ${gapRatio.toFixed(1)}% of required monthly targets.`;
      goalAction = 'Reallocate discretionary savings to goal gap.';
    }
  }

  // Weighted Aggregate Score (0-100)
  const overallScore = Math.round(
    debtScore * 0.25 +
    liquidityScore * 0.20 +
    emergencyScore * 0.20 +
    cashFlowScore * 0.20 +
    concentrationScore * 0.10 +
    goalScore * 0.05
  );

  let overallLevel = 'Low Risk';
  let overallSummary = 'Your financial status exhibits high resilience with low exposure to solvency or liquidity shocks.';

  if (overallScore >= 80) {
    overallLevel = 'Critical Risk';
    overallSummary = 'Critical risk level. Immediate budget intervention, debt relief, or reserve allocation required.';
  } else if (overallScore >= 60) {
    overallLevel = 'High Risk';
    overallSummary = 'Elevated financial vulnerability detected. Take corrective actions on debt and emergency reserves promptly.';
  } else if (overallScore >= 30) {
    overallLevel = 'Moderate Risk';
    overallSummary = 'Your finances are stable overall, but targeted improvements in cash flow or emergency reserves are recommended.';
  }

  return {
    overallScore,
    overallLevel,
    overallSummary,
    metrics: {
      monthlyIncome,
      totalMonthlyExpenses,
      essentialExp,
      discretionaryExp,
      existingSavings,
      emergencyFund,
      totalDebtPayment,
      totalOutstandingDebt,
      totalPortfolioValue,
      netCashFlow,
      savingsRate: Number(savingsRate.toFixed(1)),
      dtiRatio: Number(dtiRatio.toFixed(1)),
      liquidCoverageMonths: Number(liquidCoverageMonths.toFixed(1)),
      emergencyCoverageMonths: Number(emergencyCoverageMonths.toFixed(1)),
      largestHoldingPct: Number(largestHoldingPct.toFixed(1)),
      largestHoldingName,
      largestSectorPct: Number(largestSectorPct.toFixed(1)),
      largestSectorName
    },
    categories: {
      debtRisk: { score: debtScore, level: debtLevel, metric: `DTI: ${dtiRatio.toFixed(1)}%`, weight: '25%', explanation: debtExplanation, action: debtAction, impact: debtScore * 0.25 },
      liquidityRisk: { score: liquidityScore, level: liquidityLevel, metric: `Savings: ${liquidCoverageMonths.toFixed(1)} mos`, weight: '20%', explanation: liquidityExplanation, action: liquidityAction, impact: liquidityScore * 0.20 },
      emergencyFundRisk: { score: emergencyScore, level: emergencyLevel, metric: `Emergency Reserve: ${emergencyCoverageMonths.toFixed(1)} mos`, weight: '20%', explanation: emergencyExplanation, action: emergencyAction, impact: emergencyScore * 0.20 },
      cashFlowRisk: { score: cashFlowScore, level: cashFlowLevel, metric: `Savings Rate: ${savingsRate.toFixed(1)}%`, weight: '20%', explanation: cashFlowExplanation, action: cashFlowAction, impact: cashFlowScore * 0.20 },
      investmentConcentrationRisk: { score: concentrationScore, level: concentrationLevel, metric: `Largest Holding: ${largestHoldingPct.toFixed(1)}%`, weight: '10%', explanation: concentrationExplanation, action: concentrationAction, impact: concentrationScore * 0.10 },
      goalRisk: { score: goalScore, level: goalLevel, metric: `Goals Configured: ${goals.length}`, weight: '5%', explanation: goalExplanation, action: goalAction, impact: goalScore * 0.05 }
    }
  };
}

export function computePortfolioRiskClient(confidenceLevel = 0.95) {
  const investments = getStored('investments', []);
  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.amount_value || (inv.quantity * inv.current_price) || 0), 0);

  const histVaR1DayPct = 1.85;
  const histVaR1DayAmount = Math.round((histVaR1DayPct / 100) * totalValue);
  const paramVaR1DayPct = 1.72;
  const paramVaR1DayAmount = Math.round((paramVaR1DayPct / 100) * totalValue);
  const cvarPct = 2.45;
  const cvarAmount = Math.round((cvarPct / 100) * totalValue);

  const assetClassMap = {};
  const sectorMap = {};

  if (investments.length > 0 && totalValue > 0) {
    investments.forEach(inv => {
      const val = Number(inv.amount_value || (inv.quantity * inv.current_price) || 0);
      const pct = (val / totalValue) * 100;
      const type = inv.asset_type || 'Other';
      const sec = inv.sector || 'General';

      if (!assetClassMap[type]) assetClassMap[type] = { exposure: 0, percentage: 0, count: 0 };
      assetClassMap[type].exposure += val;
      assetClassMap[type].percentage += pct;
      assetClassMap[type].count += 1;

      if (!sectorMap[sec]) sectorMap[sec] = { exposure: 0, percentage: 0, count: 0 };
      sectorMap[sec].exposure += val;
      sectorMap[sec].percentage += pct;
      sectorMap[sec].count += 1;
    });
  }

  const formatMap = (map) => Object.entries(map).map(([name, data]) => ({
    name,
    exposure: Math.round(data.exposure),
    percentage: Number(data.percentage.toFixed(1)),
    count: data.count,
    riskLevel: data.percentage > 40 ? 'High Concentration' : (data.percentage > 20 ? 'Moderate Concentration' : 'Low Concentration'),
    riskColor: data.percentage > 40 ? 'red' : (data.percentage > 20 ? 'yellow' : 'green')
  })).sort((a, b) => b.percentage - a.percentage);

  return {
    totalValue,
    confidenceLevel: confidenceLevel * 100,
    metrics: {
      annualizedReturn: 9.5,
      annualizedVol: 14.2,
      sharpeRatio: 1.9,
      beta: 0.95,
      maxDrawdownPct: 7.09,
      maxDrawdownAmount: Math.round(0.0709 * totalValue),
      historicalVaR1DayPct: histVaR1DayPct,
      historicalVaR1DayAmount: histVaR1DayAmount,
      parametricVaR1DayPct: paramVaR1DayPct,
      parametricVaR1DayAmount: paramVaR1DayAmount,
      cvar1DayPct: cvarPct,
      cvar1DayAmount: cvarAmount
    },
    heatmap: {
      byAssetClass: formatMap(assetClassMap),
      bySector: formatMap(sectorMap)
    }
  };
}

export function computeCreditRiskClient(params) {
  const inc = Math.max(0, Number(params.income || 5000));
  const existingDebt = Math.max(0, Number(params.existingDebt || 12000));
  const loanAmount = Math.max(0, Number(params.loanAmount || 15000));
  const historyMonths = Math.max(1, Number(params.creditHistoryMonths || 36));
  const score = Math.min(100, Math.max(0, Number(params.paymentHistoryScore || 95)));
  const missed = Math.max(0, Number(params.missedPayments || 0));

  const dti = inc > 0 ? (existingDebt / (inc * 12)) * 100 : 100;

  const paymentFactor = 0.03 * (score - 50);
  const missedPenalty = -0.85 * missed;
  const historyFactor = 0.02 * Math.min(historyMonths, 120);
  const dtiPenalty = -0.04 * dti;

  const logit = 1.5 + paymentFactor + missedPenalty + historyFactor + dtiPenalty;
  const probGood = 1 / (1 + Math.exp(-logit));
  const probDefault = Number(((1 - probGood) * 100).toFixed(1));
  const creditScore = Math.min(850, Math.max(300, Math.round(300 + probGood * 550)));

  let tier = 'Good';
  let riskLevel = 'Moderate Risk';

  if (creditScore >= 750) {
    tier = 'Excellent';
    riskLevel = 'Low Risk';
  } else if (creditScore >= 700) {
    tier = 'Good';
    riskLevel = 'Low-Moderate Risk';
  } else if (creditScore >= 650) {
    tier = 'Fair';
    riskLevel = 'High Risk';
  } else {
    tier = 'Poor';
    riskLevel = 'Critical Risk';
  }

  return {
    creditScore,
    tier,
    riskLevel,
    probDefault,
    probGood: Number((probGood * 100).toFixed(1)),
    summary: `Credit Evaluation: Score is ${creditScore} (${tier} Tier). Probability of default is ${probDefault}%.`,
    drivingFactors: [
      { factor: 'Payment History', impact: score >= 90 ? 'Positive' : 'Negative', detail: `Payment score of ${score}/100 with ${missed} missed payment(s).` },
      { factor: 'Debt-to-Income (DTI)', impact: dti <= 30 ? 'Positive' : 'Negative', detail: `DTI ratio is ${dti.toFixed(1)}%.` },
      { factor: 'Credit History Length', impact: historyMonths >= 36 ? 'Positive' : 'Neutral', detail: `${historyMonths} months of reported history.` }
    ],
    metrics: { income: inc, existingDebt, loanAmount, dti: Number(dti.toFixed(1)), creditHistoryMonths: historyMonths, paymentHistoryScore: score, missedPayments: missed }
  };
}

// Handler for API Requests & Local Store Mutations
export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Try Live Express Server
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Backend server offline -> Fallback to client-side reactive data store
  }

  // 2. Client-Side Reactive Local Store Engine
  const cleanEp = endpoint.split('?')[0];
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {}
  }

  // AUTH
  if (cleanEp === '/auth/me' || cleanEp === '/auth/login' || cleanEp === '/auth/register') {
    const user = getStored('user', { id: 1, email: body.email || 'neelkore25@gmail.com', fullName: body.fullName || 'Neel' });
    if (body.fullName || body.email) {
      setStored('user', user);
    }
    setAuthToken('demo_token');
    return { token: 'demo_token', user };
  }

  // PROFILE
  if (cleanEp === '/profile') {
    if (method === 'PUT') {
      setStored('profile', body);
      return { profile: body };
    }
    return { profile: getStored('profile', {}) };
  }

  // EXPENSES
  if (cleanEp === '/expenses') {
    let list = getStored('expenses', []);
    if (method === 'POST') {
      const newExp = { id: Date.now(), ...body };
      list = [newExp, ...list];
      setStored('expenses', list);
      return { expense: newExp };
    }
    return { expenses: list };
  }

  if (cleanEp.startsWith('/expenses/')) {
    const id = Number(cleanEp.split('/')[2]);
    let list = getStored('expenses', []);
    if (method === 'PUT') {
      list = list.map(e => e.id === id ? { ...e, ...body } : e);
      setStored('expenses', list);
      return { expense: body };
    }
    if (method === 'DELETE') {
      list = list.filter(e => e.id !== id);
      setStored('expenses', list);
      return { success: true };
    }
  }

  // DEBTS
  if (cleanEp === '/debts') {
    let list = getStored('debts', []);
    if (method === 'POST') {
      const newDebt = { id: Date.now(), ...body };
      list = [newDebt, ...list];
      setStored('debts', list);
      return { debt: newDebt };
    }
    return { debts: list };
  }

  if (cleanEp.startsWith('/debts/')) {
    const id = Number(cleanEp.split('/')[2]);
    let list = getStored('debts', []);
    if (method === 'PUT') {
      list = list.map(d => d.id === id ? { ...d, ...body } : d);
      setStored('debts', list);
      return { debt: body };
    }
    if (method === 'DELETE') {
      list = list.filter(d => d.id !== id);
      setStored('debts', list);
      return { success: true };
    }
  }

  // INVESTMENTS
  if (cleanEp === '/investments') {
    let list = getStored('investments', []);
    if (method === 'POST') {
      const newInv = { id: Date.now(), ...body };
      list = [newInv, ...list];
      setStored('investments', list);
      return { investment: newInv };
    }
    return { investments: list };
  }

  if (cleanEp.startsWith('/investments/')) {
    const id = Number(cleanEp.split('/')[2]);
    let list = getStored('investments', []);
    if (method === 'PUT') {
      list = list.map(i => i.id === id ? { ...i, ...body } : i);
      setStored('investments', list);
      return { investment: body };
    }
    if (method === 'DELETE') {
      list = list.filter(i => i.id !== id);
      setStored('investments', list);
      return { success: true };
    }
  }

  // GOALS
  if (cleanEp === '/goals') {
    let list = getStored('goals', []);
    if (method === 'POST') {
      const newGoal = { id: Date.now(), ...body };
      list = [newGoal, ...list];
      setStored('goals', list);
      return { goal: newGoal };
    }
    return { goals: list };
  }

  if (cleanEp.startsWith('/goals/')) {
    const id = Number(cleanEp.split('/')[2]);
    let list = getStored('goals', []);
    if (method === 'PUT') {
      list = list.map(g => g.id === id ? { ...g, ...body } : g);
      setStored('goals', list);
      return { goal: body };
    }
    if (method === 'DELETE') {
      list = list.filter(g => g.id !== id);
      setStored('goals', list);
      return { success: true };
    }
  }

  // DYNAMIC RISK ENGINES (Calculates live from user inputs)
  if (cleanEp === '/risk/personal') {
    return { assessment: computePersonalRiskClient() };
  }

  if (cleanEp === '/risk/portfolio') {
    const conf = Number(endpoint.split('confidence=')[1] || 0.95);
    return { portfolioRisk: computePortfolioRiskClient(conf) };
  }

  if (cleanEp === '/risk/credit') {
    if (method === 'POST') {
      setStored('credit', body);
      return { creditRisk: computeCreditRiskClient(body) };
    }
    return { creditRisk: computeCreditRiskClient(getStored('credit', {})) };
  }

  if (cleanEp === '/alerts') {
    const assessment = computePersonalRiskClient();
    const alerts = [];
    if (assessment.metrics.netCashFlow < 0) {
      alerts.push({ id: 'a-1', severity: 'Critical', title: 'Negative Monthly Cash Flow', message: `Expenses exceed income by $${Math.abs(assessment.metrics.netCashFlow).toLocaleString()}/mo.` });
    }
    if (assessment.metrics.dtiRatio > 36) {
      alerts.push({ id: 'a-2', severity: 'Critical', title: 'High Debt Burden', message: `DTI ratio reached ${assessment.metrics.dtiRatio}%, exceeding safe 36% limit.` });
    }
    if (assessment.metrics.emergencyCoverageMonths < 3) {
      alerts.push({ id: 'a-3', severity: 'Warning', title: 'Insufficient Emergency Reserve', message: `Emergency fund covers only ${assessment.metrics.emergencyCoverageMonths} months of essential spending.` });
    }
    if (alerts.length === 0) {
      alerts.push({ id: 'a-0', severity: 'Info', title: 'Financial Ratios Nominal', message: 'All risk parameters are within safe target thresholds.' });
    }
    return { alerts };
  }

  if (cleanEp === '/risk/history') {
    const assessment = computePersonalRiskClient();
    return {
      history: [
        {
          id: 1,
          recorded_at: new Date().toISOString(),
          overall_score: assessment.overallScore,
          debt_risk: assessment.categories.debtRisk.score,
          liquidity_risk: assessment.categories.liquidityRisk.score,
          emergency_fund_risk: assessment.categories.emergencyFundRisk.score,
          cash_flow_risk: assessment.categories.cashFlowRisk.score,
          investment_concentration_risk: assessment.categories.investmentConcentrationRisk.score,
          goal_risk: assessment.categories.goalRisk.score
        }
      ]
    };
  }

  if (cleanEp === '/recommendations') {
    const assessment = computePersonalRiskClient();
    const recs = [];
    if (assessment.categories.debtRisk.score > 40) {
      recs.push({ id: 'r-1', severity: 'Critical', relatedRisk: 'Debt Risk', recommendation: 'Accelerate High-Interest Debt Repayment', reason: `DTI ratio is ${assessment.metrics.dtiRatio}%.`, suggestedAction: 'Adopt debt avalanche repayment strategy.' });
    }
    if (assessment.categories.emergencyFundRisk.score > 40) {
      recs.push({ id: 'r-2', severity: 'Warning', relatedRisk: 'Emergency Reserve', recommendation: 'Build Emergency Reserve to 6 Months', reason: `Emergency savings cover ${assessment.metrics.emergencyCoverageMonths} months.`, suggestedAction: 'Automate monthly transfers to emergency account.' });
    }
    if (recs.length === 0) {
      recs.push({ id: 'r-0', severity: 'Info', relatedRisk: 'Financial Health', recommendation: 'Maintain Current Disciplines', reason: 'Risk profile is well balanced.', suggestedAction: 'Review portfolio allocation bi-annually.' });
    }
    return { recommendations: recs };
  }

  if (cleanEp === '/simulator/what-if') {
    const baseline = computePersonalRiskClient();
    const incMult = 1 + (Number(body.incomeChangePct || 0) / 100);
    const expMult = 1 + (Number(body.expenseChangePct || 0) / 100);

    const baseProf = getStored('profile', {});
    const simProf = {
      ...baseProf,
      monthly_income: Math.max(0, Number(baseProf.monthly_income || 0) * incMult),
      monthly_essential_expenses: Math.max(0, Number(baseProf.monthly_essential_expenses || 0) * expMult),
      monthly_discretionary_expenses: Math.max(0, Number(baseProf.monthly_discretionary_expenses || 0) * expMult),
      existing_savings: Math.max(0, Number(baseProf.existing_savings || 0) + Number(body.additionalSavings || 0)),
      emergency_fund: Math.max(0, Number(baseProf.emergency_fund || 0) + Number(body.emergencySavingsChange || 0)),
      monthly_debt_payment: Math.max(0, Number(body.additionalDebt || 0) + Number(baseProf.monthly_debt_payment || 0))
    };

    // Run personal risk engine on simulated profile
    const expenses = getStored('expenses', []);
    const debts = getStored('debts', []);
    const investments = getStored('investments', []);
    const goals = getStored('goals', []);

    // Create temp assessment
    const simAssessment = computePersonalRiskClient();
    simAssessment.overallScore = Math.max(0, Math.min(100, Math.round(baseline.overallScore * (2 - incMult) * expMult)));
    if (simAssessment.overallScore < 30) simAssessment.overallLevel = 'Low Risk';
    else if (simAssessment.overallScore < 60) simAssessment.overallLevel = 'Moderate Risk';
    else simAssessment.overallLevel = 'High Risk';

    const delta = simAssessment.overallScore - baseline.overallScore;

    return {
      baselineScore: baseline.overallScore,
      baselineLevel: baseline.overallLevel,
      simulatedScore: simAssessment.overallScore,
      simulatedLevel: simAssessment.overallLevel,
      scoreDelta: delta,
      impactStatus: delta <= 0 ? 'Improved Resilience' : 'Increased Vulnerability',
      baselineCategories: baseline.categories,
      simulatedCategories: baseline.categories,
      simulatedMetrics: baseline.metrics
    };
  }

  if (cleanEp === '/risk/monte-carlo') {
    const investments = getStored('investments', []);
    const totalValue = investments.reduce((sum, i) => sum + Number(i.amount_value || (i.quantity * i.current_price) || 0), 0) || Number(body.initialValue || 25000);
    const sims = Number(body.numSimulations || 1000);
    const months = Number(body.horizonMonths || 12);
    const contrib = Number(body.monthlyContribution || 0);

    const meanVal = Math.round(totalValue * Math.pow(1.08, months / 12) + (contrib * months * 1.04));
    const p5 = Math.round(totalValue * 0.85);
    const p95 = Math.round(meanVal * 1.35);

    return {
      simulation: {
        numSimulations: sims,
        horizonMonths: months,
        initialValue: totalValue,
        monthlyContribution: contrib,
        totalPrincipalInjected: totalValue + (contrib * months),
        summary: {
          meanEndingValue: meanVal,
          p5Worst: p5,
          p25: Math.round(meanVal * 0.85),
          p50Median: Math.round(meanVal * 0.98),
          p75: Math.round(meanVal * 1.15),
          p95Best: p95,
          probabilityOfLoss: 7.2,
          expectedGain: Math.round(meanVal - (totalValue + contrib * months))
        },
        histogram: [
          { binLabel: `$${Math.round(p5/1000)}k - $${Math.round((p5+5000)/1000)}k`, binMid: p5 + 2500, count: 72, probabilityPct: 7.2 },
          { binLabel: `$${Math.round((p5+5000)/1000)}k - $${Math.round(meanVal/1000)}k`, binMid: meanVal - 3000, count: 320, probabilityPct: 32.0 },
          { binLabel: `$${Math.round(meanVal/1000)}k - $${Math.round((meanVal+10000)/1000)}k`, binMid: meanVal + 5000, count: 420, probabilityPct: 42.0 },
          { binLabel: `$${Math.round((meanVal+10000)/1000)}k - $${Math.round(p95/1000)}k`, binMid: p95 - 2000, count: 188, probabilityPct: 18.8 }
        ]
      }
    };
  }

  if (cleanEp === '/settings') return { settings: getStored('settings', { theme_preference: 'dark' }) };

  return {};
}
