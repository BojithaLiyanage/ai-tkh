import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreateAdminForm from './CreateAdminForm';
import UserManagement from './UserManagement';
import ContentManagement from './ContentManagement';
import ContentLibrary from './ContentLibrary';
import FiberDatabaseManagement from './FiberDatabaseManagement';
import Navbar from './Navbar';
import { authApi, contentApi, type UserStats, type ContentStats } from '../services/api';

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showUserManageModal, setShowUserManageModal] = useState(false);
  const [showContentManagement, setShowContentManagement] = useState(false);
  const [showContentLibrary, setShowContentLibrary] = useState(false);
  const [showFiberDatabaseManagement, setShowFiberDatabaseManagement] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [userStats, contentStatsData] = await Promise.all([
        authApi.getUserStats(),
        contentApi.getContentStats()
      ]);
      setStats(userStats);
      setContentStats(contentStatsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!user || user.user_type !== 'super_admin') {
    return <div className="loading">Access denied...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-5 bg-gray-50 min-h-screen">

      {/* Super Admin Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* System Overview */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
            System Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : stats?.total_users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : stats?.active_users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Admin Users</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : stats?.admin_users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Client Accounts</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : stats?.client_users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">System Status</span>
              <span className="font-semibold text-green-600">Online</span>
            </div>
          </div>
        </div>

        {/* Content Overview */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            Content Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Modules</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : contentStats?.total_modules || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Topics</span>
              <span className="font-semibold text-gray-900">
                {loading ? 'Loading...' : contentStats?.total_topics || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Subtopics</span>
              <span className="font-semibold text-blue-600">
                {loading ? 'Loading...' : contentStats?.total_subtopics || 0}
              </span>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            User Management
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCreateAdminModal(true)}
              className="w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Create User</p>
                  <p className="text-sm text-blue-600">Add new accounts</p>
                </div>
                <span className="text-blue-500 text-lg">→</span>
              </div>
            </button>
            <button 
              onClick={() => setShowUserManageModal(true)}
              className="w-full p-4 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">Manage All Users</p>
                  <p className="text-sm text-green-600">View, edit, or deactivate user accounts</p>
                </div>
                <span className="text-green-500 text-lg">→</span>
              </div>
            </button>
            {/* <button className="w-full p-4 text-left bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-900">System Permissions</p>
                  <p className="text-sm text-purple-600">Configure role-based access control</p>
                </div>
                <span className="text-purple-500 text-lg">→</span>
              </div>
            </button> */}
          </div>
        </div>
      </div>

      {/* System Administration */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
          <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
          System Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setShowContentManagement(true)}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-indigo-600 text-xl">📝</span>
              </div>
              <p className="font-medium text-gray-900">Content Management</p>
              <p className="text-sm text-gray-500 mt-1">Create educational content</p>
            </div>
          </div>
          <div
            onClick={() => setShowContentLibrary(true)}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
              <p className="font-medium text-gray-900">Content Library</p>
              <p className="text-sm text-gray-500 mt-1">View and manage content</p>
            </div>
          </div>
          {/* <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-orange-600 text-xl">📊</span>
              </div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-500 mt-1">View system analytics</p>
            </div>
          </div> */}
          {/* <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-red-600 text-xl">🔒</span>
              </div>
              <p className="font-medium text-gray-900">Security</p>
              <p className="text-sm text-gray-500 mt-1">Security configurations</p>
            </div>
          </div> */}
          <div
            onClick={() => setShowFiberDatabaseManagement(true)}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 text-xl">🧵</span>
              </div>
              <p className="font-medium text-gray-900">Fiber Database</p>
              <p className="text-sm text-gray-500 mt-1">Manage fiber database entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-4"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">System initialized</p>
              <p className="text-xs text-gray-500">Super admin account created</p>
            </div>
            <span className="text-xs text-gray-400">Just now</span>
          </div>
          <div className="flex items-center justify-center p-8 text-gray-500">
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <CreateAdminForm 
              onSuccess={() => {
                setShowCreateAdminModal(false);
                fetchStats(); // Refresh stats after creating new user
              }}
              onCancel={() => setShowCreateAdminModal(false)}
            />
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <UserManagement 
            onClose={() => setShowUserManageModal(false)}
            onUserUpdated={() => fetchStats()} // Refresh stats when users are updated
          />
        </div>
      )}

      {/* Content Management Modal */}
      {showContentManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentManagement
            onClose={() => setShowContentManagement(false)}
            onContentUpdated={() => {
              fetchStats(); // Refresh content statistics when content is updated
            }}
          />
        </div>
      )}

      {/* Content Library Modal */}
      {showContentLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentLibrary
            onClose={() => setShowContentLibrary(false)}
          />
        </div>
      )}

      {/* Fiber Database Management Modal */}
      {showFiberDatabaseManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FiberDatabaseManagement
            onClose={() => setShowFiberDatabaseManagement(false)}
          />
        </div>
      )}
      </div>
    </>
  );
};

export default SuperAdminDashboard;