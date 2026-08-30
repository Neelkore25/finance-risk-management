# Finance Risk Analytics Platform 🛡️📊

[![Live Demo](https://img.shields.io/badge/Live%20Web%20App-GitHub%20Pages-sky?style=for-the-badge&logo=github)](https://neelkore25.github.io/finance-risk-management/)
[![Python API](https://img.shields.io/badge/Live%20Python%20API-Render-emerald?style=for-the-badge&logo=render)](https://finance-risk-management.onrender.com/docs)
[![Python Engine](https://img.shields.io/badge/Python-NumPy%20%7C%20Pandas%20%7C%20SciPy%20%7C%20Scikit--Learn-blue.svg?style=for-the-badge&logo=python)](https://finance-risk-management.onrender.com/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

🌐 **Live Web Application**: [https://neelkore25.github.io/finance-risk-management/](https://neelkore25.github.io/finance-risk-management/)  
⚡ **Live Python ML API & Swagger Docs**: [https://finance-risk-management.onrender.com/docs](https://finance-risk-management.onrender.com/docs)

---

## 💡 About The Project — Finance Risk Analytics

**Finance Risk Analytics** is an end-to-end Quantitative Finance & Data Science Platform engineered to analyze personal solvency risks, portfolio downside volatility, and credit risk probability using **Python** (`NumPy`, `Pandas`, `SciPy`, `Scikit-Learn`, `Matplotlib`, `Seaborn`).

### 🐍 Python Data Science Engine (`python_analytics/`)

The platform relies on Python for core quantitative analytics and machine learning:

1. **Pandas Financial DataFrames (`portfolio_analytics.py` & `personal_risk_engine.py`)**:
   - Parses holding records into structured DataFrames.
   - Computes weighted market allocations and Herfindahl-Hirschman Concentration Index (HHI).
2. **NumPy Vectorized Array Mathematics (`quantitative_var.py` & `monte_carlo_engine.py`)**:
   - **Historical VaR (95%/99%)**: Downside risk percentile estimation.
   - **Parametric VaR & CVaR (Expected Shortfall)**: Closed-form normal distributions via SciPy.
   - **Vectorized Monte Carlo Simulation**: 10,000 stochastic portfolio paths simulated via Geometric Brownian Motion (GBM).
3. **Scikit-Learn Machine Learning Classifier (`credit_risk_ml.py`)**:
   - Trains a Logistic Regression model with `StandardScaler` feature normalization to predict applicant loan default probability and credit scores (300–850).
4. **Matplotlib & Seaborn Visualizations (`risk_reports_generator.py`)**:
   - Generates publication-ready return distribution plots and sector concentration charts.

---

## 🔒 Strict Authentication & Real-Time Calculation Engine

- **Strict Validation**: Duplicate email registrations are rejected. Passwords must match the registered user account.
- **Dynamic Recalculation**: Whenever you edit your income, expenses, debts, or investments, the platform recalculates your overall risk score, DTI ratio %, Cash Flow Surplus, Quantitative VaR, and Credit Score in real-time!

---

## 💻 Running the Python Analytics Suite

```bash
# Clone Repository
git clone https://github.com/Neelkore25/finance-risk-management.git
cd finance-risk-management

# Run Master Python Pipeline
python python_analytics/main.py
```

---

## ⚖️ Disclaimer

"Finance Risk Analytics is an educational risk analysis platform and does not provide formal financial advice."

Distributed under the MIT License.
