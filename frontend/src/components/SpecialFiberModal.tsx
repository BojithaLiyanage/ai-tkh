import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  message,
  Empty,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

interface PropertyEntry {
  key: string;
  value: string;
}

interface SpecialFiberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; properties: Record<string, any> }) => Promise<void>;
  title: string;
  initialData?: {
    name: string;
    properties: Record<string, any>;
  };
}

const SpecialFiberModal: React.FC<SpecialFiberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
}) => {
  const [loading, setLoading] = useState(false);
  const [fiberName, setFiberName] = useState('');
  const [properties, setProperties] = useState<PropertyEntry[]>([]);
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setFiberName(initialData.name);
      const props = Object.entries(initialData.properties).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setProperties(props);
    } else if (isOpen) {
      setFiberName('');
      setProperties([]);
      setNewPropertyKey('');
      setNewPropertyValue('');
    }
  }, [isOpen, initialData]);

  const handleAddProperty = () => {
    if (!newPropertyKey.trim()) {
      message.warning('Property key cannot be empty');
      return;
    }
    if (!newPropertyValue.trim()) {
      message.warning('Property value cannot be empty');
      return;
    }

    // Check for duplicate keys
    if (properties.some((p) => p.key === newPropertyKey)) {
      message.warning('Property key already exists');
      return;
    }

    setProperties([...properties, { key: newPropertyKey, value: newPropertyValue }]);
    setNewPropertyKey('');
    setNewPropertyValue('');
  };

  const handleDeleteProperty = (key: string) => {
    setProperties(properties.filter((p) => p.key !== key));
  };

  const handleUpdateProperty = (index: number, newValue: string) => {
    const updatedProperties = [...properties];
    updatedProperties[index] = { ...updatedProperties[index], value: newValue };
    setProperties(updatedProperties);
  };

  const handleUpdatePropertyKey = (index: number, newKey: string) => {
    if (!newKey.trim()) {
      message.warning('Property key cannot be empty');
      return;
    }

    // Check for duplicate keys (excluding the current property)
    if (properties.some((p, i) => i !== index && p.key === newKey)) {
      message.warning('Property key already exists');
      return;
    }

    const updatedProperties = [...properties];
    updatedProperties[index] = { ...updatedProperties[index], key: newKey };
    setProperties(updatedProperties);
  };

  const handleSubmit = async () => {
    if (!fiberName.trim()) {
      message.warning('Fiber name is required');
      return;
    }

    setLoading(true);
    try {
      const propertiesObj = properties.reduce(
        (acc, prop) => {
          acc[prop.key] = prop.value;
          return acc;
        },
        {} as Record<string, any>
      );

      await onSubmit({
        name: fiberName,
        properties: propertiesObj,
      });

      // Reset form
      setFiberName('');
      setProperties([]);
      setNewPropertyKey('');
      setNewPropertyValue('');
      onClose();
    } catch (error: any) {
      // Error is already handled by parent component
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const propertyColumns = [
    {
      title: 'Property Key',
      dataIndex: 'key',
      key: 'key',
      width: '35%',
      render: (text: string, _record: PropertyEntry, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleUpdatePropertyKey(index, e.target.value)}
          placeholder="Enter key"
          size="small"
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '55%',
      render: (text: string, _record: PropertyEntry, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleUpdateProperty(index, e.target.value)}
          placeholder="Enter value"
          size="small"
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: PropertyEntry) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteProperty(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <Form layout="vertical" onSubmitCapture={handleSubmit}>
        {/* Fiber Name */}
        <Form.Item
          label="Fiber Name"
          required
          tooltip="Name of the special fiber type"
        >
          <Input
            placeholder="e.g., Chitin Nanofiber"
            value={fiberName}
            onChange={(e) => setFiberName(e.target.value)}
            disabled={loading}
          />
        </Form.Item>

        {/* Properties Section */}
        <Form.Item label="Properties" required>
          <div className="space-y-3">
            {/* Add Property Form */}
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add Property</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Property key (e.g., physical.diameter)"
                    value={newPropertyKey}
                    onChange={(e) => setNewPropertyKey(e.target.value)}
                    disabled={loading}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="Property value (e.g., 50-500 nm)"
                    value={newPropertyValue}
                    onChange={(e) => setNewPropertyValue(e.target.value)}
                    disabled={loading}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddProperty}
                    disabled={loading}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Properties Table */}
            {properties.length === 0 ? (
              <Empty
                description="No properties added yet"
                style={{ marginTop: '16px' }}
              />
            ) : (
              <Table
                columns={propertyColumns}
                dataSource={properties}
                rowKey="key"
                pagination={false}
                size="small"
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        </Form.Item>

        {/* Info */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200 mb-3">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use dot notation for nested properties (e.g., physical.diameter)</li>
            <li>Properties are stored as JSON for flexibility</li>
            <li>Embeddings will be automatically generated when you create this fiber</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default SpecialFiberModal;
