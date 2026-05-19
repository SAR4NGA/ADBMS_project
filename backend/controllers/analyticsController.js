const { getDB } = require('../config/db');

const getExpenseTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const pool = await getDB();
    const result = await pool.request()
      .input('year', year || 2026)
      .query(`
        SELECT 
          dd.MonthName,
          dd.CalendarYear,
          ec.CategoryName,
          SUM(li.LineTotal) AS TotalSpent
        FROM ExpenseHeader eh
        JOIN DateDimension dd 
          ON eh.DateKey = dd.DateKey
        JOIN ExpenseLineItem li 
          ON eh.ExpenseID = li.ExpenseID
        JOIN ExpenseCategory ec 
          ON li.ExpenseCategoryID = ec.ExpenseCategoryID
        WHERE dd.CalendarYear = @year
        GROUP BY 
          dd.MonthName,
          dd.CalendarYear,
          ec.CategoryName
        ORDER BY 
          dd.CalendarYear,
          ec.CategoryName
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getExpenseTrends };
