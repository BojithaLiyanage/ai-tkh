import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Space,
  message,
  Spin,
  Empty,
  Pagination,
  Select,
  Popconfirm,
  Tabs,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { SpecialFiberForm } from './SpecialFiberForm';
import { SpecialFiberCard } from './SpecialFiberCard';
import { SpecialFiberDetailsModal } from './SpecialFiberDetailsModal';
import { fiberApi } from '../services/api';

interface SpecialFiber {
  id: number;
  fiber_id: number;
  special_fiber_type: string;
  description?: string;
  source_file?: string;
  raw_sheet_name?: string;
  properties: any[];
  created_at: string;
  updated_at: string;
}

interface Fiber {
  id: number;
  fiber_id: string;
  name: string;
}

export const SpecialFibersManagement: React.FC = () => {
  const [specialFibers, setSpecialFibers] = useState<SpecialFiber[]>([]);
  const [fibers, setFibers] = useState<Fiber[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecialFiber | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<SpecialFiber | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Data
  const [fiberTypes, setFiberTypes] = useState<string[]>([]);

  useEffect(() => {
    loadFibers();
    loadSpecialFibers();
  }, []);

  useEffect(() => {
    loadSpecialFibers();
  }, [currentPage, pageSize, selectedType]);

  const loadFibers = async () => {
    try {
      const response = await fiberApi.getFibers();
      setFibers(response);
    } catch (error) {
      console.error('Failed to load fibers:', error);
    }
  };

  const loadSpecialFibers = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const response = await fiberApi.getSpecialFibers(
        skip,
        pageSize,
        selectedType
      );

      setSpecialFibers(response.special_fibers);
      setTotalCount(response.total_count);

      // Extract unique fiber types for filter
      const types = Array.from(
        new Set(response.special_fibers.map((f) => f.special_fiber_type))
      );
      setFiberTypes(types);
    } catch (error: any) {
      message.error('Failed to load special fibers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (fiber: SpecialFiber) => {
    setEditingItem(fiber);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (fiberId: number) => {
    try {
      await fiberApi.deleteSpecialFiber(fiberId);
      message.success('Special fiber deleted successfully');
      loadSpecialFibers();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete special fiber');
    }
  };

  const handleViewDetails = (fiber: SpecialFiber) => {
    setSelectedForDetails(fiber);
    setDetailsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingItem) {
        await fiberApi.updateSpecialFiber(editingItem.id, data);
      } else {
        await fiberApi.createSpecialFiber(data);
      }
      loadSpecialFibers();
      setIsFormOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const data = specialFibers.map((fiber) => ({
        'Fiber Type': fiber.special_fiber_type,
        'Fiber ID': fiber.fiber_id,
        'Properties': fiber.properties.length,
        'Created': new Date(fiber.created_at).toLocaleDateString(),
        'Description': fiber.description || '-',
      }));

      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map((row) =>
          Object.values(row)
            .map((v) => `"${v}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `special-fibers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('Exported successfully');
    } catch (error) {
      message.error('Export failed');
    }
  };

  // Filter fibers by search term
  const filteredFibers = specialFibers.filter((fiber) => {
    const matchesSearch =
      fiber.special_fiber_type
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      fiber.fiber_id.toString().includes(searchTerm) ||
      fiber.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const fiberNameMap = new Map(
    fibers.map((f) => [f.id, f.name])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Special Fibers Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage advanced fiber materials with dynamic properties
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadSpecialFibers}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
          >
            Add Special Fiber
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by type, fiber ID, or description..."
              allowClear
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by type"
              allowClear
              value={selectedType || undefined}
              onChange={setSelectedType}
              options={[
                { label: 'All Types', value: null },
                ...fiberTypes.map((type) => ({
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                  value: type,
                })),
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={filteredFibers.length === 0}
              block
            >
              Export CSV
            </Button>
          </Col>
        </Row>
        <div className="mt-3 text-sm text-gray-600">
          Showing <strong>{filteredFibers.length}</strong> of{' '}
          <strong>{totalCount}</strong> special fibers
        </div>
      </div>

      {/* Content */}
      <Spin spinning={loading}>
        {filteredFibers.length > 0 ? (
          <div className="space-y-6">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredFibers.map((fiber) => (
                <SpecialFiberCard
                  key={fiber.id}
                  fiber={fiber}
                  fiberName={fiberNameMap.get(fiber.fiber_id)}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="flex justify-center mt-8">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={setCurrentPage}
                  onShowSizeChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  showTotal={(total) => `Total ${total} items`}
                />
              </div>
            )}
          </div>
        ) : (
          <Empty
            description={
              searchTerm || selectedType
                ? 'No special fibers match your filters'
                : 'No special fibers yet. Create one to get started!'
            }
            style={{ marginTop: '60px', marginBottom: '60px' }}
          >
            {!searchTerm && !selectedType && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateClick}
              >
                Create Special Fiber
              </Button>
            )}
          </Empty>
        )}
      </Spin>

      {/* Modals */}
      <SpecialFiberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingItem={editingItem}
        fibers={fibers}
        loading={loading}
      />

      <SpecialFiberDetailsModal
        fiber={selectedForDetails}
        fiberName={selectedForDetails ? fiberNameMap.get(selectedForDetails.fiber_id) : undefined}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </div>
  );
};

export default SpecialFibersManagement;
