import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  message,
  Spin,
  Input,
  Tag,
  Card,
  Empty,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { fiberApi } from '../services/api';
import SpecialFiberModal from './SpecialFiberModal';
import SpecialFiberViewModal from './SpecialFiberViewModal';

interface SpecialFiber {
  id: number;
  name: string;
  properties: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SpecialFiberCreateData {
  name: string;
  properties: Record<string, any>;
}

const SpecialFibersTab: React.FC = () => {
  const [specialFibers, setSpecialFibers] = useState<SpecialFiber[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingFiber, setEditingFiber] = useState<SpecialFiber | null>(null);
  const [viewingFiber, setViewingFiber] = useState<SpecialFiber | null>(null);

  useEffect(() => {
    loadSpecialFibers();
  }, []);

  const loadSpecialFibers = async () => {
    setLoading(true);
    try {
      const response = await fiberApi.getSpecialFibers(0, 100);
      setSpecialFibers(response.special_fibers);
    } catch (error: any) {
      message.error('Failed to load special fibers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFibers = specialFibers.filter((fiber) =>
    fiber.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingFiber(null);
    setShowAddModal(true);
  };

  const handleEditClick = (fiber: SpecialFiber) => {
    setEditingFiber(fiber);
    setShowEditModal(true);
  };

  const handleViewClick = (fiber: SpecialFiber) => {
    setViewingFiber(fiber);
    setShowViewModal(true);
  };

  const handleAddSubmit = async (data: SpecialFiberCreateData) => {
    try {
      await fiberApi.createSpecialFiber(data);
      message.success('Special fiber created successfully');
      setShowAddModal(false);
      await loadSpecialFibers();
    } catch (error: any) {
      message.error(error.message || 'Failed to create special fiber');
      throw error;
    }
  };

  const handleEditSubmit = async (data: SpecialFiberCreateData) => {
    if (!editingFiber) return;
    try {
      await fiberApi.updateSpecialFiber(editingFiber.id, data);
      message.success('Special fiber updated successfully');
      setShowEditModal(false);
      await loadSpecialFibers();
    } catch (error: any) {
      message.error(error.message || 'Failed to update special fiber');
      throw error;
    }
  };

  const handleDelete = async (fiberId: number) => {
    try {
      await fiberApi.deleteSpecialFiber(fiberId);
      message.success('Special fiber deleted successfully');
      await loadSpecialFibers();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete special fiber');
    }
  };

  const handleToggleStatus = async (fiber: SpecialFiber) => {
    try {
      const updatedData = {
        name: fiber.name,
        properties: fiber.properties,
        is_active: !fiber.is_active,
      };
      await fiberApi.updateSpecialFiber(fiber.id, updatedData);
      message.success(
        fiber.is_active
          ? 'Special fiber deactivated successfully'
          : 'Special fiber activated successfully'
      );
      await loadSpecialFibers();
    } catch (error: any) {
      message.error(error.message || 'Failed to update special fiber status');
    }
  };


  return (
    <div className="space-y-3">
      {/* Search and Add Button */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <Input
          placeholder="Search special fibers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddClick}
        >
          Add New Special Fiber
        </Button>
      </div>

      {/* Cards View */}
      <Spin spinning={loading}>
        {filteredFibers.length === 0 ? (
          <Empty
            description={
              specialFibers.length === 0
                ? 'No special fibers found'
                : 'No special fibers match your search'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredFibers.map((fiber) => (
              <Card key={fiber.id} size="small" hoverable>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{fiber.name}</h4>
                    <p className="text-sm text-gray-600">
                      Properties: {Object.keys(fiber.properties).length}
                    </p>
                    <div className="mt-2">
                      <Tag color={fiber.is_active ? 'green' : 'red'}>
                        {fiber.is_active ? 'Active' : 'Inactive'}
                      </Tag>
                    </div>
                  </div>
                  <Space size="small">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewClick(fiber)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleEditClick(fiber)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      icon={fiber.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                      danger={fiber.is_active}
                      onClick={() => handleToggleStatus(fiber)}
                    >
                      {fiber.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Popconfirm
                      title="Delete Special Fiber"
                      description={`Are you sure you want to delete "${fiber.name}"? This action cannot be undone.`}
                      okText="Delete"
                      okType="danger"
                      cancelText="Cancel"
                      onConfirm={() => handleDelete(fiber.id)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {/* Add Modal */}
      <SpecialFiberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title="Add New Special Fiber"
      />

      {/* Edit Modal */}
      {editingFiber && (
        <SpecialFiberModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingFiber(null);
          }}
          onSubmit={handleEditSubmit}
          title="Edit Special Fiber"
          initialData={{
            name: editingFiber.name,
            properties: editingFiber.properties,
          }}
        />
      )}

      {/* View Modal */}
      {viewingFiber && (
        <SpecialFiberViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingFiber(null);
          }}
          fiber={viewingFiber}
          onEdit={(fiber) => {
            setViewingFiber(null);
            handleEditClick(fiber);
          }}
        />
      )}
    </div>
  );
};

export default SpecialFibersTab;
