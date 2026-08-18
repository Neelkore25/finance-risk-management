"""
================================================================================
RISKGUARD — PYTHON CLI API BRIDGE
================================================================================
Universal command-line interface bridging Node.js Express requests to Python
NumPy, Pandas, SciPy, and Scikit-Learn calculation modules.
"""

import sys
import json
import argparse
import numpy as np

from portfolio_analytics import analyze_holdings
from quantitative_var import calculate_quantitative_var
from monte_carlo_engine import run_monte_carlo_simulation
from credit_risk_ml import predict_credit_risk
from personal_risk_engine import compute_personal_risk_score


def main():
    parser = argparse.ArgumentParser(description="RiskGuard Python Analytics CLI Bridge")
    parser.add_argument('--action', type=str, default='all', help='Action to perform: portfolio | var | montecarlo | credit | personal | all')
    parser.add_argument('--input', type=str, default='{}', help='JSON encoded input data string')
    
    args = parser.parse_args()

    try:
        data = json.loads(args.input) if args.input else {}
    except Exception:
        data = {}

    action = args.action.lower()
    output = {}

    if action == 'portfolio':
        output = analyze_holdings(data.get('holdings', []))

    elif action == 'var':
        returns = data.get('returns', np.random.normal(loc=0.0005, scale=0.012, size=252).tolist())
        value = float(data.get('totalValue', 35000))
        conf = float(data.get('confidenceLevel', 0.95))
        output = calculate_quantitative_var(returns, value, conf)

    elif action == 'montecarlo':
        init_val = float(data.get('initialValue', 35000))
        mu = float(data.get('annualMu', 0.09))
        sigma = float(data.get('annualSigma', 0.16))
        sims = int(data.get('numSimulations', 10000))
        months = int(data.get('horizonMonths', 12))
        contrib = float(data.get('monthlyContribution', 500))
        output = run_monte_carlo_simulation(init_val, mu, sigma, sims, months, contrib)

    elif action == 'credit':
        output = predict_credit_risk(data)

    elif action == 'personal':
        profile = data.get('profile', {})
        expenses = data.get('expenses', [])
        debts = data.get('debts', [])
        investments = data.get('investments', [])
        goals = data.get('goals', [])
        output = compute_personal_risk_score(profile, expenses, debts, investments, goals)

    else: # 'all'
        sample_holdings = data.get('investments', [
            {"asset_name": "S&P 500 ETF", "asset_type": "Mutual Funds", "sector": "Technology", "quantity": 100, "current_price": 450, "amount_value": 45000}
        ])
        portfolio_res = analyze_holdings(sample_holdings)
        var_res = calculate_quantitative_var([], portfolio_res.get('total_portfolio_value', 45000), 0.95)
        mc_res = run_monte_carlo_simulation(portfolio_res.get('total_portfolio_value', 45000), 0.09, 0.16, 10000, 12, 500)
        credit_res = predict_credit_risk(data.get('credit', {}))

        output = {
            "engine": "Python Data Analytics Suite (NumPy, Pandas, SciPy, Scikit-Learn)",
            "portfolio": portfolio_res,
            "quantitative_var": var_res,
            "monte_carlo_10k": mc_res["summary"],
            "credit_ml": credit_res
        }

    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
