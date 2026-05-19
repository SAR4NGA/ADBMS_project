const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.post('/batch', expenseController.createMultipleExpenses);
router.put('/approve/:id', expenseController.approveExpense);

module.exports = router;