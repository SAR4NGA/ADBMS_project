import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { Check, X, Eye } from 'lucide-react';
import { getExpenses, approveExpense } from '../services/expenseService';

const Approvals = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingExpenses = async () => {
    setIsLoading(true);
    try {
      const allExpenses = await getExpenses();
      // Filter for Pending (StatusName === 'Pending' or StatusID === 1)
      const pending = allExpenses.filter(e => e.StatusName === 'Pending');
      setPendingExpenses(pending);
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this expense?')) return;
    try {
      await approveExpense(id, { approvedBy: 1, statusId: 2, remarks: 'Approved via UI' });
      alert('Expense approved successfully.');
      fetchPendingExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve expense.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason === null) return; // User cancelled
    
    try {
      await approveExpense(id, { approvedBy: 1, statusId: 3, remarks: reason });
      alert('Expense rejected successfully.');
      fetchPendingExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject expense.');
    }
  };

  const headers = ['Expense ID', 'Date', 'Employee', 'Supplier', 'Amount', 'Description', 'Actions'];

  return (
    <Layout title="Pending Approvals">
      <Card className="border-none shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading pending approvals...</div>
        ) : pendingExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending expenses found. All caught up!</div>
        ) : (
          <Table
            headers={headers}
            data={pendingExpenses}
            renderRow={(item) => (
              <>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">#{item.ExpenseID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.FullDate || item.DateKey).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.EmployedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.SupplierName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Rs. {Number(item.TotalAmount).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{item.Description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(item.ExpenseID)} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve">
                      <Check size={20} />
                    </button>
                    <button onClick={() => handleReject(item.ExpenseID)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                      <X size={20} />
                    </button>
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                      <Eye size={20} />
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </Card>
    </Layout>
  );
};

export default Approvals;
