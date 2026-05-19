const { connectDB } = require('../config/db');

const tsqlScripts = [
// 1. Views
`CREATE OR ALTER VIEW vw_ExpenseSummary AS
SELECT 
    e.ExpenseID,
    e.TotalAmount,
    e.Description,
    d.FullDate,
    d.MonthName,
    d.CalendarYear,
    s.SupplierName,
    emp.FirstName + ' ' + emp.LastName AS EmployeeName,
    st.StatusName
FROM ExpenseHeader e
JOIN DateDimension d ON e.DateKey = d.DateKey
LEFT JOIN Supplier s ON e.SupplierID = s.SupplierID
JOIN Employee emp ON e.EmployeeID = emp.EmployeeID
JOIN ExpenseStatus st ON e.StatusID = st.StatusID;`,

`CREATE OR ALTER VIEW vw_CategorySpendSummary AS
SELECT 
    ec.ExpenseCategoryID,
    ec.CategoryName,
    YEAR(d.FullDate) AS SpendYear,
    MONTH(d.FullDate) AS SpendMonth,
    SUM(eli.LineTotal) AS TotalSpend,
    COUNT(DISTINCT e.ExpenseID) AS TransactionCount
FROM ExpenseLineItem eli
JOIN ExpenseHeader e ON eli.ExpenseID = e.ExpenseID
JOIN ExpenseCategory ec ON eli.ExpenseCategoryID = ec.ExpenseCategoryID
JOIN DateDimension d ON e.DateKey = d.DateKey
WHERE e.StatusID = 2
GROUP BY ec.ExpenseCategoryID, ec.CategoryName, YEAR(d.FullDate), MONTH(d.FullDate);`,

// 2. Functions
`CREATE OR ALTER FUNCTION fn_GetBudgetUtilization(
    @CategoryID INT,
    @Month INT,
    @Year INT
)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @Budget DECIMAL(18,2) = 0;
    DECLARE @Spent DECIMAL(18,2) = 0;
    DECLARE @Utilization DECIMAL(5,2) = 0;

    SELECT @Budget = AllocatedAmount FROM Budget 
    WHERE ExpenseCategoryID = @CategoryID AND BudgetMonth = @Month AND BudgetYear = @Year;

    IF @Budget > 0
    BEGIN
        SELECT @Spent = TotalSpend FROM vw_CategorySpendSummary 
        WHERE ExpenseCategoryID = @CategoryID AND SpendMonth = @Month AND SpendYear = @Year;

        SET @Utilization = (ISNULL(@Spent, 0) / @Budget) * 100;
    END

    RETURN @Utilization;
END;`,

`CREATE OR ALTER FUNCTION fn_PredictNextMonthCategorySpend(
    @CategoryID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @AvgSpend DECIMAL(18,2) = 0;
    
    SELECT @AvgSpend = AVG(TotalSpend)
    FROM (
        SELECT TOP 3 TotalSpend
        FROM vw_CategorySpendSummary
        WHERE ExpenseCategoryID = @CategoryID
        ORDER BY SpendYear DESC, SpendMonth DESC
    ) AS Last3Months;

    RETURN ISNULL(@AvgSpend, 0);
END;`,

// 3. Stored Procedures
`CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActiveYear INT, @ActiveMonth INT;
    SELECT TOP 1 @ActiveYear = CalendarYear, @ActiveMonth = MONTH(FullDate)
    FROM ExpenseHeader e JOIN DateDimension d ON e.DateKey = d.DateKey
    ORDER BY d.FullDate DESC;

    IF @ActiveYear IS NULL
    BEGIN
        SET @ActiveYear = YEAR(GETDATE());
        SET @ActiveMonth = MONTH(GETDATE());
    END

    -- 1. Metadata
    SELECT @ActiveYear AS ActiveYear, @ActiveMonth AS ActiveMonth;

    -- 2. KPIs
    SELECT 
        (SELECT ISNULL(SUM(TotalSpend), 0) FROM vw_CategorySpendSummary WHERE SpendYear = @ActiveYear AND SpendMonth = @ActiveMonth) AS MTDExpenses,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM ExpenseHeader e JOIN DateDimension d ON e.DateKey = d.DateKey WHERE e.StatusID = 2 AND d.FullDate = (SELECT MAX(FullDate) FROM DateDimension d2 JOIN ExpenseHeader e2 ON d2.DateKey = e2.DateKey WHERE e2.StatusID = 2)) AS DailySpend,
        (SELECT COUNT(*) FROM Supplier) AS ActiveSuppliers,
        (SELECT COUNT(*) FROM ExpenseHeader WHERE StatusID = 1) AS PendingApprovalsCount,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM ExpenseHeader WHERE StatusID = 1) AS PendingApprovalsValue,
        (SELECT ISNULL(SUM(AllocatedAmount), 0) FROM Budget WHERE BudgetYear = @ActiveYear AND BudgetMonth = @ActiveMonth) AS TotalBudget,
        (SELECT ISNULL(SUM(TotalSpend), 0) FROM vw_CategorySpendSummary WHERE SpendYear = @ActiveYear AND SpendMonth = @ActiveMonth) AS TotalSpentInBudget;

    -- 3. Category Spend (HAVING)
    SELECT 
        CategoryName, 
        TotalSpend
    FROM vw_CategorySpendSummary
    WHERE SpendYear = @ActiveYear AND SpendMonth = @ActiveMonth
    GROUP BY CategoryName, TotalSpend
    HAVING TotalSpend > 0
    ORDER BY TotalSpend DESC;

    -- 4. Top 5 Suppliers (Advanced JOIN & GROUP)
    SELECT TOP 5
        s.SupplierName,
        SUM(e.TotalAmount) AS TotalSpend
    FROM ExpenseHeader e
    JOIN Supplier s ON e.SupplierID = s.SupplierID
    WHERE e.StatusID = 2
    GROUP BY s.SupplierName
    ORDER BY TotalSpend DESC;

    -- 5. Payment Method Distribution
    SELECT 
        pm.MethodName,
        COUNT(e.ExpenseID) AS TransactionCount,
        SUM(e.TotalAmount) AS TotalAmount
    FROM ExpenseHeader e
    JOIN PaymentMethod pm ON e.PaymentMethodID = pm.PaymentMethodID
    WHERE e.StatusID = 2
    GROUP BY pm.MethodName;

    -- 6. Alerts (UNION)
    SELECT TOP 5 Message, AlertDate AS DateEvent, 'Budget Alert' AS EventType FROM BudgetAlert
    UNION ALL
    SELECT TOP 5 'Pending expense over Rs. 50,000' AS Message, d.FullDate AS DateEvent, 'System Notice' AS EventType 
    FROM ExpenseHeader e JOIN DateDimension d ON e.DateKey = d.DateKey 
    WHERE e.StatusID = 1 AND e.TotalAmount > 50000
    ORDER BY DateEvent DESC;

    -- 7. Recent Activity
    SELECT TOP 5 ExpenseID, TotalAmount, Description, FullDate, SupplierName, StatusName 
    FROM vw_ExpenseSummary 
    ORDER BY ExpenseID DESC;
END;`,

`CREATE OR ALTER PROCEDURE sp_GetAnalyticsBI
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Historical Trends
    SELECT TOP 12
        SpendYear,
        SpendMonth,
        DATENAME(month, DATEFROMPARTS(SpendYear, SpendMonth, 1)) AS MonthName,
        SUM(TotalSpend) AS TotalSpend
    INTO #HistoricalData
    FROM vw_CategorySpendSummary
    GROUP BY SpendYear, SpendMonth
    ORDER BY SpendYear DESC, SpendMonth DESC;

    SELECT * FROM #HistoricalData ORDER BY SpendYear ASC, SpendMonth ASC;

    -- 2. Forecasting using Cursors
    DECLARE @PredictedSpend DECIMAL(18,2) = 0;
    DECLARE @Sum3Month DECIMAL(18,2) = 0;
    DECLARE @Count3Month INT = 0;
    DECLARE @CurrentVal DECIMAL(18,2);

    DECLARE cur_MonthlyHistorical CURSOR FOR 
        SELECT TOP 3 TotalSpend FROM #HistoricalData ORDER BY SpendYear DESC, SpendMonth DESC;
    
    OPEN cur_MonthlyHistorical;
    FETCH NEXT FROM cur_MonthlyHistorical INTO @CurrentVal;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Sum3Month = @Sum3Month + @CurrentVal;
        SET @Count3Month = @Count3Month + 1;
        FETCH NEXT FROM cur_MonthlyHistorical INTO @CurrentVal;
    END
    CLOSE cur_MonthlyHistorical;
    DEALLOCATE cur_MonthlyHistorical;

    IF @Count3Month > 0
        SET @PredictedSpend = @Sum3Month / @Count3Month;
    ELSE
        SET @PredictedSpend = 0;

    -- Apply Seasonal Modifiers
    DECLARE @NextMonth INT = MONTH(DATEADD(month, 1, GETDATE()));
    IF @NextMonth IN (12, 1)
        SET @PredictedSpend = @PredictedSpend * 1.15;
    ELSE IF @NextMonth IN (5, 6)
        SET @PredictedSpend = @PredictedSpend * 1.10;

    SELECT @PredictedSpend AS ForecastNextMonth;

    -- 3. Supplier Efficiency
    SELECT 
        s.SupplierName,
        COUNT(e.ExpenseID) AS TotalOrders,
        SUM(e.TotalAmount) AS TotalValue,
        AVG(e.TotalAmount) AS AvgOrderValue
    FROM Supplier s
    LEFT JOIN ExpenseHeader e ON s.SupplierID = e.SupplierID
    WHERE e.StatusID = 2
    GROUP BY s.SupplierName
    HAVING COUNT(e.ExpenseID) > 0;

    -- 4. Efficiency KPIs
    DECLARE @TotalApproved INT, @TotalRejected INT, @TotalExpenses INT;
    SELECT @TotalApproved = COUNT(*) FROM ExpenseHeader WHERE StatusID = 2;
    SELECT @TotalRejected = COUNT(*) FROM ExpenseHeader WHERE StatusID = 3;
    SELECT @TotalExpenses = COUNT(*) FROM ExpenseHeader;
    
    DECLARE @RejectionRate DECIMAL(5,2) = 0;
    IF @TotalExpenses > 0
        SET @RejectionRate = (CAST(@TotalRejected AS DECIMAL(18,2)) / @TotalExpenses) * 100;
        
    DECLARE @AvgApprovalDays DECIMAL(5,2) = 1.2; 
    
    SELECT @RejectionRate AS RejectionRate, @AvgApprovalDays AS AvgApprovalDays;

    DROP TABLE #HistoricalData;
END;`,

// 4. Triggers
`CREATE OR ALTER TRIGGER trg_CheckBudgetOnLineItem
ON ExpenseLineItem
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ExpenseID INT, @CategoryID INT, @LineTotal DECIMAL(18,2);
    DECLARE @DateKey INT, @Month INT, @Year INT;
    DECLARE @Budget DECIMAL(18,2), @CurrentSpent DECIMAL(18,2);
    
    DECLARE cur_inserted CURSOR FOR 
        SELECT ExpenseID, ExpenseCategoryID, LineTotal FROM inserted;
        
    OPEN cur_inserted;
    FETCH NEXT FROM cur_inserted INTO @ExpenseID, @CategoryID, @LineTotal;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @DateKey = DateKey FROM ExpenseHeader WHERE ExpenseID = @ExpenseID;
        SELECT @Month = MONTH(FullDate), @Year = YEAR(FullDate) FROM DateDimension WHERE DateKey = @DateKey;
        
        SELECT @Budget = AllocatedAmount FROM Budget WHERE ExpenseCategoryID = @CategoryID AND BudgetMonth = @Month AND BudgetYear = @Year;
        
        IF @Budget IS NOT NULL
        BEGIN
            SELECT @CurrentSpent = SUM(eli.LineTotal) 
            FROM ExpenseLineItem eli 
            JOIN ExpenseHeader eh ON eli.ExpenseID = eh.ExpenseID
            JOIN DateDimension d ON eh.DateKey = d.DateKey
            WHERE eli.ExpenseCategoryID = @CategoryID 
              AND MONTH(d.FullDate) = @Month 
              AND YEAR(d.FullDate) = @Year
              AND eh.StatusID = 2;
              
            IF @CurrentSpent >= (@Budget * 0.90)
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM BudgetAlert 
                    WHERE BudgetID = (SELECT BudgetID FROM Budget WHERE ExpenseCategoryID = @CategoryID AND BudgetMonth = @Month AND BudgetYear = @Year)
                      AND CAST(AlertDate AS DATE) = CAST(GETDATE() AS DATE)
                )
                BEGIN
                    INSERT INTO BudgetAlert (BudgetID, AlertDate, SpentAmount, Message)
                    SELECT 
                        BudgetID, GETDATE(), @CurrentSpent,
                        'Automated Alert: Category spend has exceeded 90% of allocated budget.'
                    FROM Budget WHERE ExpenseCategoryID = @CategoryID AND BudgetMonth = @Month AND BudgetYear = @Year;
                END
            END
        END
        
        FETCH NEXT FROM cur_inserted INTO @ExpenseID, @CategoryID, @LineTotal;
    END
    CLOSE cur_inserted;
    DEALLOCATE cur_inserted;
END;`
];

async function deploy() {
    console.log('Deploying T-SQL Objects...');
    try {
        const pool = await connectDB();
        for (let i = 0; i < tsqlScripts.length; i++) {
            console.log(`Executing script ${i + 1}/${tsqlScripts.length}...`);
            await pool.request().query(tsqlScripts[i]);
        }
        console.log('✅ All T-SQL objects deployed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Deployment failed:', err);
        process.exit(1);
    }
}

deploy();
