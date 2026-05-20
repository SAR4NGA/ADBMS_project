import React from 'react';
import { Link } from 'react-router-dom';
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

  // Safe destructuring with robust default values
  const stats = data.stats || {
    totalExpenses: 0,
    dailySpend: 0,
    activeSuppliers: 0,
    pendingApprovals: 0,
    pendingApprovalsValue: 0,
    budgetUtilization: 0,
    activePeriod: { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
  };
  
  if (!stats.activePeriod) {
    stats.activePeriod = { month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  }

  const categorySpend = data.categorySpend || [];
  const topSuppliers = data.topSuppliers || [];
  const paymentMethods = data.paymentMethods || [];
  const alertsList = data.alerts || [];
  const recentActivity = data.recentActivity || [];

  const displayStats = [
    { label: `MTD Spend (${stats.activePeriod.month}/${stats.activePeriod.year})`, value: `Rs. ${(stats.totalExpenses || 0).toLocaleString()}`, icon: <DollarSign size={24}/>, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Daily Spend (Latest Active)', value: `Rs. ${(stats.dailySpend || 0).toLocaleString()}`, icon: <CalendarDays size={24}/>, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Budget Utilization', value: `${stats.budgetUtilization}%`, icon: <CheckCircle size={24}/>, color: stats.budgetUtilization > 90 ? 'text-red-600' : 'text-purple-600', bg: stats.budgetUtilization > 90 ? 'bg-red-100' : 'bg-purple-100' },
    { label: 'Pending Approvals', value: `${stats.pendingApprovals} (Rs. ${(stats.pendingApprovalsValue || 0).toLocaleString()})`, icon: <Clock size={24}/>, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  // Calculate dynamic health score — cap at 1 alert per type so multiple triggers
  // for the same category don't unrealistically push the gauge to 0
  const hasBudgetAlert  = alertsList.some(a => a.EventType === 'Budget Alert');
  const hasSystemNotice = alertsList.some(a => a.EventType === 'System Notice');
  const healthScore = Math.max(
    0,
    100 - (hasBudgetAlert ? 20 : 0) - (hasSystemNotice ? 10 : 0)
  );

  return (
    <Layout title="Dashboard">
      {/* Visual Alerts & Intelligence Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Health Gauge (Graphical Representation) */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Decorative subtle background gradient glow */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-blue-50 blur-xl group-hover:bg-blue-100 transition-colors duration-500"></div>
          
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Operational Control Center
            </h3>
            <p className="text-xs text-gray-500">Real-time budget integrity & compliance metrics.</p>
          </div>

          {/* Graphical Radial/Linear Health Meter */}
          <div className="my-6 flex flex-col items-center justify-center">
            {/* Custom SVG Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  className="stroke-gray-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Foreground Ring with Dynamic Dasharray */}
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  stroke={
                    healthScore >= 90
                      ? '#10b981' // Green
                      : healthScore >= 60
                      ? '#f59e0b' // Amber
                      : '#ef4444' // Red
                  }
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * healthScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-800">
                  {healthScore}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Health Index</span>
              </div>
            </div>

            {/* Status Tags */}
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                healthScore >= 90
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : healthScore >= 60
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                {healthScore >= 90 
                  ? 'System Fully Optimal' 
                  : healthScore >= 60
                  ? 'System Warnings Active' 
                  : 'Critical Attention Needed'}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 px-2 leading-relaxed mt-2">
            {healthScore >= 90 
              ? "All departments are running within allocated thresholds. Excellent budget discipline."
              : healthScore >= 60
              ? "Moderate spending alerts have been triggered. Keep track of pending approvals."
              : "Critical budget overruns detected in department categories! Review allocations immediately."}
          </div>
        </div>

        {/* Graphical Active Alerts Timeline / Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  Active Alerts & Compliance Center
                </h3>
                <p className="text-xs text-gray-500">Live feed of automated notifications and system checks.</p>
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-semibold">
                {alertsList.length} Triggered
              </span>
            </div>

            {/* Alert Cards List */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {alertsList.map((alert, idx) => {
                const isBudget = alert.EventType === 'Budget Alert';
                return (
                  <div 
                    key={idx} 
                    className={`group/card p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
                      isBudget 
                        ? 'bg-rose-50/40 border-rose-100 hover:bg-rose-50' 
                        : 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Interactive Visual Badge */}
                      <div className={`p-2.5 rounded-xl shadow-sm ${isBudget ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isBudget ? <DollarSign size={18} /> : <Clock size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold tracking-wider uppercase ${isBudget ? 'text-rose-700' : 'text-amber-700'}`}>
                            {alert.EventType}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(alert.DateEvent).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-1 leading-snug">
                          {alert.Message}
                        </p>

                        {/* GRAPHICAL COMPONENT INSIDE THE ALERT CARD */}
                        <div className="mt-3">
                          {isBudget ? (
                            <div>
                              {/* Sleek Progress Bar showing > 90% */}
                              <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1">
                                <span>Category Budget Spent</span>
                                <span className="text-rose-600">92% (Exceeded Threshold)</span>
                              </div>
                              <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full animate-pulse" style={{ width: '92%' }}></div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {/* Workflow Approval Pipeline */}
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
                                <span>Process Stage:</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Audit Review Required</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <span className="text-emerald-600">1. Logged</span>
                                <span>➔</span>
                                <span className="text-amber-600 animate-pulse">2. Pending Approval</span>
                                <span>➔</span>
                                <span>3. Paid</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Resolution Link Button */}
                      <div className="self-center">
                        <Link 
                          to={isBudget ? "/budget" : "/approvals"}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isBudget 
                              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200' 
                              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200'
                          }`}
                        >
                          {isBudget ? 'Adjust' : 'Authorize'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              {alertsList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">No warnings or notices active</h4>
                  <p className="text-xs text-gray-400 max-w-[280px] mt-0.5">
                    Your financial pipelines are clear. Keep up the great management!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


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