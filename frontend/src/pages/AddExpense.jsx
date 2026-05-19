import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Plus, Trash2, ShoppingCart, Info, List, CreditCard, ArrowLeft, Users } from 'lucide-react';
import { addMultipleExpenses } from '../services/expenseService';
import { useExpenseLookups } from '../hooks/useExpenseLookups';

const AddExpense = () => {
  const navigate = useNavigate();
  const { suppliers, employees, paymentMethods, categories, items, loading: lookupsLoading } = useExpenseLookups();
  
  // High-level state
  const [expenseList, setExpenseList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Current Form state
  const [expenseMode, setExpenseMode] = useState('supplier'); // 'supplier' or 'general'
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    supplierId: '',
    paymentMethodId: '',
    description: '',
    lineItems: []
  });

  const [currentLineItem, setCurrentLineItem] = useState({
    itemId: '',
    categoryId: '',
    quantity: 1,
    unitPrice: ''
  });

  // Derived / Filtered Lookups
  const selectedSupplier = useMemo(() => {
    if (!formData.supplierId) return null;
    return suppliers.find(s => s.SupplierID === Number(formData.supplierId));
  }, [formData.supplierId, suppliers]);

  const filteredCategories = useMemo(() => {
    if (expenseMode === 'salary') {
      return categories.filter(c => c.CategoryName === 'Salaries' || String(c.ExpenseCategoryID) === '3');
    }
    if (expenseMode === 'general') {
      // Show general items like Utilities, Rent, Transport, etc. Do not show Stock Purchase for general expenses.
      return categories.filter(c => c.CategoryName !== 'Stock Purchase' && c.CategoryName !== 'Salaries');
    }
    // Supplier mode should generally default to Stock Purchase, or all categories can be available for selection if needed
    return categories.filter(c => c.CategoryName !== 'Salaries');
  }, [categories, expenseMode, selectedSupplier]);

  const filteredItems = useMemo(() => {
    if (expenseMode === 'general') return [];
    if (selectedSupplier && selectedSupplier.Type) {
      return items.filter(i => i.Type === selectedSupplier.Type);
    }
    return items;
  }, [items, expenseMode, selectedSupplier]);

  const handleAddLineItem = () => {
    const qty = Number(currentLineItem.quantity) || 1;
    const price = Number(currentLineItem.unitPrice) || 0;
    let categoryId = currentLineItem.categoryId;

    if (expenseMode === 'salary') {
      const salaryCat = filteredCategories.find(c => c.CategoryName === 'Salaries' || String(c.ExpenseCategoryID) === '3');
      if (salaryCat) categoryId = salaryCat.ExpenseCategoryID;
    }

    if (expenseMode === 'supplier') {
      if (!currentLineItem.itemId || qty <= 0 || price < 0) {
        alert('Please select an item and provide valid quantity/price.');
        return;
      }
      // Auto-default category to Stock Purchase (ID 1) if not explicitly set
      if (!categoryId) {
        categoryId = '1';
      }
    } else {
      if (!categoryId || price <= 0) {
        alert('Please select a category and provide a valid amount.');
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          itemId: currentLineItem.itemId ? Number(currentLineItem.itemId) : null,
          categoryId: Number(categoryId),
          quantity: qty,
          unitPrice: price
        }
      ]
    }));

    setCurrentLineItem({
      itemId: '',
      categoryId: '',
      quantity: 1,
      unitPrice: ''
    });
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const currentTotalAmount = useMemo(() => {
    return formData.lineItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  }, [formData.lineItems]);

  const handleAddExpenseToList = () => {
    if (!formData.employeeId || !formData.paymentMethodId) {
      alert('Please select an Employee and a Payment Method.');
      return;
    }
    if (expenseMode === 'supplier' && !formData.supplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (formData.lineItems.length === 0) {
      alert('Please add at least one line item (or amount) to the expense.');
      return;
    }

    const newExpense = {
      description: formData.description || (
        expenseMode === 'supplier' ? `Purchase from ${selectedSupplier?.SupplierName}` : 
        expenseMode === 'salary' ? `Salary payment for ${employees.find(e => e.EmployeeID === Number(formData.employeeId))?.EmployeeName}` :
        'General Expense'
      ),
      totalAmount: currentTotalAmount,
      supplierId: expenseMode === 'supplier' ? Number(formData.supplierId) : null,
      employeeId: Number(formData.employeeId),
      paymentMethodId: Number(formData.paymentMethodId),
      expenseDate: formData.expenseDate,
      lineItems: formData.lineItems
    };

    setExpenseList(prev => [...prev, newExpense]);

    // Reset current form but keep date, employee, payment method for convenience
    setFormData(prev => ({
      ...prev,
      description: '',
      supplierId: '',
      lineItems: []
    }));
  };

  const removeExpenseFromList = (index) => {
    setExpenseList(prev => prev.filter((_, i) => i !== index));
  };

  const grandTotal = useMemo(() => {
    return expenseList.reduce((acc, exp) => acc + exp.totalAmount, 0);
  }, [expenseList]);

  const handleSubmitAll = async () => {
    if (expenseList.length === 0) {
      alert('No expenses in the queue to submit.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addMultipleExpenses(expenseList);
      alert(`Successfully saved ${expenseList.length} expense(s)!`);
      navigate('/expenses');
    } catch (error) {
      alert('Failed to save expenses. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (lookupsLoading) {
    return (
      <Layout title="Add Expense">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-lg">Loading lookups...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Intelligent Expense Entry">
      <div className="mb-4">
        <Button onClick={() => navigate('/expenses')} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Expenses
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] rounded-xl bg-white shadow-lg overflow-hidden border border-gray-200">
        
        {/* Left Side: Input Form */}
        <div className="w-full lg:w-3/5 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 custom-scrollbar">
          
          {/* Mode Selector */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner mb-6">
            <button
              type="button"
              onClick={() => { setExpenseMode('supplier'); setFormData(prev => ({ ...prev, lineItems: [], supplierId: '' })); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-md transition-all ${expenseMode === 'supplier' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <ShoppingCart size={18} /> Supplier / Inventory
            </button>
            <button
              type="button"
              onClick={() => { setExpenseMode('general'); setFormData(prev => ({ ...prev, lineItems: [], supplierId: '' })); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-md transition-all ${expenseMode === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <List size={18} /> General / Internal
            </button>
            <button
              type="button"
              onClick={() => { setExpenseMode('salary'); setFormData(prev => ({ ...prev, lineItems: [], supplierId: '' })); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-md transition-all ${expenseMode === 'salary' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <Users size={18} /> Employee Salary
            </button>
          </div>

          <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info size={16} className="text-blue-500" /> Header Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {expenseMode === 'salary' ? 'Employee (Paid To)' : 'Employee (Filing)'}
                </label>
                <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Select Employee</option>
                  {employees?.map(e => <option key={e.EmployeeID} value={e.EmployeeID}>{e.EmployeeName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                <select value={formData.paymentMethodId} onChange={e => setFormData({...formData, paymentMethodId: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Select Payment</option>
                  {paymentMethods?.map(p => <option key={p.PaymentMethodID} value={p.PaymentMethodID}>{p.MethodName}</option>)}
                </select>
              </div>
              {expenseMode === 'supplier' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 text-blue-700">Supplier (Intelligent)</label>
                  <select value={formData.supplierId} onChange={e => {
                    setFormData({...formData, supplierId: e.target.value, lineItems: []});
                    setCurrentLineItem({ itemId: '', categoryId: '', quantity: 1, unitPrice: '' });
                  }} className="w-full border border-blue-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30">
                    <option value="">Select Supplier</option>
                    {suppliers?.map(s => <option key={s.SupplierID} value={s.SupplierID}>{s.SupplierName} ({s.Type})</option>)}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description (Optional)</label>
              <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Specific notes for this expense..." className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" />
            </div>
          </div>

          <div className="mt-6 space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
             <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
              {expenseMode === 'supplier' ? 'Itemized Entries' : 'Expense Breakdown'}
            </h3>

            {/* Sub-form for adding line items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              {expenseMode === 'supplier' && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 text-blue-800">Filtered Item</label>
                  <select disabled={!formData.supplierId} value={currentLineItem.itemId} onChange={e => setCurrentLineItem({...currentLineItem, itemId: e.target.value})} className="w-full border border-blue-200 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 bg-white">
                    <option value="">Select Item</option>
                    {filteredItems.map(i => <option key={i.ItemID} value={i.ItemID}>{i.ItemName} ({i.UnitOfMeasure})</option>)}
                  </select>
                </div>
              )}
              {expenseMode !== 'salary' && (
                <div className={expenseMode === 'general' ? 'col-span-2' : 'col-span-2'}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select value={currentLineItem.categoryId} onChange={e => setCurrentLineItem({...currentLineItem, categoryId: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">Select Category</option>
                    {filteredCategories.map(c => <option key={c.ExpenseCategoryID} value={c.ExpenseCategoryID}>{c.CategoryName}</option>)}
                  </select>
                </div>
              )}
              {expenseMode === 'supplier' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                  <input type="number" min="1" value={currentLineItem.quantity} onChange={e => setCurrentLineItem({...currentLineItem, quantity: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" />
                </div>
              )}
              <div className={expenseMode === 'salary' ? 'col-span-4' : ''}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {expenseMode === 'supplier' ? 'Unit Price' : expenseMode === 'salary' ? 'Salary Amount' : 'Amount'}
                </label>
                <input type="number" min="0" step="0.01" value={currentLineItem.unitPrice} onChange={e => setCurrentLineItem({...currentLineItem, unitPrice: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" />
              </div>
              
              <div className="col-span-2 md:col-span-4 flex justify-end mt-2">
                <Button type="button" onClick={handleAddLineItem} className="bg-gray-800 hover:bg-black text-sm py-2 px-5 shadow-md">
                  <Plus size={16} className="inline mr-2" /> Add to Queue
                </Button>
              </div>
            </div>

            {/* List of current line items */}
            {formData.lineItems.length > 0 && (
              <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Detail</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {formData.lineItems.map((item, idx) => {
                      const itemName = items.find(i => i.ItemID === Number(item.itemId))?.ItemName;
                      const catName = categories.find(c => c.ExpenseCategoryID === Number(item.categoryId))?.CategoryName;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-gray-900">
                            {expenseMode === 'supplier' ? (
                              <><span className="font-semibold text-base">{itemName}</span> <br/><span className="text-sm text-gray-500 mt-1 inline-block">{item.quantity} × Rs.{item.unitPrice}</span></>
                            ) : (
                              <><span className="font-semibold text-base">{catName}</span></>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900 text-base">Rs. {(item.quantity * item.unitPrice).toFixed(2)}</td>
                          <td className="px-5 py-3 text-right">
                            <button type="button" onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-md transition-colors"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-5 py-4 font-bold text-gray-700 text-right uppercase tracking-wider text-xs">Expense Total:</td>
                      <td className="px-5 py-4 font-black text-blue-700 text-right text-lg">Rs. {currentTotalAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            
            <div className="flex justify-end pt-5">
              <Button type="button" onClick={handleAddExpenseToList} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 shadow-lg px-8 py-2.5 text-sm font-bold">
                Package Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Staged Expenses (The Cart) */}
        <div className="w-full lg:w-2/5 p-6 bg-gray-900 text-white flex flex-col h-full relative">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CreditCard size={20} className="text-blue-400" /> Staged Expenses
            </h3>
            <Badge variant="blue" className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 text-xs">{expenseList.length} items</Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-32">
            {expenseList.length === 0 ? (
              <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                  <ShoppingCart size={40} className="opacity-40" />
                </div>
                <p className="text-lg font-medium text-gray-400">No expenses packaged yet.</p>
                <p className="text-sm mt-2 text-gray-500">Package expenses from the left panel.</p>
              </div>
            ) : (
              expenseList.map((exp, idx) => {
                const supName = suppliers.find(s => s.SupplierID === Number(exp.supplierId))?.SupplierName;
                const empName = employees.find(e => e.EmployeeID === Number(exp.employeeId))?.EmployeeName;
                return (
                  <div key={idx} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-500 transition-all relative group shadow-md hover:shadow-xl hover:-translate-y-1">
                    <button onClick={() => removeExpenseFromList(idx)} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-700 hover:bg-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex justify-between items-start mb-3 pr-8">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-gray-900 bg-blue-400 uppercase tracking-wider mb-2">
                          {exp.supplierId ? 'Supplier' : exp.description.includes('Salary') ? 'Employee Compensation' : 'Internal'}
                        </span>
                        <h4 className="font-bold text-gray-100 text-base">{supName || exp.description || 'General Internal Expense'}</h4>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-xl text-white">Rs. {exp.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 space-y-2 mt-4 pt-4 border-t border-gray-700">
                      <p className="truncate flex items-center gap-2"><span className="text-gray-500">📋</span> {exp.description}</p>
                      <p className="flex items-center gap-2"><span className="text-gray-500">👤</span> {empName}</p>
                      <div className="flex justify-between">
                         <span className="flex items-center gap-2"><span className="text-gray-500">📅</span> {exp.expenseDate}</span>
                         <span className="flex items-center gap-2"><span className="text-gray-500">📦</span> {exp.lineItems.length} items</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-900 border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.7)] z-10">
            <div className="flex justify-between items-end mb-5">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Grand Total</span>
              <span className="text-4xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                Rs. {grandTotal.toFixed(2)}
              </span>
            </div>
            <Button onClick={handleSubmitAll} disabled={isSubmitting || expenseList.length === 0} className="w-full py-4 text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none shadow-xl shadow-blue-900/40 transform hover:scale-[1.02] transition-all">
              {isSubmitting ? 'Processing Batch...' : 'Submit All Expenses'}
            </Button>
          </div>
        </div>
        
      </div>
    </Layout>
  );
};

export default AddExpense;