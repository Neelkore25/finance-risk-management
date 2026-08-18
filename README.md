# RiskGuard — Finance Risk Management Platform 🛡️📊

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-sky?style=for-the-badge&logo=github)](https://neelkore25.github.io/finance-risk-management/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Stack: Full--Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite%20%7C%20Python-emerald.svg?style=for-the-badge)]()

🌐 **Live Application Website**: [https://neelkore25.github.io/finance-risk-management/](https://neelkore25.github.io/finance-risk-management/)

---

## 💡 About The Project

**RiskGuard** is an end-to-end, production-grade Quantitative Finance & Risk Management Platform engineered to bridge personal financial planning with institutional risk analytics. 

Traditional budgeting apps only track spending history. RiskGuard acts as a **chief risk officer in your browser**, transforming raw cash flow, debt liabilities, and investment holdings into deterministic risk scores, statistical Value at Risk (VaR), Expected Shortfall (CVaR), and 10,000-path Monte Carlo stochastic forecasts.

### Why RiskGuard?
- 🎯 **Deterministic & Transparent Risk Engine**: Eliminates arbitrary risk numbers. Every 0–100 score is derived from a transparent, explainable math engine across 6 core risk factors (Debt, Liquidity, Emergency Reserves, Cash Flow, Concentration, Goal Risk).
- 📈 **Institutional Quantitative Analytics**: Calculates 1-Day Historical VaR (95%/99%), Parametric Gaussian VaR, Expected Shortfall (CVaR), Sharpe Ratio, Beta vs Market Benchmarks, and Maximum Drawdown.
- 🎲 **Stochastic Monte Carlo & What-If Simulations**: Predicts future portfolio trajectories over 1,000 to 10,000 paths using Geometric Brownian Motion (GBM) and provides real-time hypothetical scenario modeling.
- 💳 **Machine Learning Credit Risk Module**: Evaluates creditworthiness using a Scikit-Learn trained Logistic Regression classifier and transparent credit metrics.
- 🐍 **Python Data Analytics Integration**: Powered by NumPy, Pandas, SciPy, and Scikit-Learn for matrix calculations and data pipelines.
- 👁️ **Strict 100% Zero-Transparency Mandate**: Clean, enterprise-grade dark/light interface designed with 100% solid opaque surfaces, crisp borders, and zero background bleed.

---

## 🚀 Quick Access Links

- 🌐 **Web Platform**: [https://neelkore25.github.io/finance-risk-management/](https://neelkore25.github.io/finance-risk-management/)
- 📄 **Source Repository**: [https://github.com/Neelkore25/finance-risk-management](https://github.com/Neelkore25/finance-risk-management)

---

## 🌟 Core Modules

### 1. Personal Risk Score Decomposition (0–100)
Evaluates 6 weighted financial risk categories with granular explainability breakdowns:
1. **Debt Risk (25%)**: Evaluated via Debt-to-Income (DTI) ratio.
2. **Liquidity Risk (20%)**: Liquid savings coverage vs monthly living expenses.
3. **Emergency Fund Risk (20%)**: Survival reserve coverage of essential spending.
4. **Cash Flow Risk (20%)**: Net monthly cash surplus and savings rate %.
5. **Investment Concentration Risk (10%)**: Asset class and sector distribution (Herfindahl Index).
6. **Financial Goal Risk (5%)**: Target funding gap vs required monthly savings pace.

### 2. Quantitative Portfolio Risk & VaR Analytics
- **Historical Value at Risk (VaR)**: 95% and 99% confidence 1-day portfolio loss bounds.
- **Parametric Gaussian VaR**: Closed-form normal distribution approximation.
- **Conditional VaR (CVaR / Expected Shortfall)**: Average magnitude of tail losses exceeding VaR.
- **Sharpe Ratio & Beta**: Risk-adjusted excess return per unit of volatility.
- **Risk Heatmaps**: Asset class & sector exposure grid with color + numerical concentration ratings.

### 3. What-If Scenario & Monte Carlo Engine
- **Monte Carlo Engine**: Simulates **10,000 stochastic portfolio paths** to project 5th percentile (worst), 50th percentile (median), 95th percentile (best) outcomes and probability of principal loss.
- **What-If Scenario Simulator**: Real-time slider controls allowing instant simulation of income drops, expense spikes, emergency deposits, or extra debt service without mutating baseline database records.

### 4. Credit Risk Underwriting Module
- Documented logistic regression underwriting model (300–850 score scale).
- Evaluates payment history, DTI, credit history length, delinquencies, and loan-to-income ratio.

### 5. Python Quantitative Analytics Suite (`python_analytics/`)
- Built using **NumPy**, **Pandas**, **SciPy**, and **Scikit-Learn**.
- Provides matrix covariance calculations, vectorized Monte Carlo simulations, and ML credit scoring.

---

## 🛠️ Technology Stack

| Component | Stack |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF |
| **Backend API** | Node.js, Express, `jsonwebtoken`, `bcryptjs`, CORS |
| **Database** | SQLite (via `sql.js` WebAssembly engine with auto-persistence) |
| **Data Science** | Python 3, NumPy, Pandas, SciPy, Scikit-Learn |
| **Deployment** | GitHub Pages & Git |

---

## 💻 Local Running & Installation

```bash
# 1. Clone repository
git clone https://github.com/Neelkore25/finance-risk-management.git
cd finance-risk-management

# 2. Install dependencies for root, server, and client
npm run setup

# 3. Launch platform
npm run dev
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
- **GitHub Pages Link**: [https://neelkore25.github.io/finance-risk-management/](https://neelkore25.github.io/finance-risk-management/)

---

## ⚖️ Disclaimer

"RiskGuard is an educational financial risk-analysis tool and does not provide professional financial advice."

Distributed under the MIT License. See `LICENSE` for details.
