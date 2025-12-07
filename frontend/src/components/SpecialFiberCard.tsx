import React from 'react';
import { Card, Tag, Button, Space, Tooltip, Empty, Segmented, Input, Badge } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

interface SpecialFiberProperty {
  id: number;
  property_name: string;
  property_value: string;
  value_type?: string;
  unit?: string;
}

interface SpecialFiber {
  id: number;
  fiber_id: number;
  special_fiber_type: string;
  description?: string;
  properties: SpecialFiberProperty[];
  created_at: string;
  updated_at: string;
}

interface SpecialFiberCardProps {
  fiber: SpecialFiber;
  fiberName?: string;
  onEdit: (fiber: SpecialFiber) => void;
  onDelete: (fiberId: number) => void;
  onViewDetails: (fiber: SpecialFiber) => void;
  loading?: boolean;
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

export const SpecialFiberCard: React.FC<SpecialFiberCardProps> = ({
  fiber,
  fiberName,
  onEdit,
  onDelete,
  onViewDetails,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'condensed'>('condensed');

  const filteredProperties = fiber.properties.filter(
    (prop) =>
      prop.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.property_value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPropertyValue = (value: string, unit?: string) => {
    if (!unit) return value;
    return `${value} ${unit}`;
  };

  const handleCopyProperty = (prop: SpecialFiberProperty) => {
    const text = `${prop.property_name}: ${formatPropertyValue(
      prop.property_value,
      prop.unit
    )}`;
    navigator.clipboard.writeText(text);
  };

  const displayedProperties =
    viewMode === 'condensed' ? filteredProperties.slice(0, 5) : filteredProperties;
  const hiddenCount =
    viewMode === 'condensed'
      ? Math.max(0, filteredProperties.length - 5)
      : 0;

  return (
    <Card
      className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      title={
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">
                {fiberName || `Fiber #${fiber.fiber_id}`}
              </span>
              <Badge
                count={fiber.properties.length}
                style={{ backgroundColor: '#1890ff' }}
                title="Number of properties"
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Type: <Tag color="blue">{fiber.special_fiber_type}</Tag>
            </p>
          </div>
        </div>
      }
      extra={
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(fiber)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(fiber)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(fiber.id)}
              loading={loading}
              size="small"
            />
          </Tooltip>
        </Space>
      }
    >
      {fiber.description && (
        <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-900">{fiber.description}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Properties Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Properties ({filteredProperties.length})
          </h4>
          <Segmented<'all' | 'condensed'>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Top 5', value: 'condensed' },
            ]}
            size="small"
          />
        </div>

        {/* Search Properties */}
        {fiber.properties.length > 3 && (
          <Input.Search
            placeholder="Search properties..."
            allowClear
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        )}

        {/* Properties Display */}
        {displayedProperties.length > 0 ? (
          <div className="space-y-2">
            {displayedProperties.map((prop) => (
              <div
                key={prop.id}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {prop.property_name}
                      </span>
                      {prop.value_type && (
                        <Tag
                          color={getValueTypeColor(prop.value_type)}
                          style={{ fontSize: '11px' }}
                        >
                          {getValueTypeLabel(prop.value_type)}
                        </Tag>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm break-words">
                      {formatPropertyValue(prop.property_value, prop.unit)}
                    </p>
                  </div>
                  <Tooltip title="Copy to clipboard">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyProperty(prop)}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="No properties found"
            style={{ marginTop: '12px', marginBottom: '12px' }}
          />
        )}

        {/* Show remaining count */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setViewMode('all')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Show {hiddenCount} more properties →
          </button>
        )}

        {/* Metadata */}
        <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <span>Created: {new Date(fiber.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(fiber.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default SpecialFiberCard;
