import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import ContentLibrary from './ContentLibrary';
import FiberDatabaseManagement from './FiberDatabaseManagement';
import QuestionBankManagement from './QuestionBankManagement';
import Navbar from './Navbar';
import { authApi, contentApi, fiberApi, questionApi, type UserStats, type ContentStats, type QuestionStats, type FiberClass } from '../services/api';
import { Card, Statistic, Spin, Button, Menu, Layout } from 'antd';
import { BookOutlined, ExperimentOutlined, QuestionCircleOutlined, ArrowRightOutlined, HomeOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';

const { Sider, Content: AntContent } = Layout;

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
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading statistics..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        {/* Module Summary */}
        <Card hoverable className="shadow-md" styles={{ body: { padding: '24px' } }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Module Summary</h2>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOutlined className="text-2xl text-blue-600" />
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <Statistic
              title="Total Modules"
              value={contentStats?.total_modules || 0}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
            />
            <Statistic
              title="Topics"
              value={contentStats?.total_topics || 0}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <Button
            variant="filled"
            color='primary'
            block
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard/admin-tools/content-library')}
          >
            Manage Modules
          </Button>
        </Card>

        {/* Fibers Summary */}
        <Card hoverable className="shadow-md" styles={{ body: { padding: '24px' } }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Fibers Summary</h2>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ExperimentOutlined className="text-2xl text-purple-600" />
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <Statistic
              title="Total Fibers"
              value={fiberCount}
              valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 'bold' }}
            />
            <Statistic
              title="Classes"
              value={fiberClasses.length}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <Button
            variant="filled"
            color='purple'
            block
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard/admin-tools/fiber-database')}
          >
            Manage Fibers
          </Button>
        </Card>

        {/* Question Bank Summary */}
        <Card hoverable className="shadow-md" styles={{ body: { padding: '24px' } }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Question Bank</h2>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <QuestionCircleOutlined className="text-2xl text-pink-600" />
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <Statistic
              title="Total Questions"
              value={questionStats?.total_questions || 0}
              valueStyle={{ color: '#eb2f96', fontSize: '28px', fontWeight: 'bold' }}
            />
            <Statistic
              title="Fibers Covered"
              value={questionStats?.total_fibers_with_questions || 0}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <Button
            variant="filled"
            color='pink'
            block
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard/admin-tools/question-bank')}
          >
            Manage Questions
          </Button>
        </Card>

        {/* User Summary */}
        <Card hoverable className="shadow-md" styles={{ body: { padding: '24px' } }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Users</h2>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-2xl text-green-600" />
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <Statistic
              title="Total Users"
              value={userStats?.total_users || 0}
              valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
            />
            <Statistic
              title="Clients"
              value={userStats?.client_users || 0}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <Button
            variant="filled"
            color='green'
            block
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard/admin-tools/users')}
          >
            Manage Users
          </Button>
        </Card>
      </div>
    </div>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.user_type !== 'super_admin') {
    return <div className="loading">Access denied...</div>;
  }

  const getSelectedKey = () => {
    if (location.pathname.includes('/admin-home')) return 'home';
    if (location.pathname.includes('/content-library')) return 'content';
    if (location.pathname.includes('/fiber-database')) return 'fibers';
    if (location.pathname.includes('/question-bank')) return 'questions';
    if (location.pathname.includes('/users')) return 'users';
    return 'home';
  };

  const getOpenKeys = () => {
    if (location.pathname.includes('/admin-tools')) return ['admin-tools'];
    return [];
  };

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate('/dashboard/admin-home'),
    },
    {
      key: 'admin-tools',
      icon: <ToolOutlined />,
      label: 'Admin Tools',
      children: [
        {
          key: 'content',
          icon: <BookOutlined />,
          label: 'Content Library',
          onClick: () => navigate('/dashboard/admin-tools/content-library'),
        },
        {
          key: 'fibers',
          icon: <ExperimentOutlined />,
          label: 'Fiber Database',
          onClick: () => navigate('/dashboard/admin-tools/fiber-database'),
        },
        {
          key: 'questions',
          icon: <QuestionCircleOutlined />,
          label: 'Question Bank',
          onClick: () => navigate('/dashboard/admin-tools/question-bank'),
        },
        {
          key: 'users',
          icon: <UserOutlined />,
          label: 'User Management',
          onClick: () => navigate('/dashboard/admin-tools/users'),
        },
      ],
    },
  ];

  return (
    <>
      <Navbar tabs={[]} />
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        {/* Unified Sidebar */}
        <Sider width={250} theme="light" className="border-r border-gray-200">
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            className="border-r-0"
            style={{ height: 'calc(100% - 65px)' }}
          />
        </Sider>

        {/* Main Content */}
        <AntContent className="overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto">
            <Routes>
              <Route path="admin-home" element={<SuperAdminHome />} />
              <Route path="admin-tools/content-library" element={
                <div className="h-full w-full">
                  <ContentLibrary onClose={() => {}} />
                </div>
              } />
              <Route path="admin-tools/fiber-database" element={
                <div className="h-full">
                  <FiberDatabaseManagement onClose={() => {}} />
                </div>
              } />
              <Route path="admin-tools/question-bank" element={
                <div className="h-full">
                  <QuestionBankManagement onClose={() => {}} />
                </div>
              } />
              <Route path="admin-tools/users" element={
                <div className="h-full">
                  <UserManagement onClose={() => {}} />
                </div>
              } />
              <Route path="*" element={<Navigate to="admin-home" replace />} />
            </Routes>
          </div>
        </AntContent>
      </Layout>
    </>
  );
};

export default SuperAdminDashboard;
