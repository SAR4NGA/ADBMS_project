import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getSuppliers, getSupplierTypes, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierTypes, setSupplierTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ id: null, supplierName: '', supplierTypeId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [suppliersData, typesData] = await Promise.all([
        getSuppliers(),
        getSupplierTypes()
      ]);
      setSuppliers(suppliersData);
      setSupplierTypes(typesData);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ id: null, supplierName: '', supplierTypeId: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setModalMode('edit');
    setFormData({ 
      id: supplier.SupplierID, 
      supplierName: supplier.SupplierName, 
      supplierTypeId: supplier.SupplierTypeID 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteSupplier(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete supplier.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        await createSupplier({ 
          supplierName: formData.supplierName, 
          supplierTypeId: Number(formData.supplierTypeId) 
        });
      } else {
        await updateSupplier(formData.id, { 
          supplierName: formData.supplierName, 
          supplierTypeId: Number(formData.supplierTypeId) 
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headers = ['ID', 'Supplier Name', 'Type Category', 'Registered Date', 'Actions'];

  return (
    <Layout title="Suppliers">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Supplier Directory</h2>
        <Button onClick={handleOpenAdd} className="flex items-center gap-2">
          <Plus size={16} /> Add Supplier
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading suppliers...</div>
        ) : (
          <Table
            headers={headers}
            data={suppliers}
            renderRow={(supplier) => (
              <>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{supplier.SupplierID}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{supplier.SupplierName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {supplier.Type || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(supplier.RegisteredDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenEdit(supplier)} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(supplier.SupplierID)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={16} />
                  </button>
                </td>
              </>
            )}
          />
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Add New Supplier' : 'Edit Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.supplierName}
              onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
              required
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type <span className="text-red-500">*</span></label>
            <select
              value={formData.supplierTypeId}
              onChange={(e) => setFormData({...formData, supplierTypeId: e.target.value})}
              required
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">-- Select Type --</option>
              {supplierTypes.map(t => (
                <option key={t.SupplierTypeID} value={t.SupplierTypeID}>{t.TypeName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Supplier'}</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Suppliers;
