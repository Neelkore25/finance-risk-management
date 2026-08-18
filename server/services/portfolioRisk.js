/**
 * RiskGuard - Quantitative Portfolio Risk Engine
 * Calculates VaR (Historical & Parametric), CVaR, Sharpe Ratio, Beta, Volatility, Max Drawdown & Risk Heatmap.
 * All formulas are fully documented and derived from portfolio/synthetic return data.
 */

const { generateSyntheticReturns } = require('./syntheticMarketData');

function calculatePortfolioRisk(investments = [], options = {}) {
  const confidenceLevel = options.confidenceLevel || 0.95; // 0.95 or 0.99
  const riskFreeRate = options.riskFreeRate || 0.04; // 4.0% annual default

  const { dailyReturns, dailyBenchmark, totalValue } = generateSyntheticReturns(investments, 252);
  const n = dailyReturns.length;

  // 1. Portfolio Daily Mean & Standard Deviation (Volatility)
  const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / n;
  const varianceDaily = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDailyReturn, 2), 0) / (n - 1);
  const stdDevDaily = Math.sqrt(varianceDaily);

  // Annualized Metrics
  const annualizedReturn = meanDailyReturn * 252;
  const annualizedVol = stdDevDaily * Math.sqrt(252);

  // 2. Benchmark Daily Mean & Variance
  const meanBmReturn = dailyBenchmark.reduce((sum, r) => sum + r, 0) / n;
  const varianceBmDaily = dailyBenchmark.reduce((sum, r) => sum + Math.pow(r - meanBmReturn, 2), 0) / (n - 1);

  // 3. Covariance & Beta Calculation
  // Beta = Covariance(Portfolio Returns, Benchmark Returns) / Variance(Benchmark Returns)
  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (dailyReturns[i] - meanDailyReturn) * (dailyBenchmark[i] - meanBmReturn);
  }
  covariance /= (n - 1);
  const beta = varianceBmDaily > 0 ? covariance / varianceBmDaily : 1.0;

  // 4. Sharpe Ratio
  // Formula: (Annualized Return - Risk Free Rate) / Annualized Volatility
  const sharpeRatio = annualizedVol > 0 ? (annualizedReturn - riskFreeRate) / annualizedVol : 0;

  // 5. Maximum Drawdown Calculation
  // Calculates largest peak-to-trough portfolio decline from cumulative wealth index
  let peak = 1.0;
  let currentWealth = 1.0;
  let maxDrawdown = 0;

  dailyReturns.forEach(r => {
    currentWealth *= (1 + r);
    if (currentWealth > peak) {
      peak = currentWealth;
    }
    const drawdown = (peak - currentWealth) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // 6. Historical VaR & CVaR (Expected Shortfall)
  // Sort daily returns in ascending order (worst losses first)
  const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * n);
  const historicalVaRPercentile = sortedReturns[cutoffIndex];

  // Historical 1-day VaR
  const historicalVaR1Day = -historicalVaRPercentile * totalValue;
  const historicalVaR1DayPct = -historicalVaRPercentile * 100;

  // Historical 10-day VaR (scaled by sqrt(10))
  const historicalVaR10Day = historicalVaR1Day * Math.sqrt(10);

  // CVaR / Expected Shortfall: Average of returns worse than the VaR cutoff
  const tailLosses = sortedReturns.slice(0, cutoffIndex + 1);
  const cvarMeanReturn = tailLosses.length > 0 ? tailLosses.reduce((sum, r) => sum + r, 0) / tailLosses.length : historicalVaRPercentile;
  const cvar1Day = -cvarMeanReturn * totalValue;
  const cvar1DayPct = -cvarMeanReturn * 100;

  // 7. Parametric VaR
  // Formula: (Mean - z_alpha * StdDev) * TotalValue
  // z-score for 95% = 1.6449, 99% = 2.3263
  const zScore = confidenceLevel === 0.99 ? 2.3263 : 1.6449;
  const parametricVaR1DayPct = -(meanDailyReturn - zScore * stdDevDaily) * 100;
  const parametricVaR1Day = (parametricVaR1DayPct / 100) * totalValue;

  // 8. Risk Heatmap Generation (by Asset Class & Sector)
  const assetClassHeatmap = {};
  const sectorHeatmap = {};

  if (investments.length > 0 && totalValue > 0) {
    investments.forEach(inv => {
      const val = Number(inv.amount_value || (inv.quantity * inv.current_price) || 0);
      const pct = (val / totalValue) * 100;

      // Asset Class grouping
      const aType = inv.asset_type || 'Other';
      if (!assetClassHeatmap[aType]) {
        assetClassHeatmap[aType] = { exposure: 0, percentage: 0, count: 0 };
      }
      assetClassHeatmap[aType].exposure += val;
      assetClassHeatmap[aType].percentage += pct;
      assetClassHeatmap[aType].count += 1;

      // Sector grouping
      const sector = inv.sector || 'Uncategorized';
      if (!sectorHeatmap[sector]) {
        sectorHeatmap[sector] = { exposure: 0, percentage: 0, count: 0 };
      }
      sectorHeatmap[sector].exposure += val;
      sectorHeatmap[sector].percentage += pct;
      sectorHeatmap[sector].count += 1;
    });
  }

  const formatHeatmap = (map) => {
    return Object.entries(map).map(([name, data]) => {
      let riskLevel = 'Low Concentration';
      let riskColor = 'green';
      if (data.percentage > 40) {
        riskLevel = 'High Concentration';
        riskColor = 'red';
      } else if (data.percentage > 20) {
        riskLevel = 'Moderate Concentration';
        riskColor = 'yellow';
      }
      return {
        name,
        exposure: Math.round(data.exposure),
        percentage: Number(data.percentage.toFixed(1)),
        count: data.count,
        riskLevel,
        riskColor
      };
    }).sort((a, b) => b.percentage - a.percentage);
  };

  return {
    totalValue,
    confidenceLevel: confidenceLevel * 100,
    metrics: {
      annualizedReturn: Number((annualizedReturn * 100).toFixed(2)),
      annualizedVol: Number((annualizedVol * 100).toFixed(2)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      beta: Number(beta.toFixed(2)),
      maxDrawdownPct: Number((maxDrawdown * 100).toFixed(2)),
      maxDrawdownAmount: Math.round(maxDrawdown * totalValue),
      
      // VaR & CVaR
      historicalVaR1DayPct: Number(historicalVaR1DayPct.toFixed(2)),
      historicalVaR1DayAmount: Math.round(Math.max(0, historicalVaR1Day)),
      historicalVaR10DayAmount: Math.round(Math.max(0, historicalVaR10Day)),
      
      parametricVaR1DayPct: Number(parametricVaR1DayPct.toFixed(2)),
      parametricVaR1DayAmount: Math.round(Math.max(0, parametricVaR1Day)),
      
      cvar1DayPct: Number(cvar1DayPct.toFixed(2)),
      cvar1DayAmount: Math.round(Math.max(0, cvar11Day = cvar1Day))
    },
    heatmap: {
      byAssetClass: formatHeatmap(assetClassHeatmap),
      bySector: formatHeatmap(sectorHeatmap)
    },
    disclaimer: 'Synthetic market data used for quantitative risk estimation.'
  };
}

module.exports = { calculatePortfolioRisk };
