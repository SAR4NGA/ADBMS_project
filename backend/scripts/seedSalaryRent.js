const { connectDB, sql } = require('../config/db');

async function seed() {
    console.log('🔄 Connecting to database to add Salary and Rent expenses...');
    try {
        const pool = await connectDB();
        
        // 1. Ensure categories exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM ExpenseCategory WHERE CategoryName = 'Salary') INSERT INTO ExpenseCategory (CategoryName) VALUES ('Salary');
            IF NOT EXISTS (SELECT 1 FROM ExpenseCategory WHERE CategoryName = 'Rent') INSERT INTO ExpenseCategory (CategoryName) VALUES ('Rent');
        `);

        const catRes = await pool.request().query(`SELECT * FROM ExpenseCategory WHERE CategoryName IN ('Salary', 'Rent')`);
        const catMap = {};
        catRes.recordset.forEach(r => {
             const id = r.ExpenseCategoryID || r.CategoryID || r.Id;
             catMap[r.CategoryName] = id;
        });

        const salaryCatId = catMap['Salary'];
        const rentCatId = catMap['Rent'];

        // 2. Ensure Budgets exist for May 2026
        await pool.request()
            .input('salaryId', sql.Int, salaryCatId)
            .input('rentId', sql.Int, rentCatId)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Budget WHERE ExpenseCategoryID = @salaryId AND BudgetMonth = 5 AND BudgetYear = 2026)
                    INSERT INTO Budget (ExpenseCategoryID, AllocatedAmount, BudgetMonth, BudgetYear) VALUES (@salaryId, 5000.00, 5, 2026);
                IF NOT EXISTS (SELECT 1 FROM Budget WHERE ExpenseCategoryID = @rentId AND BudgetMonth = 5 AND BudgetYear = 2026)
                    INSERT INTO Budget (ExpenseCategoryID, AllocatedAmount, BudgetMonth, BudgetYear) VALUES (@rentId, 2000.00, 5, 2026);
            `);

        // 3. Create Expense Header
        const headerRes = await pool.request()
            .query(`
                INSERT INTO ExpenseHeader (DateKey, SupplierID, EmployeeID, PaymentMethodID, StatusID, TotalAmount, Description)
                VALUES (20260520, 1, 1, 1, 2, 4700.00, 'Monthly Salary and Rent');
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExpenseID;
            `);
        
        const expenseId = headerRes.recordset[0].ExpenseID;

        // 4. Add Line Items
        await pool.request()
            .input('eid', sql.Int, expenseId)
            .input('catid', sql.Int, salaryCatId)
            .input('amt', sql.Decimal(18,2), 3500.00)
            .query(`INSERT INTO ExpenseLineItem (ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice) VALUES (@eid, NULL, @catid, 1, @amt)`);

        await pool.request()
            .input('eid', sql.Int, expenseId)
            .input('catid', sql.Int, rentCatId)
            .input('amt', sql.Decimal(18,2), 1200.00)
            .query(`INSERT INTO ExpenseLineItem (ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice) VALUES (@eid, NULL, @catid, 1, @amt)`);

        console.log('✅ Success! Added Salary ($3500) and Rent ($1200) expenses.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

seed();
