import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import ContentLibrary from './ContentLibrary';
import FiberDatabaseManagement from './FiberDatabaseManagement';
import QuestionBankManagement from './QuestionBankManagement';
import Navbar from './Navbar';
import { authApi, contentApi, fiberApi, questionApi, type UserStats, type ContentStats, type QuestionStats, type FiberClass } from '../services/api';

const SuperAdminHome: React.FC = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [fiberCount, setFiberCount] = useState<number>(0);
  const [fiberClasses, setFiberClasses] = useState<FiberClass[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [users, content, fibers, classes, questions] = await Promise.all([
        authApi.getUserStats(),
        contentApi.getContentStats(),
        fiberApi.getFibers(),
        fiberApi.getFiberClasses(),
        questionApi.getQuestionStats(),
      ]);
      setUserStats(users);
      setContentStats(content);
      setFiberCount(fibers.length);
      setFiberClasses(classes);
      setQuestionStats(questions);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Module Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{contentStats?.total_modules || 0}</p>
          <p className="text-sm text-gray-500 mb-3">{contentStats?.total_topics || 0} topics</p>
          <button
            onClick={() => navigate('/dashboard/admin-tools/content-library')}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Manage Modules
          </button>
        </div>

        {/* Fibers Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fibers</h2>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🧵</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">{fiberCount}</p>
          <p className="text-sm text-gray-500 mb-3">{fiberClasses.length} classes</p>
          <button
            onClick={() => navigate('/dashboard/admin-tools/fiber-database')}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
          >
            Manage Fibers
          </button>
        </div>

        {/* Question Bank Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">❓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-pink-600 mb-1">{questionStats?.total_questions || 0}</p>
          <p className="text-sm text-gray-500 mb-3">{questionStats?.total_fibers_with_questions || 0} fibers covered</p>
          <button
            onClick={() => navigate('/dashboard/admin-tools/question-bank')}
            className="w-full px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-xs font-medium"
          >
            Manage Questions
          </button>
        </div>

        {/* User Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-3">{userStats?.total_users || 0}</p>
          <button
            onClick={() => navigate('/dashboard/admin-tools/users')}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
          >
            Manage Users
          </button>
        </div>

        {/* User Breakdown Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow lg:col-span-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700 font-medium mb-1">Clients</p>
              <p className="text-2xl font-bold text-green-600">{userStats?.client_users || 0}</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 font-medium mb-1">Admins</p>
              <p className="text-2xl font-bold text-blue-600">{userStats?.admin_users || 0}</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 font-medium mb-1">Super Admins</p>
              <p className="text-2xl font-bold text-purple-600">{userStats?.super_admin_users || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminTools: React.FC<{ onUserUpdated: () => void }> = ({ onUserUpdated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes('content-library')) return 'content';
    if (location.pathname.includes('fiber-database')) return 'fibers';
    if (location.pathname.includes('question-bank')) return 'questions';
    if (location.pathname.includes('users')) return 'users';
    return 'content';
  };

  const activeTab = getActiveTab();

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-1">
          <button
            onClick={() => navigate('/dashboard/admin-tools/content-library')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            📚 Content Library
          </button>
          <button
            onClick={() => navigate('/dashboard/admin-tools/fiber-database')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'fibers'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            🧵 Fiber Database
          </button>
          <button
            onClick={() => navigate('/dashboard/admin-tools/question-bank')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            ❓ Question Bank
          </button>
          <button
            onClick={() => navigate('/dashboard/admin-tools/users')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            👥 User Management
          </button>
        </div>
      </div>

      {/* Tool Content - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="content-library" element={
            <div className="h-full p-6">
              <ContentLibrary onClose={() => {}} />
            </div>
          } />
          <Route path="fiber-database" element={
            <div className="h-full p-6">
              <FiberDatabaseManagement onClose={() => {}} />
            </div>
          } />
          <Route path="question-bank" element={
            <div className="h-full p-6">
              <QuestionBankManagement onClose={() => {}} />
            </div>
          } />
          <Route path="users" element={
            <div className="h-full p-6">
              <UserManagement onClose={() => {}} onUserUpdated={onUserUpdated} />
            </div>
          } />
          <Route path="*" element={<Navigate to="content-library" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAllStats = async () => {
    // This function is passed to UserManagement to refresh stats when users are updated
    // We can trigger a re-render by navigating to the same route
    navigate('/dashboard/admin-home', { replace: true });
  };

  if (!user || user.user_type !== 'super_admin') {
    return <div className="loading">Access denied...</div>;
  }

  const isAdminToolsActive = location.pathname.includes('/admin-tools');

  const navbarTabs = [
    {
      id: 'home',
      label: 'Home',
      isActive: !isAdminToolsActive,
      onClick: () => navigate('/dashboard/admin-home')
    },
    {
      id: 'admin-tools',
      label: 'Admin Tools',
      isActive: isAdminToolsActive,
      onClick: () => navigate('/dashboard/admin-tools/content-library')
    }
  ];

  return (
    <>
      <Navbar tabs={navbarTabs} />
      <div className="bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="h-full overflow-y-auto p-6">
          <Routes>
            <Route path="admin-home" element={<SuperAdminHome />} />
            <Route path="admin-tools/*" element={<AdminTools onUserUpdated={fetchAllStats} />} />
            <Route path="*" element={<Navigate to="admin-home" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
