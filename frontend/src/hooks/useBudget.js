import { useState, useEffect, useCallback } from 'react';
import { getBudgets } from '../services/budgetService';

export function useBudget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBudgets();
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, loading, error, refresh: fetchBudgets };
}
