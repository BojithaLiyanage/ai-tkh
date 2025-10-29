import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Profile Header Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 gap-4">
                {/* Avatar */}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white">
                  {getInitials(user.full_name)}
                </div>

                {/* User info */}
                <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 sm:ml-6 sm:mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account Information
            </h2>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{user.full_name}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900 capitalize">{user.user_type}</p>
                </div>
              </div>

              {/* Client Info if available */}
              {user.client && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Type</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 capitalize">{user.client.client_type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {user.client.organization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-900">{user.client.organization}</p>
                      </div>
                    </div>
                  )}

                  {user.client.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-900">{user.client.specialization}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Account Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <div className={`px-4 py-3 border rounded-lg flex items-center gap-2 ${
                  user.is_active
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    user.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <p className={user.is_active ? 'text-green-900' : 'text-red-900'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Profile Button - Placeholder for future */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                Edit Profile (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
