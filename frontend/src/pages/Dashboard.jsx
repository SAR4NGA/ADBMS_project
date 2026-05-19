import React from 'react';
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
    { label: 'Total Expenses (Aprvd)', value: `Rs. ${stats.totalExpenses.toLocaleString()}`, icon: <DollarSign size={24}/>, color: 'text-blue-600', bg: 'bg-blue-100' },
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
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
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
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.StatusName === 'Approved' ? 'bg-green-500' : activity.StatusName === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
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