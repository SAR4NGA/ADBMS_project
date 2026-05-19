import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import BudgetBarChart from '../components/charts/BudgetBarChart';
import { useBudget } from '../hooks/useBudget';

const Budget = () => {
  const { budgets, loading } = useBudget();

  const mockBudgetData = [
    { category: 'Marketing', budget: 5000, spent: 4200 },
    { category: 'IT Support', budget: 3000, spent: 3100 },
    { category: 'Office Rent', budget: 10000, spent: 10000 },
    { category: 'Travel', budget: 2000, spent: 1500 },
    { category: 'Utilities', budget: 1500, spent: 1200 },
  ];

  return (
    <Layout title="Budget Management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Budget vs Actual Spent">
          <BudgetBarChart data={budgets.length > 0 ? budgets : mockBudgetData} />
        </Card>
        
        <Card title="Budget Allocation Details">
          <div className="space-y-6">
            {(budgets.length > 0 ? budgets : mockBudgetData).map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{item.category}</span>
                  <span className="text-sm font-medium text-gray-500">
                    ${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${item.spent > item.budget ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min((item.spent / item.budget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Budget;
