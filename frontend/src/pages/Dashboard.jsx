import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import TrendLineChart from '../components/charts/TrendLineChart';
import { useExpenses } from '../hooks/useExpenses';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { expenses, loading } = useExpenses();

  const stats = [
    { label: 'Total Expenses', value: '$12,450', icon: <DollarSign size={24}/>, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Monthly Trend', value: '+12.5%', icon: <TrendingUp size={24}/>, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Active Suppliers', value: '24', icon: <Users size={24}/>, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Pending Approvals', value: '7', icon: <AlertCircle size={24}/>, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const chartData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 2000 },
    { name: 'Apr', amount: 2780 },
    { name: 'May', amount: 1890 },
    { name: 'Jun', amount: 2390 },
    { name: 'Jul', amount: 3490 },
  ];

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
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
        <Card title="Expense Overview" className="lg:col-span-2 border-none shadow-sm">
          <TrendLineChart data={chartData} />
        </Card>
        
        <Card title="Recent Activity" className="border-none shadow-sm">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">New expense added</p>
                  <p className="text-xs text-gray-500">2 hours ago • Office Supplies</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
