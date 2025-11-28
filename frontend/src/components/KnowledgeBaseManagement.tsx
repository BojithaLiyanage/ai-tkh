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
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [form] = Form.useForm();


  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (publishedFilter) params.append('is_published', publishedFilter);

      const url = `/admin/knowledge-base?${params}`;

      const response = await api.get(url);

      setDocuments(response.data);
    } catch (error: any) {
      console.error('[KB Management] Error fetching documents:', error);

      if (error.response?.status === 401) {
        message.error('Authentication error. Please log in again.');
      } else if (error.response?.status === 403) {
        message.error('Access denied. Admin privileges required.');
      } else {
        message.error('Failed to fetch documents. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, publishedFilter]);

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
    setDocumentToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/admin/knowledge-base/${documentToDelete}`);
      message.success('Document deleted successfully!');
      setDeleteModalVisible(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error: any) {
      console.error('[KB Management] Error deleting document:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setDocumentToDelete(null);
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
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Fixed Top Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-7xl mx-auto p-6">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                size="large"
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="All Documents"
                value={publishedFilter}
                onChange={setPublishedFilter}
                style={{ width: '100%' }}
                allowClear
                size="large"
              >
                <Option value="">All Documents</Option>
                <Option value="true">Published Only</Option>
                <Option value="false">Drafts Only</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowEditor(true)}
                size="large"
              >
                New Document
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
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
                <Col xs={24} sm={12} lg={8} key={doc.id}>
                  <Card
                    hoverable
                    className="h-full shadow-md"
                    styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                  >
                    {/* Status Badge */}
                    <div className="mb-3">
                      <Badge
                        status={doc.is_published ? 'success' : 'warning'}
                        text={doc.is_published ? 'Published' : 'Draft'}
                      />
                    </div>

                    {/* Title */}
                    <Title level={4} style={{ marginTop: 0, marginBottom: '12px' }}>
                      {doc.title}
                    </Title>

                    {/* Category */}
                    {doc.category && (
                      <Text type="secondary" className="block mb-2">
                        <Text strong>{doc.category}</Text>
                        {doc.subcategory && ` > ${doc.subcategory}`}
                      </Text>
                    )}

                    {/* Content Preview */}
                    {doc.content && (
                      <Paragraph ellipsis={{ rows: 3 }} className="mb-3" style={{ flexGrow: 1 }}>
                        {doc.content}
                      </Paragraph>
                    )}

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mb-3">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <Tag key={idx} color="blue">{tag}</Tag>
                        ))}
                        {doc.tags.length > 3 && (
                          <Tag color="default">+{doc.tags.length - 3} more</Tag>
                        )}
                      </div>
                    )}

                    {/* Last Updated */}
                    <Text type="secondary" className="text-xs block mb-4">
                      Updated: {new Date(doc.updated_at).toLocaleDateString()}
                    </Text>

                    {/* Action Buttons */}
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space.Compact style={{ width: '100%' }}>
                        <Button
                          icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(doc);
                          }}
                          size="small"
                          style={{ flex: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(doc);
                          }}
                          size="small"
                          style={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                      </Space.Compact>
                      <Space.Compact style={{ width: '100%' }}>
                        <Button
                          icon={doc.is_published ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublish(doc.id, doc.is_published);
                          }}
                          type={doc.is_published ? 'default' : 'primary'}
                          size="small"
                          style={{ flex: 1 }}
                        >
                          {doc.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          size="small"
                          style={{ flex: 1 }}
                        >
                          Delete
                        </Button>
                      </Space.Compact>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>

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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Document"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: loading }}
        centered
      >
        <p>Are you sure you want to delete this document? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default KnowledgeBaseManagement;
