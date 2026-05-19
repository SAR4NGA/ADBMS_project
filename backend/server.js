const express = require('express');
const cors = require('cors');
const { loadEnvironment } = require('./config/env');
const { connectDB } = require('./config/db');

loadEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const budgetRoutes = require('./routes/budget');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

const expenseRoutes = require('./routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

const supplierRoutes = require('./routes/supplierRoutes');
app.use('/api/suppliers', supplierRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('Vaultix API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
