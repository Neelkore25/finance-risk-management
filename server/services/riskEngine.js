/**
 * RiskGuard - Single Reusable Personal Financial Risk Engine
 * Deterministic, explainable, and testable risk calculation module.
 */

function calculatePersonalRisk(profile, expenses = [], debts = [], investments = [], goals = [], userSettings = {}) {
  const dtiTarget = Math.max(10, Math.min(80, Number(userSettings?.dtiLimit || 36)));
  const emergencyTarget = Math.max(1, Math.min(24, Number(userSettings?.emergencyTargetMonths || 6)));

  // Safe extraction with default fallbacks
  const monthlyIncome = Math.max(0, Number(profile?.monthly_income ?? profile?.monthly_net_income ?? 0));
  const essentialExp = Math.max(0, Number(profile?.monthly_essential_expenses ?? profile?.essential_expenses ?? 0));
  const discretionaryExp = Math.max(0, Number(profile?.monthly_discretionary_expenses ?? profile?.discretionary_expenses ?? 0));
  
  // Calculate total monthly expenses dynamically from expense items if present, else profile
  const totalItemizedExp = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalMonthlyExpenses = Math.max(essentialExp + discretionaryExp, totalItemizedExp);
  
  const existingSavings = Math.max(0, Number(profile?.existing_savings ?? profile?.liquid_savings ?? 0));
  const emergencyFund = Math.max(0, Number(profile?.emergency_fund ?? existingSavings));
  
  // Debt calculation
  const totalItemizedDebtPayment = debts.reduce((sum, d) => sum + Number(d.monthly_payment ?? d.monthly_emi ?? 0), 0);
  const totalDebtPayment = Math.max(Number(profile?.monthly_debt_payment ?? profile?.monthly_debt_payments ?? 0), totalItemizedDebtPayment);
  const totalOutstandingDebt = debts.reduce((sum, d) => sum + Number(d.outstanding_amount ?? d.outstanding_balance ?? 0), 0);

  // Portfolio total
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + Number(inv.amount_value || (inv.quantity * inv.current_price) || 0), 0);

  // 1. DEBT RISK CALCULATION (Dynamic against dtiTarget)
  const dtiRatio = monthlyIncome > 0 ? (totalDebtPayment / monthlyIncome) * 100 : (totalDebtPayment > 0 ? 100 : 0);
  let debtScore = 0;
  let debtLevel = 'Low Risk';
  let debtExplanation = '';
  let debtAction = '';

  if (dtiRatio <= (dtiTarget * 0.5)) {
    debtScore = Math.round((dtiRatio / (dtiTarget * 0.5)) * 15);
    debtLevel = 'Low Risk';
    debtExplanation = `Your Debt-to-Income (DTI) ratio is ${dtiRatio.toFixed(1)}%, well within your target threshold of ${dtiTarget}%.`;
    debtAction = `Maintain current debt levels under your ${dtiTarget}% limit and pay off high-interest balances if any.`;
  } else if (dtiRatio <= dtiTarget) {
    debtScore = Math.round(15 + ((dtiRatio - (dtiTarget * 0.5)) / (dtiTarget * 0.5)) * 30);
    debtLevel = 'Moderate Risk';
    debtExplanation = `Your DTI ratio is ${dtiRatio.toFixed(1)}%. Debt payments absorb a notable portion of your monthly income close to your ${dtiTarget}% limit.`;
    debtAction = `Avoid taking on new loans to keep debt obligations beneath ${dtiTarget}%.`;
  } else if (dtiRatio <= (dtiTarget * 1.4)) {
    debtScore = Math.round(50 + ((dtiRatio - dtiTarget) / (dtiTarget * 0.4)) * 30);
    debtLevel = 'High Risk';
    debtExplanation = `High DTI ratio of ${dtiRatio.toFixed(1)}%, exceeding your target limit of ${dtiTarget}%.`;
    debtAction = 'Prioritize debt consolidation or aggressive debt snowball/avalanche repayment.';
  } else {
    debtScore = Math.min(100, Math.round(80 + ((dtiRatio - (dtiTarget * 1.4)) / 30) * 20));
    debtLevel = 'Critical Risk';
    debtExplanation = `Critical DTI ratio of ${dtiRatio.toFixed(1)}%, severely exceeding your target limit of ${dtiTarget}%.`;
    debtAction = 'Immediate debt restructuring or financial counseling recommended.';
  }

  // 2. LIQUIDITY RISK CALCULATION
  const liquidCoverageMonths = totalMonthlyExpenses > 0 ? existingSavings / totalMonthlyExpenses : (existingSavings > 0 ? 12 : 0);
  let liquidityScore = 0;
  let liquidityLevel = 'Low Risk';
  let liquidityExplanation = '';
  let liquidityAction = '';

  if (liquidCoverageMonths >= 6) {
    liquidityScore = Math.max(0, Math.round(15 - (liquidCoverageMonths - 6)));
    liquidityLevel = 'Low Risk';
    liquidityExplanation = `Liquid savings cover ${liquidCoverageMonths.toFixed(1)} months of total expenses. Excellent liquidity buffer.`;
    liquidityAction = 'Consider allocating excess liquid savings into higher-yield investment assets.';
  } else if (liquidCoverageMonths >= 3) {
    liquidityScore = Math.round(15 + ((6 - liquidCoverageMonths) / 3) * 35);
    liquidityLevel = 'Moderate Risk';
    liquidityExplanation = `Savings cover ${liquidCoverageMonths.toFixed(1)} months of expenses. Moderate buffer available.`;
    liquidityAction = 'Gradually boost liquid savings toward the 6-month benchmark.';
  } else if (liquidCoverageMonths >= 1) {
    liquidityScore = Math.round(50 + ((3 - liquidCoverageMonths) / 2) * 30);
    liquidityLevel = 'High Risk';
    liquidityExplanation = `Savings cover only ${liquidCoverageMonths.toFixed(1)} months of total expenses. Vulnerable to unexpected income drops.`;
    liquidityAction = 'Direct immediate discretionary cash flow into high-yield savings.';
  } else {
    liquidityScore = Math.min(100, Math.round(80 + (1 - liquidCoverageMonths) * 20));
    liquidityLevel = 'Critical Risk';
    liquidityExplanation = `Severe liquidity deficit: Liquid reserves cover less than 1 month (${liquidCoverageMonths.toFixed(1)} mos) of living expenses.`;
    liquidityAction = 'Emergency cash allocation required to avoid solvency stress.';
  }

  // 3. EMERGENCY FUND RISK CALCULATION (Dynamic against emergencyTarget)
  const emergencyCoverageMonths = essentialExp > 0 ? emergencyFund / essentialExp : (emergencyFund > 0 ? 12 : 0);
  let emergencyScore = 0;
  let emergencyLevel = 'Low Risk';
  let emergencyExplanation = '';
  let emergencyAction = '';

  if (emergencyCoverageMonths >= emergencyTarget) {
    emergencyScore = Math.max(0, Math.round(10 - Math.min(10, (emergencyCoverageMonths - emergencyTarget))));
    emergencyLevel = 'Low Risk';
    emergencyExplanation = `Dedicated emergency fund covers ${emergencyCoverageMonths.toFixed(1)} months of essential expenses, meeting your target of ${emergencyTarget} months.`;
    emergencyAction = 'Maintain emergency fund in a separate, accessible account.';
  } else if (emergencyCoverageMonths >= (emergencyTarget * 0.5)) {
    emergencyScore = Math.round(10 + ((emergencyTarget - emergencyCoverageMonths) / (emergencyTarget * 0.5)) * 35);
    emergencyLevel = 'Moderate Risk';
    emergencyExplanation = `Emergency fund covers ${emergencyCoverageMonths.toFixed(1)} months of essential spending vs target of ${emergencyTarget} months.`;
    emergencyAction = `Aim to build emergency fund to cover at least ${emergencyTarget} months of essential needs.`;
  } else if (emergencyCoverageMonths >= 1) {
    emergencyScore = Math.round(45 + (((emergencyTarget * 0.5) - emergencyCoverageMonths) / (emergencyTarget * 0.5)) * 35);
    emergencyLevel = 'High Risk';
    emergencyExplanation = `Emergency fund covers only ${emergencyCoverageMonths.toFixed(1)} months of essential costs.`;
    emergencyAction = `Set up automated monthly contributions to reach ${emergencyTarget} months of emergency savings.`;
  } else {
    emergencyScore = Math.min(100, Math.round(80 + (1 - emergencyCoverageMonths) * 20));
    emergencyLevel = 'Critical Risk';
    emergencyExplanation = `No substantial emergency reserve. Only ${emergencyCoverageMonths.toFixed(1)} months of essential costs covered.`;
    emergencyAction = 'Prioritize emergency fund accumulation before aggressive investing.';
  }

  // 4. CASH FLOW RISK CALCULATION
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
    cashFlowAction = 'Audit expenses immediately and reduce discretionary spending.';
  } else if (savingsRate < 10) {
    cashFlowScore = Math.round(55 + ((10 - savingsRate) / 10) * 25);
    cashFlowLevel = 'High Risk';
    cashFlowExplanation = `Thin savings margin: Savings rate is only ${savingsRate.toFixed(1)}% of income.`;
    cashFlowAction = 'Identify discretionary expense cuts to improve monthly cash surplus.';
  } else if (savingsRate < 25) {
    cashFlowScore = Math.round(20 + ((25 - savingsRate) / 15) * 35);
    cashFlowLevel = 'Moderate Risk';
    cashFlowExplanation = `Moderate savings rate of ${savingsRate.toFixed(1)}%. Healthy, but room for optimization.`;
    cashFlowAction = 'Increase savings rate toward 25%+ with structured budget targets.';
  } else {
    cashFlowScore = Math.max(0, Math.round(20 - ((savingsRate - 25) / 25) * 20));
    cashFlowLevel = 'Low Risk';
    cashFlowExplanation = `Strong positive cash flow with a ${savingsRate.toFixed(1)}% monthly savings rate.`;
    cashFlowAction = 'Systematically deploy monthly surplus toward investment goals.';
  }

  // 5. INVESTMENT CONCENTRATION RISK CALCULATION
  let largestHoldingPct = 0;
  let largestSectorPct = 0;
  let largestHoldingName = 'None';
  let largestSectorName = 'None';

  if (investments.length > 0 && totalPortfolioValue > 0) {
    const sortedHoldings = [...investments].sort((a, b) => Number(b.amount_value) - Number(a.amount_value));
    largestHoldingPct = (Number(sortedHoldings[0].amount_value) / totalPortfolioValue) * 100;
    largestHoldingName = sortedHoldings[0].asset_name;

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
    concentrationScore = 20; // Default baseline risk when no portfolio exists
    concentrationLevel = 'Low Risk';
    concentrationExplanation = 'No investment portfolio holdings recorded yet.';
    concentrationAction = 'Add your investment holdings to evaluate concentration & market risks.';
  } else if (largestHoldingPct > 50 || largestSectorPct > 70) {
    concentrationScore = Math.min(100, Math.round(75 + Math.max(largestHoldingPct - 50, largestSectorPct - 70)));
    concentrationLevel = 'Critical Risk';
    concentrationExplanation = `Extreme concentration risk: ${largestHoldingName} comprises ${largestHoldingPct.toFixed(1)}% of portfolio, or ${largestSectorName} sector comprises ${largestSectorPct.toFixed(1)}%.`;
    concentrationAction = 'Rebalance portfolio across non-correlated asset classes and sectors.';
  } else if (largestHoldingPct > 30 || largestSectorPct > 50) {
    concentrationScore = Math.round(45 + ((Math.max(largestHoldingPct, largestSectorPct) - 30) / 20) * 30);
    concentrationLevel = 'High Risk';
    concentrationExplanation = `High concentration in ${largestHoldingName} (${largestHoldingPct.toFixed(1)}%) or ${largestSectorName} sector (${largestSectorPct.toFixed(1)}%).`;
    concentrationAction = 'Diversify new contributions into index funds or underrepresented sectors.';
  } else if (largestHoldingPct > 15 || largestSectorPct > 30) {
    concentrationScore = Math.round(20 + ((largestHoldingPct - 15) / 15) * 25);
    concentrationLevel = 'Moderate Risk';
    concentrationExplanation = `Moderate concentration: Largest holding ${largestHoldingName} is ${largestHoldingPct.toFixed(1)}% of investments.`;
    concentrationAction = 'Monitor asset allocation periodically and maintain diversification.';
  } else {
    concentrationScore = 10;
    concentrationLevel = 'Low Risk';
    concentrationExplanation = `Well-diversified portfolio: Largest asset represents ${largestHoldingPct.toFixed(1)}% and top sector ${largestSectorPct.toFixed(1)}%.`;
    concentrationAction = 'Maintain current asset distribution strategy.';
  }

  // 6. FINANCIAL GOAL RISK CALCULATION
  let goalScore = 0;
  let goalLevel = 'Low Risk';
  let goalExplanation = '';
  let goalAction = '';

  if (goals.length === 0) {
    goalScore = 25;
    goalLevel = 'Low Risk';
    goalExplanation = 'No active financial goals configured.';
    goalAction = 'Define specific target goals (e.g. Retirement, Home, Education) to track achievability.';
  } else {
    let totalTarget = 0;
    let totalCurrent = 0;
    let totalRequiredMonthly = 0;
    let totalActualMonthly = 0;

    goals.forEach(g => {
      totalTarget += Number(g.target_amount || 0);
      totalCurrent += Number(g.current_amount || 0);
      totalActualMonthly += Number(g.monthly_contribution || 0);
      
      const targetDate = new Date(g.target_date);
      const monthsLeft = Math.max(1, Math.round((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30.4375)));
      const gap = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
      totalRequiredMonthly += gap / monthsLeft;
    });

    const goalGapRatio = totalRequiredMonthly > 0 ? (totalActualMonthly / totalRequiredMonthly) * 100 : 100;
    
    if (goalGapRatio < 40) {
      goalScore = Math.min(100, Math.round(75 + (40 - goalGapRatio)));
      goalLevel = 'Critical Risk';
      goalExplanation = `Current monthly contributions cover only ${goalGapRatio.toFixed(1)}% of required savings rate to reach goals on schedule.`;
      goalAction = 'Increase monthly contributions or adjust target completion dates.';
    } else if (goalGapRatio < 75) {
      goalScore = Math.round(45 + ((75 - goalGapRatio) / 35) * 30);
      goalLevel = 'High Risk';
      goalExplanation = `Goal shortfall: Actual savings cover ${goalGapRatio.toFixed(1)}% of required monthly targets.`;
      goalAction = 'Reallocate discretionary savings toward goal funding gap.';
    } else if (goalGapRatio < 95) {
      goalScore = Math.round(20 + ((95 - goalGapRatio) / 20) * 25);
      goalLevel = 'Moderate Risk';
      goalExplanation = `Minor funding gap: Achieving ${goalGapRatio.toFixed(1)}% of monthly target contribution.`;
      goalAction = 'Slight increase in monthly contribution will secure on-time goal completion.';
    } else {
      goalScore = 10;
      goalLevel = 'Low Risk';
      goalExplanation = `Financial goals are on track with ${goalGapRatio.toFixed(1)}% of required savings funded monthly.`;
      goalAction = 'Keep funding current goals on target.';
    }
  }

  // OVERALL WEIGHTED RISK SCORE (0 - 100)
  // Weights: Debt (25%), Liquidity (20%), Emergency (20%), Cash Flow (20%), Concentration (10%), Goals (5%)
  const overallScore = Math.round(
    debtScore * 0.25 +
    liquidityScore * 0.20 +
    emergencyScore * 0.20 +
    cashFlowScore * 0.20 +
    concentrationScore * 0.10 +
    goalScore * 0.05
  );

  let overallLevel = 'Low Risk';
  let overallSummary = '';

  if (overallScore < 30) {
    overallLevel = 'Low Risk';
    overallSummary = 'Your financial status exhibits high resilience with low exposure to solvency or liquidity shocks.';
  } else if (overallScore < 60) {
    overallLevel = 'Moderate Risk';
    overallSummary = 'Your finances are stable overall, but targeted improvements in cash flow or emergency reserves are recommended.';
  } else if (overallScore < 80) {
    overallLevel = 'High Risk';
    overallSummary = 'Elevated financial vulnerability detected. Take corrective actions on debt and emergency reserves promptly.';
  } else {
    overallLevel = 'Critical Risk';
    overallSummary = 'Critical risk level. Immediate budget intervention, debt relief, or reserve allocation required.';
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
      debtRisk: {
        score: debtScore,
        level: debtLevel,
        metric: `DTI: ${dtiRatio.toFixed(1)}%`,
        weight: '25%',
        explanation: debtExplanation,
        action: debtAction,
        impact: debtScore * 0.25
      },
      liquidityRisk: {
        score: liquidityScore,
        level: liquidityLevel,
        metric: `Savings: ${liquidCoverageMonths.toFixed(1)} mos`,
        weight: '20%',
        explanation: liquidityExplanation,
        action: liquidityAction,
        impact: liquidityScore * 0.20
      },
      emergencyFundRisk: {
        score: emergencyScore,
        level: emergencyLevel,
        metric: `Emergency Reserve: ${emergencyCoverageMonths.toFixed(1)} mos`,
        weight: '20%',
        explanation: emergencyExplanation,
        action: emergencyAction,
        impact: emergencyScore * 0.20
      },
      cashFlowRisk: {
        score: cashFlowScore,
        level: cashFlowLevel,
        metric: `Savings Rate: ${savingsRate.toFixed(1)}%`,
        weight: '20%',
        explanation: cashFlowExplanation,
        action: cashFlowAction,
        impact: cashFlowScore * 0.20
      },
      investmentConcentrationRisk: {
        score: concentrationScore,
        level: concentrationLevel,
        metric: `Largest Holding: ${largestHoldingPct.toFixed(1)}%`,
        weight: '10%',
        explanation: concentrationExplanation,
        action: concentrationAction,
        impact: concentrationScore * 0.10
      },
      goalRisk: {
        score: goalScore,
        level: goalLevel,
        metric: `Goals Configured: ${goals.length}`,
        weight: '5%',
        explanation: goalExplanation,
        action: goalAction,
        impact: goalScore * 0.05
      }
    }
  };
}

module.exports = { calculatePersonalRisk };
