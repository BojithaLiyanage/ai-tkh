import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContentLibrary from './ContentLibrary';
import FiberDatabaseManagement from './FiberDatabaseManagement';
import QuestionBankManagement from './QuestionBankManagement';
import KnowledgeBaseManagement from './KnowledgeBaseManagement';
import SuperAdminDashboard from './SuperAdminDashboard';
import Navbar from './Navbar';
import { contentApi, fiberApi, questionApi, knowledgeBaseApi, type ContentStats, type QuestionStats, type FiberClass, type KnowledgeBaseStats } from '../services/api';
import { Card, Statistic, Spin, Button, Menu, Layout } from 'antd';
import { BookOutlined, ExperimentOutlined, QuestionCircleOutlined, ArrowRightOutlined, HomeOutlined, ToolOutlined, DatabaseOutlined, UserOutlined } from '@ant-design/icons';

const { Sider, Content: AntContent } = Layout;

interface AdminHomeProps {
  userType: string;
}

const AdminHome: React.FC<AdminHomeProps> = ({ userType }) => {
  const navigate = useNavigate();
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [fiberCount, setFiberCount] = useState<number>(0);
  const [fiberClasses, setFiberClasses] = useState<FiberClass[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [kbStats, setKbStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [content, fibers, classes, questions, knowledgeBase] = await Promise.all([
        contentApi.getContentStats(),
        fiberApi.getFibers(),
        fiberApi.getFiberClasses(),
        questionApi.getQuestionStats(),
        knowledgeBaseApi.getKnowledgeBaseStats(),
      ]);
      setContentStats(content);
      setFiberCount(fibers.length);
      setFiberClasses(classes);
      setQuestionStats(questions);
      setKbStats(knowledgeBase);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module Summary */}
        <Card
          hoverable
          className="shadow-md"
          styles={{ body: { padding: '24px' } }}
        >
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
        <Card
          hoverable
          className="shadow-md"
          styles={{ body: { padding: '24px' } }}
        >
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
        <Card
          hoverable
          className="shadow-md"
          styles={{ body: { padding: '24px' } }}
        >
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

        {/* Knowledge Base Summary */}
        <Card
          hoverable
          className="shadow-md"
          styles={{ body: { padding: '24px' } }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Knowledge Base</h2>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DatabaseOutlined className="text-2xl text-orange-600" />
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <Statistic
              title="Total Documents"
              value={kbStats?.total_documents || 0}
              valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
            />
            <Statistic
              title="Published"
              value={kbStats?.published_documents || 0}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <Button
            variant="filled"
            color='orange'
            block
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/dashboard/admin-tools/knowledge-base')}
          >
            Manage Knowledge Base
          </Button>
        </Card>

        {/* Super Admin Dashboard - Only for super_admin */}
        {userType === 'super_admin' && (
          <Card
            hoverable
            className="shadow-md"
            styles={{ body: { padding: '24px' } }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Super Admin</h2>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserOutlined className="text-2xl text-orange-600" />
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <Statistic
                title="Admin Controls"
                value="Active"
                valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
              />
              <p className="text-sm text-gray-600">
                Manage users, permissions, and system-wide settings
              </p>
            </div>
            <Button
              variant="filled"
              color='orange'
              block
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/dashboard/super-admin')}
            >
              Super Admin Dashboard
            </Button>
          </Card>
        )}
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

  const getSelectedKey = () => {
    if (location.pathname.includes('/admin-home')) return 'home';
    if (location.pathname.includes('/content-library')) return 'content';
    if (location.pathname.includes('/fiber-database')) return 'fibers';
    if (location.pathname.includes('/question-bank')) return 'questions';
    if (location.pathname.includes('/knowledge-base')) return 'knowledge-base';
    if (location.pathname.includes('/super-admin')) return 'super-admin';
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
          key: 'knowledge-base',
          icon: <DatabaseOutlined />,
          label: 'Knowledge Base',
          onClick: () => navigate('/dashboard/admin-tools/knowledge-base'),
        },
      ],
    },
    ...(user?.user_type === 'super_admin' ? [{
      key: 'super-admin',
      icon: <UserOutlined />,
      label: 'Super Admin',
      onClick: () => navigate('/dashboard/super-admin'),
    }] : []),
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
              <Route path="admin-home" element={<AdminHome userType={user?.user_type || 'admin'} />} />
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
              <Route path="admin-tools/knowledge-base" element={
                <div className="h-full">
                  <KnowledgeBaseManagement />
                </div>
              } />
              <Route path="super-admin/*" element={<SuperAdminDashboard />} />
              <Route path="*" element={<Navigate to="admin-home" replace />} />
            </Routes>
          </div>
        </AntContent>
      </Layout>
    </>
  );
};

export default AdminDashboard;
