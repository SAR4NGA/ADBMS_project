const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const loadEnvironment = () => {
    const envPaths = [
        path.resolve(__dirname, '../.env'),
        path.resolve(__dirname, '../../.env')
    ];

    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            return envPath;
        }
    }

    dotenv.config();
    return null;
};

module.exports = {
    loadEnvironment
};