import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, OnboardingStatus } from '../services/api';
import ClientOnboarding from './ClientOnboarding';

const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && user.user_type === 'client') {
        try {
          const status = await clientApi.getOnboardingStatus();
          setOnboardingStatus(status);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, [user]);

  if (!user || user.user_type !== 'client') {
    return <div className="loading">Access denied...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (onboardingStatus?.needs_onboarding) {
    return <ClientOnboarding />;
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6 flex justify-between items-center flex-wrap">
        <div>
          <h1 className="text-gray-900 text-3xl font-semibold mb-2.5">Client Dashboard</h1>
          <div className="text-left">
            <p className="my-1.5 text-gray-500 text-sm">Welcome, {user.full_name}!</p>
            <p className="my-1.5 text-gray-500 text-sm">Email: {user.email}</p>
            <p className="my-1.5 text-green-600 text-sm font-medium">Role: {user.user_type.toUpperCase()}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-auto px-5 py-2.5 bg-red-600 text-white border-none rounded-md text-sm font-medium cursor-pointer ml-5 transition-colors duration-200 hover:bg-red-700 sm:w-auto sm:ml-5 max-sm:w-full max-sm:ml-0 max-sm:mt-4"
        >
          Logout
        </button>
      </div>

      {/* Client Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Account Overview */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            Account Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Account Status</span>
              <span className="font-semibold text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Member Since</span>
              <span className="font-semibold text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Services Used</span>
              <span className="font-semibold text-gray-900">-</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Support Tickets</span>
              <span className="font-semibold text-blue-600">-</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Request Service</p>
                  <p className="text-sm text-blue-600">Start a new service request</p>
                </div>
                <span className="text-blue-500 text-lg">→</span>
              </div>
            </button>
            <button className="w-full p-4 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">View Services</p>
                  <p className="text-sm text-green-600">Check your active services</p>
                </div>
                <span className="text-green-500 text-lg">→</span>
              </div>
            </button>
            <button className="w-full p-4 text-left bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-orange-900">Support</p>
                  <p className="text-sm text-orange-600">Get help or contact support</p>
                </div>
                <span className="text-orange-500 text-lg">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Services & Features */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
          <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
          Available Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📋</span>
              </div>
              <p className="font-medium text-gray-900">Service A</p>
              <p className="text-sm text-gray-500 mt-1">Description of service A</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 text-xl">🔧</span>
              </div>
              <p className="font-medium text-gray-900">Service B</p>
              <p className="text-sm text-gray-500 mt-1">Description of service B</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <p className="font-medium text-gray-900">Service C</p>
              <p className="text-sm text-gray-500 mt-1">Description of service C</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-gray-900 text-2xl font-semibold mb-5 flex items-center">
          <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
          Account Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg mr-4 flex items-center justify-center">
                <span className="text-blue-600 text-lg">👤</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Profile Settings</p>
                <p className="text-sm text-gray-500">Update your profile information</p>
              </div>
            </div>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg mr-4 flex items-center justify-center">
                <span className="text-green-600 text-lg">🔒</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Security</p>
                <p className="text-sm text-gray-500">Change password and security settings</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;