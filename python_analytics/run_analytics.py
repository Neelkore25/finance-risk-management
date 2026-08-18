"""
RiskGuard Python Analytics CLI Runner
Triggers Python NumPy/Pandas quantitative risk models and exports outputs.
"""

import sys
import json
from risk_analytics import run_sample_analytics

def main():
    print("==================================================")
    print("  RISKGUARD PYTHON FINANCIAL DATA ANALYTICS SUITE ")
    print("==================================================")
    
    report = run_sample_analytics()
    print("\n--- Analytics Report Output ---")
    print(json.dumps(report, indent=2))
    
    # Save output report JSON
    with open('python_analytics_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print("\n[SUCCESS] Report exported to python_analytics_report.json")

if __name__ == '__main__':
    main()
