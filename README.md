# RiskGuard — Finance Risk Management Platform 🛡️📊

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stack: Full--Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite%20%7C%20Python-emerald.svg)]()
[![Design: Zero--Transparency](https://img.shields.io/badge/UI-100%25%20Zero--Transparency-sky.svg)]()

**RiskGuard** is a full-stack, enterprise-grade financial risk management platform designed for comprehensive personal solvency evaluation, quantitative portfolio risk analytics (Value at Risk, CVaR, Sharpe, Beta, Max Drawdown), credit risk underwriting, stochastic Monte Carlo simulations, what-if scenario forecasting, and automated recommendations.

---

## 🌟 Core Features

### 1. Deterministic Personal Risk Engine (0–100 Score)
Evaluates 6 weighted financial risk categories with granular explainability breakdowns:
1. **Debt Risk**: Based on Debt-to-Income (DTI) ratio.
2. **Liquidity Risk**: Liquid savings buffer vs total monthly expenses.
3. **Emergency Reserve Risk**: Coverage of essential survival spending.
4. **Cash Flow Risk**: Monthly surplus and net savings rate.
5. **Investment Concentration Risk**: Asset class and sector concentration (Herfindahl Index).
6. **Financial Goal Risk**: Target funding gap vs time horizon achievability.

### 2. Quantitative Portfolio Risk & VaR Analytics
Derived from daily asset return series and covariance matrices:
- **Historical Value at Risk (VaR)**: 95% and 99% 1-day percentile loss bounds.
- **Parametric Gaussian VaR**: Statistical normal distribution approximation.
- **Conditional VaR (CVaR / Expected Shortfall)**: Average loss beyond the VaR cutoff threshold.
- **Sharpe Ratio & Beta**: Risk-adjusted returns and market sensitivity benchmark.
- **Maximum Drawdown**: Historical peak-to-trough drop.
- **Risk Heatmap**: Exposure breakdown by Asset Class & Sector with color + numerical ratings.

### 3. Stochastic Monte Carlo & What-If Simulators
- **Monte Carlo Engine**: Runs **1,000+ to 10,000+ stochastic portfolio paths** using Geometric Brownian Motion (GBM) to forecast 5th, 50th, and 95th percentile outcomes and probability of loss.
- **What-If Scenario Simulator**: Interactive slider controls allowing users to simulate hypothetical income/expense shifts, extra debt, or emergency fund allocations without mutating baseline database records.

### 4. Credit Risk Underwriting Module
- Educational credit scoring model (300–850 scale) powered by a documented logistic regression algorithm.
- Evaluates payment history, DTI, credit age, recent delinquencies, and loan-to-income ratio.

### 5. Python Quantitative Data Analytics Suite (`python_analytics/`)
- Powered by **NumPy**, **Pandas**, **SciPy**, **Scikit-Learn**, **Matplotlib**, and **Seaborn**.
- Provides vectorized numerical analytics, matrix operations, Scikit-Learn logistic classification, and exported structured data reports.

### 6. Reports & Data Export
- **PDF Report Exporter**: Formatted multi-page executive summary generated via `jsPDF`.
- **Native CSV Data Export**: Raw metric and portfolio data export for spreadsheet analysis.

### 7. 100% Zero-Transparency UI Mandate & Dark Mode
- **Zero Transparency Policy**: Absolutely no glassmorphism, no `backdrop-blur`, no translucent backgrounds. Every UI surface is 100% solid opaque (`bg-white` / `bg-slate-900`).
- **Dark/Light Mode**: Integrated theme switcher with persistent local and database storage.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF |
| **Backend** | Node.js, Express, `jsonwebtoken`, `bcryptjs`, CORS |
| **Database** | SQLite (via `sql.js` WebAssembly engine with auto-persistence) |
| **Data Analytics** | Python 3, NumPy, Pandas, SciPy, Scikit-Learn |
| **Orchestration** | Concurrently, Git |

---

## 📁 Project Structure

```
Finance Risk Management/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Sidebar, Navbar, OpaqueModal, RiskBadge
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # 15 Complete Application Pages
│   │   ├── services/           # Unified API Client Service
│   │   ├── App.jsx             # Main Router & Protected Routes
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind Zero-Transparency Design Tokens
│   ├── package.json
│   └── vite.config.js
├── server/                      # Node.js Express REST API
│   ├── db/                     # SQLite Database Initialization & Schema
│   ├── middleware/             # JWT Authentication & Isolation
│   ├── routes/                 # Express API Endpoints
│   ├── services/               # Risk, Portfolio, Monte Carlo, Credit & Report Engines
│   ├── package.json
│   └── server.js               # Entry Point (Port 5000)
├── python_analytics/            # Python Data Analytics Module
│   ├── risk_analytics.py       # NumPy, Pandas, SciPy & Scikit-Learn Engine
│   ├── run_analytics.py        # CLI Analytics Runner
│   └── requirements.txt
├── package.json                 # Root Concurrent Launcher
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start & Local Running

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Python (optional, for standalone CLI data analytics)

### Installation & Launch

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Neelkore25/finance-risk-management.git
   cd finance-risk-management
   ```

2. **Install Dependencies**:
   ```bash
   npm run setup
   ```

3. **Start Platform (Backend + Frontend)**:
   ```bash
   npm run dev
   ```

4. **Access Applications**:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## ⚖️ License & Disclaimer

"RiskGuard is an educational financial risk-analysis tool and does not provide professional financial advice."

Distributed under the MIT License. See `LICENSE` for details.
