const express = require('express');
const router = express.Router();
const { getAnalyticsBI } = require('../controllers/analyticsController');

router.get('/', getAnalyticsBI);

module.exports = router;
