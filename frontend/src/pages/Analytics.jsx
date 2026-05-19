import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import TrendLineChart from '../components/charts/TrendLineChart';
import { useAnalytics } from '../hooks/useAnalytics';
import { Loader2, TrendingUp, Lightbulb, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const { analytics, loading, error } = useAnalytics();

  if (loading) {
    return (
      <Layout title="Analytics BI & Forecasting">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-lg font-medium">Running T-SQL regression models...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Analytics BI">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-bold">
          Error loading analytics: {error}
        </div>
      </Layout>
    );
  }

  const { historicalTrends, forecast, supplierProfiles, efficiencyKPIs } = analytics;

  // Enhance trend data with the forecast point for the chart
  const combinedTrendData = [...historicalTrends.map(t => ({ name: t.MonthName, amount: t.TotalSpend, isForecast: false }))];
  if (forecast > 0) {
    const nextMonthLabel = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('default', { month: 'long' });
    combinedTrendData.push({ name: nextMonthLabel + ' (Projected)', amount: forecast, isForecast: true });
  }

  return (
    <Layout title="Analytics BI & Forecasting">
      <div className="space-y-8">
        {/* Dynamic BI Suggestion Box */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex gap-4 items-start">
          <Lightbulb size={32} className="text-yellow-300 shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Automated System Insight</h3>
            <p className="opacity-90 text-sm">
              Based on historical data and seasonal cursor averages, we project next month's spending to be around <strong className="text-white">Rs. {forecast.toLocaleString()}</strong>. 
              The system rejection rate is currently <strong className="text-white">{efficiencyKPIs.RejectionRate}%</strong> with an average turnaround time of {efficiencyKPIs.AvgApprovalDays} days.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Historical Spend & T-SQL Projection" className="border-none shadow-sm">
            <TrendLineChart data={combinedTrendData} color="#8b5cf6" />
          </Card>
          
          <Card title="Supplier Volume & Efficiency" className="border-none shadow-sm">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierProfiles} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="SupplierName" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" tickFormatter={(val) => `Rs.${val/1000}k`} stroke="#3b82f6" tick={{fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar yAxisId="left" dataKey="TotalValue" fill="#3b82f6" name="Total Spend" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="TotalOrders" fill="#10b981" name="Order Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        
        <Card title="Process Efficiency Metrics" className="border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-lg"><TrendingUp size={24}/></div>
              <div>
                <p className="text-xs text-blue-800 uppercase font-bold mb-1">Forecast Algorithm</p>
                <p className="text-lg font-bold text-gray-800">3-Mo. Seasonal Moving Avg</p>
              </div>
            </div>
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-500 text-white rounded-lg"><Target size={24}/></div>
              <div>
                <p className="text-xs text-emerald-800 uppercase font-bold mb-1">Approval Turnaround</p>
                <p className="text-lg font-bold text-gray-800">{efficiencyKPIs.AvgApprovalDays} Days</p>
              </div>
            </div>
            <div className="p-5 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl border border-rose-100 flex items-center gap-4">
              <div className="p-3 bg-rose-500 text-white rounded-lg"><Users size={24}/></div>
              <div>
                <p className="text-xs text-rose-800 uppercase font-bold mb-1">Rejection Rate</p>
                <p className="text-lg font-bold text-gray-800">{efficiencyKPIs.RejectionRate}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;
