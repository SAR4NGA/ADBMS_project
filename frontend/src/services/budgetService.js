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
