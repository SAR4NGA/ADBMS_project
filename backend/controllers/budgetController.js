const { getDBPool, sql } = require('../config/db');

const getBudgets = async (req, res) => {
  try {
    const pool = await getDBPool();
    
    // We fetch budgets for the current month and year
    // and calculate the actual spent amount from approved expenses
    const result = await pool.request().query(`
      SELECT 
        b.BudgetID as id,
        ec.ExpenseCategoryID as categoryId,
        ec.CategoryName as category,
        b.AllocatedAmount as budget,
        ISNULL((
            SELECT SUM(eli.LineTotal)
            FROM ExpenseLineItem eli
            JOIN ExpenseHeader eh ON eli.ExpenseID = eh.ExpenseID
            JOIN DateDimension dd ON eh.DateKey = dd.DateKey
            WHERE eli.ExpenseCategoryID = b.ExpenseCategoryID
              AND MONTH(dd.FullDate) = b.BudgetMonth
              AND YEAR(dd.FullDate) = b.BudgetYear
              AND eh.StatusID = 2 -- 'Approved'
        ), 0) as spent
      FROM Budget b
      JOIN ExpenseCategory ec ON b.ExpenseCategoryID = ec.ExpenseCategoryID
      WHERE b.BudgetMonth = MONTH(GETDATE()) AND b.BudgetYear = YEAR(GETDATE())
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error in getBudgets:', error);
    res.status(500).json({ error: error.message });
  }
};

const createBudget = async (req, res) => {
  try {
    const { categoryId, amount } = req.body;
    const pool = await getDBPool();
    await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('amount', sql.Decimal(18,2), amount)
      .query(`
        INSERT INTO Budget (ExpenseCategoryID, AllocatedAmount, BudgetMonth, BudgetYear)
        VALUES (@categoryId, @amount, MONTH(GETDATE()), YEAR(GETDATE()))
      `);
    res.status(201).json({ message: 'Budget created successfully' });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const pool = await getDBPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('amount', sql.Decimal(18,2), amount)
      .query(`
        UPDATE Budget 
        SET AllocatedAmount = @amount
        WHERE BudgetID = @id
      `);
    res.json({ message: 'Budget updated successfully' });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getDBPool();
    
    // Check if any budget alerts are linked to it and delete first
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM BudgetAlert WHERE BudgetID = @id`);
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Budget WHERE BudgetID = @id`);
      
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
