"""
================================================================================
RISKGUARD — RISK REPORTS & VISUALIZATION GENERATOR (Matplotlib, Seaborn, Pandas)
================================================================================
Generates publication-quality financial risk charts and exports summary reports.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns


def generate_risk_visualizations(daily_returns_list=None, sector_data_dict=None):
    """
    Generates quantitative risk charts using Matplotlib and Seaborn.
    """
    charts_dir = os.path.join(os.path.dirname(__file__), 'charts')
    if not os.path.exists(charts_dir):
        os.makedirs(charts_dir, exist_ok=True)

    sns.set_theme(style="darkgrid")
    generated_files = []

    # 1. Daily Returns & VaR Cutoff Plot
    if daily_returns_list is None:
        returns = np.random.normal(loc=0.0005, scale=0.012, size=252)
    else:
        returns = np.array(daily_returns_list)

    var_cutoff = float(np.percentile(returns, 5))

    fig, ax = plt.subplots(figsize=(8, 4.5))
    sns.histplot(returns, kde=True, ax=ax, color="#0284c7", bins=30)
    ax.axvline(var_cutoff, color="#ef4444", linestyle="--", linewidth=2, label=f"95% Historical VaR Cutoff ({round(var_cutoff*100, 2)}%)")
    ax.set_title("Portfolio Return Distribution & Value at Risk (VaR) Cutoff", fontsize=12, fontweight='bold')
    ax.set_xlabel("Daily Returns")
    ax.set_ylabel("Frequency")
    ax.legend()
    plt.tight_layout()

    var_chart_path = os.path.join(charts_dir, 'var_distribution.png')
    fig.savefig(var_chart_path, dpi=150)
    plt.close(fig)
    generated_files.append(var_chart_path)

    # 2. Sector Allocation Seaborn Bar Chart
    if sector_data_dict:
        df_sector = pd.DataFrame(list(sector_data_dict.items()), columns=['Sector', 'Exposure'])
        fig2, ax2 = plt.subplots(figsize=(8, 4.5))
        sns.barplot(data=df_sector, x='Exposure', y='Sector', palette="Blues_r", ax=ax2)
        ax2.set_title("Portfolio Concentration by Industry Sector", fontsize=12, fontweight='bold')
        ax2.set_xlabel("Total Exposure ($)")
        plt.tight_layout()

        sector_chart_path = os.path.join(charts_dir, 'sector_concentration.png')
        fig2.savefig(sector_chart_path, dpi=150)
        plt.close(fig2)
        generated_files.append(sector_chart_path)

    return generated_files


if __name__ == '__main__':
    sample_sectors = {"Technology": 15000, "Government": 10000, "Financials": 8000, "Real Estate": 5000}
    files = generate_risk_visualizations(sector_data_dict=sample_sectors)
    print("Generated Python Risk Charts:")
    print(files)
