/**
 * RiskGuard - Calculation-Driven Alert Engine
 * Generates dynamic threshold alerts derived from active user financial and portfolio data.
 */

function generateAlerts(riskAssessment, portfolioRisk) {
  const alerts = [];
  const { metrics, categories } = riskAssessment;

  // 1. Negative Cash Flow Alert
  if (metrics.netCashFlow < 0) {
    alerts.push({
      id: 'alert-cashflow-neg',
      severity: 'Critical',
      title: 'Negative Monthly Cash Flow',
      message: `Your monthly expenses exceed income by \$${Math.abs(metrics.netCashFlow).toLocaleString()}.`,
      timestamp: new Date().toISOString()
    });
  }

  // 2. High DTI Alert
  if (metrics.dtiRatio > 36) {
    alerts.push({
      id: 'alert-dti-high',
      severity: metrics.dtiRatio > 50 ? 'Critical' : 'Warning',
      title: 'Elevated Debt Burden',
      message: `Debt-to-Income ratio reached ${metrics.dtiRatio}%, exceeding safe borrowing bounds (36%).`,
      timestamp: new Date().toISOString()
    });
  }

  // 3. Emergency Reserve Low Alert
  if (metrics.emergencyCoverageMonths < 3) {
    alerts.push({
      id: 'alert-emergency-low',
      severity: metrics.emergencyCoverageMonths < 1 ? 'Critical' : 'Warning',
      title: 'Insufficient Emergency Reserves',
      message: `Emergency fund covers only ${metrics.emergencyCoverageMonths} months of essential expenses.`,
      timestamp: new Date().toISOString()
    });
  }

  // 4. Portfolio VaR Exceeded Alert
  if (portfolioRisk && portfolioRisk.metrics && portfolioRisk.metrics.historicalVaR1DayPct > 4) {
    alerts.push({
      id: 'alert-var-high',
      severity: 'Warning',
      title: 'High Portfolio Downside Risk (VaR)',
      message: `1-Day 95% Historical VaR is ${portfolioRisk.metrics.historicalVaR1DayPct}%, exceeding the 4.0% risk tolerance threshold.`,
      timestamp: new Date().toISOString()
    });
  }

  // 5. Maximum Drawdown Warning Alert
  if (portfolioRisk && portfolioRisk.metrics && portfolioRisk.metrics.maxDrawdownPct > 15) {
    alerts.push({
      id: 'alert-drawdown',
      severity: 'Warning',
      title: 'Elevated Historical Drawdown',
      message: `Max drawdown reached ${portfolioRisk.metrics.maxDrawdownPct}% in synthetic market stress test.`,
      timestamp: new Date().toISOString()
    });
  }

  // 6. High Investment Concentration Alert
  if (metrics.largestHoldingPct > 30) {
    alerts.push({
      id: 'alert-concentration',
      severity: 'Warning',
      title: 'Asset Concentration Alert',
      message: `${metrics.largestHoldingName} represents ${metrics.largestHoldingPct}% of total investment assets.`,
      timestamp: new Date().toISOString()
    });
  }

  // Baseline Info alert if no critical issues exist
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-nominal',
      severity: 'Info',
      title: 'Financial Parameters Nominal',
      message: 'All risk metrics, liquidity levels, and debt ratios are currently within healthy thresholds.',
      timestamp: new Date().toISOString()
    });
  }

  return {
    alerts,
    disclaimer: 'Real-time-style risk alerts based on current application calculations.'
  };
}

module.exports = { generateAlerts };
