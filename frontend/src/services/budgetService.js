import api from '../api/axios';

export const getBudgets = async () => {
  try {
    const response = await api.get(`/budget`);
    return response.data;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
};

export const createBudget = async (data) => {
  try {
    const response = await api.post(`/budget`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

export const updateBudget = async (id, data) => {
  try {
    const response = await api.put(`/budget/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budget/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};
