/**
 * RiskGuard - Report Generation Service
 * Native CSV generation & structured PDF export data payload generator.
 */

function generateCSVReport(user, riskData, portfolioRisk, creditRisk) {
  const lines = [];
  lines.push(`RISKGUARD FINANCIAL RISK REPORT`);
  lines.push(`User,${user.fullName} (${user.email})`);
  lines.push(`Generated Date,${new Date().toLocaleString()}`);
  lines.push(``);

  lines.push(`OVERALL FINANCIAL RISK ASSESSMENT`);
  lines.push(`Overall Risk Score,${riskData.overallScore} / 100`);
  lines.push(`Overall Risk Level,${riskData.overallLevel}`);
  lines.push(`Summary,${riskData.overallSummary}`);
  lines.push(``);

  lines.push(`RISK CATEGORY BREAKDOWN`);
  lines.push(`Category,Score,Risk Level,Metric,Weight,Explanation`);
  Object.entries(riskData.categories).forEach(([key, cat]) => {
    lines.push(`"${key}",${cat.score},"${cat.level}","${cat.metric}","${cat.weight}","${cat.explanation.replace(/"/g, '""')}"`);
  });
  lines.push(``);

  lines.push(`KEY FINANCIAL METRICS`);
  lines.push(`Monthly Income,${riskData.metrics.monthlyIncome}`);
  lines.push(`Total Monthly Expenses,${riskData.metrics.totalMonthlyExpenses}`);
  lines.push(`Net Monthly Cash Flow,${riskData.metrics.netCashFlow}`);
  lines.push(`Savings Rate,${riskData.metrics.savingsRate}%`);
  lines.push(`Debt-to-Income (DTI),${riskData.metrics.dtiRatio}%`);
  lines.push(`Liquid Coverage (Months),${riskData.metrics.liquidCoverageMonths}`);
  lines.push(`Emergency Fund Coverage (Months),${riskData.metrics.emergencyCoverageMonths}`);
  lines.push(``);

  if (portfolioRisk && portfolioRisk.metrics) {
    lines.push(`QUANTITATIVE PORTFOLIO RISK METRICS`);
    lines.push(`Total Portfolio Value,$${portfolioRisk.totalValue}`);
    lines.push(`Historical VaR (1-Day 95%),$${portfolioRisk.metrics.historicalVaR1DayAmount} (${portfolioRisk.metrics.historicalVaR1DayPct}%)`);
    lines.push(`Parametric VaR (1-Day 95%),$${portfolioRisk.metrics.parametricVaR1DayAmount} (${portfolioRisk.metrics.parametricVaR1DayPct}%)`);
    lines.push(`Expected Shortfall / CVaR,$${portfolioRisk.metrics.cvar1DayAmount} (${portfolioRisk.metrics.cvar1DayPct}%)`);
    lines.push(`Sharpe Ratio,${portfolioRisk.metrics.sharpeRatio}`);
    lines.push(`Portfolio Beta,${portfolioRisk.metrics.beta}`);
    lines.push(`Annual Volatility,${portfolioRisk.metrics.annualizedVol}%`);
    lines.push(`Max Drawdown,${portfolioRisk.metrics.maxDrawdownPct}%`);
    lines.push(``);
  }

  if (creditRisk) {
    lines.push(`CREDIT RISK ANALYSIS`);
    lines.push(`Credit Score,${creditRisk.creditScore}`);
    lines.push(`Risk Tier,${creditRisk.tier}`);
    lines.push(`Probability of Default,${creditRisk.probDefault}%`);
    lines.push(``);
  }

  lines.push(`Disclaimer,"RiskGuard is an educational financial risk-analysis tool and does not provide professional financial advice."`);

  return lines.join('\n');
}

module.exports = { generateCSVReport };
