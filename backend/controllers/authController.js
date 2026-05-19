const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDBPool, sql } = require('../config/db');

exports.login = async (req, res) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    
    try {
        const { username, password } = req.body;

        console.log(`[${timestamp}] [AUTH] [INFO] Login attempt received. Username: "${username || 'N/A'}" from IP: ${ip}`);

        if (!username || !password) {
            console.log(`[${timestamp}] [AUTH] [WARN] Login failed: Missing credentials.`);
            return res.status(400).json({ message: 'Please provide both username and password.' });
        }

        console.log(`[${timestamp}] [AUTH] [INFO] Connecting to database...`);
        const pool = await getDBPool();
        
        console.log(`[${timestamp}] [AUTH] [INFO] Fetching user "${username}" from [User] table...`);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT u.*, r.RoleName 
                FROM [User] u
                LEFT JOIN [Role] r ON u.RoleID = r.RoleID
                WHERE u.Username = @username
            `);

        const user = result.recordset[0];

        if (!user) {
            console.log(`[${timestamp}] [AUTH] [WARN] Login failed: User "${username}" not found.`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log(`[${timestamp}] [AUTH] [INFO] User found. Verifying password for user "${username}"...`);
        const isMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!isMatch) {
            console.log(`[${timestamp}] [AUTH] [WARN] Login failed: Incorrect password for user "${username}".`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT
        const payload = {
            id: user.UserID,
            username: user.Username,
            role: user.RoleName
        };

        console.log(`[${timestamp}] [AUTH] [INFO] Password verified. Generating JWT token for "${username}"...`);
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        console.log(`[${timestamp}] [AUTH] [SUCCESS] User "${username}" (Role: ${user.RoleName}) logged in successfully.`);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: payload.id,
                username: payload.username,
                role: payload.role
            }
        });

    } catch (err) {
        console.error(`[${timestamp}] [AUTH] [ERROR] Exception occurred during login flow:`, err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
