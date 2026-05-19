const sql = require('mssql');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    }
};

let poolPromise = null;

const connectDB = async () => {
    try {
        if (!poolPromise) {
            poolPromise = new sql.ConnectionPool(dbConfig).connect();
        }
        const pool = await poolPromise;
        console.log('✅ Connected to SQL Server successfully.');
        return pool;
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
};

const getDBPool = async () => {
    if (!poolPromise) {
        return await connectDB();
    }
    return poolPromise;
}

module.exports = {
    connectDB,
    getDBPool,
    sql
};
