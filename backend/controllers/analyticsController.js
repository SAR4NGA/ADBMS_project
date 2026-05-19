const { getDBPool } = require('../config/db');

const getAnalyticsBI = async (req, res) => {
    try {
        const pool = await getDBPool();

        // Execute the advanced T-SQL stored procedure which uses cursors and HAVING clauses
        const result = await pool.request().execute('sp_GetAnalyticsBI');
        
        // result.recordsets format:
        // 0: Historical Trends (Last 12 months data)
        // 1: ForecastNextMonth (Predictive projection value)
        // 2: Supplier Efficiency Profiles
        // 3: Efficiency KPIs (RejectionRate, AvgApprovalDays)

        const historicalTrends = result.recordsets[0] || [];
        const forecastResult = result.recordsets[1] ? result.recordsets[1][0] : { ForecastNextMonth: 0 };
        const supplierProfiles = result.recordsets[2] || [];
        const efficiencyKPIs = result.recordsets[3] ? result.recordsets[3][0] : { RejectionRate: 0, AvgApprovalDays: 0 };

        res.json({
            historicalTrends,
            forecast: forecastResult.ForecastNextMonth,
            supplierProfiles,
            efficiencyKPIs
        });

    } catch (error) {
        console.error('Error in sp_GetAnalyticsBI:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAnalyticsBI };
