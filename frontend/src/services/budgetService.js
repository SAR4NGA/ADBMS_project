import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getBudgets = async () => {
  try {
    const response = await axios.get(`${API_URL}/budget`);
    return response.data;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
};

export const createBudget = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/budget`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

export const updateBudget = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/budget/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/budget/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};
