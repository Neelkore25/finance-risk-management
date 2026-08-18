"""
================================================================================
RISKGUARD — PORTFOLIO ANALYTICS MODULE (Pandas & NumPy)
================================================================================
Calculates portfolio weights, sector exposure, asset class distribution,
covariance matrices, and Herfindahl-Hirschman Concentration Index (HHI).
"""

import numpy as np
import pandas as pd


def analyze_holdings(holdings_list):
    """
    Processes a list of asset holding dicts into a Pandas DataFrame
    and computes matrix operations using NumPy.
    """
    if not holdings_list:
        return {
            "total_portfolio_value": 0.0,
            "asset_count": 0,
            "hhi_index": 0.0,
            "largest_holding_pct": 0.0,
            "asset_class_breakdown": {},
            "sector_breakdown": {}
        }

    # Convert list of dicts to Pandas DataFrame
    df = pd.DataFrame(holdings_list)

    # Clean data types with Pandas
    df['quantity'] = pd.to_numeric(df.get('quantity', 1), errors='coerce').fillna(1.0)
    df['current_price'] = pd.to_numeric(df.get('current_price', 0), errors='coerce').fillna(0.0)
    
    # Calculate Market Value column
    if 'amount_value' in df.columns and df['amount_value'].sum() > 0:
        df['market_value'] = pd.to_numeric(df['amount_value'], errors='coerce').fillna(0.0)
    else:
        df['market_value'] = df['quantity'] * df['current_price']

    total_value = float(df['market_value'].sum())

    if total_value <= 0:
        return {
            "total_portfolio_value": 0.0,
            "asset_count": len(df),
            "hhi_index": 0.0,
            "largest_holding_pct": 0.0,
            "asset_class_breakdown": {},
            "sector_breakdown": {}
        }

    # Vectorized Portfolio Weight calculation using NumPy
    market_values = df['market_value'].values
    weights = market_values / total_value
    df['weight'] = weights

    # Herfindahl-Hirschman Concentration Index (HHI = sum(w_i^2))
    hhi_index = float(np.sum(weights ** 2))
    largest_holding_pct = float(np.max(weights) * 100.0)

    # Groupings using Pandas
    asset_types = df.groupby('asset_type')['market_value'].sum()
    asset_breakdown = {k: float(v) for k, v in asset_types.items()}

    sectors = df.groupby('sector')['market_value'].sum()
    sector_breakdown = {k: float(v) for k, v in sectors.items()}

    return {
        "total_portfolio_value": round(total_value, 2),
        "asset_count": int(len(df)),
        "hhi_index": round(hhi_index, 4),
        "largest_holding_pct": round(largest_holding_pct, 2),
        "asset_class_breakdown": asset_breakdown,
        "sector_breakdown": sector_breakdown
    }


if __name__ == '__main__':
    sample_data = [
        {"asset_name": "Apple Inc", "asset_type": "Stocks", "sector": "Technology", "quantity": 50, "current_price": 180, "amount_value": 9000},
        {"asset_name": "US Treasury Bond", "asset_type": "Bonds", "sector": "Government", "quantity": 10, "current_price": 1000, "amount_value": 10000},
        {"asset_name": "S&P 500 ETF", "asset_type": "Mutual Funds", "sector": "General", "quantity": 100, "current_price": 450, "amount_value": 45000}
    ]
    res = analyze_holdings(sample_data)
    print("Portfolio Analysis Result:")
    print(res)
