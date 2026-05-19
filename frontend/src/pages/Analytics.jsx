import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAnalytics } from '../hooks/useAnalytics';
import TrendLineChart from '../components/charts/TrendLineChart';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function Analytics() {
  const [year, setYear]         = useState(2026);
  const [category, setCategory] = useState('all');

  const { chartData, categories, loading, error, kpis } = useAnalytics(year);

  const filteredData = category === 'all'
    ? chartData
    : chartData.map(row => ({
        month: row.month,
        [category]: row[category]
      }));

  const visibleCategories = category === 'all' ? categories : [category];

  if (loading) return (
    <Layout title="Analytics BI">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout title="Analytics BI">
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load analytics</p>
      </div>
    </Layout>
  );

  return (
    <Layout title="Analytics BI">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Expense Trend Analysis
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monthly spending breakdown — Vaultix
            </p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
            >
              <option value="all">All categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-gray-500">Total Spent (YTD)</p>
            <p className="text-2xl font-semibold mt-1">
              ${kpis.totalSpent.toLocaleString()}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Monthly Average</p>
            <p className="text-2xl font-semibold mt-1">
              ${kpis.monthlyAvg.toLocaleString()}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Highest Month</p>
            <p className="text-2xl font-semibold mt-1">
              {kpis.highestMonth.month}
            </p>
            <p className="text-xs text-gray-400">
              ${kpis.highestMonth.total.toLocaleString()}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Lowest Month</p>
            <p className="text-2xl font-semibold mt-1">
              {kpis.lowestMonth.month}
            </p>
            <p className="text-xs text-gray-400">
              ${kpis.lowestMonth.total === Infinity ? '—' : kpis.lowestMonth.total?.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card title="Monthly spending by category">
          <TrendLineChart
            data={filteredData}
            categories={visibleCategories}
          />
        </Card>

        {/* Summary Table */}
        <Card title="Monthly summary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Month</th>
                  {visibleCategories.map(c => (
                    <th key={c} className="text-left py-2 px-3 text-gray-500 font-medium">{c}</th>
                  ))}
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => {
                  const total = visibleCategories.reduce((s, c) => s + (row[c] || 0), 0);
                  const avg = kpis.monthlyAvg;
                  const isOver = total > avg * 1.05;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{row.month}</td>
                      {visibleCategories.map(c => (
                        <td key={c} className="py-2 px-3">
                          ${(row[c] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 px-3 font-medium">${total.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <Badge variant={isOver ? 'red' : 'green'}>
                          {isOver ? 'Over' : 'On track'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </Layout>
  );
}
