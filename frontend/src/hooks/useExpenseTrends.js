import { useState, useEffect } from 'react';
import { getExpenseTrends } from '../services/analyticsService';

export function useExpenseTrends(year = 2026) {
  const [trends, setTrends]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getExpenseTrends(year)
      .then(setTrends)
      .catch(err => setError(err?.message || 'Failed to load trends'))
      .finally(() => setLoading(false));
  }, [year]);

  // ── Transform flat DB rows into recharts-friendly pivot ───────────────────
  const months     = [...new Set(trends.map(t => t.MonthName))];
  const categories = [...new Set(trends.map(t => t.CategoryName))];

  const chartData = months.map(month => {
    const row = { month };
    categories.forEach(cat => {
      const match = trends.find(t => t.MonthName === month && t.CategoryName === cat);
      row[cat] = match ? match.TotalSpent : 0;
    });
    return row;
  });

  // ── KPI calculations ──────────────────────────────────────────────────────
  const totalSpent = trends.reduce((s, t) => s + t.TotalSpent, 0);
  const monthlyAvg = months.length ? Math.round(totalSpent / months.length) : 0;

  const monthTotals = months.map(m => ({
    month: m,
    total: trends.filter(t => t.MonthName === m).reduce((s, t) => s + t.TotalSpent, 0),
  }));

  const highestMonth = monthTotals.length
    ? monthTotals.reduce((a, b) => (a.total > b.total ? a : b))
    : { month: '—', total: 0 };

  const lowestMonth = monthTotals.length
    ? monthTotals.reduce((a, b) => (a.total < b.total ? a : b))
    : { month: '—', total: 0 };

  return {
    trends,
    chartData,
    categories,
    loading,
    error,
    kpis: { totalSpent, monthlyAvg, highestMonth, lowestMonth },
  };
}
