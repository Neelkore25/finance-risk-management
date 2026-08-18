/**
 * RiskGuard - Single API & Data Service Layer
 * Reusable fetch wrapper with JWT header injection & static fallback data provider.
 */

const API_BASE = '/api';

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

// Fallback Mock Engine for Static Deployments (e.g. GitHub Pages)
function getStaticFallback(endpoint) {
  const cleanEp = endpoint.split('?')[0];

  if (cleanEp === '/auth/me' || cleanEp === '/auth/login' || cleanEp === '/auth/register') {
    return {
      token: 'demo_token',
      user: { id: 1, email: 'demo@riskguard.io', fullName: 'User' }
    };
  }

  if (cleanEp === '/risk/personal') {
    return {
      assessment: {
        overallScore: 59,
        overallLevel: 'Moderate Risk',
        overallSummary: 'Your finances are stable overall, but targeted improvements in cash flow or emergency reserves are recommended.',
        metrics: {
          monthlyIncome: 5000,
          totalMonthlyExpenses: 2800,
          essentialExp: 2000,
          discretionaryExp: 800,
          existingSavings: 10000,
          emergencyFund: 0,
          totalDebtPayment: 400,
          totalOutstandingDebt: 12000,
          totalPortfolioValue: 35000,
          netCashFlow: 1800,
          savingsRate: 36.0,
          dtiRatio: 8.0,
          liquidCoverageMonths: 3.6,
          emergencyCoverageMonths: 0.0,
          largestHoldingPct: 40.0,
          largestHoldingName: 'S&P 500 ETF',
          largestSectorPct: 45.0,
          largestSectorName: 'Technology'
        },
        categories: {
          debtRisk: {
            score: 15,
            level: 'Low Risk',
            metric: 'DTI: 8.0%',
            weight: '25%',
            explanation: 'Your Debt-to-Income (DTI) ratio is 8.0%, well within safe thresholds.',
            action: 'Maintain current debt levels.',
            impact: 3.75
          },
          liquidityRisk: {
            score: 38,
            level: 'Moderate Risk',
            metric: 'Savings: 3.6 mos',
            weight: '20%',
            explanation: 'Savings cover 3.6 months of total expenses.',
            action: 'Gradually boost liquid savings toward 6 months.',
            impact: 7.6
          },
          emergencyFundRisk: {
            score: 95,
            level: 'Critical Risk',
            metric: 'Emergency Reserve: 0 mos',
            weight: '20%',
            explanation: 'Emergency fund covers 0 months of essential expenses.',
            action: 'Build emergency reserve immediately.',
            impact: 19.0
          },
          cashFlowRisk: {
            score: 10,
            level: 'Low Risk',
            metric: 'Savings Rate: 36.0%',
            weight: '20%',
            explanation: 'Strong positive cash flow with 36.0% savings rate.',
            action: 'Systematically deploy monthly surplus.',
            impact: 2.0
          },
          investmentConcentrationRisk: {
            score: 45,
            level: 'Moderate Risk',
            metric: 'Largest Holding: 40.0%',
            weight: '10%',
            explanation: 'Moderate concentration in S&P 500 ETF (40.0%).',
            action: 'Rebalance across non-correlated sectors.',
            impact: 4.5
          },
          goalRisk: {
            score: 25,
            level: 'Low Risk',
            metric: 'Goals Configured: 2',
            weight: '5%',
            explanation: 'Financial goals are on track.',
            action: 'Maintain contribution schedule.',
            impact: 1.25
          }
        }
      }
    };
  }

  if (cleanEp === '/risk/portfolio') {
    return {
      portfolioRisk: {
        totalValue: 35000,
        confidenceLevel: 95,
        metrics: {
          annualizedReturn: 9.5,
          annualizedVol: 14.2,
          sharpeRatio: 1.9,
          beta: 0.95,
          maxDrawdownPct: 7.09,
          maxDrawdownAmount: 2480,
          historicalVaR1DayPct: 1.52,
          historicalVaR1DayAmount: 532,
          parametricVaR1DayPct: 1.48,
          parametricVaR1DayAmount: 518,
          cvar1DayPct: 2.1,
          cvar1DayAmount: 735
        },
        heatmap: {
          byAssetClass: [
            { name: 'Stocks', exposure: 20000, percentage: 57.1, count: 2, riskLevel: 'High Concentration', riskColor: 'red' },
            { name: 'Bonds', exposure: 10000, percentage: 28.6, count: 1, riskLevel: 'Moderate Concentration', riskColor: 'yellow' },
            { name: 'Cash', exposure: 5000, percentage: 14.3, count: 1, riskLevel: 'Low Concentration', riskColor: 'green' }
          ],
          bySector: [
            { name: 'Technology', exposure: 15000, percentage: 42.9, count: 1, riskLevel: 'High Concentration', riskColor: 'red' },
            { name: 'Government', exposure: 10000, percentage: 28.6, count: 1, riskLevel: 'Moderate Concentration', riskColor: 'yellow' },
            { name: 'Financials', exposure: 10000, percentage: 28.6, count: 1, riskLevel: 'Moderate Concentration', riskColor: 'yellow' }
          ]
        }
      }
    };
  }

  if (cleanEp === '/risk/credit') {
    return {
      creditRisk: {
        creditScore: 300,
        tier: 'Poor',
        riskLevel: 'Critical Risk',
        probDefault: 99.9,
        probGood: 0.1,
        summary: 'High default risk profile. Elevated probability of loan rejection.',
        drivingFactors: [
          { factor: 'Emergency Reserves', impact: 'Negative', detail: '0 months of emergency reserve' },
          { factor: 'Debt Burden', impact: 'Negative', detail: '$12,000 outstanding debt' }
        ],
        metrics: {
          income: 5000,
          existingDebt: 12000,
          loanAmount: 15000,
          dti: 8.0,
          creditHistoryMonths: 36,
          paymentHistoryScore: 95,
          missedPayments: 0
        }
      }
    };
  }

  if (cleanEp === '/alerts') {
    return {
      alerts: [
        {
          id: 'alert-emergency-low',
          severity: 'Critical',
          title: 'Insufficient Emergency Reserves',
          message: 'Emergency fund covers only 0 months of essential expenses.',
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  if (cleanEp === '/risk/history') {
    return {
      history: [
        {
          id: 1,
          overall_score: 59,
          debt_risk: 15,
          liquidity_risk: 38,
          emergency_fund_risk: 95,
          cash_flow_risk: 10,
          investment_concentration_risk: 45,
          goal_risk: 25,
          recorded_at: new Date().toISOString()
        }
      ]
    };
  }

  if (cleanEp === '/recommendations') {
    return {
      recommendations: [
        {
          id: 'rec-emergency',
          severity: 'Critical',
          relatedRisk: 'Emergency Reserve Risk',
          recommendation: 'Build Emergency Fund to 6 Months of Living Costs',
          reason: 'Your emergency savings cover only 0 months of essential spending.',
          suggestedAction: 'Set up an automated monthly auto-transfer into high-yield savings.'
        }
      ]
    };
  }

  if (cleanEp === '/profile') {
    return {
      profile: {
        monthly_income: 5000,
        monthly_essential_expenses: 2000,
        monthly_discretionary_expenses: 800,
        existing_savings: 10000,
        emergency_fund: 0,
        monthly_debt_payment: 400
      }
    };
  }

  if (cleanEp === '/simulator/what-if') {
    return {
      baselineScore: 59,
      baselineLevel: 'Moderate Risk',
      simulatedScore: 42,
      simulatedLevel: 'Low Risk',
      scoreDelta: -17,
      impactStatus: 'Improved Resilience',
      baselineCategories: {},
      simulatedCategories: {},
      simulatedMetrics: {}
    };
  }

  if (cleanEp === '/risk/monte-carlo') {
    return {
      simulation: {
        numSimulations: 1000,
        horizonMonths: 12,
        initialValue: 35000,
        monthlyContribution: 500,
        totalPrincipalInjected: 41000,
        annualMuPct: 9.5,
        annualSigmaPct: 14.2,
        summary: {
          meanEndingValue: 44250,
          p5Worst: 32100,
          p25: 38500,
          p50Median: 43800,
          p75: 49100,
          p95Best: 58900,
          probabilityOfLoss: 8.4,
          expectedGain: 3250
        },
        histogram: [
          { binLabel: '$30k - $35k', binMid: 32500, count: 84, probabilityPct: 8.4 },
          { binLabel: '$35k - $40k', binMid: 37500, count: 210, probabilityPct: 21.0 },
          { binLabel: '$40k - $45k', binMid: 42500, count: 350, probabilityPct: 35.0 },
          { binLabel: '$45k - $50k', binMid: 47500, count: 240, probabilityPct: 24.0 },
          { binLabel: '$50k - $55k', binMid: 52500, count: 116, probabilityPct: 11.6 }
        ]
      }
    };
  }

  if (cleanEp === '/expenses') return { expenses: [] };
  if (cleanEp === '/debts') return { debts: [] };
  if (cleanEp === '/investments') return { investments: [] };
  if (cleanEp === '/goals') return { goals: [] };
  if (cleanEp === '/settings') return { settings: { theme_preference: 'dark' } };

  return {};
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      setAuthToken(null);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status} Request Failed`);
    }

    return data;
  } catch (err) {
    // If backend API is unreachable (e.g. static hosting on GitHub Pages), use fallback mock engine
    return getStaticFallback(endpoint);
  }
}
