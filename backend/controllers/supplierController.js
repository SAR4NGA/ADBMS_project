const { getDBPool, sql } = require('../config/db');

exports.getSuppliers = async (req, res) => {
    try {
        const pool = await getDBPool();
        const result = await pool.request().query(`
            SELECT 
                s.SupplierID, 
                s.SupplierName, 
                s.RegisteredDate, 
                s.SupplierTypeID, 
                st.TypeName as Type 
            FROM Supplier s
            LEFT JOIN SupplierType st ON s.SupplierTypeID = st.SupplierTypeID
            ORDER BY s.SupplierName ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Server error while fetching suppliers.' });
    }
};

exports.getSupplierTypes = async (req, res) => {
    try {
        const pool = await getDBPool();
        const result = await pool.request().query(`
            SELECT SupplierTypeID, TypeName, SupplierCategoryID FROM SupplierType ORDER BY TypeName ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching supplier types:', err);
        res.status(500).json({ message: 'Server error while fetching supplier types.' });
    }
};

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

exports.updateSupplier = async (req, res) => {
    try {
        const supplierId = Number.parseInt(req.params.id, 10);
        const { supplierName, supplierTypeId } = req.body;

        if (Number.isNaN(supplierId)) return res.status(400).json({ message: 'Invalid supplier ID.' });

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

exports.deleteSupplier = async (req, res) => {
    try {
        const supplierId = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(supplierId)) return res.status(400).json({ message: 'Invalid supplier ID.' });

        const pool = await getDBPool();
        
        // First check if there are expenses attached
        const check = await pool.request()
            .input('id', sql.Int, supplierId)
            .query('SELECT COUNT(*) as count FROM ExpenseHeader WHERE SupplierID = @id');
            
        if (check.recordset[0].count > 0) {
            return res.status(400).json({ message: 'Cannot delete supplier because they have associated expenses.' });
        }

        // Delete from SupplierContact, SupplierAddress if exists, then Supplier
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await new sql.Request(transaction).input('id', sql.Int, supplierId).query('DELETE FROM SupplierContact WHERE SupplierID = @id');
            await new sql.Request(transaction).input('id', sql.Int, supplierId).query('DELETE FROM SupplierAddress WHERE SupplierID = @id');
            await new sql.Request(transaction).input('id', sql.Int, supplierId).query('DELETE FROM Supplier WHERE SupplierID = @id');
            await transaction.commit();
            res.json({ message: 'Supplier deleted successfully.' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error deleting supplier:', err);
        res.status(500).json({ message: 'Server error while deleting supplier.' });
    }
};
