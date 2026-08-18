"""
================================================================================
RISKGUARD — PERSONAL RISK ENGINE (Pandas & NumPy)
================================================================================
Calculates 0-100 personal financial risk score across 6 core risk categories.
"""

import numpy as np
import pandas as pd


def compute_personal_risk_score(profile_dict, expenses_list=None, debts_list=None, investments_list=None, goals_list=None):
    """
    Computes deterministic weighted risk score using Pandas DataFrames and NumPy array operations.
    """
    income = float(max(0, profile_dict.get('monthly_income', 5000)))
    essential_exp = float(max(0, profile_dict.get('monthly_essential_expenses', 2000)))
    discretionary_exp = float(max(0, profile_dict.get('monthly_discretionary_expenses', 800)))
    savings = float(max(0, profile_dict.get('existing_savings', 10000)))
    emergency_fund = float(max(0, profile_dict.get('emergency_fund', 6000)))

    # Process Expenses with Pandas
    if expenses_list:
        df_exp = pd.DataFrame(expenses_list)
        if not df_exp.empty:
            total_exp = float(pd.to_numeric(df_exp['amount'], errors='coerce').sum())
        else:
            total_exp = essential_exp + discretionary_exp
    else:
        total_exp = essential_exp + discretionary_exp

    # Process Debts with Pandas
    if debts_list:
        df_debts = pd.DataFrame(debts_list)
        if not df_debts.empty:
            debt_payment = float(pd.to_numeric(df_debts['monthly_payment'], errors='coerce').sum())
        else:
            debt_payment = float(max(0, profile_dict.get('monthly_debt_payment', 400)))
    else:
        debt_payment = float(max(0, profile_dict.get('monthly_debt_payment', 400)))

    # 1. Debt Risk (DTI)
    dti = (debt_payment / income * 100.0) if income > 0 else 100.0
    debt_score = int(np.clip(np.round(dti * 1.5), 0, 100))

    # 2. Liquidity Risk (Savings Coverage)
    liquid_months = savings / total_exp if total_exp > 0 else 12.0
    liquidity_score = int(np.clip(np.round(max(0, (6.0 - liquid_months) * 15)), 0, 100))

    # 3. Emergency Fund Risk
    emergency_months = emergency_fund / essential_exp if essential_exp > 0 else 12.0
    emergency_score = int(np.clip(np.round(max(0, (6.0 - emergency_months) * 16)), 0, 100))

    # 4. Cash Flow Risk (Savings Rate)
    net_cash_flow = income - (total_exp + debt_payment)
    savings_rate = (net_cash_flow / income * 100.0) if income > 0 else 0.0
    cash_flow_score = int(np.clip(np.round(max(0, (30.0 - savings_rate) * 2.5)), 0, 100)) if net_cash_flow >= 0 else 90

    # 5. Investment Concentration Risk
    concentration_score = 25
    if investments_list:
        df_inv = pd.DataFrame(investments_list)
        if not df_inv.empty:
            vals = pd.to_numeric(df_inv['amount_value'], errors='coerce').values
            tot_inv = np.sum(vals)
            if tot_inv > 0:
                largest_pct = (np.max(vals) / tot_inv) * 100.0
                concentration_score = int(np.clip(np.round(largest_pct * 1.2), 10, 100))

    # 6. Goal Risk
    goal_score = 20

    # Weighted aggregate score using NumPy dot product
    scores = np.array([debt_score, liquidity_score, emergency_score, cash_flow_score, concentration_score, goal_score])
    weights = np.array([0.25, 0.20, 0.20, 0.20, 0.10, 0.05])
    overall_score = int(np.round(np.dot(scores, weights)))

    level = "Low Risk" if overall_score < 30 else ("Moderate Risk" if overall_score < 60 else ("High Risk" if overall_score < 80 else "Critical Risk"))

    return {
        "overall_score": overall_score,
        "overall_level": level,
        "metrics": {
            "monthly_income": income,
            "total_monthly_expenses": total_exp,
            "net_cash_flow": net_cash_flow,
            "savings_rate_pct": round(savings_rate, 1),
            "dti_pct": round(dti, 1),
            "liquid_coverage_months": round(liquid_months, 1),
            "emergency_coverage_months": round(emergency_months, 1)
        },
        "category_scores": {
            "debt_risk": debt_score,
            "liquidity_risk": liquidity_score,
            "emergency_fund_risk": emergency_score,
            "cash_flow_risk": cash_flow_score,
            "investment_concentration_risk": concentration_score,
            "goal_risk": goal_score
        }
    }


if __name__ == '__main__':
    prof = {"monthly_income": 5000, "monthly_essential_expenses": 2000, "monthly_discretionary_expenses": 800, "existing_savings": 10000, "emergency_fund": 6000, "monthly_debt_payment": 400}
    res = compute_personal_risk_score(prof)
    print("Python Personal Risk Score Engine Result:")
    print(res)
