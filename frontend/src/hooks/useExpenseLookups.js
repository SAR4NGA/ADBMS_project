import { useState, useEffect, useCallback } from 'react';
import {
  getSuppliers,
  getEmployees,
  getPaymentMethods,
  getExpenseCategories,
  getItems
} from '../services/expenseService';

export function useExpenseLookups() {
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [suppliersData, employeesData, paymentMethodsData, categoriesData, itemsData] = await Promise.all([
        getSuppliers(),
        getEmployees(),
        getPaymentMethods(),
        getExpenseCategories(),
        getItems()
      ]);

      setSuppliers(suppliersData);
      setEmployees(employeesData);
      setPaymentMethods(paymentMethodsData);
      setCategories(categoriesData);
      setItems(itemsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load lookup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  return {
    suppliers,
    employees,
    paymentMethods,
    categories,
    items,
    loading,
    error,
    refresh: fetchLookups
  };
}
