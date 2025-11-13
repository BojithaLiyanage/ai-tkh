import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button } from 'antd';
import {
  fiberApi,
  type FiberClass,
  type FiberSubtype,
  type SyntheticType,
  type PolymerizationType
} from '../services/api';
import ImageUploadComponent from './ImageUploadComponent';

const { TextArea } = Input;

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

        // Handle string fields that should be empty strings if null
        const stringFields = ['structure_image_url', 'structure_image_id'];

        numericFields.forEach(field => {
          if (processedData[field] === null || processedData[field] === undefined) {
            processedData[field] = '';
          }
        });

        stringFields.forEach(field => {
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
            structure_image_url: '',
            structure_image_id: '',
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

        // Handle image fields - convert empty strings to null
        if (submitData.structure_image_url === '') {
          submitData.structure_image_url = null;
        }
        if (submitData.structure_image_id === '') {
          submitData.structure_image_id = null;
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
          <>
            <Form.Item
              label="Name"
              required
              validateStatus={formErrors.name ? 'error' : ''}
              help={formErrors.name}
            >
              <Input
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter name"
              />
            </Form.Item>

            <Form.Item label="Description">
              <TextArea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Enter description"
              />
            </Form.Item>
          </>
        );

      case 'subtypes':
        return (
          <>
            <Form.Item
              label="Fiber Class"
              required
              validateStatus={formErrors.class_id ? 'error' : ''}
              help={formErrors.class_id}
            >
              <Select
                showSearch
                placeholder="Select a fiber class"
                value={formData.class_id || undefined}
                onChange={(value) => handleInputChange('class_id', value || '')}
                allowClear
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {fiberClasses.map(cls => (
                  <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Name"
              required
              validateStatus={formErrors.name ? 'error' : ''}
              help={formErrors.name}
            >
              <Input
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter subtype name"
              />
            </Form.Item>

            <Form.Item label="Description">
              <TextArea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Enter description"
              />
            </Form.Item>
          </>
        );

      case 'fibers':
        return (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
            {/* Basic Information */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label="Fiber ID"
                  required
                  validateStatus={formErrors.fiber_id ? 'error' : ''}
                  help={formErrors.fiber_id}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    value={formData.fiber_id || ''}
                    onChange={(e) => handleInputChange('fiber_id', e.target.value)}
                    placeholder="Enter fiber ID"
                  />
                </Form.Item>

                <Form.Item
                  label="Name"
                  required
                  validateStatus={formErrors.name ? 'error' : ''}
                  help={formErrors.name}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter fiber name"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Classifications */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Classifications</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Fiber Class" style={{ marginBottom: 0 }}>
                  <Select
                    showSearch
                    placeholder="Select a fiber class"
                    value={formData.class_id || undefined}
                    onChange={(value) => handleInputChange('class_id', value || '')}
                    allowClear
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {fiberClasses.map(cls => (
                      <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Fiber Subtype" style={{ marginBottom: 0 }}>
                  <Select
                    showSearch
                    placeholder="Select a subtype"
                    value={formData.subtype_id || undefined}
                    onChange={(value) => handleInputChange('subtype_id', value || '')}
                    allowClear
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {fiberSubtypes
                      .filter(subtype => !formData.class_id || subtype.class_id === parseInt(formData.class_id))
                      .map(subtype => (
                        <Select.Option key={subtype.id} value={subtype.id}>{subtype.name}</Select.Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Synthetic Type" style={{ marginBottom: 0 }}>
                  <Select
                    showSearch
                    placeholder="Select a synthetic type"
                    value={formData.synthetic_type_id || undefined}
                    onChange={(value) => handleInputChange('synthetic_type_id', value || '')}
                    allowClear
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {syntheticTypes.map(type => (
                      <Select.Option key={type.id} value={type.id}>{type.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Polymerization Type" style={{ marginBottom: 0 }}>
                  <Select
                    showSearch
                    placeholder="Select a polymerization type"
                    value={formData.polymerization_type_id || undefined}
                    onChange={(value) => handleInputChange('polymerization_type_id', value || '')}
                    allowClear
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {polymerizationTypes.map(type => (
                      <Select.Option key={type.id} value={type.id}>{type.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Physical Properties */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Physical Properties</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Density (g/cm³)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.001}
                    value={formData.density_g_cm3 || null}
                    onChange={(value) => handleInputChange('density_g_cm3', value || '')}
                    placeholder="Enter density"
                  />
                </Form.Item>

                <Form.Item label="Moisture Regain (%)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.moisture_regain_percent || null}
                    onChange={(value) => handleInputChange('moisture_regain_percent', value || '')}
                    placeholder="Enter moisture regain"
                  />
                </Form.Item>

                <Form.Item label="Absorption Capacity (%)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.absorption_capacity_percent || null}
                    onChange={(value) => handleInputChange('absorption_capacity_percent', value || '')}
                    placeholder="Enter absorption capacity"
                  />
                </Form.Item>

                <Form.Item label="Fineness Min (µm)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.fineness_min_um || null}
                    onChange={(value) => handleInputChange('fineness_min_um', value || '')}
                    placeholder="Enter minimum fineness"
                  />
                </Form.Item>

                <Form.Item label="Fineness Max (µm)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.fineness_max_um || null}
                    onChange={(value) => handleInputChange('fineness_max_um', value || '')}
                    placeholder="Enter maximum fineness"
                  />
                </Form.Item>

                <Form.Item label="Staple Length Min (mm)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.staple_length_min_mm || null}
                    onChange={(value) => handleInputChange('staple_length_min_mm', value || '')}
                    placeholder="Enter minimum staple length"
                  />
                </Form.Item>

                <Form.Item label="Staple Length Max (mm)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.staple_length_max_mm || null}
                    onChange={(value) => handleInputChange('staple_length_max_mm', value || '')}
                    placeholder="Enter maximum staple length"
                  />
                </Form.Item>

                <Form.Item label="Tenacity Min (cN/tex)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.tenacity_min_cn_tex || null}
                    onChange={(value) => handleInputChange('tenacity_min_cn_tex', value || '')}
                    placeholder="Enter minimum tenacity"
                  />
                </Form.Item>

                <Form.Item label="Tenacity Max (cN/tex)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.tenacity_max_cn_tex || null}
                    onChange={(value) => handleInputChange('tenacity_max_cn_tex', value || '')}
                    placeholder="Enter maximum tenacity"
                  />
                </Form.Item>

                <Form.Item label="Elongation Min (%)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.elongation_min_percent || null}
                    onChange={(value) => handleInputChange('elongation_min_percent', value || '')}
                    placeholder="Enter minimum elongation"
                  />
                </Form.Item>

                <Form.Item label="Elongation Max (%)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.elongation_max_percent || null}
                    onChange={(value) => handleInputChange('elongation_max_percent', value || '')}
                    placeholder="Enter maximum elongation"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Chemical Properties */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Chemical Properties</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Polymer Composition" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.polymer_composition || ''}
                    onChange={(e) => handleInputChange('polymer_composition', e.target.value)}
                    placeholder="Enter polymer composition"
                  />
                </Form.Item>

                <Form.Item label="Degree of Polymerization" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.degree_of_polymerization || ''}
                    onChange={(e) => handleInputChange('degree_of_polymerization', e.target.value)}
                    placeholder="Enter degree of polymerization"
                  />
                </Form.Item>

                <Form.Item label="Acid Resistance" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.acid_resistance || ''}
                    onChange={(e) => handleInputChange('acid_resistance', e.target.value)}
                    placeholder="Enter acid resistance"
                  />
                </Form.Item>

                <Form.Item label="Alkali Resistance" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.alkali_resistance || ''}
                    onChange={(e) => handleInputChange('alkali_resistance', e.target.value)}
                    placeholder="Enter alkali resistance"
                  />
                </Form.Item>

                <Form.Item label="Microbial Resistance" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.microbial_resistance || ''}
                    onChange={(e) => handleInputChange('microbial_resistance', e.target.value)}
                    placeholder="Enter microbial resistance"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Thermal Properties */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Thermal Properties</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Glass Transition Temperature (°C)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.glass_transition_temp_c || null}
                    onChange={(value) => handleInputChange('glass_transition_temp_c', value || '')}
                    placeholder="Enter glass transition temperature"
                  />
                </Form.Item>

                <Form.Item label="Melting Point (°C)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.melting_point_c || null}
                    onChange={(value) => handleInputChange('melting_point_c', value || '')}
                    placeholder="Enter melting point"
                  />
                </Form.Item>

                <Form.Item label="Decomposition Temperature (°C)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.01}
                    value={formData.decomposition_temp_c || null}
                    onChange={(value) => handleInputChange('decomposition_temp_c', value || '')}
                    placeholder="Enter decomposition temperature"
                  />
                </Form.Item>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Form.Item label="Thermal Properties" style={{ marginBottom: 0 }}>
                    <TextArea
                      value={formData.thermal_properties || ''}
                      onChange={(e) => handleInputChange('thermal_properties', e.target.value)}
                      rows={3}
                      placeholder="Enter thermal properties description"
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Structure */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Structure</h4>
              <Form.Item label="Repeating Unit" style={{ marginBottom: '16px' }}>
                <Input
                  value={formData.repeating_unit || ''}
                  onChange={(e) => handleInputChange('repeating_unit', e.target.value)}
                  placeholder="Enter repeating unit"
                />
              </Form.Item>

              <Form.Item label="Molecular Structure (SMILES)" style={{ marginBottom: '16px' }}>
                <Input
                  value={formData.molecular_structure_smiles || ''}
                  onChange={(e) => handleInputChange('molecular_structure_smiles', e.target.value)}
                  placeholder="Enter SMILES notation"
                />
              </Form.Item>

              <div style={{ marginBottom: '16px' }}>
                <ImageUploadComponent
                  value={formData.structure_image_url || null}
                  publicId={formData.structure_image_id || null}
                  onChange={(imageUrl, publicId) => {
                    handleInputChange('structure_image_url', imageUrl || '');
                    handleInputChange('structure_image_id', publicId || '');
                  }}
                  label="Structure Image"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Arrays */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Categories & Properties</h4>
              <Form.Item label="Trade Names" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.trade_names?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('trade_names', e.target.value)}
                  placeholder="Enter trade names separated by commas"
                />
              </Form.Item>

              <Form.Item label="Sources" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.sources?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('sources', e.target.value)}
                  placeholder="Enter sources separated by commas"
                />
              </Form.Item>

              <Form.Item label="Applications" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.applications?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('applications', e.target.value)}
                  placeholder="Enter applications separated by commas"
                />
              </Form.Item>

              <Form.Item label="Manufacturing Process" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.manufacturing_process?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('manufacturing_process', e.target.value)}
                  placeholder="Enter manufacturing processes separated by commas"
                />
              </Form.Item>

              <Form.Item label="Spinning Method" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.spinning_method?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('spinning_method', e.target.value)}
                  placeholder="Enter spinning methods separated by commas"
                />
              </Form.Item>

              <Form.Item label="Post Treatments" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.post_treatments?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('post_treatments', e.target.value)}
                  placeholder="Enter post treatments separated by commas"
                />
              </Form.Item>

              <Form.Item label="Functional Groups" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.functional_groups?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('functional_groups', e.target.value)}
                  placeholder="Enter functional groups separated by commas"
                />
              </Form.Item>

              <Form.Item label="Dye Affinity" style={{ marginBottom: '16px' }} tooltip="Enter comma-separated values">
                <Input
                  value={formData.dye_affinity?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('dye_affinity', e.target.value)}
                  placeholder="Enter dye affinities separated by commas"
                />
              </Form.Item>
            </div>

            {/* Sustainability */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Sustainability</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Biodegradable" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Unknown"
                    value={formData.biodegradability === null ? undefined : formData.biodegradability ? 'true' : 'false'}
                    onChange={(value) => {
                      handleInputChange('biodegradability', value === undefined ? null : value === 'true');
                    }}
                    allowClear
                  >
                    <Select.Option value="true">Yes</Select.Option>
                    <Select.Option value="false">No</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Environmental Impact Score (1-10)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={10}
                    value={formData.environmental_impact_score || null}
                    onChange={(value) => handleInputChange('environmental_impact_score', value || '')}
                    placeholder="Enter impact score"
                  />
                </Form.Item>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Form.Item label="Sustainability Notes" style={{ marginBottom: 0 }}>
                    <TextArea
                      value={formData.sustainability_notes || ''}
                      onChange={(e) => handleInputChange('sustainability_notes', e.target.value)}
                      rows={3}
                      placeholder="Enter sustainability notes"
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Identification & Testing */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Identification & Testing</h4>
              <Form.Item label="Identification Methods" style={{ marginBottom: '16px' }}>
                <TextArea
                  value={formData.identification_methods || ''}
                  onChange={(e) => handleInputChange('identification_methods', e.target.value)}
                  rows={3}
                  placeholder="Enter identification methods"
                />
              </Form.Item>

              <Form.Item label="Property Analysis Methods" style={{ marginBottom: '16px' }}>
                <TextArea
                  value={formData.property_analysis_methods || ''}
                  onChange={(e) => handleInputChange('property_analysis_methods', e.target.value)}
                  rows={3}
                  placeholder="Enter property analysis methods"
                />
              </Form.Item>
            </div>

            {/* Metadata */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Metadata</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Data Quality Score (1-5)" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={5}
                    value={formData.data_quality_score || 3}
                    onChange={(value) => handleInputChange('data_quality_score', value ? parseInt(String(value)) : 3)}
                  />
                </Form.Item>

                <Form.Item label="Data Source" style={{ marginBottom: 0 }}>
                  <Input
                    value={formData.data_source || 'Manual Entry'}
                    onChange={(e) => handleInputChange('data_source', e.target.value)}
                    placeholder="Enter data source"
                  />
                </Form.Item>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={`${editingItem ? 'Edit' : 'Create'} ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          {editingItem ? 'Update' : 'Create'}
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <Form layout="vertical" onSubmitCapture={handleSubmit}>
        {renderFormFields()}
      </Form>
    </Modal>
  );
};

export default FiberFormModal;