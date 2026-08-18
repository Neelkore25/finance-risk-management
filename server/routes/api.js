const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const { calculatePersonalRisk } = require('../services/riskEngine');
const { calculateCreditRisk } = require('../services/creditRisk');
const { calculatePortfolioRisk } = require('../services/portfolioRisk');
const { runMonteCarloSimulation } = require('../services/monteCarlo');
const { generateRecommendations } = require('../services/recommendationEngine');
const { generateAlerts } = require('../services/alertEngine');
const { generateCSVReport } = require('../services/reportGenerator');

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

router.post('/auth/register', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = db.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)')
      .run(email.toLowerCase(), password_hash, fullName);

    const userId = result.lastInsertRowid;

    // Create default financial profile
    db.prepare(`
      INSERT INTO financial_profiles (user_id, monthly_income, monthly_essential_expenses, monthly_discretionary_expenses, existing_savings, emergency_fund, monthly_debt_payment)
      VALUES (?, 5000, 2000, 800, 10000, 6000, 400)
    `).run(userId);

    // Create default settings
    db.prepare('INSERT INTO user_settings (user_id, theme_preference) VALUES (?, ?)').run(userId, 'dark');

    const token = jwt.sign({ userId, email: email.toLowerCase(), fullName }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, email: email.toLowerCase(), fullName }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, fullName: user.full_name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(444).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ==========================================
// 2. FINANCIAL PROFILE & CRUD ROUTES
// ==========================================

router.get('/profile', authMiddleware, (req, res) => {
  try {
    let profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId);
    if (!profile) {
      db.prepare('INSERT INTO financial_profiles (user_id) VALUES (?)').run(req.user.userId);
      profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId);
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch financial profile.' });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  const { monthly_income, monthly_essential_expenses, monthly_discretionary_expenses, existing_savings, emergency_fund, monthly_debt_payment } = req.body;

  try {
    db.prepare(`
      UPDATE financial_profiles
      SET monthly_income = ?,
          monthly_essential_expenses = ?,
          monthly_discretionary_expenses = ?,
          existing_savings = ?,
          emergency_fund = ?,
          monthly_debt_payment = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      Math.max(0, Number(monthly_income || 0)),
      Math.max(0, Number(monthly_essential_expenses || 0)),
      Math.max(0, Number(monthly_discretionary_expenses || 0)),
      Math.max(0, Number(existing_savings || 0)),
      Math.max(0, Number(emergency_fund || 0)),
      Math.max(0, Number(monthly_debt_payment || 0)),
      req.user.userId
    );

    const updated = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId);
    res.json({ profile: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update financial profile.' });
  }
});

// EXPENSES CRUD
router.get('/expenses', authMiddleware, (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').all(req.user.userId);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

router.post('/expenses', authMiddleware, (req, res) => {
  const { name, amount, category, is_essential, date } = req.body;
  if (!name || amount === undefined || !category) {
    return res.status(400).json({ error: 'Expense name, amount, and category are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO expenses (user_id, name, amount, category, is_essential, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      name,
      Math.max(0, Number(amount)),
      category,
      is_essential ? 1 : 0,
      date || new Date().toISOString().split('T')[0]
    );

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ expense: newExpense });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense.' });
  }
});

router.put('/expenses/:id', authMiddleware, (req, res) => {
  const { name, amount, category, is_essential, date } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    db.prepare(`
      UPDATE expenses
      SET name = ?, amount = ?, category = ?, is_essential = ?, date = ?
      WHERE id = ? AND user_id = ?
    `).run(name, Math.max(0, Number(amount)), category, is_essential ? 1 : 0, date, req.params.id, req.user.userId);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json({ expense: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense.' });
  }
});

router.delete('/expenses/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

// DEBTS CRUD
router.get('/debts', authMiddleware, (req, res) => {
  try {
    const debts = db.prepare('SELECT * FROM debts WHERE user_id = ? ORDER BY outstanding_amount DESC').all(req.user.userId);
    res.json({ debts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch debts.' });
  }
});

router.post('/debts', authMiddleware, (req, res) => {
  const { name, debt_type, outstanding_amount, interest_rate, monthly_payment, due_date } = req.body;
  if (!name || !debt_type || outstanding_amount === undefined) {
    return res.status(400).json({ error: 'Debt name, type, and outstanding amount are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO debts (user_id, name, debt_type, outstanding_amount, interest_rate, monthly_payment, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      name,
      debt_type,
      Math.max(0, Number(outstanding_amount)),
      Math.max(0, Number(interest_rate || 0)),
      Math.max(0, Number(monthly_payment || 0)),
      due_date || null
    );

    const newDebt = db.prepare('SELECT * FROM debts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ debt: newDebt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add debt.' });
  }
});

router.put('/debts/:id', authMiddleware, (req, res) => {
  const { name, debt_type, outstanding_amount, interest_rate, monthly_payment, due_date } = req.body;
  try {
    const result = db.prepare(`
      UPDATE debts
      SET name = ?, debt_type = ?, outstanding_amount = ?, interest_rate = ?, monthly_payment = ?, due_date = ?
      WHERE id = ? AND user_id = ?
    `).run(name, debt_type, Math.max(0, Number(outstanding_amount)), Math.max(0, Number(interest_rate || 0)), Math.max(0, Number(monthly_payment || 0)), due_date, req.params.id, req.user.userId);

    if (result.changes === 0) return res.status(404).json({ error: 'Debt not found.' });
    const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(req.params.id);
    res.json({ debt: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update debt.' });
  }
});

router.delete('/debts/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Debt not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete debt.' });
  }
});

// INVESTMENTS CRUD
router.get('/investments', authMiddleware, (req, res) => {
  try {
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY amount_value DESC').all(req.user.userId);
    res.json({ investments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch investments.' });
  }
});

router.post('/investments', authMiddleware, (req, res) => {
  const { asset_name, asset_type, sector, quantity, current_price, amount_value } = req.body;
  if (!asset_name || !asset_type) {
    return res.status(400).json({ error: 'Asset name and type are required.' });
  }

  const q = Math.max(0, Number(quantity || 1));
  const p = Math.max(0, Number(current_price || 0));
  const val = Math.max(0, Number(amount_value || (q * p)));

  try {
    const result = db.prepare(`
      INSERT INTO investments (user_id, asset_name, asset_type, sector, quantity, current_price, amount_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, asset_name, asset_type, sector || 'General', q, p, val);

    const newInv = db.prepare('SELECT * FROM investments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ investment: newInv });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add investment.' });
  }
});

router.put('/investments/:id', authMiddleware, (req, res) => {
  const { asset_name, asset_type, sector, quantity, current_price, amount_value } = req.body;
  const q = Math.max(0, Number(quantity || 1));
  const p = Math.max(0, Number(current_price || 0));
  const val = Math.max(0, Number(amount_value || (q * p)));

  try {
    const result = db.prepare(`
      UPDATE investments
      SET asset_name = ?, asset_type = ?, sector = ?, quantity = ?, current_price = ?, amount_value = ?
      WHERE id = ? AND user_id = ?
    `).run(asset_name, asset_type, sector, q, p, val, req.params.id, req.user.userId);

    if (result.changes === 0) return res.status(404).json({ error: 'Investment not found.' });
    const updated = db.prepare('SELECT * FROM investments WHERE id = ?').get(req.params.id);
    res.json({ investment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update investment.' });
  }
});

router.delete('/investments/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM investments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Investment not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete investment.' });
  }
});

// GOALS CRUD
router.get('/goals', authMiddleware, (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC').all(req.user.userId);
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
});

router.post('/goals', authMiddleware, (req, res) => {
  const { name, target_amount, current_amount, target_date, monthly_contribution } = req.body;
  if (!name || target_amount === undefined || !target_date) {
    return res.status(400).json({ error: 'Goal name, target amount, and target date are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, monthly_contribution)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      name,
      Math.max(0, Number(target_amount)),
      Math.max(0, Number(current_amount || 0)),
      target_date,
      Math.max(0, Number(monthly_contribution || 0))
    );

    const newGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ goal: newGoal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add goal.' });
  }
});

router.put('/goals/:id', authMiddleware, (req, res) => {
  const { name, target_amount, current_amount, target_date, monthly_contribution } = req.body;
  try {
    const result = db.prepare(`
      UPDATE goals
      SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, monthly_contribution = ?
      WHERE id = ? AND user_id = ?
    `).run(name, Math.max(0, Number(target_amount)), Math.max(0, Number(current_amount || 0)), target_date, Math.max(0, Number(monthly_contribution || 0)), req.params.id, req.user.userId);

    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found.' });
    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    res.json({ goal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal.' });
  }
});

router.delete('/goals/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

// ==========================================
// 3. RISK ENGINES & CALCULATIONS
// ==========================================

router.get('/risk/personal', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};
    const expenses = db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user.userId);
    const debts = db.prepare('SELECT * FROM debts WHERE user_id = ?').all(req.user.userId);
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.userId);

    const assessment = calculatePersonalRisk(profile, expenses, debts, investments, goals);

    // Save history snapshot
    db.prepare(`
      INSERT INTO risk_history (user_id, overall_score, debt_risk, liquidity_risk, emergency_fund_risk, cash_flow_risk, investment_concentration_risk, goal_risk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      assessment.overallScore,
      assessment.categories.debtRisk.score,
      assessment.categories.liquidityRisk.score,
      assessment.categories.emergencyFundRisk.score,
      assessment.categories.cashFlowRisk.score,
      assessment.categories.investmentConcentrationRisk.score,
      assessment.categories.goalRisk.score
    );

    res.json({ assessment });
  } catch (err) {
    console.error('Personal Risk Error:', err);
    res.status(500).json({ error: 'Failed to calculate personal risk.' });
  }
});

router.get('/risk/portfolio', authMiddleware, (req, res) => {
  try {
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const confidenceLevel = Number(req.query.confidence || 0.95);
    const portfolioRisk = calculatePortfolioRisk(investments, { confidenceLevel });
    res.json({ portfolioRisk });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate portfolio risk.' });
  }
});

router.post('/risk/monte-carlo', authMiddleware, (req, res) => {
  try {
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const options = {
      numSimulations: Number(req.body.numSimulations || 1000),
      horizonMonths: Number(req.body.horizonMonths || 12),
      initialValue: req.body.initialValue ? Number(req.body.initialValue) : undefined,
      monthlyContribution: Number(req.body.monthlyContribution || 0)
    };
    const simulation = runMonteCarloSimulation(investments, options);
    res.json({ simulation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run Monte Carlo simulation.' });
  }
});

router.post('/risk/credit', authMiddleware, (req, res) => {
  try {
    const params = req.body;
    const result = calculateCreditRisk(params);

    // Save credit risk profile to DB
    db.prepare(`
      INSERT INTO credit_risk_profiles (user_id, income, existing_debt, credit_history_months, payment_history_score, missed_payments, loan_amount, score, tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        income = excluded.income,
        existing_debt = excluded.existing_debt,
        credit_history_months = excluded.credit_history_months,
        payment_history_score = excluded.payment_history_score,
        missed_payments = excluded.missed_payments,
        loan_amount = excluded.loan_amount,
        score = excluded.score,
        tier = excluded.tier,
        calculated_at = CURRENT_TIMESTAMP
    `).run(
      req.user.userId,
      result.metrics.income,
      result.metrics.existingDebt,
      result.metrics.creditHistoryMonths,
      result.metrics.paymentHistoryScore,
      result.metrics.missedPayments,
      result.metrics.loanAmount,
      result.creditScore,
      result.tier
    );

    res.json({ creditRisk: result });
  } catch (err) {
    console.error('Credit Risk Error:', err);
    res.status(500).json({ error: 'Failed to calculate credit risk.' });
  }
});

router.get('/risk/credit', authMiddleware, (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM credit_risk_profiles WHERE user_id = ?').get(req.user.userId);
    if (!record) {
      // Return default simulation parameters
      const defaultProfile = calculateCreditRisk({
        income: 5000,
        existingDebt: 12000,
        creditHistoryMonths: 36,
        paymentHistoryScore: 95,
        missedPayments: 0,
        loanAmount: 15000
      });
      return res.json({ creditRisk: defaultProfile });
    }

    const calculated = calculateCreditRisk({
      income: record.income,
      existingDebt: record.existing_debt,
      creditHistoryMonths: record.credit_history_months,
      paymentHistoryScore: record.payment_history_score,
      missedPayments: record.missed_payments,
      loanAmount: record.loan_amount
    });

    res.json({ creditRisk: calculated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch credit risk.' });
  }
});

// WHAT-IF SIMULATION ROUTE (Reusable engine, zero DB mutations)
router.post('/simulator/what-if', authMiddleware, (req, res) => {
  try {
    const { incomeChangePct, expenseChangePct, additionalSavings, additionalDebt, emergencySavingsChange, investmentAllocation } = req.body;

    const baseProfile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};
    const baseExpenses = db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user.userId);
    const baseDebts = db.prepare('SELECT * FROM debts WHERE user_id = ?').all(req.user.userId);
    const baseInvestments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const baseGoals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.userId);

    // Calculate baseline
    const baselineAssessment = calculatePersonalRisk(baseProfile, baseExpenses, baseDebts, baseInvestments, baseGoals);

    // Apply what-if adjustments
    const incMult = 1 + (Number(incomeChangePct || 0) / 100);
    const expMult = 1 + (Number(expenseChangePct || 0) / 100);

    const simProfile = {
      ...baseProfile,
      monthly_income: Math.max(0, Number(baseProfile.monthly_income || 0) * incMult),
      monthly_essential_expenses: Math.max(0, Number(baseProfile.monthly_essential_expenses || 0) * expMult),
      monthly_discretionary_expenses: Math.max(0, Number(baseProfile.monthly_discretionary_expenses || 0) * expMult),
      existing_savings: Math.max(0, Number(baseProfile.existing_savings || 0) + Number(additionalSavings || 0)),
      emergency_fund: Math.max(0, Number(baseProfile.emergency_fund || 0) + Number(emergencySavingsChange || 0)),
      monthly_debt_payment: Math.max(0, Number(baseProfile.monthly_debt_payment || 0) + Number(additionalDebt || 0))
    };

    const simAssessment = calculatePersonalRisk(simProfile, baseExpenses, baseDebts, baseInvestments, baseGoals);

    const scoreDelta = simAssessment.overallScore - baselineAssessment.overallScore;

    res.json({
      baselineScore: baselineAssessment.overallScore,
      baselineLevel: baselineAssessment.overallLevel,
      simulatedScore: simAssessment.overallScore,
      simulatedLevel: simAssessment.overallLevel,
      scoreDelta,
      impactStatus: scoreDelta < 0 ? 'Improved Resilience' : (scoreDelta > 0 ? 'Increased Vulnerability' : 'Unchanged'),
      baselineCategories: baselineAssessment.categories,
      simulatedCategories: simAssessment.categories,
      simulatedMetrics: simAssessment.metrics
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute What-If simulation.' });
  }
});

// RECOMMENDATIONS & ALERTS
router.get('/recommendations', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};
    const expenses = db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user.userId);
    const debts = db.prepare('SELECT * FROM debts WHERE user_id = ?').all(req.user.userId);
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.userId);

    const riskAssessment = calculatePersonalRisk(profile, expenses, debts, investments, goals);
    const portfolioRisk = calculatePortfolioRisk(investments);

    const recommendations = generateRecommendations(riskAssessment, portfolioRisk);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

router.get('/alerts', authMiddleware, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};
    const expenses = db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user.userId);
    const debts = db.prepare('SELECT * FROM debts WHERE user_id = ?').all(req.user.userId);
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.userId);

    const riskAssessment = calculatePersonalRisk(profile, expenses, debts, investments, goals);
    const portfolioRisk = calculatePortfolioRisk(investments);

    const alertData = generateAlerts(riskAssessment, portfolioRisk);
    res.json(alertData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

router.get('/risk/history', authMiddleware, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM risk_history
      WHERE user_id = ?
      ORDER BY recorded_at ASC
      LIMIT 30
    `).all(req.user.userId);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk history.' });
  }
});

// CSV REPORT DOWNLOAD
router.get('/reports/csv', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT full_name as fullName, email FROM users WHERE id = ?').get(req.user.userId);
    const profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};
    const expenses = db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user.userId);
    const debts = db.prepare('SELECT * FROM debts WHERE user_id = ?').all(req.user.userId);
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.userId);

    const riskAssessment = calculatePersonalRisk(profile, expenses, debts, investments, goals);
    const portfolioRisk = calculatePortfolioRisk(investments);
    const creditRecord = db.prepare('SELECT * FROM credit_risk_profiles WHERE user_id = ?').get(req.user.userId);
    const creditRisk = creditRecord ? calculateCreditRisk({
      income: creditRecord.income,
      existingDebt: creditRecord.existing_debt,
      creditHistoryMonths: creditRecord.credit_history_months,
      paymentHistoryScore: creditRecord.payment_history_score,
      missedPayments: creditRecord.missed_payments,
      loanAmount: creditRecord.loan_amount
    }) : null;

    const csvData = generateCSVReport(user, riskAssessment, portfolioRisk, creditRisk);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=RiskGuard_Report_${user.fullName.replace(/\s+/g, '_')}.csv`);
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate CSV report.' });
  }
});

// SETTINGS
router.get('/settings', authMiddleware, (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.userId);
    if (!settings) {
      db.prepare('INSERT INTO user_settings (user_id, theme_preference) VALUES (?, ?)').run(req.user.userId, 'dark');
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.userId);
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', authMiddleware, (req, res) => {
  try {
    const { theme_preference } = req.body;
    db.prepare('UPDATE user_settings SET theme_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(theme_preference || 'dark', req.user.userId);
    const updated = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.userId);
    res.json({ settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// PYTHON ANALYTICS MODULE INTEGRATION
const { runPythonAnalytics } = require('../services/pythonBridge');

router.get('/analytics/python', authMiddleware, async (req, res) => {
  try {
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ?').all(req.user.userId);
    const profile = db.prepare('SELECT * FROM financial_profiles WHERE user_id = ?').get(req.user.userId) || {};

    const pyResult = await runPythonAnalytics('all', { investments, profile });

    res.json({
      engine: 'Python Data Analytics Suite (NumPy, Pandas, SciPy, Scikit-Learn)',
      pythonBridge: pyResult,
      status: 'active'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run Python analytics endpoint.' });
  }
});

module.exports = router;
