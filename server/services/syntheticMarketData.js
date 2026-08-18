/**
 * RiskGuard - Synthetic Market Data Generator
 * Generates realistic synthetic historical price series & return vectors locally.
 * Note: Clearly labeled as synthetic data for educational quantitative risk analysis.
 */

// Asset class annual mean returns and annual volatilities (standard deviations)
const ASSET_PARAMETERS = {
  'Stocks': { meanReturn: 0.10, volatility: 0.18, beta: 1.0 },
  'Bonds': { meanReturn: 0.04, volatility: 0.06, beta: 0.2 },
  'Crypto': { meanReturn: 0.25, volatility: 0.65, beta: 1.8 },
  'Mutual Funds': { meanReturn: 0.08, volatility: 0.14, beta: 0.85 },
  'Fixed Deposits': { meanReturn: 0.06, volatility: 0.01, beta: 0.05 },
  'Gold': { meanReturn: 0.07, volatility: 0.15, beta: 0.1 },
  'Real Estate': { meanReturn: 0.08, volatility: 0.10, beta: 0.4 },
  'Cash': { meanReturn: 0.02, volatility: 0.005, beta: 0.0 },
  'Other': { meanReturn: 0.07, volatility: 0.15, beta: 0.7 }
};

// Benchmark (e.g. S&P 500 equivalent synthetic index)
const BENCHMARK_PARAMS = { meanReturn: 0.09, volatility: 0.16 };

/**
 * Box-Muller transform for standard normal random variables
 */
function randomNormal(mean = 0, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Generates 252 daily returns for a given portfolio or asset list
 */
function generateSyntheticReturns(investments = [], days = 252) {
  const dailyBenchmark = [];
  const dailyReturns = [];

  // Generate benchmark daily returns
  const bmDailyMean = BENCHMARK_PARAMS.meanReturn / 252;
  const bmDailyVol = BENCHMARK_PARAMS.volatility / Math.sqrt(252);
  for (let d = 0; d < days; d++) {
    dailyBenchmark.push(randomNormal(bmDailyMean, bmDailyVol));
  }

  if (!investments || investments.length === 0) {
    // Return standard default returns if portfolio is empty
    const defaultDailyMean = 0.08 / 252;
    const defaultDailyVol = 0.15 / Math.sqrt(252);
    for (let d = 0; d < days; d++) {
      dailyReturns.push(randomNormal(defaultDailyMean, defaultDailyVol));
    }
    return { dailyReturns, dailyBenchmark, totalValue: 0 };
  }

  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.amount_value || (inv.quantity * inv.current_price) || 0), 0);

  // Compute portfolio weighted daily returns
  for (let d = 0; d < days; d++) {
    let dayPortfolioReturn = 0;
    const bmRet = dailyBenchmark[d];

    investments.forEach(inv => {
      const val = Number(inv.amount_value || (inv.quantity * inv.current_price) || 0);
      const weight = totalValue > 0 ? val / totalValue : 1 / investments.length;
      const assetType = inv.asset_type || 'Stocks';
      const params = ASSET_PARAMETERS[assetType] || ASSET_PARAMETERS['Other'];

      const dailyMean = params.meanReturn / 252;
      const dailyVol = params.volatility / Math.sqrt(252);
      
      // Systematic component linked to benchmark + idiosyncratic component
      const idiosyncratic = randomNormal(0, dailyVol * 0.7);
      const assetReturn = params.beta * bmRet + (dailyMean - params.beta * bmDailyMean) + idiosyncratic;
      
      dayPortfolioReturn += weight * assetReturn;
    });

    dailyReturns.push(dayPortfolioReturn);
  }

  return {
    dailyReturns,
    dailyBenchmark,
    totalValue,
    disclaimer: 'Synthetic market data for demonstration and educational quantitative risk analysis.'
  };
}

module.exports = { generateSyntheticReturns, ASSET_PARAMETERS, randomNormal };
