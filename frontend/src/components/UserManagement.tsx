import React, { useState, useEffect } from 'react';
import { authApi, type User, type AdminUserUpdate, type ClientType } from '../services/api';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Alert, Spin, Switch } from 'antd';
import { EditOutlined, CheckCircleOutlined, StopOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format } from "date-fns";

interface UserManagementProps {
  onClose?: () => void;
  onUserUpdated?: () => void;
}

interface EditUserData extends AdminUserUpdate {
  id: number;
}

interface NewUserData {
  full_name: string;
  email: string;
  password: string;
  user_type: 'client' | 'admin' | 'super_admin';
  client_type?: ClientType;
  organization?: string;
  specialization?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null);
  const [newUser, setNewUser] = useState<NewUserData | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authApi.getAllUsers();
      setUsers(allUsers);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser({
      id: user.id,
      full_name: user.full_name,
      user_type: user.user_type,
      is_active: user.is_active,
      client_type: user.client?.client_type,
      organization: user.client?.organization || '',
      specialization: user.client?.specialization || ''
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setActionLoading(editingUser.id);
      const { id, ...updateData } = editingUser;
      await authApi.adminUpdateUser(id, updateData);
      await fetchUsers();
      setEditingUser(null);
      if (onUserUpdated) onUserUpdated();
      setError('');
    } catch (err) {
      setError('Failed to update user');
      console.error('Failed to update user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setActionLoading(user.id);
      if (user.is_active) {
        await authApi.deactivateUser(user.id);
      } else {
        await authApi.activateUser(user.id);
      }
      await fetchUsers();
      if (onUserUpdated) onUserUpdated();
      setError('');
    } catch (err) {
      setError(`Failed to ${user.is_active ? 'deactivate' : 'activate'} user`);
      console.error('Failed to toggle user status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenNewUserModal = () => {
    setNewUser({
      full_name: '',
      email: '',
      password: '',
      user_type: 'client',
      client_type: 'student',
      organization: '',
      specialization: ''
    });
  };

  const handleCreateUser = async () => {
    if (!newUser) return;

    try {
      setCreatingUser(true);

      // Prepare data based on user type
      const userData: any = {
        full_name: newUser.full_name,
        email: newUser.email,
        password: newUser.password,
        user_type: newUser.user_type,
        client_type: newUser.user_type === 'client' ? (newUser.client_type || 'student') : 'student',
      };

      if (newUser.user_type === 'client') {
        if (newUser.organization) userData.organization = newUser.organization;
        if (newUser.specialization) userData.specialization = newUser.specialization;
      }

      await authApi.createUser(userData);
      await fetchUsers();
      setNewUser(null);
      if (onUserUpdated) onUserUpdated();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
      console.error('Failed to create user:', err);
    } finally {
      setCreatingUser(false);
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'super_admin': return 'red';
      case 'admin': return 'blue';
      case 'client': return 'green';
      default: return 'default';
    }
  };

  const getClientTypeColor = (clientType: string) => {
    switch (clientType) {
      case 'researcher': return 'purple';
      case 'industry_expert': return 'orange';
      case 'student': return 'cyan';
      case 'undergraduate': return 'geekblue';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      fixed: 'left',
      width: 150,
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'User Type',
      dataIndex: 'user_type',
      key: 'user_type',
      width: 120,
      filters: [
        { text: 'Client', value: 'client' },
        { text: 'Admin', value: 'admin' },
        { text: 'Super Admin', value: 'super_admin' },
      ],
      onFilter: (value, record) => record.user_type === value,
      render: (userType: string) => (
        <Tag color={getUserTypeColor(userType)}>
          {userType.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Client Type',
      key: 'client_type',
      width: 150,
      filters: [
        { text: 'Researcher', value: 'researcher' },
        { text: 'Industry Expert', value: 'industry_expert' },
        { text: 'Student', value: 'student' },
        { text: 'Undergraduate', value: 'undergraduate' },
      ],
      onFilter: (value, record) => record.client?.client_type === value,
      render: (_, record) => (
        record.client ? (
          <Tag color={getClientTypeColor(record.client.client_type)}>
            {record.client.client_type.replace('_', ' ').toUpperCase()}
          </Tag>
        ) : null
      ),
    },
    {
      title: 'Organization',
      key: 'organization',
      width: 150,
      render: (_, record) => record.client?.organization || '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    // {
    //   title: 'Created',
    //   dataIndex: 'created_at',
    //   key: 'created_at',
    //   width: 180,
    //   sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    //   render: (date: string) => format(new Date(date), "MMM-dd-yyyy")
    // },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            disabled={actionLoading === record.id}
          >
            Edit
          </Button>
          {record.user_type !== 'super_admin' && (
            <Button
              size="small"
              danger={record.is_active}
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleUserStatus(record)}
              disabled={actionLoading === record.id}
              loading={actionLoading === record.id}
            >
              {record.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white w-full h-full flex flex-col p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenNewUserModal}
          size="large"
        >
          Add New User
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError('')}
          style={{ marginBottom: '16px' }}
          showIcon
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Loading users..." />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} users`
          }}
          scroll={{ x: 1200 }}
        />
      )}

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        footer={null}
        width={600}
      >
        {editingUser && (
          <Form layout="vertical" onFinish={handleUpdateUser}>
            <Form.Item label="Full Name" required>
              <Input
                value={editingUser.full_name || ''}
                onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </Form.Item>

            <Form.Item label="User Type" required>
              <Select
                value={editingUser.user_type || 'client'}
                onChange={(value) => setEditingUser({
                  ...editingUser,
                  user_type: value as 'super_admin' | 'admin' | 'client'
                })}
              >
                <Select.Option value="client">Client</Select.Option>
                <Select.Option value="admin">Admin</Select.Option>
              </Select>
            </Form.Item>

            {editingUser.user_type === 'client' && (
              <>
                <Form.Item label="Client Type" required>
                  <Select
                    value={editingUser.client_type || 'student'}
                    onChange={(value) => setEditingUser({
                      ...editingUser,
                      client_type: value as ClientType
                    })}
                  >
                    <Select.Option value="researcher">Researcher</Select.Option>
                    <Select.Option value="industry_expert">Industry Expert</Select.Option>
                    <Select.Option value="student">Student</Select.Option>
                    <Select.Option value="undergraduate">Undergraduate</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Organization">
                  <Input
                    value={editingUser.organization || ''}
                    onChange={(e) => setEditingUser({...editingUser, organization: e.target.value})}
                    placeholder="Enter organization (optional)"
                  />
                </Form.Item>

                <Form.Item label="Specialization">
                  <Input
                    value={editingUser.specialization || ''}
                    onChange={(e) => setEditingUser({...editingUser, specialization: e.target.value})}
                    placeholder="Enter specialization (optional)"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item label="Active">
              <Switch
                checked={editingUser.is_active || false}
                onChange={(checked) => setEditingUser({...editingUser, is_active: checked})}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading === editingUser.id}
              >
                {actionLoading === editingUser.id ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Add New User Modal */}
      <Modal
        title="Add New User"
        open={!!newUser}
        onCancel={() => setNewUser(null)}
        footer={null}
        width={600}
      >
        {newUser && (
          <Form layout="vertical" onFinish={handleCreateUser}>
            <Form.Item label="Full Name" required>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </Form.Item>

            <Form.Item label="Email" required>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Enter email address"
              />
            </Form.Item>

            <Form.Item label="Password" required>
              <Input.Password
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Enter password"
              />
            </Form.Item>

            <Form.Item label="User Type" required>
              <Select
                value={newUser.user_type}
                onChange={(value) => setNewUser({
                  ...newUser,
                  user_type: value as 'super_admin' | 'admin' | 'client'
                })}
              >
                <Select.Option value="client">Client</Select.Option>
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="super_admin">Super Admin</Select.Option>
              </Select>
            </Form.Item>

            {newUser.user_type === 'client' && (
              <>
                <Form.Item label="Client Type" required>
                  <Select
                    value={newUser.client_type || 'student'}
                    onChange={(value) => setNewUser({
                      ...newUser,
                      client_type: value as ClientType
                    })}
                  >
                    <Select.Option value="researcher">Researcher</Select.Option>
                    <Select.Option value="industry_expert">Industry Expert</Select.Option>
                    <Select.Option value="student">Student</Select.Option>
                    <Select.Option value="undergraduate">Undergraduate</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Organization">
                  <Input
                    value={newUser.organization || ''}
                    onChange={(e) => setNewUser({...newUser, organization: e.target.value})}
                    placeholder="Enter organization (optional)"
                  />
                </Form.Item>

                <Form.Item label="Specialization">
                  <Input
                    value={newUser.specialization || ''}
                    onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                    placeholder="Enter specialization (optional)"
                  />
                </Form.Item>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setNewUser(null)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creatingUser}
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;