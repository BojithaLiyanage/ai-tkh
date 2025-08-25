import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  // Route to specific dashboard based on user type
  switch (user.user_type) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Unknown User Type</h2>
            <p className="text-gray-600">Please contact system administrator.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;