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

interface FiberDatabaseManagementProps {
  onClose: () => void;
}

type TabType = 'fibers' | 'classes' | 'subtypes' | 'synthetic' | 'polymerization';

const FiberDatabaseManagement: React.FC<FiberDatabaseManagementProps> = ({ onClose }) => {
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
    if (!confirm('Are you sure you want to delete this item?')) return;

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
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Showing {filteredFibers.length} of {fibers.length} fibers
                  {(searchTerm || selectedClassFilter) && (
                    <span className="ml-2 text-sm text-blue-600">
                      (filtered{searchTerm && ` by "${searchTerm}"`}{selectedClassFilter && ` by class`})
                    </span>
                  )}
                </h4>
                {(searchTerm || selectedClassFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedClassFilter(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search fibers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={selectedClassFilter || ''}
                onChange={(e) => setSelectedClassFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Classes</option>
                {fiberClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Fiber
              </button>
            </div>

            {/* Fibers List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredFibers.map(fiber => (
                <div key={fiber.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{fiber.name}</h4>
                      <p className="text-sm text-gray-600">ID: {fiber.fiber_id}</p>
                      {fiber.fiber_class && (
                        <p className="text-sm text-gray-600">Class: {fiber.fiber_class.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          fiber.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {fiber.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewFiber(fiber.id)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditFiber(fiber.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleFiberStatusToggle(fiber.id, fiber.is_active)}
                        className={`px-3 py-1 text-sm rounded ${
                          fiber.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {fiber.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(fiber.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'classes':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {fiberClasses.length} fiber classes in database
              </h4>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Fiber Classes</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Class
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fiberClasses.map(cls => (
                <div key={cls.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.name}</h4>
                      {cls.description && (
                        <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(cls)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'subtypes':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {fiberSubtypes.length} fiber subtypes across {fiberClasses.length} classes
              </h4>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Fiber Subtypes</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Subtype
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fiberSubtypes.map(subtype => (
                <div key={subtype.id} className="p-4 border border-gray-200 rounded-lg">
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(subtype)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subtype.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'synthetic':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {syntheticTypes.length} synthetic types available
              </h4>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Synthetic Types</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Type
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {syntheticTypes.map(type => (
                <div key={type.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(type)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'polymerization':
        return (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {polymerizationTypes.length} polymerization types available
              </h4>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Polymerization Types</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Type
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {polymerizationTypes.map(type => (
                <div key={type.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(type)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fiber Database Management</h2>
          <p className="text-purple-100 mt-1">Manage fibers, classes, and properties</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="m-6 mb-0 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="m-6 mb-0 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {([
            {
              key: 'fibers',
              label: 'Fibers',
              count: activeTab === 'fibers' && (searchTerm || selectedClassFilter) ?
                `${filteredFibers.length}/${fibers.length}` :
                fibers.length
            },
            { key: 'classes', label: 'Classes', count: fiberClasses.length },
            { key: 'subtypes', label: 'Subtypes', count: fiberSubtypes.length },
            { key: 'synthetic', label: 'Synthetic Types', count: syntheticTypes.length },
            { key: 'polymerization', label: 'Polymerization Types', count: polymerizationTypes.length }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                  {tab.key === 'fibers' && activeTab === 'fibers' && (searchTerm || selectedClassFilter) && (
                    <span className="ml-1 text-blue-600">filtered</span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Fiber Detail Modal */}
      {selectedFiber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Fiber Details: {selectedFiber.name}</h3>
              <button
                onClick={() => setSelectedFiber(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
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
          </div>
        </div>
      )}

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