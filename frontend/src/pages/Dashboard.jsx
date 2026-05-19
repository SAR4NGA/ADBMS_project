import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useDashboard } from '../hooks/useDashboard';
import { DollarSign, CalendarDays, Users, AlertCircle, Loader2, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Dashboard = () => {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-lg font-medium">Loading advanced insights...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-bold">
          Error loading dashboard insights: {error}
        </div>
      </Layout>
    );
  }

  const { stats, categorySpend, topSuppliers, paymentMethods, alerts, recentActivity } = data;

  const displayStats = [
    { label: `MTD Spend (${stats.activePeriod.month}/${stats.activePeriod.year})`, value: `Rs. ${(stats.totalExpenses || 0).toLocaleString()}`, icon: <DollarSign size={24}/>, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Daily Spend (Latest Active)', value: `Rs. ${(stats.dailySpend || 0).toLocaleString()}`, icon: <CalendarDays size={24}/>, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Budget Utilization', value: `${stats.budgetUtilization}%`, icon: <CheckCircle size={24}/>, color: stats.budgetUtilization > 90 ? 'text-red-600' : 'text-purple-600', bg: stats.budgetUtilization > 90 ? 'bg-red-100' : 'bg-purple-100' },
    { label: 'Pending Approvals', value: `${stats.pendingApprovals} (Rs. ${(stats.pendingApprovalsValue || 0).toLocaleString()})`, icon: <Clock size={24}/>, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <Layout title="Dashboard">
      {/* Dynamic Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-xl flex items-center gap-3 border ${alert.EventType === 'Budget Alert' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <AlertCircle size={20} className={alert.EventType === 'Budget Alert' ? 'text-red-600' : 'text-amber-600'} />
              <span className="font-medium text-sm">{alert.Message}</span>
              <span className="text-xs opacity-70 ml-auto">{new Date(alert.DateEvent).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <h4 className="text-xl font-bold text-gray-800">{stat.value}</h4>
              </div>
            </div>
            {stat.label === 'Budget Utilization' && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                <div className={`h-1.5 rounded-full ${stats.budgetUtilization > 90 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}></div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Category Spend Donut */}
        <Card title="Category Spend Breakdown" className="border-none shadow-sm col-span-1">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySpend} dataKey="TotalSpend" nameKey="CategoryName" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {categorySpend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 max-h-32 overflow-y-auto">
            {categorySpend.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.CategoryName}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Top Suppliers Bar Chart */}
        <Card title="Top 5 Suppliers (MTD)" className="lg:col-span-2 border-none shadow-sm">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(val) => `Rs.${val/1000}k`} stroke="#94a3b8" />
                <YAxis dataKey="SupplierName" type="category" width={120} tick={{ fontSize: 12, fill: '#475569' }} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val) => `Rs. ${val.toLocaleString()}`} />
                <Bar dataKey="TotalSpend" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <Card title="Payment Distribution" className="border-none shadow-sm">
          <div className="space-y-4">
            {paymentMethods.map((pm, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{pm.MethodName}</p>
                    <p className="text-xs text-gray-500">{pm.TransactionCount} Transactions</p>
                  </div>
                </div>
                <p className="font-bold text-gray-800">Rs. {pm.TotalAmount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Transactions" className="lg:col-span-2 border-none shadow-sm">
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full shadow-sm ${activity.StatusName === 'Approved' ? 'bg-emerald-500' : activity.StatusName === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-800">{activity.Description}</p>
                    <p className="text-sm font-bold text-gray-900">Rs. {activity.TotalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">{new Date(activity.FullDate).toLocaleDateString()} &bull; {activity.SupplierName || 'Internal'}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${activity.StatusName === 'Approved' ? 'bg-emerald-100 text-emerald-700' : activity.StatusName === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {activity.StatusName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 text-sm italic">No recent activity found.</p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;