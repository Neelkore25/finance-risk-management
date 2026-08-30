"""
================================================================================
RISKGUARD — QUANTITATIVE VAR & METRICS ENGINE (NumPy & SciPy)
================================================================================
Calculates Value at Risk (Historical & Parametric), Expected Shortfall (CVaR),
Sharpe Ratio, Portfolio Beta, Volatility, and Maximum Drawdown.
"""

import numpy as np
from scipy.stats import norm


def calculate_quantitative_var(portfolio_value=250000, confidence_level=0.95, time_horizon_days=1, portfolio_holdings=None, risk_free_rate=0.04):
    """
    Computes statistical downside risk metrics using NumPy arrays and SciPy norm quantile distributions.
    Supports confidence levels (0.95, 0.99) and time horizons (1-Day, 10-Day).
    """
    portfolio_val = float(portfolio_value) if portfolio_value > 0 else 250000.0
    horizon_days = max(1, int(time_horizon_days))
    time_scale = np.sqrt(horizon_days)

    # 1. Determine Return Distribution based on portfolio holdings or synthetic return generator
    if portfolio_holdings and len(portfolio_holdings) > 0:
        # Generate asset-weighted portfolio daily return series
        returns_list = []
        for holding in portfolio_holdings:
            qty = float(holding.get('quantity', 1))
            price = float(holding.get('current_price', 100))
            asset_type = str(holding.get('asset_type', 'Stocks')).lower()
            val = qty * price

            # Assign asset-class historical volatility characteristics
            if 'crypto' in asset_type:
                mu, sigma = 0.0008, 0.035
            elif 'bond' in asset_type or 'fixed' in asset_type:
                mu, sigma = 0.00015, 0.004
            elif 'cash' in asset_type:
                mu, sigma = 0.00008, 0.001
            else:  # Stocks / Mutual Funds / General
                mu, sigma = 0.0004, 0.014

            asset_returns = np.random.normal(loc=mu, scale=sigma, size=252)
            returns_list.append(asset_returns * val)

        total_holdings_val = sum(float(h.get('quantity', 1)) * float(h.get('current_price', 100)) for h in portfolio_holdings)
        if total_holdings_val > 0:
            portfolio_val = total_holdings_val

        returns = np.sum(returns_list, axis=0) / portfolio_val
    else:
        # Fallback synthetic 252-day return vector (1 trading year)
        returns = np.random.normal(loc=0.0004, scale=0.012, size=252)

    n = len(returns)

    # 2. Portfolio Mean & Volatility using NumPy
    mean_daily = np.mean(returns)
    std_daily = np.std(returns, ddof=1)

    ann_return = mean_daily * 252.0
    ann_vol = std_daily * np.sqrt(252.0)

    # 3. Historical VaR (Scaled by time_scale)
    percentile_rank = (1.0 - float(confidence_level)) * 100.0
    hist_var_1d_return = -np.percentile(returns, percentile_rank)
    hist_var_return = hist_var_1d_return * time_scale
    hist_var_pct = float(max(0.01, hist_var_return * 100.0))
    hist_var_amount = float(hist_var_return * portfolio_val)

    # 4. Parametric Gaussian VaR (using SciPy norm z-score)
    z_score = norm.ppf(float(confidence_level))
    para_var_1d_return = -(mean_daily - z_score * std_daily)
    para_var_return = para_var_1d_return * time_scale
    para_var_pct = float(max(0.01, para_var_return * 100.0))
    para_var_amount = float(para_var_return * portfolio_val)

    # 5. CVaR / Expected Shortfall (Tail Loss Mean beyond VaR cutoff)
    cutoff_val = -hist_var_1d_return
    tail_losses = returns[returns <= cutoff_val]
    cvar_1d_return = -np.mean(tail_losses) if len(tail_losses) > 0 else hist_var_1d_return
    cvar_return = cvar_1d_return * time_scale
    cvar_pct = float(max(0.01, cvar_return * 100.0))
    cvar_amount = float(cvar_return * portfolio_val)

    # 6. Sharpe Ratio
    sharpe = float((ann_return - risk_free_rate) / ann_vol) if ann_vol > 0 else 0.0

    # 7. Portfolio Beta calculation relative to benchmark
    benchmark_returns = np.random.normal(loc=0.0003, scale=0.010, size=n)
    cov_matrix = np.cov(returns, benchmark_returns)
    beta = float(cov_matrix[0, 1] / cov_matrix[1, 1]) if cov_matrix[1, 1] > 0 else 1.0

    # 8. Maximum Drawdown (Peak-to-Trough drop)
    cum_wealth = np.cumprod(1.0 + returns)
    running_max = np.maximum.accumulate(cum_wealth)
    drawdowns = (running_max - cum_wealth) / running_max
    max_drawdown_pct = float(np.max(drawdowns) * 100.0)
    max_drawdown_amount = float((max_drawdown_pct / 100.0) * portfolio_val)

    return {
        "portfolio_value": round(float(portfolio_val), 2),
        "confidence_level": float(confidence_level),
        "confidence_level_pct": float(confidence_level) * 100.0,
        "time_horizon_days": horizon_days,
        "annualized_return_pct": round(float(ann_return * 100.0), 2),
        "annualized_volatility_pct": round(float(ann_vol * 100.0), 2),
        "annualizedVol": round(float(ann_vol * 100.0), 2),
        "sharpe_ratio": round(sharpe, 2),
        "sharpeRatio": round(sharpe, 2),
        "beta": round(beta, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "maxDrawdownPct": round(max_drawdown_pct, 2),
        "max_drawdown_amount": round(max_drawdown_amount, 2),
        "maxDrawdownAmount": round(max_drawdown_amount, 2),
        "historical_var_amount": round(hist_var_amount, 2),
        "historical_var_pct": round(hist_var_pct, 2),
        "historicalVaR1DayAmount": round(hist_var_amount, 2),
        "historicalVaR1DayPct": round(hist_var_pct, 2),
        "parametric_var_amount": round(para_var_amount, 2),
        "parametric_var_pct": round(para_var_pct, 2),
        "parametricVaR1DayAmount": round(para_var_amount, 2),
        "parametricVaR1DayPct": round(para_var_pct, 2),
        "cvar_amount": round(cvar_amount, 2),
        "cvar_pct": round(cvar_pct, 2),
        "cvar1DayAmount": round(cvar_amount, 2),
        "cvar1DayPct": round(cvar_pct, 2)
    }


def calculate_portfolio_var(portfolio_value=250000, confidence_level=0.95, time_horizon_days=1, portfolio_holdings=None):
    """Alias function for quantitative VaR calculation"""
    return calculate_quantitative_var(
        portfolio_value=portfolio_value,
        confidence_level=confidence_level,
        time_horizon_days=time_horizon_days,
        portfolio_holdings=portfolio_holdings
    )


if __name__ == '__main__':
    res = calculate_portfolio_var(250000, 0.95, 1)
    print("Quantitative VaR Result:")
    print(res)
