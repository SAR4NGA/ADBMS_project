import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function useDashboard() {
  const [data, setData] = useState({
    stats: { totalExpenses: 0, monthlyTrend: '0%', activeSuppliers: 0, pendingApprovals: 0 },
    chartData: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refresh: fetchDashboardData };
}