import { useState, useEffect } from 'react';
import { getExpenseTrends } from '../services/analyticsService';

export function useAnalytics(year = 2026) {
  const [trends, setTrends]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    getExpenseTrends(year)
      .then(setTrends)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [year]);

  // Transform flat data into chart-friendly format
  const months = [...new Set(trends.map(t => t.MonthName))];
  const categories = [...new Set(trends.map(t => t.CategoryName))];

  const chartData = months.map(month => {
    const row = { month };
    categories.forEach(cat => {
      const match = trends.find(
        t => t.MonthName === month && t.CategoryName === cat
      );
      row[cat] = match ? match.TotalSpent : 0;
    });
    return row;
  });

  const totalSpent = trends.reduce((s, t) => s + t.TotalSpent, 0);
  const monthlyAvg = months.length ? Math.round(totalSpent / months.length) : 0;
  const monthTotals = months.map(m => ({
    month: m,
    total: trends
      .filter(t => t.MonthName === m)
      .reduce((s, t) => s + t.TotalSpent, 0)
  }));
  const highestMonth = monthTotals.reduce(
    (a, b) => a.total > b.total ? a : b,
    { month: '—', total: 0 }
  );
  const lowestMonth = monthTotals.reduce(
    (a, b) => a.total < b.total ? a : b,
    { month: '—', total: Infinity }
  );

  return {
    trends,
    chartData,
    categories,
    loading,
    error,
    kpis: {
      totalSpent,
      monthlyAvg,
      highestMonth,
      lowestMonth
    }
  };
}
