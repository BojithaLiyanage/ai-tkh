import React, { useState, useEffect } from 'react';
import { authApi, type User, type UserUpdate, type ClientType } from '../services/api';

interface UserManagementProps {
  onClose?: () => void;
  onUserUpdated?: () => void;
}

interface EditUserData extends UserUpdate {
  id: number;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose, onUserUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
      is_active: user.is_active
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setActionLoading(editingUser.id);
      const { id, ...updateData } = editingUser;
      await authApi.updateUser(id, updateData);
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

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">User Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Client Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Organization</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                        {user.user_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.client && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {user.client.client_type.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.client?.organization || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          disabled={actionLoading === user.id}
                        >
                          Edit
                        </button>
                        {user.user_type !== 'super_admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              user.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? 'Processing...' : 
                             user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={editingUser.user_type || 'client'}
                  onChange={(e) => setEditingUser({
                    ...editingUser, 
                    user_type: e.target.value as 'super_admin' | 'admin' | 'client'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingUser.is_active || false}
                    onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                    className="rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateUser}
                disabled={actionLoading === editingUser.id}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {actionLoading === editingUser.id ? 'Updating...' : 'Update User'}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;