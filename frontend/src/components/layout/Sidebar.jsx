import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Users, 
  CheckSquare, 
  BarChart3,
  Wallet
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/expenses', icon: <Receipt size={20} />, label: 'Expenses' },
    { to: '/budget', icon: <PieChart size={20} />, label: 'Budget' },
    { to: '/suppliers', icon: <Users size={20} />, label: 'Suppliers' },
    { to: '/approvals', icon: <CheckSquare size={20} />, label: 'Approvals' },
    { to: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <Wallet className="text-blue-400" size={28} />
        <h1 className="text-xl font-bold tracking-tight">Vaultix</h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-6 border-t border-slate-800">
        <div className="text-xs text-slate-500 uppercase font-semibold mb-2">System Status</div>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Connected to SQL Server
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
