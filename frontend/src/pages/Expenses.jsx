import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useExpenses } from '../hooks/useExpenses';
import { Plus, Filter, Download } from 'lucide-react';

const Expenses = () => {
  const { expenses, loading } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const headers = ['ID', 'Date', 'Supplier', 'Employee', 'Description', 'Amount', 'Status', 'Actions'];

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Layout title="Expenses">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={18} />
            Filter
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={18} />
            Export
          </Button>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Expense
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <Table
          headers={headers}
          data={expenses}
          renderRow={(expense) => (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{expense.ExpenseID}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.FullDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{expense.SupplierName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.EmployedBy}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{expense.Description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">${expense.TotalAmount}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusVariant(expense.StatusName)}>{expense.StatusName}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900 font-medium">View</button>
              </td>
            </>
          )}
        />
        {loading && (
          <div className="text-center py-10 text-gray-500">Loading expenses...</div>
        )}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-10 text-gray-500">No expenses found.</div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Expense">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Expenses;
