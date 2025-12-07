import React from 'react';
import { Modal, Divider, Tag, Empty, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';

interface SpecialFiber {
  id: number;
  name: string;
  properties: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SpecialFiberViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiber: SpecialFiber | null;
  onEdit?: (fiber: SpecialFiber) => void;
}

const SpecialFiberViewModal: React.FC<SpecialFiberViewModalProps> = ({
  isOpen,
  onClose,
  fiber,
  onEdit,
}) => {
  if (!fiber) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const propertyCount = Object.keys(fiber.properties).length;

  return (
    <Modal
      title={`View Special Fiber: ${fiber.name}`}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            onEdit?.(fiber);
            onClose();
          }}
        >
          Edit
        </Button>,
      ]}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-600">Status</p>
              <Tag color={fiber.is_active ? 'green' : 'red'}>
                {fiber.is_active ? 'Active' : 'Inactive'}
              </Tag>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Properties Count</p>
              <Tag color="blue">{propertyCount} properties</Tag>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Created</p>
              <p className="text-sm text-gray-700">{formatDate(fiber.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Updated</p>
              <p className="text-sm text-gray-700">{formatDate(fiber.updated_at)}</p>
            </div>
          </div>
        </div>

        <Divider />

        {/* Properties */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Properties</h4>
          {propertyCount === 0 ? (
            <Empty description="No properties" />
          ) : (
            <div className="space-y-2">
              {Object.entries(fiber.properties).map(([key, value]) => (
                <div key={key} className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    <code className="bg-gray-100 px-2 py-1 rounded">{key}</code>
                  </p>
                  <p className="text-sm text-gray-800">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Metadata */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Metadata</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-600">ID</p>
              <p className="text-sm text-gray-900 font-mono">{fiber.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Name</p>
              <p className="text-sm text-gray-900">{fiber.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Created At</p>
              <p className="text-sm text-gray-900">{formatDate(fiber.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Updated At</p>
              <p className="text-sm text-gray-900">{formatDate(fiber.updated_at)}</p>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default SpecialFiberViewModal;
