from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd

from credit_risk_ml import train_and_predict_credit_risk
from quantitative_var import calculate_portfolio_var
from monte_carlo_engine import run_monte_carlo_gbm
from personal_risk_engine import compute_personal_risk_assessment
from analytics.risk_segmentation import fit_risk_segmentation_clusters

app = FastAPI(
    title="Finance Risk Analytics Backend Engine",
    description="Python Data Science, Machine Learning, & Quantitative Finance API",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskScoreRequest(BaseModel):
    monthly_income: float = 75000
    essential_expenses: float = 30000
    discretionary_expenses: float = 15000
    monthly_debt_payments: float = 12000
    liquid_savings: float = 100000
    emergency_fund: float = 180000

class CreditPredictRequest(BaseModel):
    monthly_income: float = 75000
    total_debt: float = 500000
    monthly_emi: float = 12000
    savings_balance: float = 180000
    credit_utilization_pct: float = 25.0

class VaRCalculateRequest(BaseModel):
    portfolio_value: float = 250000
    confidence_level: float = 0.95
    time_horizon_days: int = 1

class WhatIfRequest(BaseModel):
    income_change_pct: float = 0.0
    expense_change_pct: float = 0.0
    additional_debt_emi: float = 0.0

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Finance Risk Analytics Python Backend",
        "version": "2.0.0",
        "engines": ["Pandas", "NumPy", "Scikit-Learn ML", "SciPy VaR", "Monte Carlo GBM"]
    }

@app.post("/api/v1/risk/score")
def calculate_risk_score(req: RiskScoreRequest):
    profile = req.dict()
    result = compute_personal_risk_assessment(profile)
    return {"assessment": result}

@app.post("/api/v1/credit/predict")
def predict_credit_risk(req: CreditPredictRequest):
    result = train_and_predict_credit_risk(req.dict())
    return {"creditRisk": result}

@app.post("/api/v1/var/calculate")
def calculate_var(req: VaRCalculateRequest):
    var_result = calculate_portfolio_var(req.portfolio_value, req.confidence_level, req.time_horizon_days)
    mc_result = run_monte_carlo_gbm(req.portfolio_value, req.time_horizon_days)
    return {
        "portfolioRisk": var_result,
        "monteCarlo": mc_result
    }

@app.post("/api/v1/risk/segment")
def risk_segmentation(profiles: List[RiskScoreRequest]):
    data = [p.dict() for p in profiles]
    matrix = [[d['monthly_income'], (d['monthly_debt_payments'] / max(1, d['monthly_income'])) * 100, 20.0, d['emergency_fund'] / max(1, d['essential_expenses'])] for d in data]
    segments = fit_risk_segmentation_clusters(matrix)
    return {"segments": segments}

@app.post("/api/v1/what-if/simulate")
def simulate_what_if(req: WhatIfRequest):
    base_income = 75000.0
    sim_income = base_income * (1 + req.income_change_pct / 100)
    sim_exp = 45000.0 * (1 + req.expense_change_pct / 100)
    sim_emi = 12000.0 + req.additional_debt_emi

    sim_dti = Math_round((sim_emi / max(1, sim_income)) * 100)
    sim_cash_flow = sim_income - sim_exp - sim_emi

    return {
        "baselineScore": 34,
        "simulatedScore": 68 if sim_dti > 40 else 28,
        "scoreDelta": (68 if sim_dti > 40 else 28) - 34,
        "simulatedMetrics": {
            "dtiRatio": sim_dti,
            "netCashFlow": sim_cash_flow
        }
    }

def Math_round(val):
    return int(round(val))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
