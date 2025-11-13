import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout, Avatar, Dropdown, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface NavbarProps {
  tabs?: Tab[];
}

const Navbar: React.FC<NavbarProps> = ({ tabs }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const items: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <div style={{ fontWeight: 500, color: '#262626' }}>{user?.full_name}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Left side - Dashboard name and tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Text strong style={{ fontSize: '20px', margin: 0 }}>
          Dashboard
        </Text>

        {/* Tabs (if provided) */}
        {tabs && tabs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab.isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Welcome message and Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Welcome message - hidden on mobile */}
        <Text style={{ margin: 0 }} className="hidden sm:block">
          Welcome, <Text strong>{user?.full_name}</Text>!
        </Text>

        {/* Profile dropdown */}
        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }} className="hover:bg-gray-100">
            <Avatar
              style={{
                backgroundColor: '#1890ff',
                verticalAlign: 'middle',
              }}
              size="default"
            >
              {user?.full_name ? getInitials(user.full_name) : 'U'}
            </Avatar>
            <Text strong className="hidden md:block" style={{ margin: 0 }}>
              {user?.full_name}
            </Text>
            <DownOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navbar;
