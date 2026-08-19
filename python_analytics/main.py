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
You are an expert Financial Risk AI Assistant embedded in a financial analytics platform.
Your response guidelines:
1. Explain financial definitions, risk metrics (VaR, Sharpe ratio, Debt ratios, Credit Risk) in short, simple, plain English terms.
2. DO NOT use complex LaTeX formulas, raw code equations, or heavy mathematical notation unless explicitly requested.
3. Keep responses structured using bullet points, short clear sentences, and lightweight bold headers (**Concept**).
4. Format currency figures in Indian Rupees (₹) when referencing user portfolio context.
"""

def generate_structured_risk_response(query: str, context: dict) -> str:
    q = query.lower().strip()
    if 'monthly debt service' in q or 'debt service' in q or 'monthly debt' in q:
        return "💳 **Monthly Debt Service** is the total amount of money you must pay each month toward all active debts and loans (like credit card EMIs, car loans, and home mortgages).\n\n• **Why it matters**: Lenders evaluate this to determine if you can comfortably afford new credit without risking default.\n• **Best Practice**: Financial advisors recommend keeping total monthly debt payments below 36% of your net income."
    if 'what is var' in q or 'value at risk' in q:
        return "📈 **Value at Risk (VaR)** is a metric that estimates the maximum expected financial loss your portfolio could face over a given timeframe (like 1 day) under normal market conditions."
    if 'credit risk' in q or 'default' in q:
        return "🏦 **Credit Default Risk** is the statistical probability that a borrower might fail to make their required debt payments on time."
    if 'dti' in q or 'debt to income' in q:
        return "💳 **Debt-to-Income (DTI) Ratio** compares your total monthly debt payments against your net monthly income."
    return f"🤖 **AI Risk Assistant**:\nI can answer questions about:\n\n• **Monthly Debt Service** & **DTI Ratio**\n• **Value at Risk (VaR)** & **Sharpe Ratio**\n• **Credit Default Risk Score**\n• **Personal Financial Risk Analysis**"

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
