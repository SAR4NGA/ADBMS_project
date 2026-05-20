const express = require('express');
const router  = express.Router();
const { getAnalyticsBI, getExpenseTrends, getSpendingAnomalies } = require('../controllers/analyticsController');

router.get('/',          getAnalyticsBI);        // Tab 1 — BI & Forecast (stored procedure)
router.get('/trends',    getExpenseTrends);       // Tab 2 — Expense Trends (direct SQL)
router.get('/anomalies', getSpendingAnomalies);   // Tab 1 (new) — Anomaly Detector

module.exports = router;
