import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { Check, X, Eye } from 'lucide-react';

const Approvals = () => {
  const headers = ['Date', 'Employee', 'Category', 'Amount', 'Description', 'Actions'];

  const pendingExpenses = [
    { id: 101, date: '2026-05-18', employee: 'John Doe', category: 'Software', amount: 299.99, desc: 'Monthly SaaS subscription' },
    { id: 102, date: '2026-05-17', employee: 'Jane Smith', category: 'Hardware', amount: 1250.00, desc: 'New laptop for designer' },
    { id: 103, date: '2026-05-17', employee: 'Mike Ross', category: 'Travel', amount: 450.50, desc: 'Client meeting flights' },
  ];

  return (
    <Layout title="Pending Approvals">
      <Card className="border-none shadow-sm">
        <Table
          headers={headers}
          data={pendingExpenses}
          renderRow={(item) => (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.employee}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${item.amount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{item.desc}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                    <Check size={20} />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject">
                    <X size={20} />
                  </button>
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                    <Eye size={20} />
                  </button>
                </div>
              </td>
            </>
          )}
        />
      </Card>
    </Layout>
  );
};

export default Approvals;
