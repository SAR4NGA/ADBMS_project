const express = require('express');
const cors = require('cors');
const { loadEnvironment } = require('./config/env');
const { connectDB } = require('./config/db');

loadEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins: GitHub Pages (production) + localhost (development)
const allowedOrigins = [
    'https://sar4nga.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
const authRoutes      = require('./routes/authRoutes');
const budgetRoutes    = require('./routes/budget');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const expenseRoutes   = require('./routes/expenseRoutes');
const supplierRoutes  = require('./routes/supplierRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/budget',    budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/suppliers', supplierRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('Vaultix API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
