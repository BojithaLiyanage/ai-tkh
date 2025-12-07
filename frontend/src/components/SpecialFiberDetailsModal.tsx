import React, { useState } from 'react';
import { Modal, Table, Tag, Empty, Button, Space, Tooltip, Copy, message } from 'antd';
import { CopyOutlined, CloseOutlined } from '@ant-design/icons';

interface SpecialFiberProperty {
  id: number;
  property_name: string;
  property_value: string;
  value_type?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

interface SpecialFiber {
  id: number;
  fiber_id: number;
  special_fiber_type: string;
  description?: string;
  source_file?: string;
  raw_sheet_name?: string;
  properties: SpecialFiberProperty[];
  created_at: string;
  updated_at: string;
}

interface SpecialFiberDetailsModalProps {
  fiber: SpecialFiber | null;
  fiberName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const getValueTypeColor = (type?: string) => {
  switch (type) {
    case 'numeric':
      return 'blue';
    case 'range':
      return 'green';
    case 'boolean':
      return 'orange';
    case 'text':
      return 'purple';
    default:
      return 'default';
  }
};

const getValueTypeLabel = (type?: string) => {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Text';
};

export const SpecialFiberDetailsModal: React.FC<SpecialFiberDetailsModalProps> = ({
  fiber,
  fiberName,
  isOpen,
  onClose,
}) => {
  const [sortedInfo, setSortedInfo] = useState<any>(null);

  if (!fiber) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const propertyColumns = [
    {
      title: 'Property Name',
      dataIndex: 'property_name',
      key: 'property_name',
      width: '25%',
      sorter: (a: any, b: any) =>
        a.property_name.localeCompare(b.property_name),
      sortOrder: sortedInfo?.columnKey === 'property_name' ? sortedInfo.order : null,
      render: (text: string) => (
        <Tooltip title="Click to copy">
          <span
            onClick={() => handleCopy(text)}
            className="cursor-pointer hover:text-blue-600"
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'property_value',
      key: 'property_value',
      width: '35%',
      render: (text: string, record: SpecialFiberProperty) => (
        <div className="flex items-center gap-2">
          <span className="break-words">
            {text}
            {record.unit && ` ${record.unit}`}
          </span>
          <Tooltip title="Copy value">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() =>
                handleCopy(
                  record.unit ? `${text} ${record.unit}` : text
                )
              }
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'value_type',
      key: 'value_type',
      width: '15%',
      filters: [
        { text: 'Numeric', value: 'numeric' },
        { text: 'Range', value: 'range' },
        { text: 'Text', value: 'text' },
        { text: 'Boolean', value: 'boolean' },
      ],
      onFilter: (value: any, record: any) =>
        (record.value_type || 'text') === value,
      render: (type: string) => (
        <Tag color={getValueTypeColor(type)}>
          {getValueTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: '15%',
      render: (unit: string | undefined) =>
        unit ? (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {unit}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  return (
    <Modal
      title={`Special Fiber Details: ${fiberName || `Fiber #${fiber.fiber_id}`}`}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={1200}
      styles={{
        body: {
          maxHeight: '75vh',
          overflowY: 'auto',
        },
      }}
    >
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Special Fiber Type
              </label>
              <p className="text-gray-900 font-medium mt-1">
                <Tag color="blue">{fiber.special_fiber_type}</Tag>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Associated Fiber ID
              </label>
              <p className="text-gray-900 font-medium mt-1">{fiber.fiber_id}</p>
            </div>

            {fiber.raw_sheet_name && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Source Sheet
                </label>
                <p className="text-gray-900 font-medium mt-1">
                  {fiber.raw_sheet_name}
                </p>
              </div>
            )}

            {fiber.source_file && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Source File
                </label>
                <p className="text-gray-900 font-medium mt-1">
                  {fiber.source_file}
                </p>
              </div>
            )}
          </div>

          {fiber.description && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <label className="text-xs font-semibold text-blue-600 uppercase block mb-2">
                Description
              </label>
              <p className="text-blue-900">{fiber.description}</p>
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Created
              </label>
              <p className="text-gray-900 font-medium mt-1">
                {new Date(fiber.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Updated
              </label>
              <p className="text-gray-900 font-medium mt-1">
                {new Date(fiber.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Total Properties
              </label>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {fiber.properties.length}
              </p>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All Properties
          </h3>

          {fiber.properties.length > 0 ? (
            <Table
              columns={propertyColumns}
              dataSource={fiber.properties.map((prop, index) => ({
                ...prop,
                key: prop.id || index,
              }))}
              pagination={{
                pageSize: 10,
                showTotal: (total) =>
                  `Total: ${total} properties`,
              }}
              size="small"
              bordered
              onChange={(pagination, filters, sorter: any) => {
                setSortedInfo(sorter);
              }}
            />
          ) : (
            <Empty description="No properties found" />
          )}
        </div>

        {/* Property Statistics Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Property Statistics
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {['numeric', 'range', 'text', 'boolean'].map((type) => {
              const count = fiber.properties.filter(
                (p) => (p.value_type || 'text') === type
              ).length;
              return (
                <div
                  key={type}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Units Section */}
        {fiber.properties.some((p) => p.unit) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Units Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(fiber.properties.map((p) => p.unit).filter(Boolean))
              ).map((unit) => (
                <Tag key={unit} color="cyan">
                  {unit}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SpecialFiberDetailsModal;
