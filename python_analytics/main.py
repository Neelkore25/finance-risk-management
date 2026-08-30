import os
import re
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd

from credit_risk_ml import train_and_predict_credit_risk
from quantitative_var import calculate_portfolio_var, calculate_quantitative_var
from monte_carlo_engine import run_monte_carlo_simulation, run_monte_carlo_gbm
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

from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

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

static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    assets_path = os.path.join(static_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/")
def serve_root_frontend():
    index_file = os.path.join(static_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Finance Risk Analytics API</h1><p>Visit <a href='/docs'>/docs</a> for API documentation.</p>")

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
    portfolio_holdings: Optional[List[Dict[str, Any]]] = []

class WhatIfRequest(BaseModel):
    income_change_pct: float = 0.0
    expense_change_pct: float = 0.0
    additional_debt_emi: float = 0.0

class AssistantRequest(BaseModel):
    user_id: str = "guest"
    prompt: str
    user_context: Optional[Dict[str, Any]] = {}

class UnifiedAssistantRequest(BaseModel):
    prompt: str
    mode: str = "chat"  # "chat" or "parse_step"
    step_key: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = {}
    user_id: Optional[str] = "guest"

SYSTEM_INSTRUCTION = """
You are an expert Financial Risk AI Assistant embedded in a financial analytics platform.
Your response guidelines:
1. Explain financial definitions, risk metrics (VaR, Sharpe ratio, Debt ratios, Credit Risk) in short, simple, plain English terms.
2. DO NOT use complex LaTeX formulas, raw code equations, or heavy mathematical notation unless explicitly requested.
3. Keep responses structured using bullet points, short clear sentences, and lightweight bold headers (**Concept**).
4. Format currency figures in Indian Rupees (₹) when referencing user portfolio context.
"""

def parse_step_value(text: str, step_key: str = None):
    raw_str = text.lower().strip()
    
    # 1. Handle shorthand patterns: 75k, 80.5k
    k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', raw_str)
    if k_match:
        val = int(round(float(k_match[1]) * 1000))
        return {"valid": True, "cleaned_value": val, "detected_typo": f"Parsed '{k_match[0]}' as ₹{val:,}"}

    # 2. Handle lakh patterns: 1.5 lakh, 2 lakhs
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)\b', raw_str)
    if lakh_match:
        val = int(round(float(lakh_match[1]) * 100000))
        return {"valid": True, "cleaned_value": val, "detected_typo": f"Parsed '{lakh_match[0]}' as ₹{val:,}"}

    # 3. Handle raw digits
    digits = re.sub(r'[^\d.]', '', raw_str)
    if digits:
        try:
            val = int(round(float(digits)))
            if val >= 0:
                return {"valid": True, "cleaned_value": val, "detected_typo": None}
        except ValueError:
            pass

    return {"valid": False, "cleaned_value": None, "detected_typo": "Could not parse amount"}

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

@app.post("/api/ai/assistant")
async def unified_assistant(req: UnifiedAssistantRequest):
    try:
        q = req.prompt.strip()
        if not q:
            return {"status": "error", "message": "Empty prompt."}

        # MODE A: PARSE STEP VALUE (Typo-resilient extraction)
        if req.mode == "parse_step":
            res = parse_step_value(q, req.step_key)
            if not res["valid"] and (genai_client or genai_legacy_model):
                try:
                    prompt = f"Extract only the numeric value in Indian Rupees from: '{q}' for {req.step_key}. Return ONLY valid JSON: {{\"valid\": true, \"cleaned_value\": 75000, \"detected_typo\": \"Parsed text as number\"}}"
                    if genai_client:
                        llm_out = genai_client.models.generate_content(model="gemini-2.5-flash", contents=prompt).text
                    elif genai_legacy_model:
                        llm_out = genai_legacy_model.generate_content(prompt).text
                    json_match = re.search(r'\{.*\}', llm_out, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                except Exception:
                    pass
            return res

        # MODE B: CHAT / DEFINITION QUESTION
        full_prompt = f"{SYSTEM_INSTRUCTION}\n\nUser Context: {req.user_context}\n\nUser Question: {req.prompt}"

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

        if genai_legacy_model:
            try:
                response = genai_legacy_model.generate_content(full_prompt)
                return {"status": "success", "reply": response.text}
            except Exception:
                pass

        reply = generate_structured_risk_response(q, req.user_context)
        return {"status": "success", "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat")
async def chat_assistant(req: AssistantRequest):
    unified_req = UnifiedAssistantRequest(
        prompt=req.prompt,
        mode="chat",
        user_context=req.user_context,
        user_id=req.user_id
    )
    return await unified_assistant(unified_req)

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
    var_result = calculate_portfolio_var(
        portfolio_value=req.portfolio_value,
        confidence_level=req.confidence_level,
        time_horizon_days=req.time_horizon_days,
        portfolio_holdings=req.portfolio_holdings
    )
    mc_result = run_monte_carlo_simulation(
        initial_value=req.portfolio_value,
        num_simulations=1000,
        horizon_months=12
    )
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
