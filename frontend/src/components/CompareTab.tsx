import React, { useState, useEffect } from 'react';
import { Select, Spin, message } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { fiberApi } from '../services/api';
import type { FiberComparison, FiberDetail } from '../services/api';

const { Option } = Select;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const PROPERTIES = [
  { value: 'density_g_cm3', label: 'Density (g/cm³)', unit: 'g/cm³', type: 'single' },
  { value: 'fineness', label: 'Fineness (μm)', unit: 'μm', type: 'range' }, // avg of min/max
  { value: 'staple_length', label: 'Staple Length (mm)', unit: 'mm', type: 'range' }, // avg of min/max
  { value: 'tenacity', label: 'Tenacity (CN/Tex)', unit: 'CN/Tex', type: 'range' }, // avg of min/max
  { value: 'elongation', label: 'Elongation (%)', unit: '%', type: 'range' }, // avg of min/max
  { value: 'moisture_regain_percent', label: 'Moisture Regain (%)', unit: '%', type: 'single' },
  { value: 'elastic_modulus', label: 'Elastic Modulus (GPa)', unit: 'GPa', type: 'range' }, // avg of min/max
];

// Helper function to get property value from fiber data
const getPropertyValue = (fiber: FiberComparison, propertyKey: string): number | null => {
  switch (propertyKey) {
    case 'density_g_cm3':
      return fiber.density_g_cm3;
    case 'fineness':
      if (fiber.fineness_min_um && fiber.fineness_max_um) {
        return (fiber.fineness_min_um + fiber.fineness_max_um) / 2;
      }
      return null;
    case 'staple_length':
      if (fiber.staple_length_min_mm && fiber.staple_length_max_mm) {
        return (fiber.staple_length_min_mm + fiber.staple_length_max_mm) / 2;
      }
      return null;
    case 'tenacity':
      if (fiber.tenacity_min_cn_tex && fiber.tenacity_max_cn_tex) {
        return (fiber.tenacity_min_cn_tex + fiber.tenacity_max_cn_tex) / 2;
      }
      return null;
    case 'elongation':
      if (fiber.elongation_min_percent && fiber.elongation_max_percent) {
        return (fiber.elongation_min_percent + fiber.elongation_max_percent) / 2;
      }
      return null;
    case 'moisture_regain_percent':
      return fiber.moisture_regain_percent;
    case 'elastic_modulus':
      if (fiber.elastic_modulus_min_gpa && fiber.elastic_modulus_max_gpa) {
        return (fiber.elastic_modulus_min_gpa + fiber.elastic_modulus_max_gpa) / 2;
      }
      return null;
    default:
      return null;
  }
};

const CompareTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chart-comparison');
  const [selectedProperty, setSelectedProperty] = useState<string>('density_g_cm3');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [selectedFiberClasses, setSelectedFiberClasses] = useState<string[]>([]);
  const [data, setData] = useState<FiberComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fiber pair comparison state
  const [fiber1Id, setFiber1Id] = useState<number | null>(null);
  const [fiber2Id, setFiber2Id] = useState<number | null>(null);
  const [fiber1Details, setFiber1Details] = useState<FiberDetail | null>(null);
  const [fiber2Details, setFiber2Details] = useState<FiberDetail | null>(null);
  const [loadingFiber1, setLoadingFiber1] = useState<boolean>(false);
  const [loadingFiber2, setLoadingFiber2] = useState<boolean>(false);

  // Fetch fiber data from API
  useEffect(() => {
    const fetchFiberData = async () => {
      try {
        setLoading(true);
        const fibers = await fiberApi.getFibersForComparison({ limit: 100 });
        setData(fibers);
      } catch (error) {
        console.error('Error fetching fiber data:', error);
        message.error('Failed to load fiber data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiberData();
  }, []);

  // Fetch full fiber details when fiber1Id changes
  useEffect(() => {
    if (fiber1Id) {
      const fetchFiber = async () => {
        try {
          setLoadingFiber1(true);
          const details = await fiberApi.getFiber(fiber1Id);
          setFiber1Details(details);
        } catch (error) {
          console.error('Error fetching fiber 1 details:', error);
          message.error('Failed to load fiber details');
        } finally {
          setLoadingFiber1(false);
        }
      };
      fetchFiber();
    } else {
      setFiber1Details(null);
    }
  }, [fiber1Id]);

  // Fetch full fiber details when fiber2Id changes
  useEffect(() => {
    if (fiber2Id) {
      const fetchFiber = async () => {
        try {
          setLoadingFiber2(true);
          const details = await fiberApi.getFiber(fiber2Id);
          setFiber2Details(details);
        } catch (error) {
          console.error('Error fetching fiber 2 details:', error);
          message.error('Failed to load fiber details');
        } finally {
          setLoadingFiber2(false);
        }
      };
      fetchFiber();
    } else {
      setFiber2Details(null);
    }
  }, [fiber2Id]);

  const currentProperty = PROPERTIES.find(p => p.value === selectedProperty);

  // Get unique fiber classes for the filter
  const fiberClasses = Array.from(
    new Map(
      data
        .filter(fiber => fiber.fiber_class)
        .map(fiber => [fiber.fiber_class!.name, fiber.fiber_class!])
    ).values()
  );

  // Filter fibers by selected classes and property data availability
  const validData = data.filter(fiber => {
    // If no fiber classes selected, show all fibers
    const classMatches = selectedFiberClasses.length === 0 ||
      (fiber.fiber_class && selectedFiberClasses.includes(fiber.fiber_class.name));

    // Also must have data for the selected property
    const hasPropertyData = getPropertyValue(fiber, selectedProperty) !== null;

    return classMatches && hasPropertyData;
  });

  // Prepare data for Chart.js
  const xAxisData = validData.map(d => d.fiber_id);
  const yAxisData = validData.map(d => getPropertyValue(d, selectedProperty) as number);

  // Find min/max fiber names
  const maxValue = yAxisData.length > 0 ? Math.max(...yAxisData) : 0;
  const minValue = yAxisData.length > 0 ? Math.min(...yAxisData) : 0;
  const maxFiber = validData[yAxisData.indexOf(maxValue)];
  const minFiber = validData[yAxisData.indexOf(minValue)];

  // Calculate Y-axis domain for consistent scaling (linear scale from 0)
  const yMax = yAxisData.length > 0 ? Math.max(...yAxisData) : 100;
  const yPadding = yMax * 0.1;
  const yDomainMax = Math.ceil(yMax + yPadding);

  // Calculate the minimum required width for the chart content
  const MIN_CHART_WIDTH = Math.max(validData.length * 40, 600); // 600px is a safety minimum

  const chartData = {
    labels: xAxisData,
    datasets: [
      {
        label: currentProperty?.label,
        data: yAxisData,
        backgroundColor: chartType === 'bar' ? '#65a0ffff' : 'rgba(59, 130, 246, 0.2)',
        borderColor: chartType === 'bar' ? '#3b82f6' : '#3b82f6',
        borderWidth: chartType === 'bar' ? 0 : 2,
        tension: 0.4,
        pointBackgroundColor: '#0a68ffff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: chartType === 'line' ? 6 : 0,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#3b82f6',
        borderColor: '#111827',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ${currentProperty?.unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
          color: '#4b5563',
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: yDomainMax,
        ticks: {
          font: {
            size: 12,
          },
          color: '#4b5563',
        },
        grid: {
          color: '#e5e7eb',
        },
      },
    },
  };

  // Helper function to format all fiber properties for table display
  const formatPropertyValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  // Get all property keys from FiberDetail - using pairs for min/max properties
  const allFiberProperties = [
    { key: 'fiber_id', label: 'Fiber ID', category: 'Basic Info' },
    { key: 'name', label: 'Name', category: 'Basic Info' },
    { key: 'density_g_cm3', label: 'Density (g/cm³)', category: 'Physical Properties' },
    {
      key: 'fineness',
      label: 'Fineness (μm)',
      category: 'Physical Properties',
      minKey: 'fineness_min_um',
      maxKey: 'fineness_max_um'
    },
    {
      key: 'staple_length',
      label: 'Staple Length (mm)',
      category: 'Physical Properties',
      minKey: 'staple_length_min_mm',
      maxKey: 'staple_length_max_mm'
    },
    {
      key: 'tenacity',
      label: 'Tenacity (CN/Tex)',
      category: 'Physical Properties',
      minKey: 'tenacity_min_cn_tex',
      maxKey: 'tenacity_max_cn_tex'
    },
    {
      key: 'elongation',
      label: 'Elongation (%)',
      category: 'Physical Properties',
      minKey: 'elongation_min_percent',
      maxKey: 'elongation_max_percent'
    },
    { key: 'moisture_regain_percent', label: 'Moisture Regain (%)', category: 'Physical Properties' },
    { key: 'absorption_capacity_percent', label: 'Absorption Capacity (%)', category: 'Physical Properties' },
    {
      key: 'elastic_modulus',
      label: 'Elastic Modulus (GPa)',
      category: 'Mechanical Properties',
      minKey: 'elastic_modulus_min_gpa',
      maxKey: 'elastic_modulus_max_gpa'
    },
    { key: 'polymer_composition', label: 'Polymer Composition', category: 'Chemical Properties' },
    { key: 'degree_of_polymerization', label: 'Degree of Polymerization', category: 'Chemical Properties' },
    { key: 'acid_resistance', label: 'Acid Resistance', category: 'Chemical Properties' },
    { key: 'alkali_resistance', label: 'Alkali Resistance', category: 'Chemical Properties' },
    { key: 'microbial_resistance', label: 'Microbial Resistance', category: 'Chemical Properties' },
    { key: 'glass_transition_temp_c', label: 'Glass Transition Temp (°C)', category: 'Thermal Properties' },
    { key: 'melting_point_c', label: 'Melting Point (°C)', category: 'Thermal Properties' },
    { key: 'decomposition_temp_c', label: 'Decomposition Temp (°C)', category: 'Thermal Properties' },
    { key: 'repeating_unit', label: 'Repeating Unit', category: 'Structure' },
    { key: 'molecular_structure_smiles', label: 'Molecular Structure (SMILES)', category: 'Structure' },
    { key: 'biodegradability', label: 'Biodegradability', category: 'Sustainability' },
    { key: 'sustainability_notes', label: 'Sustainability Notes', category: 'Sustainability' },
    { key: 'environmental_impact_score', label: 'Environmental Impact Score', category: 'Sustainability' },
  ];

  // Helper function to get property value from fiber (handles min/max ranges)
  const getPropertyValue2 = (fiber: FiberDetail | null, prop: any): string => {
    if (!fiber) return 'N/A';

    // If it's a range property (has minKey and maxKey)
    if (prop.minKey && prop.maxKey) {
      const min = (fiber as any)[prop.minKey];
      const max = (fiber as any)[prop.maxKey];

      if (min !== null && min !== undefined && max !== null && max !== undefined) {
        return `${(min as number).toFixed(2)}-${(max as number).toFixed(2)}`;
      }
      return 'N/A';
    }

    // Otherwise get single value
    const value = (fiber as any)[prop.key];
    return formatPropertyValue(value);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('chart-comparison')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'chart-comparison'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Chart Comparison
          </button>
          <button
            onClick={() => setActiveTab('pair-comparison')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'pair-comparison'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pair Comparison
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" tip="Loading fiber data..." />
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">No Fiber Data Available</div>
              <div className="text-sm text-gray-500">
                No fibers are currently available for comparison. Please ensure fibers have been added to the database.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: CHART COMPARISON */}
              {activeTab === 'chart-comparison' && (
                <>
                  <div className="mb-2">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Chart Comparison</h2>
                  </div>

                  {/* Controls */}
                  <div className="mb-2 bg-white py-3 p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Fiber Class Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filter by Fiber Class
                        </label>
                        <Select
                          mode="multiple"
                          placeholder="All Classes"
                          value={selectedFiberClasses}
                          onChange={setSelectedFiberClasses}
                          className="w-full"
                          size="large"
                          maxTagCount="responsive"
                        >
                          {fiberClasses.map(fiberClass => (
                            <Option key={fiberClass.id} value={fiberClass.name}>
                              {fiberClass.name}
                            </Option>
                          ))}
                        </Select>
                      </div>

                      {/* Property Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Property to Compare
                        </label>
                        <Select
                          value={selectedProperty}
                          onChange={setSelectedProperty}
                          className="w-full"
                          size="large"
                        >
                          {PROPERTIES.map(property => (
                            <Option key={property.value} value={property.value}>
                              {property.label}
                            </Option>
                          ))}
                        </Select>
                      </div>

                      {/* Chart Type Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chart Type
                        </label>
                        <Select
                          value={chartType}
                          onChange={setChartType}
                          className="w-full"
                          size="large"
                        >
                          <Option value="bar">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <rect x="2" y="10" width="3" height="8" />
                                <rect x="7" y="6" width="3" height="12" />
                                <rect x="12" y="2" width="3" height="16" />
                              </svg>
                              Bar Chart
                            </div>
                          </Option>
                          <Option value="line">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 18L7 10L12 14L18 4" />
                              </svg>
                              Line Chart
                            </div>
                          </Option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Statistics Container */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex gap-6">
                      {/* Chart Section - Left 2/3 */}
                      <div className="flex-1" style={{ width: '66.666%' }}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {currentProperty?.label} Comparison
                        </h3>

                        {/* Chart Wrapper: Handles the Horizontal Scroll */}
                        <div className="overflow-x-auto" style={{ width: '100%' }}>
                          {/* Chart Canvas: Forced to be wide enough to scroll */}
                          <div style={{ minWidth: `${MIN_CHART_WIDTH}px`, height: '400px' }}>
                            {chartType === 'bar' ? (
                              <Bar data={chartData} options={chartOptions} />
                            ) : (
                              <Line data={chartData} options={chartOptions} />
                            )}
                          </div>
                        </div>

                        {/* Axis labels */}
                        <div className="mt-6 flex justify-center gap-8 text-sm font-medium text-gray-700 pb-2">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">X-Axis</div>
                            <div>Fiber Type</div>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Y-Axis</div>
                            <div>{currentProperty?.label}</div>
                          </div>
                        </div>
                      </div>

                      {/* Statistics Section - Right 1/3 */}
                      <div className="border-l border-gray-200 pl-6" style={{ width: '33.333%' }}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Statistics
                        </h3>

                        {/* Statistics Summary */}
                        <div className="space-y-2 mb-6">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-0.5">Maximum</div>
                            <div className="text-lg font-bold text-blue-600">
                              {maxValue.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                            <div className="text-xs text-blue-400 mt-1">
                              Fiber: {maxFiber?.name || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-0.5">Minimum</div>
                            <div className="text-lg font-bold text-green-600">
                              {minValue.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                            <div className="text-xs text-green-400 mt-1">
                              Fiber: {minFiber?.name || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-0.5">Average</div>
                            <div className="text-lg font-bold text-purple-600">
                              {yAxisData.length > 0
                                ? (yAxisData.reduce((a, b) => a + b, 0) / yAxisData.length).toFixed(2)
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: PAIR COMPARISON */}
              {activeTab === 'pair-comparison' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Compare Two Fibers</h2>

                  {/* Fiber Selection Controls */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fiber 1 Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select First Fiber
                      </label>
                      <Select
                        placeholder="Search and choose a fiber..."
                        value={fiber1Id}
                        onChange={setFiber1Id}
                        className="w-full"
                        size="large"
                        allowClear
                        showSearch
                        filterOption={(input, option) => {
                          const label = option?.children?.toString() || '';
                          return label.toLowerCase().includes(input.toLowerCase());
                        }}
                      >
                        {data.map(fiber => (
                          <Option key={fiber.id} value={fiber.id}>
                            {fiber.name} {fiber.fiber_class ? `(${fiber.fiber_class.name})` : ''}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    {/* Fiber 2 Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Second Fiber
                      </label>
                      <Select
                        placeholder="Search and choose a fiber..."
                        value={fiber2Id}
                        onChange={setFiber2Id}
                        className="w-full"
                        size="large"
                        allowClear
                        showSearch
                        filterOption={(input, option) => {
                          const label = option?.children?.toString() || '';
                          return label.toLowerCase().includes(input.toLowerCase());
                        }}
                      >
                        {data.map(fiber => (
                          <Option key={fiber.id} value={fiber.id}>
                            {fiber.name} {fiber.fiber_class ? `(${fiber.fiber_class.name})` : ''}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  {fiber1Details && fiber2Details ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 border-r border-gray-300 w-1/3">
                              Property
                            </th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 border-r border-gray-300 w-1/3">
                              {fiber1Details.name} {fiber1Details.fiber_class ? `(${fiber1Details.fiber_class.name})` : ''}
                            </th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-1/3">
                              {fiber2Details.name} {fiber2Details.fiber_class ? `(${fiber2Details.fiber_class.name})` : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allFiberProperties.map((prop, idx) => {
                            const formattedVal1 = getPropertyValue2(fiber1Details, prop);
                            const formattedVal2 = getPropertyValue2(fiber2Details, prop);

                            return (
                              <tr
                                key={prop.key}
                                className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                              >
                                <td className="px-4 py-3 font-medium text-gray-800 border-r border-gray-200">
                                  <div className="text-xs text-gray-500 mb-1">{prop.category}</div>
                                  {prop.label}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200">
                                  {formattedVal1}
                                </td>
                                <td className="px-4 py-3">
                                  {formattedVal2}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      {loadingFiber1 || loadingFiber2 ? (
                        <Spin tip="Loading fiber details..." />
                      ) : (
                        <div className="text-lg">Select two fibers to compare all their properties</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default CompareTab;
