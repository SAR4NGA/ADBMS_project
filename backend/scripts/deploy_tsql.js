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

`CREATE OR ALTER VIEW vw_SupplierPerformance AS
SELECT
    s.SupplierID,
    s.SupplierName,
    s.RegisteredDate,
    COUNT(DISTINCT e.ExpenseID)                AS TotalOrders,
    ISNULL(SUM(e.TotalAmount), 0)              AS TotalValue,
    ISNULL(AVG(e.TotalAmount), 0)              AS AvgOrderValue,
    COUNT(CASE WHEN e.StatusID = 1 THEN 1 END) AS PendingOrders,
    COUNT(CASE WHEN e.StatusID = 3 THEN 1 END) AS RejectedOrders,
    MAX(d.FullDate)                            AS LastOrderDate
FROM Supplier s
LEFT JOIN ExpenseHeader e ON s.SupplierID = e.SupplierID
LEFT JOIN DateDimension d ON e.DateKey    = d.DateKey
GROUP BY s.SupplierID, s.SupplierName, s.RegisteredDate;`,

`CREATE OR ALTER VIEW vw_MonthlyBudgetVsActual AS
SELECT
    b.BudgetID,
    b.ExpenseCategoryID,
    ec.CategoryName,
    b.BudgetMonth,
    b.BudgetYear,
    b.AllocatedAmount                                          AS BudgetAmount,
    ISNULL(css.TotalSpend, 0)                                  AS ActualSpend,
    b.AllocatedAmount - ISNULL(css.TotalSpend, 0)              AS Variance,
    CASE
        WHEN b.AllocatedAmount = 0 THEN 0
        ELSE CAST(ISNULL(css.TotalSpend, 0) AS DECIMAL(18,2))
             / b.AllocatedAmount * 100
    END                                                        AS UtilizationPct
FROM Budget b
JOIN ExpenseCategory ec ON b.ExpenseCategoryID = ec.ExpenseCategoryID
LEFT JOIN vw_CategorySpendSummary css
       ON css.ExpenseCategoryID = b.ExpenseCategoryID
      AND css.SpendMonth        = b.BudgetMonth
      AND css.SpendYear         = b.BudgetYear;`,

// 2. Functions
`CREATE OR ALTER FUNCTION fn_GetBudgetUtilization(
    @CategoryID INT,
    @Month INT,
    @Year INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Budget DECIMAL(18,2) = 0;
    DECLARE @Spent DECIMAL(18,2) = 0;
    DECLARE @Utilization DECIMAL(18,2) = 0;

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

`CREATE OR ALTER FUNCTION fn_GetSupplierRiskScore(
    @SupplierID INT
)
RETURNS INT
AS
BEGIN
    DECLARE @RiskScore      INT           = 0;
    DECLARE @TotalOrders    INT           = 0;
    DECLARE @RejectedOrders INT           = 0;
    DECLARE @PendingValue   DECIMAL(18,2) = 0;
    DECLARE @RejectionPct   DECIMAL(5,2)  = 0;
    DECLARE @PendingScore   INT           = 0;

    SELECT
        @TotalOrders    = COUNT(*),
        @RejectedOrders = COUNT(CASE WHEN StatusID = 3 THEN 1 END),
        @PendingValue   = ISNULL(SUM(CASE WHEN StatusID = 1 THEN TotalAmount ELSE 0 END), 0)
    FROM ExpenseHeader
    WHERE SupplierID = @SupplierID;

    -- Rejection rate contributes up to 60 points
    IF @TotalOrders > 0
        SET @RejectionPct = (CAST(@RejectedOrders AS DECIMAL(18,2)) / @TotalOrders) * 100;
    SET @RiskScore = CAST(@RejectionPct * 0.60 AS INT);

    -- Pending value contributes up to 40 points (capped at Rs. 500,000)
    SET @PendingScore = CAST((@PendingValue / 500000.0) * 40 AS INT);
    IF @PendingScore > 40 SET @PendingScore = 40;
    SET @RiskScore = @RiskScore + @PendingScore;

    IF @RiskScore > 100 SET @RiskScore = 100;
    RETURN @RiskScore;
END;`,

`CREATE OR ALTER FUNCTION fn_ClassifyBudgetStatus(
    @CategoryID INT,
    @Month      INT,
    @Year       INT
)
RETURNS VARCHAR(10)
AS
BEGIN
    DECLARE @Utilization DECIMAL(18,2);
    DECLARE @Status      VARCHAR(10);

    SET @Utilization = dbo.fn_GetBudgetUtilization(@CategoryID, @Month, @Year);

    IF @Utilization >= 90
        SET @Status = 'CRITICAL';
    ELSE IF @Utilization >= 70
        SET @Status = 'WARNING';
    ELSE
        SET @Status = 'SAFE';

    RETURN @Status;
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

    -- 6. Alerts (UNION) — current period only
    SELECT TOP 5 Message, AlertDate AS DateEvent, 'Budget Alert' AS EventType
    FROM BudgetAlert
    WHERE YEAR(AlertDate) = @ActiveYear AND MONTH(AlertDate) = @ActiveMonth
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

`CREATE OR ALTER PROCEDURE sp_GetBudgetReport
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentMonth INT = MONTH(GETDATE());
    DECLARE @CurrentYear  INT = YEAR(GETDATE());

    -- Budget vs actual for current month.
    -- Uses CROSS APPLY to call fn_ClassifyBudgetStatus and fn_PredictNextMonthCategorySpend per row.
    SELECT
        mbv.BudgetID,
        mbv.ExpenseCategoryID,
        mbv.CategoryName,
        mbv.BudgetMonth,
        mbv.BudgetYear,
        mbv.BudgetAmount,
        mbv.ActualSpend,
        mbv.Variance,
        mbv.UtilizationPct,
        status_label.BudgetStatus,
        prediction.PredictedNextMonth
    FROM vw_MonthlyBudgetVsActual mbv
    CROSS APPLY (
        SELECT dbo.fn_ClassifyBudgetStatus(
            (SELECT ExpenseCategoryID FROM Budget WHERE BudgetID = mbv.BudgetID),
            mbv.BudgetMonth,
            mbv.BudgetYear
        ) AS BudgetStatus
    ) status_label
    CROSS APPLY (
        SELECT dbo.fn_PredictNextMonthCategorySpend(
            (SELECT ExpenseCategoryID FROM Budget WHERE BudgetID = mbv.BudgetID)
        ) AS PredictedNextMonth
    ) prediction
    WHERE mbv.BudgetMonth = @CurrentMonth
      AND mbv.BudgetYear  = @CurrentYear
    ORDER BY mbv.UtilizationPct DESC;
END;`,

`CREATE OR ALTER PROCEDURE sp_GetSupplierDetails
    @SupplierID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Full supplier profile + risk score (calls fn_GetSupplierRiskScore via scalar UDF)
    SELECT
        sp.SupplierID,
        sp.SupplierName,
        sp.RegisteredDate,
        sp.TotalOrders,
        sp.TotalValue,
        sp.AvgOrderValue,
        sp.PendingOrders,
        sp.RejectedOrders,
        sp.LastOrderDate,
        dbo.fn_GetSupplierRiskScore(sp.SupplierID) AS RiskScore
    FROM vw_SupplierPerformance sp
    WHERE sp.SupplierID = @SupplierID;

    -- 2. Last 10 expenses for this supplier
    SELECT TOP 10
        e.ExpenseID,
        e.TotalAmount,
        e.Description,
        d.FullDate,
        st.StatusName,
        emp.FirstName + ' ' + emp.LastName AS SubmittedBy
    FROM ExpenseHeader e
    JOIN DateDimension d  ON e.DateKey    = d.DateKey
    JOIN ExpenseStatus  st ON e.StatusID  = st.StatusID
    JOIN Employee      emp ON e.EmployeeID = emp.EmployeeID
    WHERE e.SupplierID = @SupplierID
    ORDER BY d.FullDate DESC;
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
END;`,

`CREATE OR ALTER TRIGGER trg_Supplier_Audit
ON Supplier
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'Supplier',
            'INSERT',
            i.SupplierID,
            NULL,
            (SELECT i.SupplierID, i.SupplierName, i.RegisteredDate FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            GETDATE()
        FROM inserted i;
        RETURN;
    END

    -- UPDATE
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'Supplier',
            'UPDATE',
            i.SupplierID,
            (SELECT d.SupplierID, d.SupplierName, d.RegisteredDate FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.SupplierID, i.SupplierName, i.RegisteredDate FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            GETDATE()
        FROM inserted i
        INNER JOIN deleted d ON d.SupplierID = i.SupplierID;
        RETURN;
    END

    -- DELETE
    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO SystemAuditLog (TableName, ActionType, RecordID, OldValue, NewValue, ChangedDate)
        SELECT
            'Supplier',
            'DELETE',
            d.SupplierID,
            (SELECT d.SupplierID, d.SupplierName, d.RegisteredDate FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            GETDATE()
        FROM deleted d;
    END
END;`,

`CREATE OR ALTER TRIGGER trg_PreventDeleteApprovedExpense
ON ExpenseHeader
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Block deletion of any Approved expense (StatusID = 2)
    IF EXISTS (SELECT 1 FROM deleted WHERE StatusID = 2)
    BEGIN
        RAISERROR(
            'Business Rule Violation: Approved expenses cannot be deleted. Reverse the approval first.',
            16, 1
        );
        RETURN;
    END

    -- For non-approved expenses, perform the actual delete cascade
    DELETE FROM BudgetAlert
    WHERE BudgetID IN (
        SELECT DISTINCT b.BudgetID
        FROM Budget b
        JOIN ExpenseLineItem eli ON eli.ExpenseCategoryID = b.ExpenseCategoryID
        WHERE eli.ExpenseID IN (SELECT ExpenseID FROM deleted)
    );

    DELETE FROM ApprovalLog     WHERE ExpenseID IN (SELECT ExpenseID FROM deleted);
    DELETE FROM ExpenseLineItem WHERE ExpenseID IN (SELECT ExpenseID FROM deleted);
    DELETE FROM ExpenseHeader   WHERE ExpenseID IN (SELECT ExpenseID FROM deleted);
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
