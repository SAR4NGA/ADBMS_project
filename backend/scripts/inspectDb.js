const { connectDB } = require('../config/db');

const inspectDb = async () => {
    try {
        const pool = await connectDB();
        
        console.log('🔄 Listing all tables in database...');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        console.log('Tables:', tables.recordset.map(r => r.TABLE_NAME));

        console.log('🔄 Checking structure of [Employee] table if it exists...');
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Employee'
        `);
        console.log('Employee Columns:', columns.recordset);

        console.log('🔄 Checking structure of [Role] table if it exists...');
        const roleColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Role'
        `);
        console.log('Role Columns:', roleColumns.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
};

inspectDb();
