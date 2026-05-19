const { connectDB } = require('../config/db');

const inspectDb = async () => {
    try {
        const pool = await connectDB();
        
        const tablesToInspect = [
            'Supplier', 'Item', 'ExpenseCategory', 'SupplierCategory', 
            'ExpenseHeader', 'ExpenseLineItem'
        ];

        for (const table of tablesToInspect) {
            console.log(`\n🔄 Checking structure of [${table}] table...`);
            const columns = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${table}'
            `);
            console.log(columns.recordset);
        }

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
};

inspectDb();
