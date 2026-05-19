import { useState, useEffect, useCallback } from 'react';
import { getAnalytics } from '../services/analyticsService';

export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refresh: fetchAnalytics };
}
