import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContentManagement from './ContentManagement';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showContentManagement, setShowContentManagement] = useState(false);

  if (!user || user.user_type !== 'admin') {
    return <div className="loading">Access denied...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6 flex justify-between items-center flex-wrap">
        <div>
          <h1 className="text-gray-900 text-3xl font-semibold mb-2.5">Admin Dashboard</h1>
          <div className="text-left">
            <p className="my-1.5 text-gray-500 text-sm">Welcome, {user.full_name}!</p>
            <p className="my-1.5 text-gray-500 text-sm">Email: {user.email}</p>
            <p className="my-1.5 text-blue-600 text-sm font-medium">Role: {user.user_type.toUpperCase()}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-auto px-5 py-2.5 bg-red-600 text-white border-none rounded-md text-sm font-medium cursor-pointer ml-5 transition-colors duration-200 hover:bg-red-700 sm:w-auto sm:ml-5 max-sm:w-full max-sm:ml-0 max-sm:mt-4"
        >
          Logout
        </button>
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Content Management */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            Content Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Modules</span>
              <span className="font-semibold text-gray-900">-</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Topics Created</span>
              <span className="font-semibold text-gray-900">-</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Subtopics</span>
              <span className="font-semibold text-blue-600">-</span>
            </div>
          </div>
        </div>

        {/* Content Actions */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            Content Management
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => setShowContentManagement(true)}
              className="w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Manage Content</p>
                  <p className="text-sm text-blue-600">Create modules, topics, and subtopics</p>
                </div>
                <span className="text-blue-500 text-lg">→</span>
              </div>
            </button>
            <button 
              onClick={() => setShowContentManagement(true)}
              className="w-full p-4 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">Add Learning Content</p>
                  <p className="text-sm text-green-600">Create educational content for students</p>
                </div>
                <span className="text-green-500 text-lg">→</span>
              </div>
            </button>
            <button className="w-full p-4 text-left bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-900">Content Analytics</p>
                  <p className="text-sm text-purple-600">View content engagement metrics</p>
                </div>
                <span className="text-purple-500 text-lg">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tools & Resources */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
          <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
          Admin Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
              <p className="font-medium text-gray-900">Content Library</p>
              <p className="text-sm text-gray-500 mt-1">Manage educational content</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <p className="font-medium text-gray-900">Content Analytics</p>
              <p className="text-sm text-gray-500 mt-1">View learning metrics</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-orange-600 text-xl">🏷️</span>
              </div>
              <p className="font-medium text-gray-900">Tags & Categories</p>
              <p className="text-sm text-gray-500 mt-1">Organize content structure</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 text-xl">📋</span>
              </div>
              <p className="font-medium text-gray-900">Content Reports</p>
              <p className="text-sm text-gray-500 mt-1">Generate content reports</p>
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
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">Admin dashboard accessed</p>
              <p className="text-xs text-gray-500">Logged in successfully</p>
            </div>
            <span className="text-xs text-gray-400">Just now</span>
          </div>
          <div className="flex items-center justify-center p-8 text-gray-500">
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>

      {/* Content Management Modal */}
      {showContentManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentManagement 
            onClose={() => setShowContentManagement(false)}
            onContentUpdated={() => {
              // Could refresh any content statistics here if needed
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;