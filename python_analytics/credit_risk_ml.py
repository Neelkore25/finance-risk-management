"""
================================================================================
RISKGUARD — CREDIT RISK ML CLASSIFIER (Scikit-Learn)
================================================================================
Machine Learning Logistic Regression Classifier for Credit Default Risk Scoring.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


def generate_synthetic_training_data(n_samples=1000):
    """
    Generates realistic synthetic credit applicant dataset for training.
    """
    np.random.seed(42)
    income = np.random.uniform(2000, 15000, n_samples)
    existing_debt = np.random.uniform(1000, 50000, n_samples)
    dti = (existing_debt / (income * 12)) * 100
    credit_history_months = np.random.randint(6, 120, n_samples)
    payment_history_score = np.random.uniform(50, 100, n_samples)
    missed_payments = np.random.poisson(lam=0.5, size=n_samples)
    loan_amount = np.random.uniform(1000, 30000, n_samples)

    # Risk score formula for synthetic target generation
    default_logit = (
        -1.5 
        - 0.04 * (payment_history_score - 50) 
        + 0.6 * missed_payments 
        + 0.03 * dti 
        - 0.01 * credit_history_months
    )
    prob_default = 1.0 / (1.0 + np.exp(-default_logit))
    default_flag = (np.random.rand(n_samples) < prob_default).astype(int)

    df = pd.DataFrame({
        'income': income,
        'existing_debt': existing_debt,
        'dti': dti,
        'credit_history_months': credit_history_months,
        'payment_history_score': payment_history_score,
        'missed_payments': missed_payments,
        'loan_amount': loan_amount,
        'default_flag': default_flag
    })
    return df


def predict_credit_risk(params):
    """
    Trains Scikit-Learn Logistic Regression model on data and predicts risk score.
    """
    training_df = generate_synthetic_training_data(1000)
    features = ['income', 'existing_debt', 'dti', 'credit_history_months', 'payment_history_score', 'missed_payments', 'loan_amount']

    X_train = training_df[features]
    y_train = training_df['default_flag']

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    clf = LogisticRegression(max_iter=1000, random_state=42)
    clf.fit(X_train_scaled, y_train)

    # Extract user features
    inc = float(params.get('income', 5000))
    debt = float(params.get('existingDebt', 12000))
    loan = float(params.get('loanAmount', 15000))
    dti = (debt / (inc * 12 if inc > 0 else 1)) * 100
    history = float(params.get('creditHistoryMonths', 36))
    score = float(params.get('paymentHistoryScore', 95))
    missed = float(params.get('missedPayments', 0))

    user_sample = np.array([[inc, debt, dti, history, score, missed, loan]])
    user_sample_scaled = scaler.transform(user_sample)

    prob_default = float(clf.predict_proba(user_sample_scaled)[0][1])
    prob_good = 1.0 - prob_default

    # Map probability to FICO scale (300 to 850)
    credit_score = int(round(300 + prob_good * 550))
    prob_default_pct = round(prob_default * 100.0, 1)

    tier = 'Good'
    risk_level = 'Moderate Risk'

    if credit_score >= 750:
        tier = 'Excellent'
        risk_level = 'Low Risk'
    elif credit_score >= 700:
        tier = 'Good'
        risk_level = 'Low-Moderate Risk'
    elif credit_score >= 650:
        tier = 'Fair'
        risk_level = 'High Risk'
    else:
        tier = 'Poor'
        risk_level = 'Critical Risk'

    return {
        "model": "Scikit-Learn Logistic Regression Classifier",
        "credit_score": credit_score,
        "tier": tier,
        "risk_level": risk_level,
        "probability_of_default_pct": prob_default_pct,
        "probability_of_good_standing_pct": round(prob_good * 100.0, 1),
        "feature_weights": dict(zip(features, [round(float(w), 4) for w in clf.coef_[0]]))
    }


if __name__ == '__main__':
    sample_applicant = {
        "income": 6000,
        "existingDebt": 10000,
        "loanAmount": 12000,
        "creditHistoryMonths": 48,
        "paymentHistoryScore": 98,
        "missedPayments": 0
    }
    res = predict_credit_risk(sample_applicant)
    print("Scikit-Learn Credit Risk ML Prediction:")
    print(res)
