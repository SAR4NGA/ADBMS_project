const { connectDB, sql } = require('../config/db');

async function seed() {
    console.log('🔄 Connecting to database to add over-budget expenses...');
    try {
        const pool = await connectDB();
        
        // 1. Ensure Categories exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM ExpenseCategory WHERE CategoryName = 'Maintenance') INSERT INTO ExpenseCategory (CategoryName) VALUES ('Maintenance');
            IF NOT EXISTS (SELECT 1 FROM ExpenseCategory WHERE CategoryName = 'Utilities') INSERT INTO ExpenseCategory (CategoryName) VALUES ('Utilities');
        `);

        const catRes = await pool.request().query(`SELECT * FROM ExpenseCategory WHERE CategoryName IN ('Maintenance', 'Utilities')`);
        const catMap = {};
        catRes.recordset.forEach(r => {
            const id = r.ExpenseCategoryID || r.CategoryID || r.Id;
            catMap[r.CategoryName] = id;
        });

        const maintCatId = catMap['Maintenance'];
        const utilCatId = catMap['Utilities'];

        // 2. Ensure Budgets exist for May 2026
        await pool.request()
            .input('maintId', sql.Int, maintCatId)
            .input('utilId', sql.Int, utilCatId)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Budget WHERE ExpenseCategoryID = @maintId AND BudgetMonth = 5 AND BudgetYear = 2026)
                    INSERT INTO Budget (ExpenseCategoryID, AllocatedAmount, BudgetMonth, BudgetYear) VALUES (@maintId, 1000.00, 5, 2026);
                IF NOT EXISTS (SELECT 1 FROM Budget WHERE ExpenseCategoryID = @utilId AND BudgetMonth = 5 AND BudgetYear = 2026)
                    INSERT INTO Budget (ExpenseCategoryID, AllocatedAmount, BudgetMonth, BudgetYear) VALUES (@utilId, 1000.00, 5, 2026);
            `);

        const budgetRes = await pool.request()
            .input('maintId', sql.Int, maintCatId)
            .input('utilId', sql.Int, utilCatId)
            .query(`SELECT CategoryName, AllocatedAmount FROM Budget b INNER JOIN ExpenseCategory ec ON b.ExpenseCategoryID = ec.ExpenseCategoryID WHERE b.ExpenseCategoryID IN (@maintId, @utilId) AND BudgetMonth = 5 AND BudgetYear = 2026`);
        
        const budgets = {};
        budgetRes.recordset.forEach(r => budgets[r.CategoryName] = r.AllocatedAmount);

        const maintBudget = budgets['Maintenance'] || 1000;
        const utilBudget = budgets['Utilities'] || 1000;

        // 3. Ensure DateDimension
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM DateDimension WHERE DateKey = 20260520)
                INSERT INTO DateDimension (DateKey, FullDate, DayOfWeek, MonthName, CalendarYear, CalendarQuarter, IsWeekend)
                VALUES (20260520, '2026-05-20', 'Wednesday', 'May', 2026, 2, 0);
        `);

        // 4. Create Expense Header
        const total = (maintBudget * 1.3) + (utilBudget * 1.15);
        const headerRes = await pool.request()
            .input('total', sql.Decimal(18,2), total)
            .query(`
                INSERT INTO ExpenseHeader (DateKey, SupplierID, EmployeeID, PaymentMethodID, StatusID, TotalAmount, Description)
                VALUES (20260520, 1, 1, 1, 2, @total, 'Urgent over-budget maintenance and utilities');
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExpenseID;
            `);
        
        const expenseId = headerRes.recordset[0].ExpenseID;

        // 5. Add Line Items
        await pool.request()
            .input('eid', sql.Int, expenseId)
            .input('catid', sql.Int, maintCatId)
            .input('amt', sql.Decimal(18,2), maintBudget * 1.3)
            .query(`INSERT INTO ExpenseLineItem (ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice) VALUES (@eid, NULL, @catid, 1, @amt)`);

        await pool.request()
            .input('eid', sql.Int, expenseId)
            .input('catid', sql.Int, utilCatId)
            .input('amt', sql.Decimal(18,2), utilBudget * 1.15)
            .query(`INSERT INTO ExpenseLineItem (ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice) VALUES (@eid, NULL, @catid, 1, @amt)`);

        console.log('✅ Success! Added expenses to Maintenance (130% of budget) and Utilities (115% of budget).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

seed();
