const express = require('express');
const router = express.Router();
const { getExpenseTrends } = require('../controllers/analyticsController');

router.get('/trends', getExpenseTrends);

module.exports = router;
