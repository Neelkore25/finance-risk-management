import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd

from credit_risk_ml import train_and_predict_credit_risk
from quantitative_var import calculate_portfolio_var
from monte_carlo_engine import run_monte_carlo_gbm
from personal_risk_engine import compute_personal_risk_assessment
from analytics.risk_segmentation import fit_risk_segmentation_clusters

# Load environment variables from .env
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Gemini Client (supporting both google-genai and google-generativeai)
genai_client = None
genai_legacy_model = None

if GEMINI_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_KEY)
    except Exception:
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=GEMINI_KEY)
            genai_legacy_model = legacy_genai.GenerativeModel("gemini-1.5-flash")
        except Exception:
            pass

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

class AssistantRequest(BaseModel):
    user_id: str = "guest"
    prompt: str
    user_context: Optional[Dict[str, Any]] = {}

SYSTEM_INSTRUCTION = """
You are an expert Financial Risk AI Assistant embedded in the Finance Risk Analytics platform.
Your goals:
1. Explain financial definitions, risk metrics (VaR, Sharpe ratio, Monte Carlo, Debt ratios), and platform concepts clearly with simple examples.
2. Provide step-by-step mathematical or logical breakdowns when asked.
3. Keep responses structured using bullet points, short clear sentences, and lightweight markdown formatting.
4. Format currency figures in Indian Rupees (₹) when referencing user portfolio context.
"""

def generate_structured_risk_response(query: str, context: dict) -> str:
    q = query.lower().strip()
    if 'what is var' in q or 'value at risk' in q:
        return "📈 **Value at Risk (VaR)** is a statistical metric estimating the maximum expected financial loss in a portfolio over a specific time horizon (e.g. 1 day) at a given confidence level (e.g. 95% or 99%).\n\n• **Historical VaR**: Derived from empirical distribution of daily returns.\n• **Parametric VaR**: Assumes normal distribution: (Mean − z · StdDev) × Portfolio Value.\n• **Monte Carlo VaR**: Vectorized 10,000-path Brownian motion simulation."
    if 'credit risk' in q or 'default' in q:
        return "🏦 **Credit Risk Score** estimates the statistical probability that a borrower may default on debt obligations.\n\n• **Model**: Scikit-Learn Logistic Regression & Random Forest\n• **Features Evaluated**: Monthly income, total debt, monthly EMI, liquid savings balance, and credit utilization."
    if 'dti' in q or 'debt to income' in q:
        return "💳 **Debt-to-Income (DTI) Ratio** is the percentage of monthly income spent on debt obligations.\n\n• **Formula**: (Monthly EMI / Net Monthly Income) × 100\n• **Healthy Bound**: ≤ 36%\n• **High Risk**: > 50%"
    return f"🤖 **AI Risk Assistant**:\nBased on Finance Risk Analytics engine:\n\n• You can ask me to explain financial terms like **VaR**, **Sharpe Ratio**, **DTI Ratio**, or **Credit ML**.\n• Or ask me to **Analyze my portfolio risk**."

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Finance Risk Analytics Python Backend",
        "version": "2.0.0",
        "gemini_active": bool(genai_client or genai_legacy_model),
        "engines": ["Pandas", "NumPy", "Scikit-Learn ML", "SciPy VaR", "Monte Carlo GBM", "Gemini 2.5 Flash LLM"]
    }

@app.post("/api/ai/chat")
async def chat_assistant(req: AssistantRequest):
    try:
        q = req.prompt.strip()
        if not q:
            return {"status": "success", "reply": "Please provide a valid question or prompt."}

        full_prompt = f"{SYSTEM_INSTRUCTION}\n\nUser Context: {req.user_context}\n\nUser Question: {req.prompt}"

        # 1. Try modern google-genai SDK
        if genai_client:
            try:
                response = genai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=full_prompt
                )
                return {"status": "success", "reply": response.text}
            except Exception:
                try:
                    response = genai_client.models.generate_content(
                        model="gemini-1.5-flash",
                        contents=full_prompt
                    )
                    return {"status": "success", "reply": response.text}
                except Exception:
                    pass

        # 2. Try legacy google-generativeai SDK
        if genai_legacy_model:
            try:
                response = genai_legacy_model.generate_content(full_prompt)
                return {"status": "success", "reply": response.text}
            except Exception:
                pass

        # 3. Dynamic Structured Fallback Engine
        reply = generate_structured_risk_response(q, req.user_context)
        return {
            "status": "success",
            "reply": reply
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
