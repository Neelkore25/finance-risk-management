# 🛡️ Finance Risk Analytics Platform

An intelligent, real-time financial risk assessment and quantitative portfolio analytics web platform. Built with **React**, **Python Data Science** (`NumPy`, `Pandas`, `SciPy`, `Scikit-Learn`), and **Supabase**.

[![Live Web App](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0284c7?style=for-the-badge&logo=github&logoColor=white)](https://neelkore25.github.io/finance-risk-management/)
[![Python API](https://img.shields.io/badge/Python%20API-FastAPI-10b981?style=for-the-badge&logo=fastapi&logoColor=white)](https://finance-risk-management.onrender.com/docs)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-6366f1?style=for-the-badge&logo=react&logoColor=white)](https://neelkore25.github.io/finance-risk-management/)
[![License: MIT](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Live Links

* 🌐 **Live Web Application**: [https://neelkore25.github.io/finance-risk-management/](https://neelkore25.github.io/finance-risk-management/)
* ⚡ **Live Python API & Swagger Docs**: [https://finance-risk-management.onrender.com/docs](https://finance-risk-management.onrender.com/docs)

---

## 💡 About The Project

**Finance Risk Analytics** is an interactive financial health and risk intelligence application. It helps individuals and analysts measure solvency risks, evaluate loan creditworthiness, stress-test budgets against unexpected shocks, and track investment downside exposure.

Everything recalculates **dynamically in real time** as you update your financial data.

---

## 🚀 Key Features

* **📊 Personal Solvency & Risk Score (0–100)**: Evaluates Debt-to-Income (DTI), living expense burn rates, cash flow surplus, and emergency fund resilience.
* **📈 Portfolio Volatility & Value at Risk (VaR)**: Calculates Parametric & Historical VaR (95% / 99% confidence) and Herfindahl asset concentration using Python.
* **💳 Credit Risk & Underwriting**: Evaluates loan default probability and calculates credit scores (300–850) based on debt burden and repayment history.
* **🎛️ What-If Scenario Simulator**: Simulates financial shocks (e.g. *What if income drops by 15%? What if debt increases by ₹5,000?*) with instant **Before vs. After** impact comparisons.
* **📉 Historical Risk Trajectory**: Tracks and logs risk score snapshots chronologically with audit logs and trend graphs.
* **📄 One-Click PDF Risk Reports**: Export clean, printable risk summary dossiers and compliance reports.
* **🌓 Light & Night Modes**: Instant switching with clean financial dark/light UI themes.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Lucide Icons, Recharts |
| **Python Engine** | FastAPI, NumPy, Pandas, SciPy, Scikit-Learn, Matplotlib |
| **Backend & Auth** | Node.js (Express), Supabase (PostgreSQL + RLS), Google OAuth |
| **Deployment** | GitHub Pages (Frontend CDN), Render (Python API) |

---

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Neelkore25/finance-risk-management.git
cd finance-risk-management
```

### 2. Run the React Web App
```bash
cd client
npm install
npm run dev
```

### 3. (Optional) Run the Python Analytics Engine
```bash
cd python_analytics
pip install -r requirements.txt
python main.py
```

---

## ⚖️ Disclaimer

*This application is created for financial analytics, research, and educational purposes.*

Distributed under the **MIT License**.
