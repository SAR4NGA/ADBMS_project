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

export const getSupplierTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/suppliers/types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier types:', error);
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const response = await axios.post(`${API_URL}/suppliers`, supplierData);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await axios.put(`${API_URL}/suppliers/${id}`, supplierData);
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};
