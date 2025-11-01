import React, { useState } from 'react';
import { Select } from 'antd';
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

// Generate dummy data for 40 fibers with 3 properties
const generateDummyData = () => {
  const fiberNames = [
    'Cotton', 'Polyester', 'Nylon', 'Silk', 'Wool',
    'Rayon', 'Acrylic', 'Spandex', 'Linen', 'Hemp',
    'Bamboo', 'Modal', 'Lyocell', 'Acetate', 'Viscose',
    'Aramid', 'Kevlar', 'Carbon', 'Fiberglass', 'Nomex',
    'Tencel', 'PLA', 'Soybean', 'Cashmere', 'Alpaca',
    'Mohair', 'Angora', 'Ramie', 'Jute', 'Sisal',
    'Flax', 'Kapok', 'Coir', 'Abaca', 'Kenaf',
    'Henequen', 'SeaCell', 'Ingeo', 'Polypropylene', 'PTFE',
  ];

  return fiberNames.map((name) => ({
    name,
    tensileStrength: Math.round(200 + Math.random() * 800), // MPa (200-1000)
    elongation: Math.round(5 + Math.random() * 45), // % (5-50)
    density: Number((0.8 + Math.random() * 0.9).toFixed(2)) // g/cm³ (0.8-1.7)
  }));
};

const PROPERTIES = [
  { value: 'tensileStrength', label: 'Tensile Strength (MPa)', unit: 'MPa' },
  { value: 'elongation', label: 'Elongation (%)', unit: '%' },
  { value: 'density', label: 'Density (g/cm³)', unit: 'g/cm³' }
];

// Define the structure for a fiber data point
interface FiberData {
    name: string;
    tensileStrength: number;
    elongation: number;
    density: number;
}

const CompareTab: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>('tensileStrength');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [data] = useState<FiberData[]>(generateDummyData());

  const currentProperty = PROPERTIES.find(p => p.value === selectedProperty);

  // Prepare data for Chart.js
  const xAxisData = data.map(d => d.name);
  // Type assertion is needed here since d[selectedProperty] is dynamically accessed
  const yAxisData = data.map(d => d[selectedProperty as keyof FiberData] as number);

  // Find min/max fiber names (though not used in the final render, good for reference)
  const maxValue = Math.max(...yAxisData);
  const minValue = Math.min(...yAxisData);
  const maxFiber = data[yAxisData.indexOf(maxValue)];
  const minFiber = data[yAxisData.indexOf(minValue)];

  // Calculate Y-axis domain for consistent scaling (linear scale from 0)
  const yMax = Math.max(...yAxisData);
  const yPadding = yMax * 0.1;
  const yDomainMax = Math.ceil(yMax + yPadding);

  // ** FIX IMPLEMENTATION: Calculate the minimum required width for the chart content **
  // We use 40px per bar/point as a minimum to ensure labels don't overlap too much.
  const MIN_CHART_WIDTH = Math.max(data.length * 40, 600); // 600px is a safety minimum
  
  const chartData = {
    labels: xAxisData,
    datasets: [
      {
        label: currentProperty?.label,
        data: yAxisData,
        backgroundColor: chartType === 'bar' ? '#65a0ffff' : 'rgba(59, 130, 246, 0.2)',
        borderColor: chartType === 'bar' ? '#3b82f6' : '#3b82f6',
        borderWidth:  chartType === 'bar'? 0 : 2,
        tension: 0.4,
        pointBackgroundColor: '#0a68ffff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: chartType === 'line' ? 6 : 0,
      },
    ],
  };

  const chartOptions: any = { // Use 'any' or define Chart.js options type
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
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} ${currentProperty?.unit}`;
          }
        }
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

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Compare Fiber Properties</h2>
        </div>

        {/* Controls */}
        <div className="mb-2 bg-white py-3 p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="text-xs text-blue-400 mt-1">Fiber: **{maxFiber.name}**</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-0.5">Minimum</div>
                  <div className="text-lg font-bold text-green-600">
                    {minValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                  <div className="text-xs text-green-400 mt-1">Fiber: **{minFiber.name}**</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-0.5">Average</div>
                  <div className="text-lg font-bold text-purple-600">
                    {(yAxisData.reduce((a, b) => a + b, 0) / yAxisData.length).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-0.5">Range</div>
                  <div className="text-lg font-bold text-orange-600">
                    {(maxValue - minValue).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{currentProperty?.unit}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareTab;