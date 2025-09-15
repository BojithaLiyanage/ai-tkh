import React, { useState, useEffect } from 'react';
import {
  fiberApi,
  type FiberClass,
  type FiberSubtype,
  type SyntheticType,
  type PolymerizationType,
  type FiberClassCreate,
  type FiberSubtypeCreate,
  type SyntheticTypeCreate,
  type PolymerizationTypeCreate,
  type FiberCreate
} from '../services/api';

type TabType = 'fibers' | 'classes' | 'subtypes' | 'synthetic' | 'polymerization';

interface FiberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  activeTab: TabType;
  editingItem?: any;
  fiberClasses: FiberClass[];
  loading: boolean;
}

const FiberFormModal: React.FC<FiberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  activeTab,
  editingItem,
  fiberClasses,
  loading
}) => {
  const [formData, setFormData] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fiberSubtypes, setFiberSubtypes] = useState<FiberSubtype[]>([]);
  const [syntheticTypes, setSyntheticTypes] = useState<SyntheticType[]>([]);
  const [polymerizationTypes, setPolymerizationTypes] = useState<PolymerizationType[]>([]);

  // Load reference data for fiber forms
  useEffect(() => {
    if (isOpen && activeTab === 'fibers') {
      const loadReferenceData = async () => {
        try {
          const [subtypesData, syntheticData, polymerizationData] = await Promise.all([
            fiberApi.getFiberSubtypes(),
            fiberApi.getSyntheticTypes(),
            fiberApi.getPolymerizationTypes()
          ]);
          setFiberSubtypes(subtypesData);
          setSyntheticTypes(syntheticData);
          setPolymerizationTypes(polymerizationData);
        } catch (error) {
          console.error('Failed to load reference data:', error);
        }
      };
      loadReferenceData();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (editingItem) {
      // Handle editing - ensure arrays and null values are properly handled
      const processedData = { ...editingItem };

      // Ensure arrays exist and are not null
      if (activeTab === 'fibers') {
        const arrayFields = [
          'trade_names', 'sources', 'applications', 'manufacturing_process',
          'spinning_method', 'post_treatments', 'functional_groups', 'dye_affinity'
        ];

        arrayFields.forEach(field => {
          if (!processedData[field] || !Array.isArray(processedData[field])) {
            processedData[field] = [];
          }
        });

        // Convert null numeric values to empty strings for form inputs
        const numericFields = [
          'class_id', 'subtype_id', 'synthetic_type_id', 'polymerization_type_id',
          'density_g_cm3', 'fineness_min_um', 'fineness_max_um',
          'staple_length_min_mm', 'staple_length_max_mm',
          'tenacity_min_cn_tex', 'tenacity_max_cn_tex',
          'elongation_min_percent', 'elongation_max_percent',
          'moisture_regain_percent', 'absorption_capacity_percent',
          'glass_transition_temp_c', 'melting_point_c', 'decomposition_temp_c',
          'environmental_impact_score'
        ];

        numericFields.forEach(field => {
          if (processedData[field] === null || processedData[field] === undefined) {
            processedData[field] = '';
          }
        });

        // Ensure data_quality_score has a default
        if (!processedData.data_quality_score) {
          processedData.data_quality_score = 3;
        }
      }

      console.log('Setting form data for editing:', processedData);
      setFormData(processedData);
    } else {
      // Reset form for new item
      switch (activeTab) {
        case 'classes':
          setFormData({ name: '', description: '' });
          break;
        case 'subtypes':
          setFormData({ class_id: '', name: '', description: '' });
          break;
        case 'synthetic':
        case 'polymerization':
          setFormData({ name: '', description: '' });
          break;
        case 'fibers':
          setFormData({
            fiber_id: '',
            name: '',
            class_id: '',
            subtype_id: '',
            synthetic_type_id: '',
            polymerization_type_id: '',
            trade_names: [],
            sources: [],
            applications: [],
            manufacturing_process: [],
            spinning_method: [],
            post_treatments: [],
            functional_groups: [],
            dye_affinity: [],
            density_g_cm3: '',
            fineness_min_um: '',
            fineness_max_um: '',
            staple_length_min_mm: '',
            staple_length_max_mm: '',
            tenacity_min_cn_tex: '',
            tenacity_max_cn_tex: '',
            elongation_min_percent: '',
            elongation_max_percent: '',
            moisture_regain_percent: '',
            absorption_capacity_percent: '',
            polymer_composition: '',
            degree_of_polymerization: '',
            acid_resistance: '',
            alkali_resistance: '',
            microbial_resistance: '',
            thermal_properties: '',
            glass_transition_temp_c: '',
            melting_point_c: '',
            decomposition_temp_c: '',
            repeating_unit: '',
            molecular_structure_smiles: '',
            biodegradability: null,
            sustainability_notes: '',
            environmental_impact_score: '',
            identification_methods: '',
            property_analysis_methods: '',
            data_source: 'Manual Entry',
            data_quality_score: 3,
            is_active: true
          });
          break;
      }
    }
    setFormErrors({});
  }, [editingItem, activeTab, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData((prev: any) => ({ ...prev, [field]: items }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    switch (activeTab) {
      case 'classes':
      case 'synthetic':
      case 'polymerization':
        if (!formData.name?.trim()) {
          errors.name = 'Name is required';
        }
        break;
      case 'subtypes':
        if (!formData.name?.trim()) {
          errors.name = 'Name is required';
        }
        if (!formData.class_id) {
          errors.class_id = 'Fiber class is required';
        }
        break;
      case 'fibers':
        if (!formData.fiber_id?.trim()) {
          errors.fiber_id = 'Fiber ID is required';
        }
        if (!formData.name?.trim()) {
          errors.name = 'Name is required';
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data based on tab type
      let submitData = { ...formData };

      // Convert empty strings to null for numeric fields
      if (activeTab === 'fibers') {
        const numericFields = [
          'class_id', 'subtype_id', 'synthetic_type_id', 'polymerization_type_id',
          'density_g_cm3', 'fineness_min_um', 'fineness_max_um',
          'staple_length_min_mm', 'staple_length_max_mm',
          'tenacity_min_cn_tex', 'tenacity_max_cn_tex',
          'elongation_min_percent', 'elongation_max_percent',
          'moisture_regain_percent', 'absorption_capacity_percent',
          'glass_transition_temp_c', 'melting_point_c', 'decomposition_temp_c',
          'environmental_impact_score', 'data_quality_score'
        ];

        numericFields.forEach(field => {
          if (submitData[field] === '' || submitData[field] === null) {
            submitData[field] = null;
          } else if (typeof submitData[field] === 'string') {
            const num = parseFloat(submitData[field]);
            submitData[field] = isNaN(num) ? null : num;
          }
        });

        // Handle biodegradability
        if (submitData.biodegradability === '') {
          submitData.biodegradability = null;
        }
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'classes':
      case 'synthetic':
      case 'polymerization':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
              />
            </div>
          </div>
        );

      case 'subtypes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiber Class *
              </label>
              <select
                value={formData.class_id || ''}
                onChange={(e) => handleInputChange('class_id', e.target.value ? parseInt(e.target.value) : '')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.class_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a fiber class</option>
                {fiberClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {formErrors.class_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.class_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter subtype name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
              />
            </div>
          </div>
        );

      case 'fibers':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiber ID *
                </label>
                <input
                  type="text"
                  value={formData.fiber_id || ''}
                  onChange={(e) => handleInputChange('fiber_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.fiber_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter fiber ID"
                />
                {formErrors.fiber_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fiber_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter fiber name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
            </div>

            {/* Classifications */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiber Class
                </label>
                <select
                  value={formData.class_id || ''}
                  onChange={(e) => handleInputChange('class_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a fiber class</option>
                  {fiberClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiber Subtype
                </label>
                <select
                  value={formData.subtype_id || ''}
                  onChange={(e) => handleInputChange('subtype_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subtype</option>
                  {fiberSubtypes
                    .filter(subtype => !formData.class_id || subtype.class_id === parseInt(formData.class_id))
                    .map(subtype => (
                      <option key={subtype.id} value={subtype.id}>{subtype.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Synthetic Type
                </label>
                <select
                  value={formData.synthetic_type_id || ''}
                  onChange={(e) => handleInputChange('synthetic_type_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a synthetic type</option>
                  {syntheticTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Polymerization Type
                </label>
                <select
                  value={formData.polymerization_type_id || ''}
                  onChange={(e) => handleInputChange('polymerization_type_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a polymerization type</option>
                  {polymerizationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Density (g/cm³)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.density_g_cm3 || ''}
                  onChange={(e) => handleInputChange('density_g_cm3', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter density"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moisture Regain (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.moisture_regain_percent || ''}
                  onChange={(e) => handleInputChange('moisture_regain_percent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter moisture regain"
                />
              </div>
            </div>

            {/* Arrays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Names
              </label>
              <input
                type="text"
                value={formData.trade_names?.join(', ') || ''}
                onChange={(e) => handleArrayChange('trade_names', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter trade names separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applications
              </label>
              <input
                type="text"
                value={formData.applications?.join(', ') || ''}
                onChange={(e) => handleArrayChange('applications', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter applications separated by commas"
              />
            </div>

            {/* Sustainability */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biodegradable
                </label>
                <select
                  value={formData.biodegradability === null ? '' : formData.biodegradability ? 'true' : 'false'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('biodegradability', value === '' ? null : value === 'true');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Quality Score (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.data_quality_score || 3}
                  onChange={(e) => handleInputChange('data_quality_score', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sustainability Notes
              </label>
              <textarea
                value={formData.sustainability_notes || ''}
                onChange={(e) => handleInputChange('sustainability_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter sustainability notes"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            {editingItem ? 'Edit' : 'Create'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {renderFormFields()}

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiberFormModal;