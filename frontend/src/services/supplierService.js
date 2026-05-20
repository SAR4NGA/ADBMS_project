import api from '../api/axios';

export const getSuppliers = async () => {
  try {
    const response = await api.get(`/suppliers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

export const getSupplierTypes = async () => {
  try {
    const response = await api.get(`/suppliers/types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier types:', error);
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const response = await api.post(`/suppliers`, supplierData);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};
