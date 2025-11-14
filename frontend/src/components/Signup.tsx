import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import type { ClientType } from '../services/api';
import { Form, Input, Button, Card, Alert, Typography, Space, Select } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined, BankOutlined, ExperimentOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Signup: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientType, setClientType] = useState<ClientType>('student');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setError('');
    setLoading(true);

    try {
      await signup(
        values.email,
        values.password,
        values.fullName,
        'client',
        values.clientType,
        values.organization || '',
        values.specialization || ''
      );
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gray-50">
      <Card
        className="w-full max-w-lg shadow-lg"
        styles={{ body: { padding: '40px' } }}
      >
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center">
            <Title level={2} className="!mb-2">Create Account</Title>
            <Text type="secondary">Sign up to get started with your account</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError('')}
              showIcon
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            initialValues={{ clientType: 'student' }}
          >
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: 'Please enter your full name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="m@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              label="I am a"
              name="clientType"
              rules={[{ required: true, message: 'Please select your role!' }]}
            >
              <Select
                placeholder="Select your role"
                onChange={(value) => setClientType(value as ClientType)}
                suffixIcon={<IdcardOutlined />}
              >
                <Option value="student">Student</Option>
                <Option value="undergraduate">Undergraduate</Option>
                <Option value="researcher">Researcher</Option>
                <Option value="industry_expert">Industry Expert</Option>
              </Select>
            </Form.Item>

            {(clientType === 'researcher' || clientType === 'industry_expert') && (
              <Form.Item
                label="Organization"
                name="organization"
              >
                <Input
                  prefix={<BankOutlined />}
                  placeholder="Enter your organization"
                />
              </Form.Item>
            )}

            {clientType === 'researcher' && (
              <Form.Item
                label="Research Specialization"
                name="specialization"
              >
                <Input
                  prefix={<ExperimentOutlined />}
                  placeholder="Enter your research area"
                />
              </Form.Item>
            )}

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<UserAddOutlined />}
                block
                size="large"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center pt-4 border-t border-gray-200">
            <Text type="secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Signup;