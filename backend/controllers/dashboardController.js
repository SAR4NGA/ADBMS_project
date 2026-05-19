const { getDBPool } = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const pool = await getDBPool();

        // Execute the advanced T-SQL stored procedure
        const result = await pool.request().execute('sp_GetDashboardStats');
        
        // result.recordsets is an array of tables returned by the stored procedure.
        // Recordset 0: Metadata (ActiveYear, ActiveMonth)
        // Recordset 1: KPIs
        // Recordset 2: Category Spend
        // Recordset 3: Top 5 Suppliers
        // Recordset 4: Payment Methods
        // Recordset 5: Alerts
        // Recordset 6: Recent Activity

        const metadata = result.recordsets[0][0];
        const kpis = result.recordsets[1][0];
        const categorySpend = result.recordsets[2];
        const topSuppliers = result.recordsets[3];
        const paymentMethods = result.recordsets[4];
        const alerts = result.recordsets[5];
        const recentActivity = result.recordsets[6];

        // Format stats for frontend
        const stats = {
            totalExpenses: kpis.MTDExpenses,
            dailySpend: kpis.DailySpend,
            activeSuppliers: kpis.ActiveSuppliers,
            pendingApprovals: kpis.PendingApprovalsCount,
            pendingApprovalsValue: kpis.PendingApprovalsValue,
            budgetUtilization: kpis.TotalBudget > 0 ? ((kpis.TotalSpentInBudget / kpis.TotalBudget) * 100).toFixed(1) : 0,
            activePeriod: { year: metadata.ActiveYear, month: metadata.ActiveMonth }
        };

        res.json({
            stats,
            categorySpend,
            topSuppliers,
            paymentMethods,
            alerts,
            recentActivity
        });

    } catch (error) {
        console.error('Error in sp_GetDashboardStats:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDashboardStats };