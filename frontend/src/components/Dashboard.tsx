import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6 flex justify-between items-center flex-wrap">
        <div>
          <h1 className="text-gray-900 text-3xl font-semibold mb-2.5">Welcome, {user.full_name}!</h1>
          <div className="text-left">
            <p className="my-1.5 text-gray-500 text-sm">Email: {user.email}</p>
            <p className="my-1.5 text-gray-500 text-sm">User Type: {user.user_type}</p>
            <p className="my-1.5 text-gray-500 text-sm">Status: {user.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-auto px-5 py-2.5 bg-red-600 text-white border-none rounded-md text-sm font-medium cursor-pointer ml-5 transition-colors duration-200 hover:bg-red-700 sm:w-auto sm:ml-5 max-sm:w-full max-sm:ml-0 max-sm:mt-4"
        >
          Logout
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5">Dashboard</h2>
        <p className="text-gray-500 leading-relaxed">This is your {user.user_type} dashboard.</p>
        
        {user.user_type === 'admin' && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 text-lg font-semibold mb-3">Admin Features</h3>
            <p className="text-blue-700">As an admin, you have access to additional features.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;