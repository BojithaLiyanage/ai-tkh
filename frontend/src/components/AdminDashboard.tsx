import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContentLibrary from './ContentLibrary';
import FiberDatabaseManagement from './FiberDatabaseManagement';
import QuestionBankManagement from './QuestionBankManagement';
import Navbar from './Navbar';
import { contentApi, fiberApi, questionApi, type ContentStats, type QuestionStats, type FiberClass } from '../services/api';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
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
      const [content, fibers, classes, questions] = await Promise.all([
        contentApi.getContentStats(),
        fiberApi.getFibers(),
        fiberApi.getFiberClasses(),
        questionApi.getQuestionStats(),
      ]);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-10">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Module Summary</h2>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Total Modules</span>
              <span className="text-2xl font-bold text-blue-600">{contentStats?.total_modules || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Topics</span>
              <span className="text-xl font-semibold text-gray-900">{contentStats?.total_topics || 0}</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/admin-tools/content-library')}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Manage Modules
            </button>
          </div>
        </div>

        {/* Fibers Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Fibers Summary</h2>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧵</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Total Fibers</span>
              <span className="text-2xl font-bold text-purple-600">{fiberCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Classes</span>
              <span className="text-xl font-semibold text-gray-900">{fiberClasses.length}</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/admin-tools/fiber-database')}
              className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Manage Fibers
            </button>
          </div>
        </div>

        {/* Question Bank Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Question Bank</h2>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❓</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Total Questions</span>
              <span className="text-2xl font-bold text-pink-600">{questionStats?.total_questions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Fibers Covered</span>
              <span className="text-xl font-semibold text-gray-900">{questionStats?.total_fibers_with_questions || 0}</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/admin-tools/question-bank')}
              className="w-full mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
            >
              Manage Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminTools: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes('content-library')) return 'content';
    if (location.pathname.includes('fiber-database')) return 'fibers';
    if (location.pathname.includes('question-bank')) return 'questions';
    return 'content';
  };

  const activeTab = getActiveTab();

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex">
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
        </div>
      </div>

      {/* Tool Content - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="content-library" element={
            <div className="h-full w-full">
              <ContentLibrary onClose={() => {}} />
            </div>
          } />
          <Route path="fiber-database" element={
            <div className="h-full">
              <FiberDatabaseManagement onClose={() => {}} />
            </div>
          } />
          <Route path="question-bank" element={
            <div className="h-full ">
              <QuestionBankManagement onClose={() => {}} />
            </div>
          } />
          <Route path="*" element={<Navigate to="content-library" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || (user.user_type !== 'admin' && user.user_type !== 'super_admin')) {
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
        <div className="h-full overflow-y-auto">
          <Routes>
            <Route path="admin-home" element={<AdminHome />} />
            <Route path="admin-tools/*" element={<AdminTools />} />
            <Route path="*" element={<Navigate to="admin-home" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
