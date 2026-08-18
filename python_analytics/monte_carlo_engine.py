"""
================================================================================
RISKGUARD — VECTORIZED MONTE CARLO SIMULATION ENGINE (NumPy)
================================================================================
Simulates 10,000+ stochastic portfolio growth paths using Geometric Brownian Motion.
"""

import numpy as np


def run_monte_carlo_simulation(initial_value=10000, annual_mu=0.09, annual_sigma=0.16, num_simulations=10000, horizon_months=12, monthly_contribution=0):
    """
    Executes vectorized multi-path stochastic simulation using NumPy array operations.
    """
    initial_val = float(initial_value) if initial_value > 0 else 10000.0
    contribution = float(monthly_contribution)
    months = int(horizon_months)

    # Monthly drift & volatility for GBM
    dt = 1.0 / 12.0
    drift = (annual_mu - 0.5 * (annual_sigma ** 2)) * dt
    vol = annual_sigma * np.sqrt(dt)

    # Generate num_simulations x horizon_months random matrix using NumPy
    z_matrix = np.random.normal(0, 1, size=(num_simulations, months))
    monthly_returns = np.exp(drift + vol * z_matrix) - 1.0

    # Simulate path progression across months
    paths = np.zeros((num_simulations, months + 1))
    paths[:, 0] = initial_val

    for m in range(1, months + 1):
        paths[:, m] = np.maximum(0, (paths[:, m - 1] + contribution) * (1.0 + monthly_returns[:, m - 1]))

    ending_values = paths[:, -1]
    ending_values.sort()

    total_principal = initial_val + (contribution * months)

    # Calculate distribution statistics with NumPy
    mean_ending = float(np.mean(ending_values))
    p5_worst = float(np.percentile(ending_values, 5))
    p25 = float(np.percentile(ending_values, 25))
    p50_median = float(np.percentile(ending_values, 50))
    p75 = float(np.percentile(ending_values, 75))
    p95_best = float(np.percentile(ending_values, 95))

    loss_count = int(np.sum(ending_values < total_principal))
    prob_loss = float((loss_count / num_simulations) * 100.0)

    # Build 10-bin histogram data
    min_val, max_val = float(ending_values[0]), float(ending_values[-1])
    counts, bin_edges = np.histogram(ending_values, bins=10)
    
    histogram = []
    for i in range(len(counts)):
        b_start = bin_edges[i]
        b_end = bin_edges[i + 1]
        histogram.append({
            "bin_label": f"${int(b_start/1000)}k - ${int(b_end/1000)}k",
            "bin_mid": round(float((b_start + b_end) / 2.0), 2),
            "count": int(counts[i]),
            "probability_pct": round(float(counts[i] / num_simulations * 100.0), 2)
        })

    return {
        "num_simulations": num_simulations,
        "horizon_months": months,
        "initial_value": initial_val,
        "total_principal": total_principal,
        "summary": {
            "mean_ending_value": round(mean_ending, 2),
            "p5_worst": round(p5_worst, 2),
            "p25": round(p25, 2),
            "p50_median": round(p50_median, 2),
            "p75": round(p75, 2),
            "p95_best": round(p95_best, 2),
            "probability_of_loss_pct": round(prob_loss, 2),
            "expected_gain": round(mean_ending - total_principal, 2)
        },
        "histogram": histogram
    }


if __name__ == '__main__':
    res = run_monte_carlo_simulation(25000, 0.10, 0.18, 10000, 12, 500)
    print("Monte Carlo Simulation Result (10,000 paths):")
    print(res["summary"])
