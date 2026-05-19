import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import TrendLineChart from '../components/charts/TrendLineChart';
import { useAnalytics } from '../hooks/useAnalytics';

const Analytics = () => {
  const chartData = [
    { name: 'Week 1', amount: 1200 },
    { name: 'Week 2', amount: 1900 },
    { name: 'Week 3', amount: 1500 },
    { name: 'Week 4', amount: 2100 },
  ];

  return (
    <Layout title="Analytics BI">
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Spending Trends (Monthly)">
            <TrendLineChart data={chartData} color="#8b5cf6" />
          </Card>
          <Card title="Quarterly Forecast">
            <TrendLineChart data={chartData} color="#10b981" />
          </Card>
        </div>
        
        <Card title="Data Insights Summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Highest Spend Category</p>
              <p className="text-xl font-bold text-gray-800">Hardware & IT</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Most Active Supplier</p>
              <p className="text-xl font-bold text-gray-800">Global Tech</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Avg. Approval Time</p>
              <p className="text-xl font-bold text-gray-800">1.2 Days</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;
