import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getSuppliers = async () => {
  try {
    const response = await axios.get(`${API_URL}/suppliers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};
