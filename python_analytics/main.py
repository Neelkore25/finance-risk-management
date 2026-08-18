"""
================================================================================
FINANCE RISK ANALYTICS — MASTER DATA SCIENCE PIPELINE (Python)
================================================================================
Core Data Science & Financial Risk Analytics Engine using:
- NumPy (Vectorized Matrix Mathematics & Stochastic Simulations)
- Pandas (Financial DataFrames & Portfolio Grouping)
- SciPy (Quantile Normal Distributions & Downside Risk Metrics)
- Scikit-Learn (Machine Learning Credit Default Classifier)
- Matplotlib & Seaborn (Quantitative Risk Charts & Histograms)

Run: python main.py
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from portfolio_analytics import analyze_holdings
from quantitative_var import calculate_quantitative_var
from monte_carlo_engine import run_monte_carlo_simulation
from credit_risk_ml import predict_credit_risk
from personal_risk_engine import compute_personal_risk_score
from risk_reports_generator import generate_risk_visualizations


def run_full_analytics():
    print("=" * 80)
    print("  FINANCE RISK ANALYTICS — PYTHON DATA SCIENCE PIPELINE")
    print("=" * 80)

    # 1. Pandas DataFrame Portfolio Analysis
    print("\n[1/5] Processing Portfolio Holdings with Pandas & NumPy...")
    sample_holdings = [
        {"asset_name": "S&P 500 ETF (VOO)", "asset_type": "Mutual Funds", "sector": "General/Diversified", "quantity": 50, "current_price": 450, "amount_value": 22500},
        {"asset_name": "Apple Inc (AAPL)", "asset_type": "Stocks", "sector": "Technology", "quantity": 40, "current_price": 180, "amount_value": 7200},
        {"asset_name": "US Treasury Note", "asset_type": "Bonds", "sector": "Government/Sovereign", "quantity": 5, "current_price": 1000, "amount_value": 5000}
    ]
    portfolio_res = analyze_holdings(sample_holdings)
    print(f"  • Total Portfolio Value: ${portfolio_res['total_portfolio_value']:,}")
    print(f"  • Asset Concentration (HHI Index): {portfolio_res['hhi_index']}")
    print(f"  • Largest Asset Allocation: {portfolio_res['largest_holding_pct']}%")

    # 2. NumPy & SciPy Quantitative VaR Metrics
    print("\n[2/5] Calculating Value at Risk (VaR), CVaR & Sharpe Ratio with NumPy & SciPy...")
    daily_returns = np.random.normal(loc=0.0005, scale=0.014, size=252).tolist()
    var_res = calculate_quantitative_var(daily_returns, portfolio_res['total_portfolio_value'], confidence_level=0.95)
    print(f"  • 1-Day Historical VaR (95%): ${var_res['historical_var_1day_amount']:,} ({var_res['historical_var_1day_pct']}%)")
    print(f"  • 1-Day Parametric Normal VaR: ${var_res['parametric_var_1day_amount']:,} ({var_res['parametric_var_1day_pct']}%)")
    print(f"  • Conditional VaR (Expected Shortfall): ${var_res['cvar_expected_shortfall_amount']:,} ({var_res['cvar_expected_shortfall_pct']}%)")
    print(f"  • Sharpe Ratio: {var_res['sharpe_ratio']} | Beta: {var_res['beta']} | Max Drawdown: {var_res['max_drawdown_pct']}%")

    # 3. Vectorized Monte Carlo Simulation (10,000 Paths)
    print("\n[3/5] Executing 10,000-Path Vectorized Monte Carlo Simulation with NumPy...")
    mc_res = run_monte_carlo_simulation(
        initial_value=portfolio_res['total_portfolio_value'],
        annual_mu=0.09,
        annual_sigma=0.16,
        num_simulations=10000,
        horizon_months=12,
        monthly_contribution=500
    )
    summary = mc_res['summary']
    print(f"  • Expected Median Value (p50): ${summary['p50_median']:,}")
    print(f"  • 5th Percentile Worst Case (p5): ${summary['p5_worst']:,}")
    print(f"  • 95th Percentile Best Case (p95): ${summary['p95_best']:,}")
    print(f"  • Probability of Principal Loss: {summary['probability_of_loss_pct']}%")

    # 4. Scikit-Learn Machine Learning Credit Risk Classifier
    print("\n[4/5] Running Scikit-Learn Logistic Regression Credit Scoring Model...")
    applicant = {
        "income": 6000,
        "existingDebt": 12000,
        "loanAmount": 15000,
        "creditHistoryMonths": 48,
        "paymentHistoryScore": 95,
        "missedPayments": 0
    }
    credit_res = predict_credit_risk(applicant)
    print(f"  • Credit Score: {credit_res['credit_score']} ({credit_res['tier']} Tier)")
    print(f"  • Default Risk Probability: {credit_res['probability_of_default_pct']}%")
    print(f"  • Risk Classification: {credit_res['risk_level']}")

    # 5. Visualizing Risk Distributions with Matplotlib & Seaborn
    print("\n[5/5] Generating Visual Risk Charts with Matplotlib & Seaborn...")
    sector_data = {"Technology": 7200, "Government": 5000, "Mutual Funds": 22500}
    chart_files = generate_risk_visualizations(daily_returns_list=daily_returns, sector_data_dict=sector_data)
    for cfile in chart_files:
        print(f"  • Generated Chart: {cfile}")

    print("\n" + "=" * 80)
    print("  FINANCE RISK ANALYTICS — PIPELINE EXECUTION COMPLETE")
    print("=" * 80)


if __name__ == '__main__':
    run_full_analytics()
