/**
 * RiskGuard - Calculation-Driven Alert Engine
 * Generates dynamic threshold alerts derived from active user financial and portfolio data,
 * respecting user settings and alert notification toggles.
 */

function generateAlerts(riskAssessment, portfolioRisk, userSettings = {}) {
  const alerts = [];
  const { metrics, categories } = riskAssessment;

  const dtiTarget = Math.max(10, Math.min(80, Number(userSettings.dtiLimit || 36)));
  const emergencyTarget = Math.max(1, Math.min(24, Number(userSettings.emergencyTargetMonths || 6)));

  // 1. Negative Cash Flow Alert (Gated by alertBudgetVariance if set)
  if (userSettings.alertBudgetVariance !== false && metrics.netCashFlow < 0) {
    alerts.push({
      id: 'alert-cashflow-neg',
      severity: 'Critical',
      title: 'Negative Monthly Cash Flow',
      message: `Your monthly expenses exceed income by deficit of \$${Math.abs(metrics.netCashFlow).toLocaleString()}.`,
      timestamp: new Date().toISOString()
    });
  }

  // 2. High DTI Alert (Gated by alertDtiBreach)
  if (userSettings.alertDtiBreach !== false && metrics.dtiRatio > dtiTarget) {
    alerts.push({
      id: 'alert-dti-high',
      severity: metrics.dtiRatio > (dtiTarget * 1.3) ? 'Critical' : 'Warning',
      title: 'Elevated Debt Burden (DTI Breach)',
      message: `Debt-to-Income ratio reached ${metrics.dtiRatio}%, exceeding your target limit (${dtiTarget}%).`,
      timestamp: new Date().toISOString()
    });
  }

  // 3. Emergency Reserve Low Alert (Gated by alertLowReserves)
  if (userSettings.alertLowReserves !== false && metrics.emergencyCoverageMonths < emergencyTarget) {
    alerts.push({
      id: 'alert-emergency-low',
      severity: metrics.emergencyCoverageMonths < (emergencyTarget * 0.5) ? 'Critical' : 'Warning',
      title: 'Insufficient Emergency Reserves',
      message: `Emergency fund covers ${metrics.emergencyCoverageMonths} months of essential expenses vs target of ${emergencyTarget} months.`,
      timestamp: new Date().toISOString()
    });
  }

  // 4. Portfolio VaR Exceeded Alert (Gated by alertVarVolatility)
  if (userSettings.alertVarVolatility !== false && portfolioRisk && portfolioRisk.metrics && portfolioRisk.metrics.historicalVaR1DayPct > 4) {
    alerts.push({
      id: 'alert-var-high',
      severity: 'Warning',
      title: 'High Portfolio Downside Risk (VaR)',
      message: `1-Day 95% Historical VaR is ${portfolioRisk.metrics.historicalVaR1DayPct}%, exceeding the 4.0% risk tolerance threshold.`,
      timestamp: new Date().toISOString()
    });
  }

  // 5. Maximum Drawdown Warning Alert (Gated by alertVarVolatility)
  if (userSettings.alertVarVolatility !== false && portfolioRisk && portfolioRisk.metrics && portfolioRisk.metrics.maxDrawdownPct > 15) {
    alerts.push({
      id: 'alert-drawdown',
      severity: 'Warning',
      title: 'Elevated Historical Drawdown',
      message: `Max drawdown reached ${portfolioRisk.metrics.maxDrawdownPct}% in synthetic market stress test.`,
      timestamp: new Date().toISOString()
    });
  }

  // 6. High Investment Concentration Alert (Gated by alertHighConcentration)
  if (userSettings.alertHighConcentration !== false && metrics.largestHoldingPct > 30) {
    alerts.push({
      id: 'alert-concentration',
      severity: 'Warning',
      title: 'Asset Concentration Alert',
      message: `${metrics.largestHoldingName || 'Single asset'} represents ${metrics.largestHoldingPct}% of total investment assets.`,
      timestamp: new Date().toISOString()
    });
  }

  // Baseline Info alert if no critical issues exist
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-nominal',
      severity: 'Info',
      title: 'Financial Parameters Nominal',
      message: 'All risk metrics, liquidity levels, and debt ratios are currently within your configured targets.',
      timestamp: new Date().toISOString()
    });
  }

  return {
    alerts,
    disclaimer: 'Real-time-style risk alerts based on active calculations and configured user thresholds.'
  };
}

module.exports = { generateAlerts };
