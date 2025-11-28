import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Spin,
  Empty,
  Modal,
  Form,
  Switch,
  message,
  Typography,
  Descriptions,
  Badge,
  Row,
  Col,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface KnowledgeBaseDocument {
  id: number;
  title: string;
  content: string;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const KnowledgeBaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<KnowledgeBaseDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<KnowledgeBaseDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [form] = Form.useForm();

  console.log('[KB Management] Component rendered', { documentsCount: documents.length, loading, user });

  const fetchDocuments = async () => {
    console.log('[KB Management] Fetching documents...');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (publishedFilter) params.append('is_published', publishedFilter);

      const url = `/admin/knowledge-base?${params}`;
      console.log('[KB Management] Requesting:', url);

      const response = await api.get(url);
      console.log('[KB Management] Response:', response.data);

      setDocuments(response.data);
    } catch (error: any) {
      console.error('[KB Management] Error fetching documents:', error);
      console.error('[KB Management] Error details:', error.response?.data);

      if (error.response?.status === 401) {
        message.error('Authentication error. Please log in again.');
      } else if (error.response?.status === 403) {
        message.error('Access denied. Admin privileges required.');
      } else {
        message.error('Failed to fetch documents. Check console for details.');
      }
    } finally {
      setLoading(false);
      console.log('[KB Management] Loading complete');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, categoryFilter, publishedFilter]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        content: values.content,
        category: values.category || null,
        subcategory: values.subcategory || null,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        is_published: values.is_published || false
      };

      if (editingDocument) {
        await api.put(`/admin/knowledge-base/${editingDocument.id}`, payload);
        message.success('Document updated successfully!');
      } else {
        await api.post('/admin/knowledge-base', payload);
        message.success('Document created successfully! Embeddings are being generated...');
      }

      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error saving document:', error);
      message.error(error.response?.data?.detail || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (doc: KnowledgeBaseDocument) => {
    setViewingDocument(doc);
    setShowViewer(true);
  };

  const handleEdit = (doc: KnowledgeBaseDocument) => {
    setEditingDocument(doc);
    form.setFieldsValue({
      title: doc.title,
      content: doc.content,
      category: doc.category || '',
      subcategory: doc.subcategory || '',
      tags: doc.tags.join(', '),
      is_published: doc.is_published
    });
    setShowEditor(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Document',
      content: 'Are you sure you want to delete this document? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          await api.delete(`/admin/knowledge-base/${id}`);
          message.success('Document deleted successfully!');
          fetchDocuments();
        } catch (error) {
          console.error('Error deleting document:', error);
          message.error('Failed to delete document');
        }
      }
    });
  };

  const togglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await api.post(`/admin/knowledge-base/${id}/publish?publish=${!currentStatus}`);
      message.success(`Document ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      fetchDocuments();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      message.error('Failed to update publish status');
    }
  };

  const resetForm = () => {
    form.resetFields();
    setEditingDocument(null);
    setShowEditor(false);
  };

  return (
    <div className="w-full h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Title level={2}>Knowledge Base Management</Title>
          <Paragraph type="secondary">
            Create and manage AI-powered knowledge articles with automatic embedding generation
          </Paragraph>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="All Documents"
                value={publishedFilter}
                onChange={setPublishedFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">All Documents</Option>
                <Option value="true">Published Only</Option>
                <Option value="false">Drafts Only</Option>
              </Select>
            </Col>
          </Row>
          <Divider />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowEditor(true)}
            size="large"
          >
            New Document
          </Button>
        </Card>

        {/* Document List */}
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" tip="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          <Empty description="No documents found" />
        ) : (
          <Row gutter={[16, 16]}>
            {documents.map((doc) => (
              <Col xs={24} key={doc.id}>
                <Card
                  hoverable
                  extra={
                    <Badge
                      status={doc.is_published ? 'success' : 'warning'}
                      text={doc.is_published ? 'Published' : 'Draft'}
                    />
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Title level={4}>{doc.title}</Title>

                      {doc.category && (
                        <Text type="secondary">
                          Category: <Text strong>{doc.category}</Text>
                          {doc.subcategory && ` > ${doc.subcategory}`}
                        </Text>
                      )}

                      {doc.content && (
                        <Paragraph ellipsis={{ rows: 2 }} className="mt-2">
                          {doc.content}
                        </Paragraph>
                      )}

                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-2">
                          {doc.tags.map((tag, idx) => (
                            <Tag key={idx} color="blue">{tag}</Tag>
                          ))}
                        </div>
                      )}

                      <Text type="secondary" className="text-xs mt-2 block">
                        Last updated: {new Date(doc.updated_at).toLocaleString()}
                      </Text>
                    </div>

                    <Space direction="vertical" size="small" className="ml-4">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleView(doc)}
                        block
                      >
                        View
                      </Button>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(doc)}
                        block
                      >
                        Edit
                      </Button>
                      <Button
                        icon={doc.is_published ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                        onClick={() => togglePublish(doc.id, doc.is_published)}
                        type={doc.is_published ? 'default' : 'primary'}
                        block
                      >
                        {doc.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(doc.id)}
                        block
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* View Modal */}
        <Modal
          title={viewingDocument?.title}
          open={showViewer}
          onCancel={() => {
            setShowViewer(false);
            setViewingDocument(null);
          }}
          footer={[
            <Button key="close" onClick={() => setShowViewer(false)}>
              Close
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setShowViewer(false);
                if (viewingDocument) handleEdit(viewingDocument);
              }}
            >
              Edit
            </Button>
          ]}
          width={800}
          centered
          styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
          {viewingDocument && (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Status">
                  <Badge
                    status={viewingDocument.is_published ? 'success' : 'warning'}
                    text={viewingDocument.is_published ? 'Published' : 'Draft'}
                  />
                </Descriptions.Item>
                {viewingDocument.category && (
                  <Descriptions.Item label="Category">
                    {viewingDocument.category}
                    {viewingDocument.subcategory && ` > ${viewingDocument.subcategory}`}
                  </Descriptions.Item>
                )}
                {viewingDocument.tags && viewingDocument.tags.length > 0 && (
                  <Descriptions.Item label="Tags">
                    {viewingDocument.tags.map((tag, idx) => (
                      <Tag key={idx} color="blue">{tag}</Tag>
                    ))}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Created">
                  {new Date(viewingDocument.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {new Date(viewingDocument.updated_at).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              <Divider>Content</Divider>

              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {viewingDocument.content}
                </Paragraph>
              </div>
            </>
          )}
        </Modal>

        {/* Editor Modal */}
        <Modal
          title={editingDocument ? 'Edit Document' : 'New Document'}
          open={showEditor}
          onCancel={resetForm}
          footer={[
            <Button
              key="cancel"
              icon={<CloseOutlined />}
              onClick={resetForm}
              size="large"
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              onClick={() => form.submit()}
            >
              {editingDocument ? 'Update Document' : 'Create Document'}
            </Button>
          ]}
          width={900}
          centered
          styles={{ body: { maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' } }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Enter document title" size="large" />
            </Form.Item>

            <Form.Item
              label="Content"
              name="content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea
                rows={12}
                placeholder="Enter document content (supports markdown)"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Category" name="category">
                  <Input placeholder="e.g., Sustainability" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Subcategory" name="subcategory">
                  <Input placeholder="e.g., Environmental Impact" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Tags (comma-separated)"
              name="tags"
            >
              <Input placeholder="e.g., cotton, sustainability, environmental" />
            </Form.Item>

            <Form.Item
              label="Publish immediately"
              name="is_published"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default KnowledgeBaseManagement;
