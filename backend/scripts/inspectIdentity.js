const { sql, connectDB } = require('../config/db');
(async () => {
  try {
    const pool = await connectDB();
    const res = await pool.request().query(`
      SELECT COLUMN_NAME, is_identity 
      FROM sys.columns 
      WHERE object_id = object_id('Supplier')
    `);
    console.log('Supplier columns:', res.recordset);
    
    // Also let's check SupplierCategory mapping
    const cats = await pool.request().query('SELECT * FROM SupplierCategory');
    console.log('Supplier Categories:', cats.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
