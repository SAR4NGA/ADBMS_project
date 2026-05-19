const { getDBPool, sql } = require('../config/db');

// GET all suppliers — rich query with contact info, address & total spend
// (merged from analytics-backend branch)
exports.getSuppliers = async (req, res) => {
    try {
        const pool = await getDBPool();
        const result = await pool.request().query(`
            SELECT 
                s.SupplierID,
                s.SupplierName,
                s.RegisteredDate,
                s.SupplierTypeID,
                st.TypeName AS Category,
                sa.City,
                sa.Province,
                (
                    SELECT TOP 1 ContactValue 
                    FROM SupplierContact 
                    WHERE SupplierID = s.SupplierID AND ContactType = 'Email'
                ) AS Email,
                (
                    SELECT TOP 1 ContactValue 
                    FROM SupplierContact 
                    WHERE SupplierID = s.SupplierID AND ContactType = 'Phone'
                ) AS Phone,
                ISNULL((
                    SELECT SUM(TotalAmount) 
                    FROM ExpenseHeader 
                    WHERE SupplierID = s.SupplierID AND StatusID = 2 -- 'Approved'
                ), 0) AS TotalSpend
            FROM Supplier s
            JOIN SupplierType st ON s.SupplierTypeID = st.SupplierTypeID
            LEFT JOIN SupplierAddress sa ON s.SupplierID = sa.SupplierID AND sa.IsPrimary = 1
            ORDER BY s.SupplierName ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Server error while fetching suppliers.' });
    }
};

// GET all supplier types
exports.getSupplierTypes = async (req, res) => {
    try {
        const pool = await getDBPool();
        const result = await pool.request().query(`
            SELECT SupplierTypeID, TypeName, SupplierCategoryID 
            FROM SupplierType 
            ORDER BY TypeName ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching supplier types:', err);
        res.status(500).json({ message: 'Server error while fetching supplier types.' });
    }
};

// POST create a new supplier
exports.createSupplier = async (req, res) => {
    try {
        const { supplierName, registeredDate, supplierTypeId } = req.body;
        if (!supplierName || !supplierTypeId) {
            return res.status(400).json({ message: 'Supplier name and type are required.' });
        }

        const date = registeredDate || new Date().toISOString().split('T')[0];

        const pool = await getDBPool();
        const result = await pool.request()
            .input('name', sql.VarChar(150), supplierName)
            .input('date', sql.Date, date)
            .input('type', sql.Int, supplierTypeId)
            .query(`
                INSERT INTO Supplier (SupplierName, RegisteredDate, SupplierTypeID)
                VALUES (@name, @date, @type);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS SupplierID;
            `);

        const newId = result.recordset[0].SupplierID;
        res.status(201).json({ message: 'Supplier created successfully.', SupplierID: newId });
    } catch (err) {
        console.error('Error creating supplier:', err);
        res.status(500).json({ message: 'Server error while creating supplier.' });
    }
};

// PUT update an existing supplier
exports.updateSupplier = async (req, res) => {
    try {
        const supplierId = Number.parseInt(req.params.id, 10);
        const { supplierName, supplierTypeId } = req.body;

        if (Number.isNaN(supplierId)) {
            return res.status(400).json({ message: 'Invalid supplier ID.' });
        }

        const pool = await getDBPool();
        await pool.request()
            .input('id', sql.Int, supplierId)
            .input('name', sql.VarChar(150), supplierName)
            .input('type', sql.Int, supplierTypeId)
            .query(`
                UPDATE Supplier 
                SET SupplierName = @name, SupplierTypeID = @type
                WHERE SupplierID = @id
            `);

        res.json({ message: 'Supplier updated successfully.' });
    } catch (err) {
        console.error('Error updating supplier:', err);
        res.status(500).json({ message: 'Server error while updating supplier.' });
    }
};

// DELETE a supplier (with safety check for associated expenses)
exports.deleteSupplier = async (req, res) => {
    try {
        const supplierId = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(supplierId)) {
            return res.status(400).json({ message: 'Invalid supplier ID.' });
        }

        const pool = await getDBPool();

        // Block deletion if supplier has linked expenses
        const check = await pool.request()
            .input('id', sql.Int, supplierId)
            .query('SELECT COUNT(*) AS count FROM ExpenseHeader WHERE SupplierID = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({
                message: 'Cannot delete supplier because they have associated expenses.'
            });
        }

        // Delete contacts → addresses → supplier (in a transaction)
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await new sql.Request(transaction)
                .input('id', sql.Int, supplierId)
                .query('DELETE FROM SupplierContact WHERE SupplierID = @id');
            await new sql.Request(transaction)
                .input('id', sql.Int, supplierId)
                .query('DELETE FROM SupplierAddress WHERE SupplierID = @id');
            await new sql.Request(transaction)
                .input('id', sql.Int, supplierId)
                .query('DELETE FROM Supplier WHERE SupplierID = @id');
            await transaction.commit();
            res.json({ message: 'Supplier deleted successfully.' });
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        console.error('Error deleting supplier:', err);
        res.status(500).json({ message: 'Server error while deleting supplier.' });
    }
};
