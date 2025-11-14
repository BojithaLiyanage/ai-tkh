import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import { Card, Avatar, Tag, Button, Spin } from 'antd';
import { ArrowLeftOutlined, MailOutlined, IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spin size="large" tip="Loading profile..." />
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mb-6"
            size="large"
          >
            Back to Dashboard
          </Button>

          {/* Profile Header Card */}
          <Card className="shadow-md mb-6" styles={{ body: { padding: '32px' } }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar
                size={120}
                style={{
                  backgroundColor: '#1890ff',
                  fontSize: '42px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                {getInitials(user.full_name)}
              </Avatar>

              {/* User info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.full_name}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4 justify-center sm:justify-start">
                  <MailOutlined />
                  <span className="text-base">{user.email}</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Tag color="blue" icon={<IdcardOutlined />} className="px-3 py-1">
                    {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1).replace('_', ' ')}
                  </Tag>
                  <Tag
                    color={user.is_active ? 'success' : 'error'}
                    icon={user.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    className="px-3 py-1"
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* Account Details Grid */}
          <div className="mb-6">
            {/* Account Information Card */}
            <Card title="Account Information" className="shadow-md" styles={{ body: { padding: '24px' } }}>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Full Name</div>
                  <div className="text-base font-medium text-gray-900">{user.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email Address</div>
                  <div className="text-base font-medium text-gray-900">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Account Type</div>
                  <Tag color="blue" className="mt-1">
                    {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1).replace('_', ' ')}
                  </Tag>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Member Since</div>
                  <div className="text-base font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Client Information Card */}
            {user.client && (
              <Card title="Client Information" className="shadow-md" styles={{ body: { padding: '24px' } }}>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Client Type</div>
                    <Tag color="purple" className="mt-1">
                      {user.client.client_type.charAt(0).toUpperCase() + user.client.client_type.slice(1).replace('_', ' ')}
                    </Tag>
                  </div>
                  {user.client.organization && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Organization</div>
                      <div className="text-base font-medium text-gray-900">{user.client.organization}</div>
                    </div>
                  )}
                  {user.client.specialization && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Specialization</div>
                      <div className="text-base font-medium text-gray-900">{user.client.specialization}</div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
};

export default UserProfile;
