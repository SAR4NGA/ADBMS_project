const fs = require('fs');

const dPath = "d:/Project/ADBMS/Vaultix/frontend/src/pages/Dashboard.jsx";
const dCode = `import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import TrendLineChart from '../components/charts/TrendLineChart';
import { useDashboard } from '../hooks/useDashboard';
import { DollarSign, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-bold">
          Error loading dashboard insights.
        </div>
      </Layout>
    );
  }

  const { stats, chartData, recentActivity } = data;

  const displayStats = [
    { label: 'Total Expenses (Aprvd)', value: \`Rs. \${stats.totalExpenses.toLocaleString()}\`, icon: <DollarSign size={24}/>, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Monthly Trend', value: stats.monthlyTrend, icon: <TrendingUp size={24}/>, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Active Suppliers', value: stats.activeSuppliers, icon: <Users size={24}/>, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <AlertCircle size={24}/>, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className={\`p-3 rounded-xl \${stat.bg} \${stat.color}\`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <h4 className="text-2xl font-bold text-gray-800">{stat.value}</h4>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Expense Overview (Last 6 Months)" className="lg:col-span-2 border-none shadow-sm">
          <TrendLineChart data={chartData} />
        </Card>
        
        <Card title="Recent Activity" className="border-none shadow-sm">
          <div className="space-y-6">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={\`w-2 h-2 rounded-full mt-2 \${activity.StatusName === 'Approved' ? 'bg-green-500' : activity.StatusName === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}\`}></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{activity.Description || 'Expense Created'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.FullDate).toLocaleDateString()} &bull; {activity.SupplierName || 'Internal'}
                  </p>
                  <p className="text-xs font-bold mt-1 text-gray-700">Rs. {activity.TotalAmount.toLocaleString()} ({activity.StatusName})</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity found.</p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
`;
fs.writeFileSync(dPath, dCode);

const bPath = "d:/Project/ADBMS/Vaultix/frontend/src/pages/Budget.jsx";
const bCode = `import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BudgetBarChart from '../components/charts/BudgetBarChart';
import { useBudget } from '../hooks/useBudget';
import { useExpenseLookups } from '../hooks/useExpenseLookups';
import { createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { AlertCircle, Loader2, PieChart, Plus, Trash2, Edit2, X } from 'lucide-react';

const Budget = () => {
  const { budgets, loading, error, refresh } = useBudget();
  const { categories } = useExpenseLookups();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ categoryId: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ categoryId: '', amount: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingId(b.id);
    setFormData({ categoryId: b.categoryId, amount: b.budget });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      try {
        await deleteBudget(id);
        refresh();
      } catch (err) {
        alert('Failed to delete budget.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount || Number(formData.amount) <= 0) {
      alert('Please select a category and enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBudget(editingId, { amount: Number(formData.amount) });
      } else {
        const exists = budgets.find(b => String(b.categoryId) === String(formData.categoryId));
        if (exists) {
          alert('A budget is already set for this category this month. Please edit the existing budget instead.');
          setIsSubmitting(false);
          return;
        }
        await createBudget({ categoryId: Number(formData.categoryId), amount: Number(formData.amount) });
      }
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      alert('Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Budget Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-600 font-medium">Monthly Category Limits</h2>
        <Button className="flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} />
          Set New Budget
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-lg font-medium">Fetching budget data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={24} />
          <div>
            <p className="font-bold">Error loading budget</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : budgets.length === 0 ? (
        <Card className="text-center py-12">
          <PieChart className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800">No Budget Set</h3>
          <p className="text-gray-500">There are no budget allocations for the current month.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <Card title="Budget vs Actual Spent" className="border-none shadow-sm">
            <BudgetBarChart data={budgets} />
          </Card>
          
          <Card title="Budget Allocation Details" className="border-none shadow-sm">
            <div className="space-y-6">
              {budgets.map((item, index) => (
                <div key={index} className="group relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block">
                        {item.category}
                      </span>
                      <span className={\`text-xs font-bold \${item.spent > item.budget ? 'text-red-600' : 'text-gray-500'}\`}>
                        Rs. {item.spent.toLocaleString()} / Rs. {item.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-blue-500" title="Edit Budget">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500" title="Delete Budget">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={\`h-full rounded-full transition-all duration-1000 ease-out \${
                        item.spent > item.budget ? 'bg-red-500' : 'bg-blue-600'
                      }\`}
                      style={{ width: \`\${Math.min((item.spent / item.budget) * 100, 100)}%\` }}
                    ></div>
                  </div>
                  {item.spent > item.budget && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle size={10} /> Over Budget
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Budget Limit' : 'Set New Budget Limit'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Expense Category</label>
                  <select 
                    value={formData.categoryId} 
                    onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                    disabled={!!editingId}
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.ExpenseCategoryID} value={c.ExpenseCategoryID}>{c.CategoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Allocated Amount (Rs.)</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Enter limit amount..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-6">
                  {isSubmitting ? 'Saving...' : 'Save Limit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Budget;
`;
fs.writeFileSync(bPath, bCode);