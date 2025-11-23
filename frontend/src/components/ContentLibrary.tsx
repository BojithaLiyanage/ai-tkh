import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { contentApi } from '../services/api';
import {
  Collapse,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Alert,
  Modal,
  Checkbox,
  Spin,
  Space,
  Typography,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { TextArea } = Input;
const { Text } = Typography;

interface ContentLibraryProps {
  onClose?: () => void; // eslint-disable-line @typescript-eslint/no-unused-vars
}

interface Module {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  slug?: string;
}

interface Topic {
  id: number;
  module_id: number;
  name: string;
  description?: string;
  order_index: number;
  slug?: string;
}

interface Subtopic {
  id: number;
  topic_id: number;
  name: string;
  definition?: string;
  notes?: string;
  difficulty_level: 'intro' | 'basic' | 'intermediate' | 'advanced';
  order_index: number;
  slug?: string;
}

interface StudyGroup {
  code: string;
  name: string;
  description?: string;
}

const ContentLibrary: React.FC<ContentLibraryProps> = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [topics, setTopics] = useState<Record<number, Topic[]>>({});
  const [subtopics, setSubtopics] = useState<Record<number, Subtopic[]>>({});
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form instances
  const [moduleFormInstance] = Form.useForm();
  const [topicFormInstance] = Form.useForm();
  const [subtopicFormInstance] = Form.useForm();

  // Form states
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState<number | null>(null);
  const [showSubtopicForm, setShowSubtopicForm] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);

  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    order_index: 0
  });

  const [topicForm, setTopicForm] = useState({
    name: '',
    description: '',
    order_index: 0
  });

  const [subtopicForm, setSubtopicForm] = useState({
    name: '',
    definition: '',
    notes: '',
    difficulty_level: 'basic' as 'intro' | 'basic' | 'intermediate' | 'advanced',
    order_index: 0
  });

  const [selectedStudyGroups, setSelectedStudyGroups] = useState<string[]>([]);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    type: 'module' | 'topic' | 'subtopic' | null;
    item: Module | Topic | Subtopic | null;
    message: string;
  }>({
    visible: false,
    type: null,
    item: null,
    message: '',
  });

  const isAdmin = user?.user_type === 'admin';
  const isSuperAdmin = user?.user_type === 'super_admin';
  const canEdit = isAdmin || isSuperAdmin;

  useEffect(() => {
    // User loaded, can now determine permissions
  }, [user, canEdit]);

  useEffect(() => {
    fetchAllContent();
    fetchStudyGroups();
  }, []);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      // Optimized: Single API call gets all modules with nested topics and subtopics
      const modulesData = await contentApi.getAllModulesWithContent();
      setModules(modulesData);

      // Flatten topics and subtopics into lookup maps
      const topicsData: Record<number, Topic[]> = {};
      const subtopicsData: Record<number, Subtopic[]> = {};

      for (const module of modulesData) {
        if (module.topics) {
          topicsData[module.id] = module.topics;

          // Flatten subtopics from nested structure
          for (const topic of module.topics) {
            if (topic.subtopics) {
              subtopicsData[topic.id] = topic.subtopics;
            }
          }
        }
      }

      setTopics(topicsData);
      setSubtopics(subtopicsData);
    } catch (err) {
      setError('Failed to load content');
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyGroups = async () => {
    try {
      const response = await api.get('/study-groups');
      setStudyGroups(response.data);
    } catch (err) {
      console.error('Failed to fetch study groups:', err);
    }
  };

  const resetForms = () => {
    setModuleForm({ name: '', description: '', order_index: 0 });
    setTopicForm({ name: '', description: '', order_index: 0 });
    setSubtopicForm({ name: '', definition: '', notes: '', difficulty_level: 'basic', order_index: 0 });
    setSelectedStudyGroups([]);
    setEditingModule(null);
    setEditingTopic(null);
    setEditingSubtopic(null);
  };

  const handleCreateModule = async (values: any) => {
    const hideLoading = message.loading('Saving module...', 0);
    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, values);
        hideLoading();
        message.success('Module updated successfully!');
      } else {
        await api.post('/modules', values);
        hideLoading();
        message.success('Module created successfully!');
      }
      setShowModuleForm(false);
      moduleFormInstance.resetFields();
      resetForms();
      await fetchAllContent();
    } catch (err: any) {
      hideLoading();
      const errorMsg = err?.response?.data?.detail || err?.message || (editingModule ? 'Failed to update module' : 'Failed to create module');
      console.error('Error:', errorMsg);
      message.error(errorMsg);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      description: module.description || '',
      order_index: module.order_index
    });
    setShowModuleForm(true);
  };

  const handleDeleteModule = (module: Module) => {
    const topicCount = topics[module.id]?.length || 0;
    const subtopicCount = topics[module.id]?.reduce((acc, topic) => acc + (subtopics[topic.id]?.length || 0), 0) || 0;

    let message_text = `This will permanently delete the module "${module.name}"`;
    if (topicCount > 0) {
      message_text += `, ${topicCount} topic${topicCount > 1 ? 's' : ''}`;
    }
    if (subtopicCount > 0) {
      message_text += `, and ${subtopicCount} subtopic${subtopicCount > 1 ? 's' : ''}`;
    }
    message_text += '.';

    setDeleteModal({
      visible: true,
      type: 'module',
      item: module,
      message: message_text,
    });
  };

  const handleCreateTopic = async (values: any, moduleId: number) => {
    const hideLoading = message.loading('Saving topic...', 0);
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, values);
        hideLoading();
        message.success('Topic updated successfully!');
      } else {
        await api.post(`/modules/${moduleId}/topics`, values);
        hideLoading();
        message.success('Topic created successfully!');
      }
      setShowTopicForm(null);
      topicFormInstance.resetFields();
      resetForms();
      await fetchAllContent();
    } catch (err: any) {
      hideLoading();
      const errorMsg = err?.response?.data?.detail || err?.message || (editingTopic ? 'Failed to update topic' : 'Failed to create topic');
      console.error('Error:', errorMsg);
      message.error(errorMsg);
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      description: topic.description || '',
      order_index: topic.order_index
    });
    setShowTopicForm(topic.module_id);
  };

  const handleDeleteTopic = (topic: Topic) => {
    const subtopicCount = subtopics[topic.id]?.length || 0;

    let message_text = `This will permanently delete the topic "${topic.name}"`;
    if (subtopicCount > 0) {
      message_text += ` and ${subtopicCount} subtopic${subtopicCount > 1 ? 's' : ''}`;
    }
    message_text += '.';

    setDeleteModal({
      visible: true,
      type: 'topic',
      item: topic,
      message: message_text,
    });
  };

  const handleCreateSubtopic = async (values: any, topicId: number) => {
    const hideLoading = message.loading('Saving subtopic...', 0);
    try {
      let subtopicId: number;

      if (editingSubtopic) {
        await api.put(`/subtopics/${editingSubtopic.id}`, values);
        subtopicId = editingSubtopic.id;
        message.success('Subtopic updated successfully!');
      } else {
        const response = await api.post(`/topics/${topicId}/subtopics`, values);
        subtopicId = response.data.id;
        message.success('Subtopic created successfully!');
      }

      // Attach study groups if any selected (only for new subtopics or if study groups changed)
      if (!editingSubtopic) {
        for (const groupCode of selectedStudyGroups) {
          try {
            await api.post(`/subtopics/${subtopicId}/study-groups/${groupCode}`);
          } catch (groupErr) {
            console.warn(`Failed to attach study group ${groupCode}:`, groupErr);
          }
        }
      }

      hideLoading();
      setShowSubtopicForm(null);
      subtopicFormInstance.resetFields();
      resetForms();
      await fetchAllContent();
    } catch (err: any) {
      hideLoading();
      const errorMsg = err?.response?.data?.detail || err?.message || (editingSubtopic ? 'Failed to update subtopic' : 'Failed to create subtopic');
      console.error('Error:', errorMsg);
      message.error(errorMsg);
    }
  };

  const handleEditSubtopic = (subtopic: Subtopic) => {
    setEditingSubtopic(subtopic);
    setSubtopicForm({
      name: subtopic.name,
      definition: subtopic.definition || '',
      notes: subtopic.notes || '',
      difficulty_level: subtopic.difficulty_level,
      order_index: subtopic.order_index
    });
    setShowSubtopicForm(subtopic.topic_id);
  };

  const handleDeleteSubtopic = (subtopic: Subtopic) => {
    setDeleteModal({
      visible: true,
      type: 'subtopic',
      item: subtopic,
      message: `This will permanently delete the subtopic "${subtopic.name}" and all its content.`,
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'intro': return 'success';
      case 'basic': return 'processing';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item || !deleteModal.type) return;

    const hideLoading = message.loading('Deleting...', 0);
    try {
      if (deleteModal.type === 'module') {
        await contentApi.deleteModule((deleteModal.item as Module).id);
      } else if (deleteModal.type === 'topic') {
        await contentApi.deleteTopic((deleteModal.item as Topic).id);
      } else if (deleteModal.type === 'subtopic') {
        await contentApi.deleteSubtopic((deleteModal.item as Subtopic).id);
      }

      hideLoading();
      message.success(`${deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1)} deleted successfully!`);
      setDeleteModal({ visible: false, type: null, item: null, message: '' });
      await fetchAllContent();
    } catch (err: any) {
      hideLoading();
      const errorMsg = err?.response?.data?.detail || err?.message || `Failed to delete ${deleteModal.type}`;
      console.error('Delete error:', errorMsg);
      message.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading content library..." />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', height: '100%', overflow: 'auto' }}>
      {/* Status Messages */}
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={clearMessages}
          style={{ marginBottom: '16px' }}
        />
      )}

      {success && (
        <Alert
          message={success}
          type="success"
          closable
          onClose={clearMessages}
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Add Module Button */}
      {canEdit && (
        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowModuleForm(true)}
          >
            Add Module
          </Button>
        </div>
      )}

      {/* Content Tree */}
      {modules.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
            <Text type="secondary">
              No modules found. {canEdit && 'Click "Add Module" to create the first module.'}
            </Text>
          </div>
        </Card>
      ) : (
        <Collapse
          accordion={false}
          activeKey={Array.from(expandedModules).map(String)}
          onChange={(keys) => {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            setExpandedModules(new Set(keysArray.map(Number)));
          }}
        >
          {modules.map((module) => (
            <Panel
              key={String(module.id)}
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <Text strong>{module.name}</Text>
                    {module.description && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px' }}>{module.description}</Text>
                      </div>
                    )}
                  </div>
                  <Space onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }} style={{ pointerEvents: 'auto' }}>
                    <Tag>{topics[module.id]?.length || 0} topics</Tag>
                    {canEdit && (
                      <>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => { e.stopPropagation(); handleEditModule(module); }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module);
                          }}
                        >
                          Delete
                        </Button>
                        {expandedModules.has(module.id) && (
                          <Button
                            size="small"
                            // type="primary"
                            style={{color:"#52c41a", borderColor: '#52c41a' }}
                            icon={<PlusOutlined />}
                            onClick={(e) => { e.stopPropagation(); setShowTopicForm(module.id); }}
                          >
                            Topic
                          </Button>
                        )}
                      </>
                    )}
                  </Space>
                </div>
              }
            >
              {/* Topics */}
              {topics[module.id] && topics[module.id].length > 0 && (
                <Collapse
                  activeKey={Array.from(expandedTopics).map(String)}
                  onChange={(keys) => {
                    const keysArray = Array.isArray(keys) ? keys : [keys];
                    setExpandedTopics(new Set(keysArray.map(Number)));
                  }}
                  style={{ marginTop: '8px' }}
                >
                  {topics[module.id].map((topic) => (
                    <Panel
                      key={String(topic.id)}
                      header={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div>
                            <Text strong>{topic.name}</Text>
                            {topic.description && (
                              <div>
                                <Text type="secondary" style={{ fontSize: '14px' }}>{topic.description}</Text>
                              </div>
                            )}
                          </div>
                          <Space onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }} style={{ pointerEvents: 'auto' }}>
                            <Tag>{subtopics[topic.id]?.length || 0} subtopics</Tag>
                            {canEdit && (
                              <>
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={(e) => { e.stopPropagation(); handleEditTopic(topic); }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic); }}
                                >
                                  Delete
                                </Button>
                                <Button
                                  size="small"
                                  // type="primary"
                                 style={{color:"#722ed1", borderColor: '#722ed1' }}
                                   icon={<PlusOutlined />}
                                  onClick={(e) => { e.stopPropagation(); setShowSubtopicForm(topic.id); }}
                                >
                                  Subtopic
                                </Button>
                              </>
                            )}
                          </Space>
                        </div>
                      }
                    >
                      {/* Subtopics */}
                      {subtopics[topic.id] && subtopics[topic.id].length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {subtopics[topic.id].map((subtopic) => (
                            <Card
                              key={subtopic.id}
                              size="small"
                              style={{ marginBottom: '8px', backgroundColor: '#fafafa' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <Space align="center">
                                    <Text strong>{subtopic.name}</Text>
                                    <Tag color={getDifficultyColor(subtopic.difficulty_level)}>
                                      {subtopic.difficulty_level}
                                    </Tag>
                                  </Space>
                                  {subtopic.definition && (
                                    <div style={{ marginTop: '8px' }}>
                                      <Text type="secondary" style={{ fontSize: '14px' }}>{subtopic.definition}</Text>
                                    </div>
                                  )}
                                  {subtopic.notes && (
                                    <div style={{ marginTop: '4px' }}>
                                      <Text type="secondary" italic style={{ fontSize: '14px' }}>{subtopic.notes}</Text>
                                    </div>
                                  )}
                                </div>
                                {canEdit && (
                                  <Space>
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => handleEditSubtopic(subtopic)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteSubtopic(subtopic)}
                                    >
                                      Delete
                                    </Button>
                                  </Space>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Panel>
                  ))}
                </Collapse>
              )}
            </Panel>
          ))}
        </Collapse>
      )}

      {/* Module Modal */}
      <Modal
        title={editingModule ? 'Edit Module' : 'Create New Module'}
        open={showModuleForm}
        onCancel={() => { setShowModuleForm(false); resetForms(); moduleFormInstance.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form
          form={moduleFormInstance}
          onFinish={handleCreateModule}
          layout="vertical"
          initialValues={editingModule ? moduleForm : { name: '', description: '', order_index: 0 }}
        >
          <Form.Item label="Module Name" name="name" rules={[{ required: true, message: 'Please enter module name' }]}>
            <Input placeholder="Module name" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea placeholder="Description (optional)" rows={3} />
          </Form.Item>
          <Form.Item label="Order Index" name="order_index">
            <Input type="number" placeholder="Order index" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setShowModuleForm(false); resetForms(); moduleFormInstance.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingModule ? 'Update Module' : 'Create Module'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Topic Modal */}
      <Modal
        title={editingTopic ? 'Edit Topic' : 'Create New Topic'}
        open={showTopicForm !== null}
        onCancel={() => { setShowTopicForm(null); resetForms(); topicFormInstance.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form
          form={topicFormInstance}
          onFinish={(values) => handleCreateTopic(values, showTopicForm!)}
          layout="vertical"
          initialValues={editingTopic ? topicForm : { name: '', description: '', order_index: 0 }}
        >
          <Form.Item label="Topic Name" name="name" rules={[{ required: true, message: 'Please enter topic name' }]}>
            <Input placeholder="Topic name" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea placeholder="Description (optional)" rows={3} />
          </Form.Item>
          <Form.Item label="Order Index" name="order_index">
            <Input type="number" placeholder="Order index" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setShowTopicForm(null); resetForms(); topicFormInstance.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
              {editingTopic ? 'Update Topic' : 'Create Topic'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Subtopic Modal */}
      <Modal
        title={editingSubtopic ? 'Edit Subtopic' : 'Create New Subtopic'}
        open={showSubtopicForm !== null}
        onCancel={() => { setShowSubtopicForm(null); resetForms(); subtopicFormInstance.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form
          form={subtopicFormInstance}
          onFinish={(values) => handleCreateSubtopic(values, showSubtopicForm!)}
          layout="vertical"
          initialValues={editingSubtopic ? subtopicForm : { name: '', definition: '', notes: '', difficulty_level: 'basic', order_index: 0 }}
        >
          <Form.Item label="Subtopic Name" name="name" rules={[{ required: true, message: 'Please enter subtopic name' }]}>
            <Input placeholder="Subtopic name" />
          </Form.Item>
          <Form.Item label="Definition" name="definition">
            <TextArea placeholder="Definition (optional)" rows={2} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <TextArea placeholder="Notes (optional)" rows={2} />
          </Form.Item>
          <Form.Item label="Difficulty Level" name="difficulty_level">
            <Select>
              <Select.Option value="intro">Introduction</Select.Option>
              <Select.Option value="basic">Basic</Select.Option>
              <Select.Option value="intermediate">Intermediate</Select.Option>
              <Select.Option value="advanced">Advanced</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Order Index" name="order_index">
            <Input type="number" placeholder="Order index" />
          </Form.Item>
          {studyGroups.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target Study Groups</label>
              <Checkbox.Group
                value={selectedStudyGroups}
                onChange={(checkedValues) => setSelectedStudyGroups(checkedValues as string[])}
              >
                <Space direction="vertical">
                  {studyGroups.map((group) => (
                    <Checkbox key={group.code} value={group.code}>
                      {group.name} ({group.code})
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setShowSubtopicForm(null); resetForms(); subtopicFormInstance.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}>
              {editingSubtopic ? 'Update Subtopic' : 'Create Subtopic'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={`Delete ${deleteModal.type ? deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1) : ''}`}
        open={deleteModal.visible}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteModal({ visible: false, type: null, item: null, message: '' })}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        <p>{deleteModal.message}</p>
      </Modal>
    </div>
  );
};

export default ContentLibrary;
