/**
 * RiskGuard - Educational Credit Risk Module
 * Documented logistic regression-style scoring model for credit evaluation.
 * Note: Educational tool only, not an official credit bureau FICO score.
 */

function calculateCreditRisk(params) {
  const income = Math.max(0, Number(params.income || 0));
  const existingDebt = Math.max(0, Number(params.existingDebt || 0));
  const loanAmount = Math.max(0, Number(params.loanAmount || 0));
  const creditHistoryMonths = Math.max(0, Number(params.creditHistoryMonths || 12));
  const paymentHistoryScore = Math.min(100, Math.max(0, Number(params.paymentHistoryScore || 100)));
  const missedPayments = Math.max(0, Number(params.missedPayments || 0));

  const annualIncome = income * 12;
  const totalDebt = existingDebt + loanAmount;
  const dti = income > 0 ? (existingDebt / income) * 100 : 100;
  const dtiWithLoan = income > 0 ? (totalDebt / (income * 12)) * 100 : 100;

  // Logistic score logit calculation:
  // Baseline intercept: 2.0
  // Weight 1: Payment History: +0.03 * (score - 50)
  // Weight 2: Missed Payments penalty: -0.85 * missedPayments
  // Weight 3: Credit History Length: +0.02 * min(creditHistoryMonths, 120)
  // Weight 4: Debt-to-Income penalty: -0.04 * dti
  // Weight 5: Loan-to-Income ratio penalty: -0.05 * (loanAmount / (annualIncome || 1))

  const paymentFactor = 0.03 * (paymentHistoryScore - 50);
  const missedPenalty = -0.85 * missedPayments;
  const historyFactor = 0.02 * Math.min(creditHistoryMonths, 120);
  const dtiPenalty = -0.04 * dti;
  const ltiPenalty = -0.05 * (annualIncome > 0 ? (loanAmount / annualIncome) * 100 : 50);

  const logit = 1.5 + paymentFactor + missedPenalty + historyFactor + dtiPenalty + ltiPenalty;

  // Logistic function: P(Good Standing) = 1 / (1 + exp(-logit))
  const probGood = 1 / (1 + Math.exp(-logit));
  const probDefault = Number(((1 - probGood) * 100).toFixed(1));

  // Map probability to FICO-style 300-850 credit risk score
  const creditScore = Math.min(850, Math.max(300, Math.round(300 + probGood * 550)));

  let tier = 'Good';
  let riskLevel = 'Moderate Risk';
  let summary = '';

  if (creditScore >= 750) {
    tier = 'Excellent';
    riskLevel = 'Low Risk';
    summary = 'Low default risk. High likelihood of credit approval with favorable interest rates.';
  } else if (creditScore >= 700) {
    tier = 'Good';
    riskLevel = 'Low-Moderate Risk';
    summary = 'Solid creditworthiness. standard borrowing conditions apply.';
  } else if (creditScore >= 650) {
    tier = 'Fair';
    riskLevel = 'High Risk';
    summary = 'Moderate risk profile. Approval may require collateral or elevated interest rates.';
  } else {
    tier = 'Poor';
    riskLevel = 'Critical Risk';
    summary = 'High default risk profile. Elevated probability of loan rejection.';
  }

  const drivingFactors = [
    {
      factor: 'Payment History',
      impact: paymentHistoryScore >= 90 ? 'Positive' : 'Negative',
      detail: `Payment score of ${paymentHistoryScore}/100 with ${missedPayments} missed payment(s).`
    },
    {
      factor: 'Debt-to-Income (DTI)',
      impact: dti <= 30 ? 'Positive' : 'Negative',
      detail: `Existing debt consumes ${dti.toFixed(1)}% of monthly income.`
    },
    {
      factor: 'Credit History Length',
      impact: creditHistoryMonths >= 36 ? 'Positive' : 'Neutral',
      detail: `${creditHistoryMonths} months of reported credit history.`
    },
    {
      factor: 'Loan-to-Income Burden',
      impact: (loanAmount / (annualIncome || 1)) <= 0.3 ? 'Positive' : 'Negative',
      detail: `Requested loan represents ${((loanAmount / (annualIncome || 1)) * 100).toFixed(1)}% of annual income.`
    }
  ];

  return {
    creditScore,
    tier,
    riskLevel,
    probDefault,
    probGood: Number((probGood * 100).toFixed(1)),
    summary,
    drivingFactors,
    metrics: {
      income,
      existingDebt,
      loanAmount,
      dti: Number(dti.toFixed(1)),
      creditHistoryMonths,
      paymentHistoryScore,
      missedPayments
    },
    disclaimer: 'RiskGuard Credit Risk Score is an educational simulation based on logistic regression modeling and does not constitute an official credit rating or loan approval guarantee.'
  };
}

module.exports = { calculateCreditRisk };
