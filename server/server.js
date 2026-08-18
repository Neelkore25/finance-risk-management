const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api', apiRoutes);

// Healthcheck Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'RiskGuard', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

async function startServer() {
  await db.initDatabase();
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  RISKGUARD SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`  REST API URL: http://localhost:${PORT}/api`);
    console.log(`==================================================`);
  });
}

startServer();
