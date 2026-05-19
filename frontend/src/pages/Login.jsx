import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Lock, User } from 'lucide-react';
import Button from '../components/ui/Button';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 bg-blue-600 text-white text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-xl mb-4">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-bold">Vaultix Admin</h1>
          <p className="text-blue-100 mt-2">Expense Tracking System</p>
        </div>
        
        <form className="p-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="admin_user"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full py-4 text-lg shadow-lg">
            Sign In
          </Button>
          
          <div className="text-center">
            <a href="#" className="text-sm text-blue-600 hover:underline font-medium">Forgot password?</a>
          </div>
        </form>
        
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
