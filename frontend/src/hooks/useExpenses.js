import { useState, useEffect, useCallback } from 'react';
import { getExpenses } from '../services/expenseService';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, refresh: fetchExpenses };
}
