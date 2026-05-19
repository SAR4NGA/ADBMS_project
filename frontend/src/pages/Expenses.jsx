import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useExpenses } from '../hooks/useExpenses';
import { deleteExpense } from '../services/expenseService';
import { Plus, Filter, Download, Trash2, Edit2 } from 'lucide-react';

const Expenses = () => {
  const navigate = useNavigate();
  const { expenses, loading } = useExpenses();

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
        <Button className="flex items-center gap-2" onClick={() => navigate('/expenses/add')}>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{expense.SupplierName || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.EmployedBy}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{expense.Description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">Rs. {parseFloat(expense.TotalAmount).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusVariant(expense.StatusName)}>{expense.StatusName}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex gap-3">
                  <button className="text-blue-600 hover:text-blue-900 font-medium">View</button>
                  <button className="text-gray-600 hover:text-gray-900" title="Edit (Coming Soon)">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900" 
                    title="Delete"
                    onClick={async () => {
                      if(window.confirm('Are you sure you want to delete this expense?')) {
                        try {
                          await deleteExpense(expense.ExpenseID);
                          window.location.reload(); // Quick refresh
                        } catch (err) {
                          alert('Failed to delete expense.');
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
    </Layout>
  );
};

export default Expenses;
