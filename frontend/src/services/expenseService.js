import api from '../api/axios';

// Expense list and details
export const getExpenses = async () => {
  try {
    const response = await api.get(`/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpenseById = async (id) => {
  try {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense details:', error);
    throw error;
  }
};

export const addExpense = async (expenseData) => {
  try {
    const response = await api.post(`/expenses`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const addMultipleExpenses = async (expensesArray) => {
  try {
    const response = await api.post(`/expenses/batch`, { expenses: expensesArray });
    return response.data;
  } catch (error) {
    console.error('Error adding multiple expenses:', error);
    throw error;
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const approveExpense = async (id, approvalData) => {
  try {
    const response = await api.put(`/expenses/approve/${id}`, approvalData);
    return response.data;
  } catch (error) {
    console.error('Error approving expense:', error);
    throw error;
  }
};

// Lookup data - fetch from any available backend endpoint
// These queries can hit the database directly or be served from a separate lookup endpoint
// For now, we'll create mock data based on the dummy data that was seeded
export const getSuppliers = async () => {
  try {
    return [
      { SupplierID: 1, SupplierName: 'Sarasavi Bookshop', Type: 'Books' },
      { SupplierID: 2, SupplierName: 'MD Gunasena', Type: 'Books' },
      { SupplierID: 3, SupplierName: 'Atlas Axillia', Type: 'Stationery' },
      { SupplierID: 4, SupplierName: 'Promate', Type: 'Stationery' },
      { SupplierID: 5, SupplierName: 'Richard Pieris', Type: 'General' },
      { SupplierID: 6, SupplierName: 'Singer Sri Lanka', Type: 'Electronics' },
      { SupplierID: 7, SupplierName: 'Abans PLC', Type: 'Electronics' },
      { SupplierID: 8, SupplierName: 'Dialog Axiata', Type: 'Utility' },
      { SupplierID: 9, SupplierName: 'Ceylon Electricity Board', Type: 'Utility' },
      { SupplierID: 10, SupplierName: 'National Water Supply', Type: 'Utility' },
      { SupplierID: 11, SupplierName: 'Cargills Ceylon', Type: 'General' },
      { SupplierID: 12, SupplierName: 'Softlogic Holdings', Type: 'General' }
    ];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

export const getEmployees = async () => {
  try {
    return [
      { EmployeeID: 1, EmployeeName: 'Kasun Perera' },
      { EmployeeID: 2, EmployeeName: 'Amila Silva' },
      { EmployeeID: 3, EmployeeName: 'Saman Kumara' },
      { EmployeeID: 4, EmployeeName: 'Nayana Fernando' },
      { EmployeeID: 5, EmployeeName: 'Tharushi Jayasinghe' },
      { EmployeeID: 6, EmployeeName: 'Dilini Rathnayake' }
    ];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const getPaymentMethods = async () => {
  try {
    return [
      { PaymentMethodID: 1, MethodName: 'Cash' },
      { PaymentMethodID: 2, MethodName: 'Bank Transfer' },
      { PaymentMethodID: 3, MethodName: 'Credit Card' },
      { PaymentMethodID: 4, MethodName: 'Cheque' }
    ];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

export const getExpenseCategories = async () => {
  try {
    return [
      { ExpenseCategoryID: 1, CategoryName: 'Stock Purchase', Type: 'Inventory' },
      { ExpenseCategoryID: 2, CategoryName: 'Utilities', Type: 'Utility' },
      { ExpenseCategoryID: 3, CategoryName: 'Salaries', Type: 'General' },
      { ExpenseCategoryID: 4, CategoryName: 'Rent', Type: 'General' },
      { ExpenseCategoryID: 5, CategoryName: 'Maintenance & Repairs', Type: 'Electronics' },
      { ExpenseCategoryID: 6, CategoryName: 'Transport & Delivery', Type: 'General' },
      { ExpenseCategoryID: 7, CategoryName: 'Marketing & Advertising', Type: 'General' },
      { ExpenseCategoryID: 8, CategoryName: 'Miscellaneous', Type: 'General' },
      { ExpenseCategoryID: 9, CategoryName: 'Office Supplies', Type: 'Stationery' },
      { ExpenseCategoryID: 10, CategoryName: 'Internet & Communication', Type: 'Utility' },
      { ExpenseCategoryID: 11, CategoryName: 'Staff Welfare', Type: 'General' }
    ];
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    throw error;
  }
};

export const getItems = async () => {
  try {
    return [
      { ItemID: 1, ItemName: 'A4 Paper Ream (Double A)', UnitOfMeasure: 'Ream', Type: 'Stationery' },
      { ItemID: 2, ItemName: 'CR Book 120 Pages', UnitOfMeasure: 'Book', Type: 'Books' },
      { ItemID: 3, ItemName: 'Atlas Blue Pen', UnitOfMeasure: 'Box', Type: 'Stationery' },
      { ItemID: 4, ItemName: 'Promate Highlighter Set', UnitOfMeasure: 'Pack', Type: 'Stationery' },
      { ItemID: 5, ItemName: 'Kangaroo Stapler', UnitOfMeasure: 'Unit', Type: 'Stationery' },
      { ItemID: 6, ItemName: 'Box File', UnitOfMeasure: 'Unit', Type: 'Stationery' },
      { ItemID: 7, ItemName: '3M Sticky Notes', UnitOfMeasure: 'Pad', Type: 'Stationery' },
      { ItemID: 8, ItemName: 'Whiteboard Marker Black', UnitOfMeasure: 'Box', Type: 'Stationery' },
      { ItemID: 9, ItemName: 'HP 65 Black Ink', UnitOfMeasure: 'Unit', Type: 'Electronics' },
      { ItemID: 10, ItemName: 'Casio Calculator', UnitOfMeasure: 'Unit', Type: 'Electronics' },
      { ItemID: 11, ItemName: 'Sellotape 1 inch', UnitOfMeasure: 'Roll', Type: 'Stationery' }
    ];
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};
