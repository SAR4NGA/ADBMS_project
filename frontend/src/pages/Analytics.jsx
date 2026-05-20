import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import TrendLineChart from '../components/charts/TrendLineChart';
import { useAnomalies } from '../hooks/useAnomalies';
import { useExpenseTrends } from '../hooks/useExpenseTrends';
import {
  Loader2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, BarChart2, TableProperties, ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly severity helpers
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getSeverity(pct) {
  if (pct > 30)  return { label: 'Major Spike',   color: 'bg-red-100 border-red-300',      badge: 'bg-red-500 text-white',       icon: <AlertTriangle size={20} className="text-red-500" />,    arrow: <TrendingUp size={16} className="text-red-500" /> };
  if (pct > 15)  return { label: 'Minor Spike',   color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-400 text-white',    icon: <TrendingUp   size={20} className="text-orange-500" />, arrow: <TrendingUp size={16} className="text-orange-400" /> };
  if (pct < -30) return { label: 'Major Saving',  color: 'bg-emerald-50 border-emerald-300', badge: 'bg-emerald-500 text-white', icon: <TrendingDown size={20} className="text-emerald-600" />, arrow: <TrendingDown size={16} className="text-emerald-500" /> };
  if (pct < -15) return { label: 'Minor Saving',  color: 'bg-green-50 border-green-200',  badge: 'bg-green-400 text-white',     icon: <TrendingDown size={20} className="text-green-500" />,  arrow: <TrendingDown size={16} className="text-green-400" /> };
  return           { label: 'Normal',             color: 'bg-slate-50 border-slate-200',  badge: 'bg-slate-400 text-white',     icon: <CheckCircle2 size={20} className="text-slate-400" />,  arrow: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Anomaly Detector
// ─────────────────────────────────────────────────────────────────────────────
function BITab() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { anomalies, loading, error, summary } = useAnomalies(year, month);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-medium">Analysing spending patterns...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header + Filters */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={22} className="text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Spending Anomaly Detector</h2>
          </div>
          <p className="text-sm text-gray-500">
            Comparing <strong>{MONTH_NAMES[month]} {year}</strong> against 3-month historical average per category.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {MONTH_NAMES.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={20} className="text-red-500" /></div>
          <div>
            <p className="text-xs text-red-700 font-bold uppercase">Spending Spikes</p>
            <p className="text-2xl font-bold text-red-600">{summary.spikes}</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><TrendingDown size={20} className="text-emerald-600" /></div>
          <div>
            <p className="text-xs text-emerald-700 font-bold uppercase">Cost Savings</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.savings}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg"><CheckCircle2 size={20} className="text-slate-500" /></div>
          <div>
            <p className="text-xs text-slate-600 font-bold uppercase">Normal</p>
            <p className="text-2xl font-bold text-slate-600">{summary.normal}</p>
          </div>
        </div>
      </div>

      {/* Anomaly Cards Grid */}
      {anomalies.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle2 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-semibold">No spending data for this period.</p>
          <p className="text-sm mt-1">Select a different month or year.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {anomalies.map(a => {
            const sev = getSeverity(a.VariancePct);
            const barW = Math.min(100, Math.abs(a.VariancePct));
            const isSpike = a.VariancePct >= 0;
            return (
              <div key={a.CategoryName} className={`rounded-xl border p-5 ${sev.color} transition-shadow hover:shadow-md`}>
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {sev.icon}
                    <h3 className="font-bold text-gray-800 text-sm">{a.CategoryName}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.badge}`}>
                    {sev.label}
                  </span>
                </div>

                {/* Amounts */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">This Month</span>
                    <span className="font-bold text-gray-800">Rs. {Number(a.CurrentSpend).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">3-Mo. Average</span>
                    <span className="font-medium text-gray-600">
                      {a.AvgSpend > 0 ? `Rs. ${Math.round(a.AvgSpend).toLocaleString()}` : 'No history'}
                    </span>
                  </div>
                </div>

                {/* Variance Bar */}
                {a.AvgSpend > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Variance</span>
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${isSpike ? 'text-red-600' : 'text-emerald-600'}`}>
                        {sev.arrow}
                        {isSpike ? '+' : ''}{a.VariancePct}%
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${
                          isSpike ? 'bg-red-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Expense Trends
// ─────────────────────────────────────────────────────────────────────────────
function TrendsTab() {
  const [year, setYear]         = useState(2026);
  const [category, setCategory] = useState('all');

  const { chartData, categories, loading, error, kpis } = useExpenseTrends(year);

  const filteredData = category === 'all'
    ? chartData
    : chartData.map(row => ({ month: row.month, [category]: row[category] }));

  const visibleCategories = category === 'all' ? categories : [category];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-medium">Loading expense trends...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Monthly Expense Breakdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">Spending by category — Vaultix</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent (YTD)',  value: `Rs. ${kpis.totalSpent.toLocaleString()}`,  color: 'bg-indigo-50 border-indigo-100 text-indigo-800' },
          { label: 'Monthly Average',    value: `Rs. ${kpis.monthlyAvg.toLocaleString()}`,  color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: `Highest — ${kpis.highestMonth.month}`, value: `Rs. ${kpis.highestMonth.total.toLocaleString()}`, color: 'bg-amber-50 border-amber-100 text-amber-800' },
          { label: `Lowest  — ${kpis.lowestMonth.month}`,  value: `Rs. ${kpis.lowestMonth.total === Infinity ? '—' : kpis.lowestMonth.total.toLocaleString()}`, color: 'bg-rose-50 border-rose-100 text-rose-800' },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-xl border p-4 ${kpi.color}`}>
            <p className="text-xs font-semibold uppercase opacity-70 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Category Line Chart */}
      <Card title="Category Spending by Month" className="border-none shadow-sm">
        <TrendLineChart data={filteredData} categories={visibleCategories} />
      </Card>

      {/* Monthly Summary Table */}
      <Card title="Monthly Summary" className="border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 text-gray-500 font-semibold">Month</th>
                {visibleCategories.map(c => (
                  <th key={c} className="text-left py-2.5 px-3 text-gray-500 font-semibold">{c}</th>
                ))}
                <th className="text-left py-2.5 px-3 text-gray-500 font-semibold">Total</th>
                <th className="text-left py-2.5 px-3 text-gray-500 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => {
                const total  = visibleCategories.reduce((s, c) => s + (row[c] || 0), 0);
                const isOver = total > kpis.monthlyAvg * 1.05;
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{row.month}</td>
                    {visibleCategories.map(c => (
                      <td key={c} className="py-2.5 px-3 text-gray-600">
                        Rs. {(row[c] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 font-bold text-gray-800">
                      Rs. {total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={isOver ? 'red' : 'green'}>
                        {isOver ? 'Over budget' : 'On track'}
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Analytics Page — tabbed shell
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'trends', label: 'Expense Trends',   icon: <BarChart2  size={16} /> },
  { id: 'bi',     label: 'Anomaly Detector', icon: <ShieldAlert size={16} /> },
];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('trends');

  return (
    <Layout title="Analytics">
      <div className="space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Business intelligence and expense trend analysis</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'bi'     && <BITab />}
        {activeTab === 'trends' && <TrendsTab />}

      </div>
    </Layout>
  );
};

export default Analytics;
