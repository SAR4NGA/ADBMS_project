import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getExpenses = async () => {
  try {
    const response = await axios.get(`${API_URL}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const addExpense = async (expenseData) => {
  try {
    const response = await axios.post(`${API_URL}/expenses`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const approveExpense = async (id, approvalData) => {
  try {
    const response = await axios.put(`${API_URL}/expenses/approve/${id}`, approvalData);
    return response.data;
  } catch (error) {
    console.error('Error approving expense:', error);
    throw error;
  }
};
