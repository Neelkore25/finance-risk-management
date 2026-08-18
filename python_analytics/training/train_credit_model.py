import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import os

def train_and_evaluate_models():
    """
    Trains Logistic Regression and Random Forest models on sample credit default features.
    Evaluates using Accuracy, Precision, Recall, F1, and ROC-AUC.
    Saves the best Random Forest model artifact via joblib.
    """
    np.random.seed(42)
    n_samples = 1000

    # Generate synthetic features: [Income, Total Debt, Monthly EMI, Savings Balance, Credit Utilization %]
    monthly_income = np.random.uniform(25000, 250000, n_samples)
    total_debt = np.random.uniform(50000, 1500000, n_samples)
    monthly_emi = np.random.uniform(5000, 75000, n_samples)
    savings_balance = np.random.uniform(10000, 500000, n_samples)
    credit_util = np.random.uniform(5, 95, n_samples)

    # Calculate DTI ratio and default score target
    dti_ratio = (monthly_emi / monthly_income) * 100
    default_prob_raw = (dti_ratio * 0.4) + (credit_util * 0.35) - ((savings_balance / total_debt) * 20)
    target_default = (default_prob_raw > 35).astype(int)

    X = pd.DataFrame({
        'monthly_income': monthly_income,
        'total_debt': total_debt,
        'monthly_emi': monthly_emi,
        'savings_balance': savings_balance,
        'credit_utilization_pct': credit_util
    })
    y = pd.Series(target_default)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Logistic Regression Model
    log_reg = LogisticRegression(random_state=42)
    log_reg.fit(X_train_scaled, y_train)
    y_pred_lr = log_reg.predict(X_test_scaled)
    y_prob_lr = log_reg.predict_proba(X_test_scaled)[:, 1]

    # 2. Random Forest Classifier Model
    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf_clf.fit(X_train_scaled, y_train)
    y_pred_rf = rf_clf.predict(X_test_scaled)
    y_prob_rf = rf_clf.predict_proba(X_test_scaled)[:, 1]

    # Model Evaluation Metrics
    metrics_lr = {
        "model": "Logistic Regression",
        "accuracy": float(accuracy_score(y_test, y_pred_lr)),
        "precision": float(precision_score(y_test, y_pred_lr, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred_lr, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred_lr, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_lr))
    }

    metrics_rf = {
        "model": "Random Forest",
        "accuracy": float(accuracy_score(y_test, y_pred_rf)),
        "precision": float(precision_score(y_test, y_pred_rf, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred_rf, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred_rf, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_rf))
    }

    # Save artifacts
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(rf_clf, os.path.join(models_dir, 'credit_rf_model.pkl'))
    joblib.dump(scaler, os.path.join(models_dir, 'credit_scaler.pkl'))

    return {
        "logistic_regression": metrics_lr,
        "random_forest": metrics_rf
    }

if __name__ == "__main__":
    results = train_and_evaluate_models()
    print("Model Evaluation Comparison:")
    print(results)
