const { getDBPool } = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const pool = await getDBPool();

        // 1. Total Expenses (Approved)
        const totalResult = await pool.request().query("SELECT SUM(TotalAmount) as Total FROM ExpenseHeader WHERE StatusID = 2");
        const totalExpenses = totalResult.recordset[0].Total || 0;

        // 2. Pending Approvals
        const pendingResult = await pool.request().query("SELECT COUNT(*) as Count FROM ExpenseHeader WHERE StatusID = 1");
        const pendingApprovals = pendingResult.recordset[0].Count || 0;

        // 3. Active Suppliers
        const suppliersResult = await pool.request().query("SELECT COUNT(*) as Count FROM Supplier");
        const activeSuppliers = suppliersResult.recordset[0].Count || 0;

        // 4. Monthly Trend (Compare this month to last month)
        const trendResult = await pool.request().query(`
            SELECT 
                ISNULL((SELECT SUM(TotalAmount) FROM ExpenseHeader e JOIN DateDimension d ON e.DateKey = d.DateKey WHERE e.StatusID = 2 AND d.CalendarYear = YEAR(GETDATE()) AND MONTH(d.FullDate) = MONTH(GETDATE())), 0) as ThisMonth,
                ISNULL((SELECT SUM(TotalAmount) FROM ExpenseHeader e JOIN DateDimension d ON e.DateKey = d.DateKey WHERE e.StatusID = 2 AND d.CalendarYear = YEAR(DATEADD(month, -1, GETDATE())) AND MONTH(d.FullDate) = MONTH(DATEADD(month, -1, GETDATE()))), 0) as LastMonth
        `);
        const { ThisMonth, LastMonth } = trendResult.recordset[0];
        let trendString = "+0%";
        let trendValue = 0;
        if (LastMonth > 0) {
            trendValue = ((ThisMonth - LastMonth) / LastMonth) * 100;
            trendString = trendValue > 0 ? `+${trendValue.toFixed(1)}%` : `${trendValue.toFixed(1)}%`;
        }

        // 5. Chart Data (Last 6 Months)
        const chartResult = await pool.request().query(`
            SELECT TOP 6
                d.MonthName as name,
                d.CalendarYear,
                SUM(e.TotalAmount) as amount,
                MONTH(d.FullDate) as monthNum
            FROM ExpenseHeader e
            JOIN DateDimension d ON e.DateKey = d.DateKey
            WHERE e.StatusID = 2
            GROUP BY d.MonthName, d.CalendarYear, MONTH(d.FullDate)
            ORDER BY d.CalendarYear DESC, MONTH(d.FullDate) DESC
        `);

        // Reverse to show chronologically
        const chartData = chartResult.recordset.reverse();

        // 6. Recent Activity
        const activityResult = await pool.request().query(`
            SELECT TOP 5 
                e.ExpenseID,
                e.TotalAmount, 
                e.Description, 
                d.FullDate,
                s.SupplierName,
                st.StatusName
            FROM ExpenseHeader e
            JOIN DateDimension d ON e.DateKey = d.DateKey
            LEFT JOIN Supplier s ON e.SupplierID = s.SupplierID
            JOIN ExpenseStatus st ON e.StatusID = st.StatusID
            ORDER BY e.ExpenseID DESC
        `);

        res.json({
            stats: {
                totalExpenses,
                monthlyTrend: trendString,
                activeSuppliers,
                pendingApprovals
            },
            chartData,
            recentActivity: activityResult.recordset
        });

    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDashboardStats };