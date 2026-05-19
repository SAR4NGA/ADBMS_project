const bcrypt = require('bcrypt');
const { connectDB, sql } = require('../config/db');

const initDatabase = async () => {
    console.log('🔄 Starting database initialization...');
    try {
        const pool = await connectDB();
        
        console.log('🔄 Creating [User] table if not exists...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='User' and xtype='U')
            BEGIN
                CREATE TABLE [User] (
                    UserID INT PRIMARY KEY IDENTITY(1,1),
                    Username VARCHAR(50) UNIQUE NOT NULL,
                    PasswordHash VARCHAR(255) NOT NULL,
                    RoleID INT FOREIGN KEY REFERENCES [Role](RoleID),
                    FirstName VARCHAR(100) NULL,
                    LastName VARCHAR(100) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Table [User] created.';
            END
            ELSE
            BEGIN
                PRINT 'Table [User] already exists.';
            END
        `);

        // Check and insert Admin role in the Role table if it doesn't exist
        console.log('🔄 Ensuring "Admin" role exists in Role table...');
        let roleResult = await pool.request()
            .input('roleName', sql.VarChar, 'Admin')
            .query(`
                IF NOT EXISTS (SELECT 1 FROM [Role] WHERE RoleName = @roleName)
                BEGIN
                    INSERT INTO [Role] (RoleName) VALUES (@roleName);
                    SELECT SCOPE_IDENTITY() AS RoleID;
                END
                ELSE
                BEGIN
                    SELECT RoleID FROM [Role] WHERE RoleName = @roleName;
                END
            `);
        
        let adminRoleId = roleResult.recordset[0]?.RoleID || roleResult.recordset[0]?.RoleId;
        
        if (!adminRoleId) {
            const existingRole = await pool.request()
                .input('roleName', sql.VarChar, 'Admin')
                .query(`SELECT RoleID FROM [Role] WHERE RoleName = @roleName`);
            adminRoleId = existingRole.recordset[0]?.RoleID || existingRole.recordset[0]?.RoleId;
        }

        console.log(`ℹ️ Admin Role ID is: ${adminRoleId}`);

        // Check if admin user exists in User table
        const adminUsername = 'admin';
        const adminPlainPassword = 'admin1234';
        
        console.log(`🔄 Checking if admin user "${adminUsername}" exists in [User] table...`);
        const userCheck = await pool.request()
            .input('username', sql.VarChar, adminUsername)
            .query(`SELECT * FROM [User] WHERE Username = @username`);

        if (userCheck.recordset.length === 0) {
            console.log(`🔄 Hashing password for admin...`);
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(adminPlainPassword, saltRounds);

            console.log(`🔄 Inserting admin user into [User]...`);
            await pool.request()
                .input('username', sql.VarChar, adminUsername)
                .input('passwordHash', sql.VarChar, passwordHash)
                .input('roleId', sql.Int, adminRoleId)
                .input('firstName', sql.VarChar, 'System')
                .input('lastName', sql.VarChar, 'Administrator')
                .query(`
                    INSERT INTO [User] (Username, PasswordHash, RoleID, FirstName, LastName)
                    VALUES (@username, @passwordHash, @roleId, @firstName, @lastName)
                `);
            console.log('✅ Admin user created successfully in [User] table.');
        } else {
            console.log('ℹ️ Admin user already exists in [User] table. Checking password compatibility...');
            const existingAdmin = userCheck.recordset[0];
            const isMatch = await bcrypt.compare(adminPlainPassword, existingAdmin.PasswordHash);
            if (!isMatch) {
                console.log('🔄 Updating password for existing admin to "admin1234"...');
                const passwordHash = await bcrypt.hash(adminPlainPassword, 10);
                await pool.request()
                    .input('username', sql.VarChar, adminUsername)
                    .input('passwordHash', sql.VarChar, passwordHash)
                    .query(`UPDATE [User] SET PasswordHash = @passwordHash WHERE Username = @username`);
                console.log('✅ Admin password updated successfully.');
            } else {
                console.log('✅ Admin password is up to date.');
            }
        }

        console.log('✅ Database initialization complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during database initialization:', err);
        process.exit(1);
    }
};

initDatabase();
