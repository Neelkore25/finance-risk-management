const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'riskguard.db');

let sqlDb = null;

// Helper to save DB to disk file
function saveDisk() {
  if (!sqlDb) return;
  try {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to write database to disk:', err);
  }
}

// Synchronous initialization using sql.js
async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  // Execute Schema Initializations
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS financial_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      monthly_income REAL DEFAULT 0,
      monthly_essential_expenses REAL DEFAULT 0,
      monthly_discretionary_expenses REAL DEFAULT 0,
      existing_savings REAL DEFAULT 0,
      emergency_fund REAL DEFAULT 0,
      monthly_debt_payment REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      is_essential INTEGER DEFAULT 1,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      debt_type TEXT NOT NULL,
      outstanding_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      monthly_payment REAL NOT NULL,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      asset_name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      sector TEXT NOT NULL,
      quantity REAL NOT NULL,
      current_price REAL NOT NULL,
      amount_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      target_date TEXT NOT NULL,
      monthly_contribution REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credit_risk_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      income REAL NOT NULL,
      existing_debt REAL NOT NULL,
      credit_history_months INTEGER NOT NULL,
      payment_history_score INTEGER NOT NULL,
      missed_payments INTEGER NOT NULL,
      loan_amount REAL NOT NULL,
      score INTEGER NOT NULL,
      tier TEXT NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      debt_risk INTEGER NOT NULL,
      liquidity_risk INTEGER NOT NULL,
      emergency_fund_risk INTEGER NOT NULL,
      cash_flow_risk INTEGER NOT NULL,
      investment_concentration_risk INTEGER NOT NULL,
      goal_risk INTEGER NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme_preference TEXT DEFAULT 'dark',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  saveDisk();
  console.log('SQLite (sql.js WebAssembly) initialized at:', dbPath);
}

// Standard better-sqlite3 compatible API wrapper
const dbWrapper = {
  prepare(sql) {
    return {
      get(...params) {
        if (!sqlDb) throw new Error('Database not initialized yet.');
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        if (!sqlDb) throw new Error('Database not initialized yet.');
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },
      run(...params) {
        if (!sqlDb) throw new Error('Database not initialized yet.');
        sqlDb.run(sql, params);
        saveDisk();
        
        // Fetch last insert rowid & changes
        let lastInsertRowid = 0;
        let changes = 1;
        try {
          const res = sqlDb.exec('SELECT last_insert_rowid() as id, total_changes() as changes');
          if (res && res[0] && res[0].values && res[0].values[0]) {
            lastInsertRowid = res[0].values[0][0];
            changes = res[0].values[0][1];
          }
        } catch (e) {}

        return { lastInsertRowid, changes };
      }
    };
  },
  exec(sql) {
    if (!sqlDb) throw new Error('Database not initialized yet.');
    sqlDb.exec(sql);
    saveDisk();
  },
  initDatabase
};

module.exports = dbWrapper;
