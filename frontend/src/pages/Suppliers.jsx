import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { Mail, Phone, MapPin } from 'lucide-react';

const Suppliers = () => {
  const headers = ['Supplier Name', 'Contact Info', 'Location', 'Total Spend', 'Status'];
  
  const suppliers = [
    { name: 'Global Tech Solutions', email: 'contact@globaltech.com', phone: '+1 234 567 890', city: 'New York', spend: 45000, status: 'Preferred' },
    { name: 'Office Depot', email: 'sales@officedepot.com', phone: '+1 987 654 321', city: 'Chicago', spend: 12000, status: 'Active' },
    { name: 'Creative Media Agency', email: 'hello@creativemedia.com', phone: '+1 456 789 012', city: 'Los Angeles', spend: 28000, status: 'Active' },
    { name: 'Swift Logistics', email: 'support@swiftlog.com', phone: '+1 321 654 987', city: 'Houston', spend: 8500, status: 'Under Review' },
  ];

  return (
    <Layout title="Suppliers">
      <Card className="border-none shadow-sm">
        <Table
          headers={headers}
          data={suppliers}
          renderRow={(supplier) => (
            <>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">{supplier.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={14} /> {supplier.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={14} /> {supplier.phone}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} /> {supplier.city}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                ${supplier.spend.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  supplier.status === 'Preferred' ? 'bg-green-100 text-green-800' : 
                  supplier.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {supplier.status}
                </span>
              </td>
            </>
          )}
        />
      </Card>
    </Layout>
  );
};

export default Suppliers;
