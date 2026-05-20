import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import Budget from './pages/Budget';
import Suppliers from './pages/Suppliers';
import Approvals from './pages/Approvals';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

function App() {
  return (
    // import.meta.env.BASE_URL will automatically grab '/ADBMS_project/' from your vite.config.js
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expenses/add" element={<AddExpense />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;