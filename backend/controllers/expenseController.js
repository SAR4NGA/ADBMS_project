const { getDBPool, sql } = require('../config/db');

const DEFAULT_EMPLOYEE_ID = 1;
const DEFAULT_PAYMENT_METHOD_ID = 1;
const DEFAULT_STATUS_ID = 1;
const DEFAULT_APPROVER_ID = 1;
const APPROVED_STATUS_ID = 2;

const buildExpenseSelectQuery = `
    SELECT
        eh.ExpenseID,
        eh.DateKey,
        dd.FullDate,
        eh.SupplierID,
        COALESCE(s.SupplierName, 'N/A') AS SupplierName,
        eh.EmployeeID,
        CONCAT(e.FirstName, ' ', e.LastName) AS EmployedBy,
        eh.PaymentMethodID,
        pm.MethodName AS PaymentMethodName,
        eh.StatusID,
        es.StatusName,
        eh.TotalAmount,
        eh.Description
    FROM ExpenseHeader eh
    INNER JOIN DateDimension dd ON dd.DateKey = eh.DateKey
    LEFT JOIN Supplier s ON s.SupplierID = eh.SupplierID
    INNER JOIN Employee e ON e.EmployeeID = eh.EmployeeID
    INNER JOIN PaymentMethod pm ON pm.PaymentMethodID = eh.PaymentMethodID
    INNER JOIN ExpenseStatus es ON es.StatusID = eh.StatusID
`;

const formatDateKey = (dateValue) => {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return Number(`${year}${month}${day}`);
};

const parseDateValue = (dateValue) => {
    if (!dateValue) {
        return new Date();
    }

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Invalid expense date supplied.');
    }

    return parsedDate;
};

const ensureDateDimensionRow = async (transaction, dateValue, dateKey) => {
    const existing = await new sql.Request(transaction)
        .input('dateKey', sql.Int, dateKey)
        .query('SELECT 1 FROM DateDimension WHERE DateKey = @dateKey');

    if (existing.recordset.length > 0) {
        return;
    }

    await new sql.Request(transaction)
        .input('dateKey', sql.Int, dateKey)
        .input('fullDate', sql.Date, dateValue)
        .query(`
            INSERT INTO DateDimension (
                DateKey, FullDate, DayOfWeek,
                MonthName, CalendarYear, CalendarQuarter, IsWeekend
            )
            VALUES (
                @dateKey,
                @fullDate,
                DATENAME(WEEKDAY, @fullDate),
                DATENAME(MONTH, @fullDate),
                YEAR(@fullDate),
                DATEPART(QUARTER, @fullDate),
                CASE WHEN DATENAME(WEEKDAY, @fullDate) IN ('Saturday', 'Sunday') THEN 1 ELSE 0 END
            )
        `);
};

const fetchExpenseById = async (pool, expenseId) => {
    const result = await pool.request()
        .input('expenseId', sql.Int, expenseId)
        .query(`${buildExpenseSelectQuery} WHERE eh.ExpenseID = @expenseId`);

    return result.recordset[0] || null;
};

exports.getExpenses = async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const pool = await getDBPool();
        const result = await pool.request().query(`
            ${buildExpenseSelectQuery}
            ORDER BY dd.FullDate DESC, eh.ExpenseID DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(`[${timestamp}] [EXPENSES] [ERROR] Failed to fetch expenses:`, err);
        res.status(500).json({ message: 'Server error while fetching expenses.' });
    }
};

exports.getExpenseById = async (req, res) => {
    const timestamp = new Date().toISOString();
    const expenseId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(expenseId)) {
        return res.status(400).json({ message: 'Invalid expense ID.' });
    }

    try {
        const pool = await getDBPool();
        const expense = await fetchExpenseById(pool, expenseId);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        const approvalsResult = await pool.request()
            .input('expenseId', sql.Int, expenseId)
            .query(`
                SELECT
                    al.ApprovalID,
                    al.ExpenseID,
                    al.ApprovalDate,
                    al.StatusID,
                    es.StatusName,
                    al.Remarks,
                    al.ApprovedBy,
                    CONCAT(e.FirstName, ' ', e.LastName) AS ApprovedByName
                FROM ApprovalLog al
                INNER JOIN ExpenseStatus es ON es.StatusID = al.StatusID
                INNER JOIN Employee e ON e.EmployeeID = al.ApprovedBy
                WHERE al.ExpenseID = @expenseId
                ORDER BY al.ApprovalDate DESC, al.ApprovalID DESC
            `);

        const lineItemsResult = await pool.request()
            .input('expenseId', sql.Int, expenseId)
            .query(`
                SELECT
                    eli.LineItemID,
                    eli.ExpenseID,
                    eli.ItemID,
                    i.ItemName,
                    eli.ExpenseCategoryID,
                    ec.CategoryName,
                    eli.Quantity,
                    eli.UnitPrice,
                    eli.LineTotal
                FROM ExpenseLineItem eli
                LEFT JOIN Item i ON i.ItemID = eli.ItemID
                INNER JOIN ExpenseCategory ec ON ec.ExpenseCategoryID = eli.ExpenseCategoryID
                WHERE eli.ExpenseID = @expenseId
                ORDER BY eli.LineItemID
            `);

        res.json({
            expense,
            approvals: approvalsResult.recordset,
            lineItems: lineItemsResult.recordset
        });
    } catch (err) {
        console.error(`[${timestamp}] [EXPENSES] [ERROR] Failed to fetch expense ${expenseId}:`, err);
        res.status(500).json({ message: 'Server error while fetching expense details.' });
    }
};

exports.createExpense = async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const {
            description,
            totalAmount,
            supplierId = null,
            employeeId = DEFAULT_EMPLOYEE_ID,
            paymentMethodId = DEFAULT_PAYMENT_METHOD_ID,
            statusId = DEFAULT_STATUS_ID,
            expenseDate,
            dateKey,
            lineItems = []
        } = req.body;

        if (!description || totalAmount === undefined || totalAmount === null) {
            return res.status(400).json({ message: 'Description and total amount are required.' });
        }

        const parsedAmount = Number(totalAmount);
        if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ message: 'Total amount must be a valid non-negative number.' });
        }

        const parsedDate = parseDateValue(expenseDate);
        const resolvedDateKey = dateKey ? Number.parseInt(dateKey, 10) : formatDateKey(parsedDate);

        if (Number.isNaN(resolvedDateKey)) {
            return res.status(400).json({ message: 'Date key is invalid.' });
        }

        const pool = await getDBPool();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            await ensureDateDimensionRow(transaction, parsedDate, resolvedDateKey);

            // Using SCOPE_IDENTITY() which is safe with triggers unlike OUTPUT INSERTED
            const expenseInsertResult = await new sql.Request(transaction)
                .input('dateKey', sql.Int, resolvedDateKey)
                .input('supplierId', sql.Int, supplierId)
                .input('employeeId', sql.Int, employeeId)
                .input('paymentMethodId', sql.Int, paymentMethodId)
                .input('statusId', sql.Int, statusId)
                .input('totalAmount', sql.Decimal(18, 2), parsedAmount)
                .input('description', sql.VarChar(255), description)
                .query(`
                    INSERT INTO ExpenseHeader (
                        DateKey, SupplierID, EmployeeID,
                        PaymentMethodID, StatusID, TotalAmount, Description
                    )
                    VALUES (
                        @dateKey, @supplierId, @employeeId,
                        @paymentMethodId, @statusId, @totalAmount, @description
                    );
                    SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExpenseID;
                `);

            const expenseId = expenseInsertResult.recordset[0].ExpenseID;

            if (Array.isArray(lineItems) && lineItems.length > 0) {
                for (const item of lineItems) {
                    const itemIdRaw = item.itemId ?? item.ItemID;
                    const itemId = (itemIdRaw === null || itemIdRaw === undefined || itemIdRaw === '') ? null : Number.parseInt(itemIdRaw, 10);
                    const categoryId = Number.parseInt(item.categoryId ?? item.expenseCategoryId ?? item.ExpenseCategoryID, 10);
                    const quantity = Number.parseInt(item.quantity ?? item.Quantity, 10) || 1;
                    const unitPrice = Number(item.unitPrice ?? item.UnitPrice);

                    if (Number.isNaN(categoryId) || Number.isNaN(unitPrice)) {
                        throw new Error('Invalid line item supplied.');
                    }

                    await new sql.Request(transaction)
                        .input('expenseId', sql.Int, expenseId)
                        .input('itemId', sql.Int, itemId)
                        .input('categoryId', sql.Int, categoryId)
                        .input('quantity', sql.Int, quantity)
                        .input('unitPrice', sql.Decimal(18, 2), unitPrice)
                        .query(`
                            INSERT INTO ExpenseLineItem (
                                ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice
                            )
                            VALUES (
                                @expenseId, @itemId, @categoryId, @quantity, @unitPrice
                            )
                        `);
                }
            } else {
                // If there are no line items (e.g. general expense), we can insert a default line item
                // to maintain the category if we have a way to pass categoryId.
                // Or maybe the frontend SHOULD send one line item even for general expenses.
            }

            await transaction.commit();

            const createdExpense = await fetchExpenseById(pool, expenseId);

            res.status(201).json({
                message: 'Expense created successfully.',
                expense: createdExpense
            });
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }
    } catch (err) {
        console.error(`[${timestamp}] [EXPENSES] [ERROR] Failed to create expense:`, err);
        res.status(500).json({ message: err.message || 'Server error while creating expense.' });
    }
};

exports.createMultipleExpenses = async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const expenses = req.body.expenses;
        if (!Array.isArray(expenses) || expenses.length === 0) {
            return res.status(400).json({ message: 'An array of expenses is required.' });
        }

        const pool = await getDBPool();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();
        const createdExpenseIds = [];

        try {
            for (const expense of expenses) {
                const {
                    description,
                    totalAmount,
                    supplierId = null,
                    employeeId = DEFAULT_EMPLOYEE_ID,
                    paymentMethodId = DEFAULT_PAYMENT_METHOD_ID,
                    statusId = DEFAULT_STATUS_ID,
                    expenseDate,
                    lineItems = []
                } = expense;

                const parsedAmount = Number(totalAmount);
                if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
                    throw new Error('Total amount must be a valid non-negative number.');
                }

                const parsedDate = parseDateValue(expenseDate);
                const resolvedDateKey = formatDateKey(parsedDate);

                await ensureDateDimensionRow(transaction, parsedDate, resolvedDateKey);

                const expenseInsertResult = await new sql.Request(transaction)
                    .input('dateKey', sql.Int, resolvedDateKey)
                    .input('supplierId', sql.Int, supplierId)
                    .input('employeeId', sql.Int, employeeId)
                    .input('paymentMethodId', sql.Int, paymentMethodId)
                    .input('statusId', sql.Int, statusId)
                    .input('totalAmount', sql.Decimal(18, 2), parsedAmount)
                    .input('description', sql.VarChar(255), description)
                    .query(`
                        INSERT INTO ExpenseHeader (
                            DateKey, SupplierID, EmployeeID,
                            PaymentMethodID, StatusID, TotalAmount, Description
                        )
                        VALUES (
                            @dateKey, @supplierId, @employeeId,
                            @paymentMethodId, @statusId, @totalAmount, @description
                        );
                        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExpenseID;
                    `);

                const expenseId = expenseInsertResult.recordset[0].ExpenseID;
                createdExpenseIds.push(expenseId);

                if (Array.isArray(lineItems) && lineItems.length > 0) {
                    for (const item of lineItems) {
                        const itemIdRaw = item.itemId ?? item.ItemID;
                        const itemId = (itemIdRaw === null || itemIdRaw === undefined || itemIdRaw === '') ? null : Number.parseInt(itemIdRaw, 10);
                        const categoryId = Number.parseInt(item.categoryId ?? item.expenseCategoryId ?? item.ExpenseCategoryID, 10);
                        const quantity = Number.parseInt(item.quantity ?? item.Quantity, 10) || 1;
                        const unitPrice = Number(item.unitPrice ?? item.UnitPrice);

                        if (Number.isNaN(categoryId) || Number.isNaN(unitPrice)) {
                            throw new Error('Invalid line item supplied.');
                        }

                        await new sql.Request(transaction)
                            .input('expenseId', sql.Int, expenseId)
                            .input('itemId', sql.Int, itemId)
                            .input('categoryId', sql.Int, categoryId)
                            .input('quantity', sql.Int, quantity)
                            .input('unitPrice', sql.Decimal(18, 2), unitPrice)
                            .query(`
                                INSERT INTO ExpenseLineItem (
                                    ExpenseID, ItemID, ExpenseCategoryID, Quantity, UnitPrice
                                )
                                VALUES (
                                    @expenseId, @itemId, @categoryId, @quantity, @unitPrice
                                )
                            `);
                    }
                }
            }

            await transaction.commit();

            res.status(201).json({
                message: 'Multiple expenses created successfully.',
                expenseIds: createdExpenseIds
            });
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }
    } catch (err) {
        console.error(`[${timestamp}] [EXPENSES] [ERROR] Failed to bulk create expenses:`, err);
        res.status(500).json({ message: err.message || 'Server error while creating multiple expenses.' });
    }
};

exports.approveExpense = async (req, res) => {
    const timestamp = new Date().toISOString();
    const expenseId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(expenseId)) {
        return res.status(400).json({ message: 'Invalid expense ID.' });
    }

    try {
        const {
            approvedBy = DEFAULT_APPROVER_ID,
            statusId = APPROVED_STATUS_ID,
            remarks = null
        } = req.body;

        const parsedApprovedBy = Number.parseInt(approvedBy, 10);
        const parsedStatusId = Number.parseInt(statusId, 10);

        if (Number.isNaN(parsedApprovedBy) || Number.isNaN(parsedStatusId)) {
            return res.status(400).json({ message: 'Approval payload is invalid.' });
        }

        const pool = await getDBPool();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const expenseExists = await new sql.Request(transaction)
                .input('expenseId', sql.Int, expenseId)
                .query('SELECT ExpenseID FROM ExpenseHeader WHERE ExpenseID = @expenseId');

            if (expenseExists.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Expense not found.' });
            }

            await new sql.Request(transaction)
                .input('expenseId', sql.Int, expenseId)
                .input('approvedBy', sql.Int, parsedApprovedBy)
                .input('statusId', sql.Int, parsedStatusId)
                .input('remarks', sql.VarChar(255), remarks)
                .query(`
                    INSERT INTO ApprovalLog (
                        ExpenseID, ApprovedBy, ApprovalDate, StatusID, Remarks
                    )
                    VALUES (
                        @expenseId, @approvedBy, GETDATE(), @statusId, @remarks
                    )
                `);

            await new sql.Request(transaction)
                .input('expenseId', sql.Int, expenseId)
                .input('statusId', sql.Int, parsedStatusId)
                .query(`
                    UPDATE ExpenseHeader
                    SET StatusID = @statusId
                    WHERE ExpenseID = @expenseId
                `);

            await transaction.commit();

            const expense = await fetchExpenseById(pool, expenseId);

            res.json({
                message: 'Expense approved successfully.',
                expense
            });
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }
    } catch (err) {
        console.error(`[${timestamp}] [EXPENSES] [ERROR] Failed to approve expense ${expenseId}:`, err);
        res.status(500).json({ message: 'Server error while approving expense.' });
    }
};

exports.updateExpense = async (req, res) => {
    const expenseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(expenseId)) return res.status(400).json({ message: 'Invalid expense ID.' });

    try {
        const { description, totalAmount, paymentMethodId, employeeId, supplierId } = req.body;
        const pool = await getDBPool();
        
        // This is a simplified update that only updates the header
        await pool.request()
            .input('id', sql.Int, expenseId)
            .input('desc', sql.VarChar(255), description)
            .input('amount', sql.Decimal(18,2), totalAmount)
            .input('paymentId', sql.Int, paymentMethodId)
            .input('empId', sql.Int, employeeId)
            .input('supId', sql.Int, supplierId || null)
            .query(`
                UPDATE ExpenseHeader 
                SET Description = @desc, TotalAmount = @amount, PaymentMethodID = @paymentId, EmployeeID = @empId, SupplierID = @supId
                WHERE ExpenseID = @id
            `);
            
        res.json({ message: 'Expense updated successfully.' });
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).json({ message: 'Server error while updating expense.' });
    }
};

exports.deleteExpense = async (req, res) => {
    const expenseId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(expenseId)) return res.status(400).json({ message: 'Invalid expense ID.' });

    try {
        const pool = await getDBPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await new sql.Request(transaction).input('id', sql.Int, expenseId).query('DELETE FROM ExpenseLineItem WHERE ExpenseID = @id');
            await new sql.Request(transaction).input('id', sql.Int, expenseId).query('DELETE FROM ApprovalLog WHERE ExpenseID = @id');
            await new sql.Request(transaction).input('id', sql.Int, expenseId).query('DELETE FROM Receipt WHERE ExpenseID = @id');
            await new sql.Request(transaction).input('id', sql.Int, expenseId).query('DELETE FROM ExpenseHeader WHERE ExpenseID = @id');
            
            await transaction.commit();
            res.json({ message: 'Expense deleted successfully.' });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).json({ message: 'Server error while deleting expense.' });
    }
};