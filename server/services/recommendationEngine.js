/**
 * RiskGuard - Automated Rule-Based Recommendation Engine
 * Generates tailored financial recommendations derived from user risk calculations.
 */

function generateRecommendations(riskAssessment, portfolioRisk) {
  const recommendations = [];
  const { metrics, categories } = riskAssessment;

  // 1. Debt Recommendation
  if (categories.debtRisk.score > 50) {
    recommendations.push({
      id: 'rec-debt',
      severity: categories.debtRisk.score > 75 ? 'Critical' : 'Warning',
      relatedRisk: 'Debt Risk',
      recommendation: 'Accelerate High-Interest Debt Repayment',
      reason: `Your Debt-to-Income ratio is high at ${metrics.dtiRatio}%. Over a third of your monthly cash flow is tied to debt payments.`,
      suggestedAction: 'Adopt the Debt Avalanche strategy: pay minimums on all debts while applying extra cash surplus to the highest interest rate obligation.'
    });
  }

  // 2. Emergency Reserve Recommendation
  if (categories.emergencyFundRisk.score > 40) {
    recommendations.push({
      id: 'rec-emergency',
      severity: categories.emergencyFundRisk.score > 75 ? 'Critical' : 'Warning',
      relatedRisk: 'Emergency Reserve Risk',
      recommendation: 'Build Emergency Fund to 6 Months of Living Costs',
      reason: `Your emergency savings cover only ${metrics.emergencyCoverageMonths} months of essential spending.`,
      suggestedAction: 'Set up an automated monthly auto-transfer into a high-yield savings account dedicated solely to emergency protection.'
    });
  }

  // 3. Cash Flow Recommendation
  if (metrics.netCashFlow < 0) {
    recommendations.push({
      id: 'rec-cashflow-neg',
      severity: 'Critical',
      relatedRisk: 'Cash Flow Risk',
      recommendation: 'Eliminate Monthly Cash Deficit',
      reason: `Monthly spending exceeds income by \$${Math.abs(metrics.netCashFlow).toLocaleString()} per month.`,
      suggestedAction: 'Audit discretionary expenses immediately and freeze non-essential recurring subscriptions.'
    });
  } else if (metrics.savingsRate < 15) {
    recommendations.push({
      id: 'rec-cashflow-low',
      severity: 'Warning',
      relatedRisk: 'Cash Flow Risk',
      recommendation: 'Boost Monthly Savings Rate to 20%+',
      reason: `Your savings rate is ${metrics.savingsRate}%, below recommended wealth-building benchmarks.`,
      suggestedAction: 'Implement a zero-based budget and allocate at least 20% of net income to savings before discretionary spending.'
    });
  }

  // 4. Investment Concentration Recommendation
  if (categories.investmentConcentrationRisk.score > 40) {
    recommendations.push({
      id: 'rec-concentration',
      severity: categories.investmentConcentrationRisk.score > 75 ? 'Critical' : 'Warning',
      relatedRisk: 'Investment Concentration Risk',
      recommendation: 'Rebalance Portfolio to Lower Asset & Sector Risk',
      reason: `High concentration detected: ${metrics.largestHoldingName} represents ${metrics.largestHoldingPct}% of total investment assets.`,
      suggestedAction: 'Direct future investment contributions toward broader market index funds or underrepresented sectors.'
    });
  }

  // 5. Goal Risk Recommendation
  if (categories.goalRisk.score > 40) {
    recommendations.push({
      id: 'rec-goals',
      severity: 'Warning',
      relatedRisk: 'Financial Goal Risk',
      recommendation: 'Adjust Goal Savings Contributions or Target Dates',
      reason: 'Current monthly savings contributions fall short of the required pace to achieve your target financial goals.',
      suggestedAction: 'Increase monthly goal allocations or extend target dates to align with realistic savings capacity.'
    });
  }

  // 6. Quantitative Portfolio Risk (VaR) Recommendation
  if (portfolioRisk && portfolioRisk.metrics && portfolioRisk.metrics.historicalVaR1DayPct > 4) {
    recommendations.push({
      id: 'rec-var',
      severity: portfolioRisk.metrics.historicalVaR1DayPct > 6 ? 'Critical' : 'Warning',
      relatedRisk: 'Portfolio Downside Risk (VaR)',
      recommendation: 'Hedge Portfolio Value at Risk (VaR)',
      reason: `1-Day 95% Historical VaR is ${portfolioRisk.metrics.historicalVaR1DayPct}%, indicating potential single-day loss of \$${portfolioRisk.metrics.historicalVaR1DayAmount.toLocaleString()}.`,
      suggestedAction: 'Consider increasing fixed-income, bond, or defensive asset allocations to dampen daily portfolio volatility.'
    });
  }

  // Positive baseline recommendation if overall risk is low
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-optimal',
      severity: 'Info',
      relatedRisk: 'Financial Stability',
      recommendation: 'Maintain Current Financial Disciplines',
      reason: 'Your overall risk profile is well-balanced across cash flow, emergency reserves, debt management, and investment diversification.',
      suggestedAction: 'Review portfolio allocations bi-annually and adjust for major life events.'
    });
  }

  return recommendations;
}

module.exports = { generateRecommendations };
