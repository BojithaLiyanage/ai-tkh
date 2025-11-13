import React, { useState, useEffect } from 'react';
import {
  fiberApi,
  type FiberClass,
  type FiberSubtype,
  type SyntheticType,
  type PolymerizationType,
  type FiberSummary,
  type FiberDetail,
  type FiberClassCreate,
  type FiberSubtypeCreate,
  type SyntheticTypeCreate,
  type PolymerizationTypeCreate,
  type FiberCreate
} from '../services/api';
import FiberFormModal from './FiberFormModal';
import { Tabs, Card, Button, Alert, Spin, Input, Select, Tag, Space, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

interface FiberDatabaseManagementProps {
  onClose?: () => void;
}

type TabType = 'fibers' | 'classes' | 'subtypes' | 'synthetic' | 'polymerization';

const FiberDatabaseManagement: React.FC<FiberDatabaseManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fibers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [fiberClasses, setFiberClasses] = useState<FiberClass[]>([]);
  const [fiberSubtypes, setFiberSubtypes] = useState<FiberSubtype[]>([]);
  const [syntheticTypes, setSyntheticTypes] = useState<SyntheticType[]>([]);
  const [polymerizationTypes, setPolymerizationTypes] = useState<PolymerizationType[]>([]);
  const [fibers, setFibers] = useState<FiberSummary[]>([]);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedFiber, setSelectedFiber] = useState<FiberDetail | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, subtypesData, syntheticData, polymerizationData, fibersData] = await Promise.all([
        fiberApi.getFiberClasses(),
        fiberApi.getFiberSubtypes(),
        fiberApi.getSyntheticTypes(),
        fiberApi.getPolymerizationTypes(),
        fiberApi.getFibers({ limit: 100 })
      ]);

      setFiberClasses(classesData);
      setFiberSubtypes(subtypesData);
      setSyntheticTypes(syntheticData);
      setPolymerizationTypes(polymerizationData);
      setFibers(fibersData);
    } catch (err) {
      setError('Failed to load fiber database');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async (data: any) => {
    setLoading(true);
    clearMessages();

    try {
      switch (activeTab) {
        case 'classes':
          await fiberApi.createFiberClass(data as FiberClassCreate);
          setSuccess('Fiber class created successfully');
          break;
        case 'subtypes':
          await fiberApi.createFiberSubtype(data as FiberSubtypeCreate);
          setSuccess('Fiber subtype created successfully');
          break;
        case 'synthetic':
          await fiberApi.createSyntheticType(data as SyntheticTypeCreate);
          setSuccess('Synthetic type created successfully');
          break;
        case 'polymerization':
          await fiberApi.createPolymerizationType(data as PolymerizationTypeCreate);
          setSuccess('Polymerization type created successfully');
          break;
        case 'fibers':
          await fiberApi.createFiber(data as FiberCreate);
          setSuccess('Fiber created successfully');
          break;
      }

      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    setLoading(true);
    clearMessages();

    try {
      switch (activeTab) {
        case 'classes':
          await fiberApi.updateFiberClass(id, data);
          setSuccess('Fiber class updated successfully');
          break;
        case 'subtypes':
          await fiberApi.updateFiberSubtype(id, data);
          setSuccess('Fiber subtype updated successfully');
          break;
        case 'synthetic':
          await fiberApi.updateSyntheticType(id, data);
          setSuccess('Synthetic type updated successfully');
          break;
        case 'polymerization':
          await fiberApi.updatePolymerizationType(id, data);
          setSuccess('Polymerization type updated successfully');
          break;
        case 'fibers':
          await fiberApi.updateFiber(id, data);
          setSuccess('Fiber updated successfully');
          break;
      }

      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this item?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setLoading(true);
        clearMessages();

        try {
          switch (activeTab) {
            case 'classes':
              await fiberApi.deleteFiberClass(id);
              setSuccess('Fiber class deleted successfully');
              break;
            case 'subtypes':
              await fiberApi.deleteFiberSubtype(id);
              setSuccess('Fiber subtype deleted successfully');
              break;
            case 'synthetic':
              await fiberApi.deleteSyntheticType(id);
              setSuccess('Synthetic type deleted successfully');
              break;
            case 'polymerization':
              await fiberApi.deletePolymerizationType(id);
              setSuccess('Polymerization type deleted successfully');
              break;
            case 'fibers':
              await fiberApi.deleteFiber(id);
              setSuccess('Fiber deleted successfully');
              break;
          }

          await loadData();
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to delete item');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleFiberStatusToggle = async (fiberId: number, isActive: boolean) => {
    setLoading(true);
    clearMessages();

    try {
      if (isActive) {
        await fiberApi.deactivateFiber(fiberId);
        setSuccess('Fiber deactivated successfully');
      } else {
        await fiberApi.activateFiber(fiberId);
        setSuccess('Fiber activated successfully');
      }

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update fiber status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFiber = async (fiberId: number) => {
    try {
      const fiber = await fiberApi.getFiber(fiberId);
      setSelectedFiber(fiber);
    } catch (err) {
      setError('Failed to load fiber details');
    }
  };

  const handleEditFiber = async (fiberId: number) => {
    setLoading(true);
    clearMessages();

    try {
      const fullFiber = await fiberApi.getFiber(fiberId);
      console.log('Full fiber data loaded for editing:', fullFiber);
      setEditingItem(fullFiber);
    } catch (err) {
      console.error('Error loading fiber for editing:', err);
      setError('Failed to load fiber for editing');
    } finally {
      setLoading(false);
    }
  };

  const filteredFibers = fibers.filter(fiber => {
    const matchesSearch = fiber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fiber.fiber_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClassFilter || fiber.fiber_class?.id === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fibers':
        return (
          <div className="space-y-3">
            {filteredFibers.map(fiber => (
              <Card key={fiber.id} size="small" hoverable>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{fiber.name}</h4>
                    <p className="text-sm text-gray-600">ID: {fiber.fiber_id}</p>
                    {fiber.fiber_class && (
                      <p className="text-sm text-gray-600">Class: {fiber.fiber_class.name}</p>
                    )}
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
                      onClick={() => handleViewFiber(fiber.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleEditFiber(fiber.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      icon={fiber.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                      danger={fiber.is_active}
                      onClick={() => handleFiberStatusToggle(fiber.id, fiber.is_active)}
                    >
                      {fiber.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(fiber.id)}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'classes':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <Alert
              message={`${fiberClasses.length} fiber classes in database`}
              type="info"
              showIcon
            />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Fiber Classes</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateForm(true)}
              >
                Add Class
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fiberClasses.map(cls => (
                <Card key={cls.id} size="small" hoverable>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.name}</h4>
                      {cls.description && (
                        <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                      )}
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setEditingItem(cls)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(cls.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'subtypes':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <Alert
              message={`${fiberSubtypes.length} fiber subtypes across ${fiberClasses.length} classes`}
              type="info"
              showIcon
            />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Fiber Subtypes</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateForm(true)}
              >
                Add Subtype
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fiberSubtypes.map(subtype => (
                <Card key={subtype.id} size="small" hoverable>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{subtype.name}</h4>
                      <p className="text-sm text-gray-600">
                        Class: {fiberClasses.find(c => c.id === subtype.class_id)?.name || 'Unknown'}
                      </p>
                      {subtype.description && (
                        <p className="text-sm text-gray-600 mt-1">{subtype.description}</p>
                      )}
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setEditingItem(subtype)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(subtype.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'synthetic':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <Alert
              message={`${syntheticTypes.length} synthetic types available`}
              type="info"
              showIcon
            />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Synthetic Types</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateForm(true)}
              >
                Add Type
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {syntheticTypes.map(type => (
                <Card key={type.id} size="small" hoverable>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      )}
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setEditingItem(type)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(type.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'polymerization':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <Alert
              message={`${polymerizationTypes.length} polymerization types available`}
              type="info"
              showIcon
            />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Polymerization Types</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateForm(true)}
              >
                Add Type
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {polymerizationTypes.map(type => (
                <Card key={type.id} size="small" hoverable>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      )}
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setEditingItem(type)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(type.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const tabItems = [
    {
      key: 'fibers',
      label: (
        <span>
          Fibers{' '}
          <Tag color="blue">
            {activeTab === 'fibers' && (searchTerm || selectedClassFilter)
              ? `${filteredFibers.length}/${fibers.length}`
              : fibers.length}
          </Tag>
        </span>
      ),
      children: null,
    },
    {
      key: 'classes',
      label: <span>Classes <Tag color="blue">{fiberClasses.length}</Tag></span>,
      children: null,
    },
    {
      key: 'subtypes',
      label: <span>Subtypes <Tag color="blue">{fiberSubtypes.length}</Tag></span>,
      children: null,
    },
    {
      key: 'synthetic',
      label: <span>Synthetic Types <Tag color="blue">{syntheticTypes.length}</Tag></span>,
      children: null,
    },
    {
      key: 'polymerization',
      label: <span>Polymerization Types <Tag color="blue">{polymerizationTypes.length}</Tag></span>,
      children: null,
    },
  ];

  return (
    <div className="bg-white w-full h-full flex flex-col">
      {/* Error/Success Messages */}
      {error && (
        <div style={{ margin: '16px 16px 0' }}>
          <Alert message={error} type="error" closable onClose={() => setError(null)} showIcon />
        </div>
      )}
      {success && (
        <div style={{ margin: '16px 16px 0' }}>
          <Alert message={success} type="success" closable onClose={() => setSuccess(null)} showIcon />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabType)}
        items={tabItems}
        style={{ marginBottom: 0 }}
        tabBarStyle={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: 0 }}
      />

      {/* Search Bar for Fibers Tab */}
      {activeTab === 'fibers' && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Input.Search
                placeholder="Search fibers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </div>
            <div style={{ flex: '0 1 200px', minWidth: '180px' }}>
              <Select
                showSearch
                placeholder="All Classes"
                value={selectedClassFilter}
                onChange={(value) => setSelectedClassFilter(value)}
                style={{ width: '100%' }}
                allowClear
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {fiberClasses.map(cls => (
                  <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold whitespace-nowrap">
                Showing {filteredFibers.length} of {fibers.length}
              </span>
                <Button 
                type="link" 
                disabled={!(searchTerm || selectedClassFilter)}
                onClick={() => { setSearchTerm(''); setSelectedClassFilter(null); }}>
                  Clear filters
                </Button>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
            >
              Add Fiber
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" tip="Loading..." />
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Fiber Detail Modal */}
      <Modal
        title={`Fiber Details: ${selectedFiber?.name || ''}`}
        open={!!selectedFiber}
        onCancel={() => setSelectedFiber(null)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {selectedFiber && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-4">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiber ID</label>
                    <p className="text-gray-900">{selectedFiber.fiber_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedFiber.name}</p>
                  </div>
                </div>
              </div>

              {/* Classifications */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Classifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiber Class</label>
                    <p className="text-gray-900">{selectedFiber.fiber_class?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subtype</label>
                    <p className="text-gray-900">{selectedFiber.subtype?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Synthetic Type</label>
                    <p className="text-gray-900">{selectedFiber.synthetic_type?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Polymerization Type</label>
                    <p className="text-gray-900">{selectedFiber.polymerization_type?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Physical Properties */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Physical Properties</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Density (g/cm³)</label>
                    <p className="text-gray-900">{selectedFiber.density_g_cm3 || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Moisture Regain (%)</label>
                    <p className="text-gray-900">{selectedFiber.moisture_regain_percent || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Absorption Capacity (%)</label>
                    <p className="text-gray-900">{selectedFiber.absorption_capacity_percent || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fineness Range (µm)</label>
                    <p className="text-gray-900">
                      {selectedFiber.fineness_min_um && selectedFiber.fineness_max_um ?
                        `${selectedFiber.fineness_min_um} - ${selectedFiber.fineness_max_um}` :
                        selectedFiber.fineness_min_um || selectedFiber.fineness_max_um || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staple Length Range (mm)</label>
                    <p className="text-gray-900">
                      {selectedFiber.staple_length_min_mm && selectedFiber.staple_length_max_mm ?
                        `${selectedFiber.staple_length_min_mm} - ${selectedFiber.staple_length_max_mm}` :
                        selectedFiber.staple_length_min_mm || selectedFiber.staple_length_max_mm || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenacity Range (cN/tex)</label>
                    <p className="text-gray-900">
                      {selectedFiber.tenacity_min_cn_tex && selectedFiber.tenacity_max_cn_tex ?
                        `${selectedFiber.tenacity_min_cn_tex} - ${selectedFiber.tenacity_max_cn_tex}` :
                        selectedFiber.tenacity_min_cn_tex || selectedFiber.tenacity_max_cn_tex || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Elongation Range (%)</label>
                    <p className="text-gray-900">
                      {selectedFiber.elongation_min_percent && selectedFiber.elongation_max_percent ?
                        `${selectedFiber.elongation_min_percent} - ${selectedFiber.elongation_max_percent}` :
                        selectedFiber.elongation_min_percent || selectedFiber.elongation_max_percent || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chemical Properties */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Chemical Properties</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Polymer Composition</label>
                    <p className="text-gray-900">{selectedFiber.polymer_composition || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Degree of Polymerization</label>
                    <p className="text-gray-900">{selectedFiber.degree_of_polymerization || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acid Resistance</label>
                    <p className="text-gray-900">{selectedFiber.acid_resistance || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alkali Resistance</label>
                    <p className="text-gray-900">{selectedFiber.alkali_resistance || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Microbial Resistance</label>
                    <p className="text-gray-900">{selectedFiber.microbial_resistance || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Thermal Properties */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Thermal Properties</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Glass Transition Temperature (°C)</label>
                    <p className="text-gray-900">{selectedFiber.glass_transition_temp_c || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Melting Point (°C)</label>
                    <p className="text-gray-900">{selectedFiber.melting_point_c || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decomposition Temperature (°C)</label>
                    <p className="text-gray-900">{selectedFiber.decomposition_temp_c || 'N/A'}</p>
                  </div>
                  {selectedFiber.thermal_properties && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Thermal Properties</label>
                      <p className="text-gray-900">{selectedFiber.thermal_properties}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Structure */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Structure</h4>
                <div className="space-y-4">
                  {selectedFiber.repeating_unit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Repeating Unit</label>
                      <p className="text-gray-900">{selectedFiber.repeating_unit}</p>
                    </div>
                  )}
                  {selectedFiber.molecular_structure_smiles && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Molecular Structure (SMILES)</label>
                      <p className="text-gray-900 font-mono text-sm break-all">{selectedFiber.molecular_structure_smiles}</p>
                    </div>
                  )}
                  {selectedFiber.structure_image_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Structure Image</label>
                      <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                        <img
                          src={selectedFiber.structure_image_url}
                          alt="Molecular structure"
                          className="max-w-full h-auto max-h-64 mx-auto rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const container = target.parentElement;
                            if (container) {
                              container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Image could not be loaded</p>';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Arrays */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Categories & Properties</h4>
                <div className="space-y-4">
                  {selectedFiber.trade_names && selectedFiber.trade_names.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trade Names</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.trade_names.map((name, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.sources && selectedFiber.sources.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sources</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.sources.map((source, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.applications && selectedFiber.applications.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Applications</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.applications.map((app, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.manufacturing_process && selectedFiber.manufacturing_process.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manufacturing Process</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.manufacturing_process.map((process, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                            {process}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.spinning_method && selectedFiber.spinning_method.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Spinning Method</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.spinning_method.map((method, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.post_treatments && selectedFiber.post_treatments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Post Treatments</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.post_treatments.map((treatment, index) => (
                          <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.functional_groups && selectedFiber.functional_groups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Functional Groups</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.functional_groups.map((group, index) => (
                          <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 text-sm rounded">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedFiber.dye_affinity && selectedFiber.dye_affinity.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dye Affinity</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFiber.dye_affinity.map((affinity, index) => (
                          <span key={index} className="px-2 py-1 bg-teal-100 text-teal-800 text-sm rounded">
                            {affinity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sustainability */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Sustainability</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Biodegradable</label>
                    <p className="text-gray-900">{selectedFiber.biodegradability === null ? 'N/A' : selectedFiber.biodegradability ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Environmental Impact Score</label>
                    <p className="text-gray-900">{selectedFiber.environmental_impact_score || 'N/A'}</p>
                  </div>
                  {selectedFiber.sustainability_notes && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Sustainability Notes</label>
                      <p className="text-gray-900">{selectedFiber.sustainability_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Identification & Testing */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Identification & Testing</h4>
                <div className="space-y-4">
                  {selectedFiber.identification_methods && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Identification Methods</label>
                      <p className="text-gray-900">{selectedFiber.identification_methods}</p>
                    </div>
                  )}
                  {selectedFiber.property_analysis_methods && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Property Analysis Methods</label>
                      <p className="text-gray-900">{selectedFiber.property_analysis_methods}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Quality Score</label>
                    <p className="text-gray-900">{selectedFiber.data_quality_score || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-gray-900">{new Date(selectedFiber.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Updated At</label>
                    <p className="text-gray-900">{new Date(selectedFiber.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <FiberFormModal
        isOpen={showCreateForm || !!editingItem}
        onClose={() => {
          setShowCreateForm(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ?
          (data) => handleUpdate(editingItem.id, data) :
          handleCreate
        }
        activeTab={activeTab}
        editingItem={editingItem}
        fiberClasses={fiberClasses}
        loading={loading}
      />
    </div>
  );
};

export default FiberDatabaseManagement;