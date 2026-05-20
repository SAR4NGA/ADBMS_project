const { getDBPool, sql } = require('../config/db');

// ── Tab 1: BI & Forecast ──────────────────────────────────────────────────────
// Calls the sp_GetAnalyticsBI stored procedure for forecast + efficiency data
const getAnalyticsBI = async (req, res) => {
    try {
        const pool = await getDBPool();
        const result = await pool.request().execute('sp_GetAnalyticsBI');

        const historicalTrends = result.recordsets[0] || [];
        const forecastResult   = result.recordsets[1] ? result.recordsets[1][0] : { ForecastNextMonth: 0 };
        const supplierProfiles = result.recordsets[2] || [];
        const efficiencyKPIs   = result.recordsets[3] ? result.recordsets[3][0] : { RejectionRate: 0, AvgApprovalDays: 0 };

        res.json({ historicalTrends, forecast: forecastResult.ForecastNextMonth, supplierProfiles, efficiencyKPIs });
    } catch (error) {
        console.error('Error in sp_GetAnalyticsBI:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Tab 2: Expense Trends ─────────────────────────────────────────────────────
// Direct SQL query: returns per-category monthly totals for line chart + table
const getExpenseTrends = async (req, res) => {
    try {
        const { year } = req.query;
        const pool = await getDBPool();
        const result = await pool.request()
            .input('year', sql.Int, parseInt(year) || 2026)
            .query(`
                SELECT
                    dd.MonthName,
                    MONTH(dd.FullDate) AS MonthNumber,
                    dd.CalendarYear,
                    ec.CategoryName,
                    SUM(li.LineTotal) AS TotalSpent
                FROM ExpenseHeader eh
                JOIN DateDimension   dd ON eh.DateKey             = dd.DateKey
                JOIN ExpenseLineItem li ON eh.ExpenseID           = li.ExpenseID
                JOIN ExpenseCategory ec ON li.ExpenseCategoryID   = ec.ExpenseCategoryID
                WHERE dd.CalendarYear = @year
                GROUP BY
                    dd.MonthName,
                    MONTH(dd.FullDate),
                    dd.CalendarYear,
                    ec.CategoryName
                ORDER BY
                    MONTH(dd.FullDate),
                    ec.CategoryName
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error in getExpenseTrends:', error);
        res.status(500).json({ error: error.message });
    }
};


// ── Tab 1: Spending Anomaly Detector ─────────────────────────────────────────
// Compares current month spend vs 3-month historical average per category
const getSpendingAnomalies = async (req, res) => {
    try {
        const now   = new Date();
        const year  = parseInt(req.query.year)  || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);

        const pool = await getDBPool();
        const result = await pool.request()
            .input('year',  sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
                -- Current month total per category
                WITH CurrentMonth AS (
                    SELECT
                        ec.CategoryName,
                        SUM(li.LineTotal) AS CurrentSpend
                    FROM ExpenseHeader eh
                    JOIN DateDimension   dd ON eh.DateKey           = dd.DateKey
                    JOIN ExpenseLineItem li ON eh.ExpenseID         = li.ExpenseID
                    JOIN ExpenseCategory ec ON li.ExpenseCategoryID = ec.ExpenseCategoryID
                    WHERE dd.CalendarYear = @year
                      AND MONTH(dd.FullDate) = @month
                    GROUP BY ec.CategoryName
                ),
                -- Monthly totals for the 3 months BEFORE the current month
                PrevMonthly AS (
                    SELECT
                        ec.CategoryName,
                        YEAR(dd.FullDate)  AS yr,
                        MONTH(dd.FullDate) AS mo,
                        SUM(li.LineTotal)  AS MonthlyTotal
                    FROM ExpenseHeader eh
                    JOIN DateDimension   dd ON eh.DateKey           = dd.DateKey
                    JOIN ExpenseLineItem li ON eh.ExpenseID         = li.ExpenseID
                    JOIN ExpenseCategory ec ON li.ExpenseCategoryID = ec.ExpenseCategoryID
                    WHERE dd.FullDate >= DATEADD(MONTH, -3, DATEFROMPARTS(@year, @month, 1))
                      AND dd.FullDate <  DATEFROMPARTS(@year, @month, 1)
                    GROUP BY ec.CategoryName, YEAR(dd.FullDate), MONTH(dd.FullDate)
                ),
                -- Average of those 3 monthly totals
                HistAvg AS (
                    SELECT CategoryName, AVG(CAST(MonthlyTotal AS FLOAT)) AS AvgSpend
                    FROM PrevMonthly
                    GROUP BY CategoryName
                )
                SELECT
                    c.CategoryName,
                    c.CurrentSpend,
                    ISNULL(h.AvgSpend, 0) AS AvgSpend,
                    CASE
                        WHEN ISNULL(h.AvgSpend, 0) = 0 THEN 100.0
                        ELSE ROUND(((c.CurrentSpend - h.AvgSpend) / h.AvgSpend) * 100.0, 1)
                    END AS VariancePct
                FROM CurrentMonth c
                LEFT JOIN HistAvg h ON c.CategoryName = h.CategoryName
                ORDER BY ABS(
                    CASE
                        WHEN ISNULL(h.AvgSpend, 0) = 0 THEN 100.0
                        ELSE ((c.CurrentSpend - h.AvgSpend) / h.AvgSpend) * 100.0
                    END
                ) DESC
            `);

        res.json({
            year,
            month,
            anomalies: result.recordset,
        });
    } catch (error) {
        console.error('Error in getSpendingAnomalies:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAnalyticsBI, getExpenseTrends, getSpendingAnomalies };

