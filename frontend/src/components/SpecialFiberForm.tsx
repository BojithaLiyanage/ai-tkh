import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Select,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import { DeleteOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import { fiberApi } from '../services/api';

interface SpecialFiberPropertyFormData {
  property_name: string;
  property_value: string;
  value_type?: string;
  unit?: string;
}

interface SpecialFiberFormData {
  fiber_id: number;
  special_fiber_type: string;
  description: string;
  properties: SpecialFiberPropertyFormData[];
}

interface SpecialFiberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SpecialFiberFormData) => Promise<void>;
  editingItem?: any;
  fibers: any[];
  loading?: boolean;
}

const VALUE_TYPES = [
  { label: 'Numeric', value: 'numeric' },
  { label: 'Range', value: 'range' },
  { label: 'Text', value: 'text' },
  { label: 'Boolean', value: 'boolean' },
];

const FIBER_TYPES = [
  'Nanofiber',
  'Graphene Fiber',
  'Carbon Nanofiber',
  'Silica Nanofiber',
  'Polymer Nanofiber',
  'Protein Nanofiber',
  'Cellulose Nanofiber',
  'MXene Fiber',
  'IR-Active Fiber',
  'Other',
];

const COMMON_PROPERTY_NAMES = [
  'physical.diameter',
  'physical.density',
  'physical.tensile_strength',
  'thermal.conductivity',
  'thermal.decomposition_temp',
  'electrical.conductivity',
  'chemical.composition',
  'applications',
  'processing_method',
  'stability',
];

const COMMON_UNITS = [
  'nm', 'µm', 'mm', 'cm', 'm',
  'g·cm⁻³', 'g/cm³',
  'GPa', 'MPa', 'N/mm²',
  'W·m⁻¹·K⁻¹', 'W/m·K',
  'S·m⁻¹', 'S/m',
  '°C', 'K',
  '%',
];

export const SpecialFiberForm: React.FC<SpecialFiberFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  fibers,
  loading = false,
}) => {
  const [formData, setFormData] = useState<SpecialFiberFormData>({
    fiber_id: 0,
    special_fiber_type: '',
    description: '',
    properties: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        fiber_id: editingItem.fiber_id,
        special_fiber_type: editingItem.special_fiber_type || '',
        description: editingItem.description || '',
        properties: editingItem.properties || [],
      });
    } else {
      setFormData({
        fiber_id: 0,
        special_fiber_type: '',
        description: '',
        properties: [],
      });
    }
    setFormErrors({});
  }, [editingItem, isOpen]);

  const detectValueType = (value: string): string => {
    if (!value) return 'text';

    const normalizedValue = value.trim().toLowerCase();

    // Boolean check
    if (/^(yes|no|true|false)$/.test(normalizedValue)) {
      return 'boolean';
    }

    // Range check (numbers with dash/en-dash/to)
    if (/(\d+[\.,]\d+|\d+)\s*[-–to\s]+\s*(\d+[\.,]\d+|\d+)/i.test(value)) {
      return 'range';
    }

    // Pure numeric
    if (/^[\d\.,\s]+$/.test(value)) {
      return 'numeric';
    }

    return 'text';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fiber_id) {
      errors.fiber_id = 'Fiber selection is required';
    }

    if (!formData.special_fiber_type?.trim()) {
      errors.special_fiber_type = 'Special fiber type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePropertyChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedProperties = [...formData.properties];
    updatedProperties[index] = { ...updatedProperties[index], [field]: value };

    // Auto-detect type if value changed
    if (field === 'property_value') {
      updatedProperties[index].value_type = detectValueType(value);
    }

    setFormData((prev) => ({
      ...prev,
      properties: updatedProperties,
    }));
  };

  const addProperty = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [
        ...prev.properties,
        { property_name: '', property_value: '', value_type: 'text', unit: '' },
      ],
    }));
  };

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }));
  };

  const clearAllProperties = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      message.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      message.success(
        `Special fiber ${editingItem ? 'updated' : 'created'} successfully`
      );
      onClose();
    } catch (error: any) {
      message.error(error.message || 'Failed to save special fiber');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyColumns = [
    {
      title: 'Property Name',
      key: 'property_name',
      width: '25%',
      render: (_: any, record: SpecialFiberPropertyFormData, index: number) => (
        <Select
          placeholder="Select property"
          value={record.property_name || undefined}
          onChange={(value) => handlePropertyChange(index, 'property_name', value)}
          options={COMMON_PROPERTY_NAMES.map((name) => ({
            label: name,
            value: name,
          }))}
          allowClear
          onClear={() => handlePropertyChange(index, 'property_name', '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Value',
      key: 'property_value',
      width: '30%',
      render: (_: any, record: SpecialFiberPropertyFormData, index: number) => (
        <Input
          placeholder="e.g., 50-500 nm"
          value={record.property_value || ''}
          onChange={(e) =>
            handlePropertyChange(index, 'property_value', e.target.value)
          }
        />
      ),
    },
    {
      title: 'Type',
      key: 'value_type',
      width: '15%',
      render: (_: any, record: SpecialFiberPropertyFormData, index: number) => (
        <Select
          placeholder="Type"
          value={record.value_type || 'text'}
          onChange={(value) => handlePropertyChange(index, 'value_type', value)}
          options={VALUE_TYPES}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit',
      key: 'unit',
      width: '20%',
      render: (_: any, record: SpecialFiberPropertyFormData, index: number) => (
        <Select
          placeholder="Unit"
          value={record.unit || undefined}
          onChange={(value) => handlePropertyChange(index, 'unit', value || '')}
          options={COMMON_UNITS.map((unit) => ({
            label: unit,
            value: unit,
          }))}
          allowClear
          onClear={() => handlePropertyChange(index, 'unit', '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, _record: any, index: number) => (
        <Tooltip title="Delete property">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => removeProperty(index)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title={`${editingItem ? 'Edit' : 'Create'} Special Fiber`}
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          {editingItem ? 'Update' : 'Create'} Special Fiber
        </Button>,
      ]}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <Spin spinning={loading}>
        <Form layout="vertical" onSubmitCapture={handleSubmit}>
          {/* Basic Information Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Fiber Selection"
                required
                validateStatus={formErrors.fiber_id ? 'error' : ''}
                help={formErrors.fiber_id}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select a fiber"
                  value={formData.fiber_id || undefined}
                  onChange={(value) =>
                    handleInputChange('fiber_id', value)
                  }
                  options={fibers.map((fiber) => ({
                    label: `${fiber.name} (ID: ${fiber.fiber_id})`,
                    value: fiber.id,
                  }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                label="Special Fiber Type"
                required
                validateStatus={formErrors.special_fiber_type ? 'error' : ''}
                help={formErrors.special_fiber_type}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select type"
                  value={formData.special_fiber_type || undefined}
                  onChange={(value) =>
                    handleInputChange('special_fiber_type', value)
                  }
                  options={FIBER_TYPES.map((type) => ({
                    label: type,
                    value: type.toLowerCase(),
                  }))}
                  allowClear
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Description"
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                placeholder="Optional description of the special fiber"
                value={formData.description || ''}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={3}
              />
            </Form.Item>
          </div>

          {/* Properties Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addProperty}
                  size="small"
                >
                  Add Property
                </Button>
                {formData.properties.length > 0 && (
                  <Button
                    danger
                    onClick={clearAllProperties}
                    size="small"
                  >
                    Clear All
                  </Button>
                )}
              </Space>
            </div>

            {formData.properties.length > 0 ? (
              <Table
                columns={propertyColumns}
                dataSource={formData.properties.map((prop, index) => ({
                  ...prop,
                  key: index,
                }))}
                pagination={false}
                size="small"
                bordered
              />
            ) : (
              <Empty
                description="No properties added yet"
                style={{ marginTop: '20px', marginBottom: '20px' }}
              />
            )}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Properties are automatically categorized
                based on their values:
              </p>
              <ul className="text-sm text-blue-700 mt-2 ml-4">
                <li>
                  <strong>Range</strong>: "50-500", "1.2–1.5" (detected
                  automatically)
                </li>
                <li>
                  <strong>Numeric</strong>: "1.42", "100" (detected
                  automatically)
                </li>
                <li>
                  <strong>Boolean</strong>: "yes/no", "true/false"
                  (detected automatically)
                </li>
                <li><strong>Text</strong>: Any other text value</li>
              </ul>
            </div>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default SpecialFiberForm;
