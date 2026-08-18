"""
================================================================================
RISKGUARD — PYTHON FINANCIAL RISK & QUANTITATIVE DATA ANALYTICS SUITE
================================================================================
Uses NumPy, Pandas, SciPy, Scikit-Learn, and Matplotlib/Seaborn for advanced
financial risk analysis, Value at Risk (VaR), CVaR, Monte Carlo simulations,
credit risk Machine Learning scoring, and portfolio optimization.
"""

import os
import json
import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


class FinancialRiskAnalytics:
    """
    Python Risk Analytics Engine providing quantitative financial modeling.
    """

    def __init__(self, risk_free_rate=0.04):
        self.risk_free_rate = risk_free_rate

    def analyze_portfolio(self, holdings_df):
        """
        Calculates portfolio metrics, asset weights, covariance matrix, and diversification index using pandas & numpy.
        """
        if holdings_df.empty:
            return {"status": "empty", "total_value": 0}

        # Calculate total portfolio value
        holdings_df['market_value'] = holdings_df['quantity'] * holdings_df['current_price']
        total_val = holdings_df['market_value'].sum()
        holdings_df['weight'] = holdings_df['market_value'] / total_val if total_val > 0 else 0

        # Group asset allocations by asset type and sector using Pandas
        asset_allocation = holdings_df.groupby('asset_type')['market_value'].sum().to_dict()
        sector_allocation = holdings_df.groupby('sector')['market_value'].sum().to_dict()

        # Concentration metrics (Herfindahl-Hirschman Index)
        weights = holdings_df['weight'].values
        hhi_index = float(np.sum(weights ** 2))
        largest_holding_pct = float(np.max(weights) * 100) if len(weights) > 0 else 0

        return {
            "total_value": float(total_val),
            "asset_count": int(len(holdings_df)),
            "hhi_index": round(hhi_index, 4),
            "largest_holding_pct": round(largest_holding_pct, 2),
            "asset_allocation": {k: round(float(v), 2) for k, v in asset_allocation.items()},
            "sector_allocation": {k: round(float(v), 2) for k, v in sector_allocation.items()}
        }

    def compute_value_at_risk(self, daily_returns_array, portfolio_value, confidence_level=0.95):
        """
        Computes Historical VaR, Parametric Gaussian VaR, and Conditional VaR (CVaR / Expected Shortfall)
        using NumPy arrays and SciPy statistical distributions.
        """
        returns = np.array(daily_returns_array)
        n = len(returns)
        if n == 0 or portfolio_value <= 0:
            return {}

        # 1. Historical VaR
        percentile_idx = (1.0 - confidence_level) * 100
        hist_var_pct = -float(np.percentile(returns, percentile_idx))
        hist_var_amount = hist_var_pct * portfolio_value

        # 2. Parametric Gaussian VaR (using NumPy & SciPy norm)
        mean_return = np.mean(returns)
        std_return = np.std(returns, ddof=1)
        z_score = norm.ppf(confidence_level)
        para_var_pct = -(mean_return - z_score * std_return)
        para_var_amount = para_var_pct * portfolio_value

        # 3. Conditional VaR (CVaR / Expected Shortfall)
        cutoff_return = -hist_var_pct
        tail_losses = returns[returns <= cutoff_return]
        cvar_pct = -float(np.mean(tail_losses)) if len(tail_losses) > 0 else hist_var_pct
        cvar_amount = cvar_pct * portfolio_value

        # 4. Sharpe Ratio & Volatility
        ann_return = mean_return * 252
        ann_vol = std_return * np.sqrt(252)
        sharpe_ratio = (ann_return - self.risk_free_rate) / ann_vol if ann_vol > 0 else 0

        return {
            "confidence_level": confidence_level * 100,
            "historical_var_amount": round(float(hist_var_amount), 2),
            "historical_var_pct": round(float(hist_var_pct * 100), 2),
            "parametric_var_amount": round(float(para_var_amount), 2),
            "parametric_var_pct": round(float(para_var_pct * 100), 2),
            "cvar_expected_shortfall_amount": round(float(cvar_amount), 2),
            "cvar_pct": round(float(cvar_pct * 100), 2),
            "annualized_return_pct": round(float(ann_return * 100), 2),
            "annualized_volatility_pct": round(float(ann_vol * 100), 2),
            "sharpe_ratio": round(float(sharpe_ratio), 2)
        }

    def run_vectorized_monte_carlo(self, initial_value, annual_mu, annual_sigma, num_sims=10000, horizon_days=252):
        """
        High-performance vectorized Monte Carlo simulation using NumPy random distributions.
        Simulates 10,000 future portfolio growth paths via Geometric Brownian Motion (GBM).
        """
        dt = 1.0 / 252.0
        drift = (annual_mu - 0.5 * annual_sigma ** 2) * dt
        shock_vol = annual_sigma * np.sqrt(dt)

        # Generate 10,000 x 252 standard normal random shocks using NumPy
        random_shocks = np.random.normal(0, 1, size=(num_sims, horizon_days))
        daily_log_returns = drift + shock_vol * random_shocks
        
        # Cumulative returns product across 252 days
        cum_returns = np.exp(np.cumsum(daily_log_returns, axis=1))
        ending_values = initial_value * cum_returns[:, -1]

        # Calculate percentiles using NumPy
        p5_worst = float(np.percentile(ending_values, 5))
        p50_median = float(np.percentile(ending_values, 50))
        p95_best = float(np.percentile(ending_values, 95))
        mean_value = float(np.mean(ending_values))
        prob_loss = float(np.mean(ending_values < initial_value) * 100)

        return {
            "num_simulations": num_sims,
            "horizon_days": horizon_days,
            "initial_value": float(initial_value),
            "expected_mean_value": round(mean_value, 2),
            "p5_worst_scenario": round(p5_worst, 2),
            "p50_median_scenario": round(p50_median, 2),
            "p95_best_scenario": round(p95_best, 2),
            "probability_of_loss_pct": round(prob_loss, 2)
        }

    def train_credit_risk_model(self, training_data_df):
        """
        Trains a Logistic Regression credit scoring classifier using Scikit-Learn.
        Predicts credit default probability based on income, debt, DTI, credit history, and loan amount.
        """
        features = ['income', 'existing_debt', 'dti', 'credit_history_months', 'loan_amount']
        X = training_data_df[features]
        y = training_data_df['default_flag']

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = LogisticRegression(random_state=42)
        model.fit(X_scaled, y)

        return model, scaler


def run_sample_analytics():
    """
    Executes sample Python data analytics pipeline and returns JSON report.
    """
    analytics = FinancialRiskAnalytics()

    # Sample Pandas DataFrame of portfolio holdings
    holdings_data = {
        'asset_name': ['Apple Inc', 'US Treasury Bond', 'S&P 500 ETF', 'Bitcoin', 'Real Estate REIT'],
        'asset_type': ['Stocks', 'Bonds', 'Mutual Funds', 'Crypto', 'Real Estate'],
        'sector': ['Technology', 'Government', 'General', 'Technology', 'Real Estate'],
        'quantity': [50, 10, 100, 0.5, 200],
        'current_price': [180.0, 1000.0, 450.0, 60000.0, 50.0]
    }
    df_holdings = pd.DataFrame(holdings_data)
    portfolio_res = analytics.analyze_portfolio(df_holdings)

    # Generate 252 daily return array with NumPy
    daily_returns = np.random.normal(loc=0.0005, scale=0.012, size=252)
    var_res = analytics.compute_value_at_risk(daily_returns, portfolio_res['total_value'], 0.95)

    # Run Monte Carlo 10,000 path simulation
    mc_res = analytics.run_vectorized_monte_carlo(
        initial_value=portfolio_res['total_value'],
        annual_mu=0.08,
        annual_sigma=0.15,
        num_sims=10000
    )

    report = {
        "platform": "RiskGuard Python Data Analytics Module",
        "numpy_version": np.__version__,
        "pandas_version": pd.__version__,
        "portfolio_analysis": portfolio_res,
        "quantitative_var": var_res,
        "monte_carlo_10k": mc_res
    }

    return report


if __name__ == '__main__':
    report = run_sample_analytics()
    print(json.dumps(report, indent=2))
