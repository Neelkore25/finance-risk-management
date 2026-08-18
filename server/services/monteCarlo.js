/**
 * RiskGuard - Monte Carlo Portfolio Simulation Engine
 * Runs 1,000+ stochastic portfolio paths using Geometric Brownian Motion (GBM).
 * Fast, resource-optimized implementation.
 */

const { generateSyntheticReturns, randomNormal } = require('./syntheticMarketData');

function runMonteCarloSimulation(investments = [], options = {}) {
  const numSimulations = options.numSimulations || 1000;
  const horizonMonths = options.horizonMonths || 12;
  const initialPortfolioValue = options.initialValue || investments.reduce((sum, inv) => sum + Number(inv.amount_value || 0), 0) || 10000;
  const monthlyContribution = Math.max(0, Number(options.monthlyContribution || 0));

  // Derive annual return & volatility parameters from portfolio
  const { dailyReturns } = generateSyntheticReturns(investments, 252);
  const meanDaily = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const varDaily = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) / (dailyReturns.length - 1);
  
  const annualMu = meanDaily * 252;
  const annualSigma = Math.sqrt(varDaily) * Math.sqrt(252);

  // Convert to monthly drift & volatility parameters for GBM
  const dt = 1 / 12;
  const monthlyDrift = (annualMu - 0.5 * Math.pow(annualSigma, 2)) * dt;
  const monthlyVol = annualSigma * Math.sqrt(dt);

  const endingValues = [];
  const samplePaths = []; // Store up to 10 sample trajectories for visual chart
  const pathSampleCount = Math.min(10, numSimulations);

  for (let s = 0; s < numSimulations; s++) {
    let currentVal = initialPortfolioValue;
    const pathTrajectory = [Math.round(currentVal)];

    for (let m = 1; m <= horizonMonths; m++) {
      // Geometric Brownian Motion step
      const z = randomNormal(0, 1);
      const monthlyReturn = Math.exp(monthlyDrift + monthlyVol * z) - 1;
      
      currentVal = Math.max(0, (currentVal + monthlyContribution) * (1 + monthlyReturn));
      if (s < pathSampleCount) {
        pathTrajectory.push(Math.round(currentVal));
      }
    }

    endingValues.push(currentVal);
    if (s < pathSampleCount) {
      samplePaths.push(pathTrajectory);
    }
  }

  // Sort ending outcomes for distribution percentiles
  endingValues.sort((a, b) => a - b);

  const meanEndingValue = Math.round(endingValues.reduce((sum, v) => sum + v, 0) / numSimulations);
  const p5Worst = Math.round(endingValues[Math.floor(0.05 * numSimulations)]);
  const p25 = Math.round(endingValues[Math.floor(0.25 * numSimulations)]);
  const p50Median = Math.round(endingValues[Math.floor(0.50 * numSimulations)]);
  const p75 = Math.round(endingValues[Math.floor(0.75 * numSimulations)]);
  const p95Best = Math.round(endingValues[Math.floor(0.95 * numSimulations)]);

  // Probability of financial loss (ending value < initial principal)
  const totalPrincipal = initialPortfolioValue + (monthlyContribution * horizonMonths);
  const lossCount = endingValues.filter(val => val < totalPrincipal).length;
  const probabilityOfLoss = Number(((lossCount / numSimulations) * 100).toFixed(1));

  // Build histogram distribution buckets (10 bins)
  const minVal = endingValues[0];
  const maxVal = endingValues[endingValues.length - 1];
  const binWidth = (maxVal - minVal) / 10 || 100;
  const histogram = [];

  for (let i = 0; i < 10; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = endingValues.filter(v => v >= binStart && (i === 9 ? v <= binEnd : v < binEnd)).length;
    histogram.push({
      binLabel: `\$${Math.round(binStart / 1000)}k - \$${Math.round(binEnd / 1000)}k`,
      binMid: Math.round((binStart + binEnd) / 2),
      count,
      probabilityPct: Number(((count / numSimulations) * 100).toFixed(1))
    });
  }

  return {
    numSimulations,
    horizonMonths,
    initialValue: Math.round(initialPortfolioValue),
    monthlyContribution,
    totalPrincipalInjected: Math.round(totalPrincipal),
    annualMuPct: Number((annualMu * 100).toFixed(2)),
    annualSigmaPct: Number((annualSigma * 100).toFixed(2)),
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
    samplePaths,
    disclaimer: 'Stochastic Monte Carlo simulation based on portfolio parameters over 1,000 iterations.'
  };
}

module.exports = { runMonteCarloSimulation };
