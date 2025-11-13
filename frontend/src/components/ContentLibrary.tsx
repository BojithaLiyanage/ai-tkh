import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal';

interface ContentLibraryProps {
  onClose?: () => void;
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

const ContentLibrary: React.FC<ContentLibraryProps> = ({ onClose }) => {
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

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
    isLoading: false
  });

  const isAdmin = user?.user_type === 'admin';
  const isSuperAdmin = user?.user_type === 'super_admin';
  const canEdit = isAdmin || isSuperAdmin;

  useEffect(() => {
    fetchAllContent();
    fetchStudyGroups();
  }, []);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      const modulesResponse = await api.get('/modules');
      const modulesData = modulesResponse.data;
      setModules(modulesData);

      // Fetch topics for each module
      const topicsData: Record<number, Topic[]> = {};
      const subtopicsData: Record<number, Subtopic[]> = {};

      for (const module of modulesData) {
        const topicsResponse = await api.get(`/modules/${module.id}/topics`);
        topicsData[module.id] = topicsResponse.data;

        // Fetch subtopics for each topic
        for (const topic of topicsResponse.data) {
          const subtopicsResponse = await api.get(`/topics/${topic.id}/subtopics`);
          subtopicsData[topic.id] = subtopicsResponse.data;
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

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
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

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, moduleForm);
        setSuccess('Module updated successfully!');
      } else {
        await api.post('/modules', moduleForm);
        setSuccess('Module created successfully!');
      }
      setShowModuleForm(false);
      resetForms();
      fetchAllContent();
    } catch (err) {
      setError(editingModule ? 'Failed to update module' : 'Failed to create module');
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

    let message = `This will permanently delete the module`;
    if (topicCount > 0) {
      message += `, ${topicCount} topic${topicCount > 1 ? 's' : ''}`;
    }
    if (subtopicCount > 0) {
      message += `, and ${subtopicCount} subtopic${subtopicCount > 1 ? 's' : ''}`;
    }
    message += '.';

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Module',
      message,
      itemName: module.name,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/modules/${module.id}`);
          setSuccess('Module deleted successfully!');
          fetchAllContent();
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err) {
          setError('Failed to delete module');
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false
    });
  };

  const handleCreateTopic = async (e: React.FormEvent, moduleId: number) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, topicForm);
        setSuccess('Topic updated successfully!');
      } else {
        await api.post(`/modules/${moduleId}/topics`, topicForm);
        setSuccess('Topic created successfully!');
      }
      setShowTopicForm(null);
      resetForms();
      fetchAllContent();
    } catch (err) {
      setError(editingTopic ? 'Failed to update topic' : 'Failed to create topic');
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

    let message = `This will permanently delete the topic`;
    if (subtopicCount > 0) {
      message += ` and ${subtopicCount} subtopic${subtopicCount > 1 ? 's' : ''}`;
    }
    message += '.';

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Topic',
      message,
      itemName: topic.name,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/topics/${topic.id}`);
          setSuccess('Topic deleted successfully!');
          fetchAllContent();
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err) {
          setError('Failed to delete topic');
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false
    });
  };

  const handleCreateSubtopic = async (e: React.FormEvent, topicId: number) => {
    e.preventDefault();
    try {
      let subtopicId: number;

      if (editingSubtopic) {
        await api.put(`/subtopics/${editingSubtopic.id}`, subtopicForm);
        subtopicId = editingSubtopic.id;
        setSuccess('Subtopic updated successfully!');
      } else {
        const response = await api.post(`/topics/${topicId}/subtopics`, subtopicForm);
        subtopicId = response.data.id;
        setSuccess('Subtopic created successfully!');
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

      setShowSubtopicForm(null);
      resetForms();
      fetchAllContent();
    } catch (err) {
      setError(editingSubtopic ? 'Failed to update subtopic' : 'Failed to create subtopic');
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
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Subtopic',
      message: 'This will permanently delete the subtopic and all its content.',
      itemName: subtopic.name,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/subtopics/${subtopic.id}`);
          setSuccess('Subtopic deleted successfully!');
          fetchAllContent();
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err) {
          setError('Failed to delete subtopic');
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleCancelConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      itemName: '',
      onConfirm: () => {},
      isLoading: false
    });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'intro': return 'bg-green-100 text-green-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-2xl w-full h-[90vh] flex items-center justify-center">
        <div className="text-gray-600">Loading content library...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={clearMessages} className="text-red-800 underline text-xs">Dismiss</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
            <button onClick={clearMessages} className="text-green-800 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Module Creation Form */}
        {showModuleForm && canEdit && (
          <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">
              {editingModule ? 'Edit Module' : 'Create New Module'}
            </h3>
            <form onSubmit={handleCreateModule} className="space-y-3">
              <input
                type="text"
                placeholder="Module name"
                value={moduleForm.name}
                onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingModule ? 'Update Module' : 'Create Module'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModuleForm(false); resetForms(); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Module Button */}
        {canEdit && (
          <div className="mb-4 flex justify-start">
            <button
              onClick={() => setShowModuleForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              + Add Module
            </button>
          </div>
        )}

        {/* Content Tree */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No modules found. {canEdit && 'Click "Add Module" to create the first module.'}
            </div>
          ) : (
            modules.map((module) => (
              <div key={module.id} className="border border-gray-200 rounded-lg">
                {/* Module Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedModules.has(module.id) ? '▼' : '▶'}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900">{module.name}</h3>
                      {module.description && (
                        <p className="text-sm text-gray-600">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {topics[module.id]?.length || 0} topics
                    </span>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEditModule(module)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowTopicForm(module.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          + Topic
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Topic Creation Form */}
                {showTopicForm === module.id && canEdit && (
                  <div className="p-4 border-t border-gray-200 bg-green-50">
                    <h4 className="font-semibold mb-3">
                      {editingTopic ? 'Edit Topic' : 'Create New Topic'}
                    </h4>
                    <form onSubmit={(e) => handleCreateTopic(e, module.id)} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Topic name"
                        value={topicForm.name}
                        onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={topicForm.description}
                        onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          {editingTopic ? 'Update Topic' : 'Create Topic'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowTopicForm(null); resetForms(); }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Topics */}
                {expandedModules.has(module.id) && topics[module.id] && (
                  <div className="border-t border-gray-200">
                    {topics[module.id].map((topic) => (
                      <div key={topic.id} className="border-b border-gray-100 last:border-b-0">
                        {/* Topic Header */}
                        <div className="flex items-center justify-between p-4 pl-8 bg-white">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTopic(topic.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {expandedTopics.has(topic.id) ? '▼' : '▶'}
                            </button>
                            <div>
                              <h4 className="font-medium text-gray-900">{topic.name}</h4>
                              {topic.description && (
                                <p className="text-sm text-gray-600">{topic.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {subtopics[topic.id]?.length || 0} subtopics
                            </span>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleEditTopic(topic)}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(topic)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setShowSubtopicForm(topic.id)}
                                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                >
                                  + Subtopic
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subtopic Creation Form */}
                        {showSubtopicForm === topic.id && canEdit && (
                          <div className="p-4 pl-8 border-t border-gray-200 bg-purple-50">
                            <h5 className="font-semibold mb-3">
                              {editingSubtopic ? 'Edit Subtopic' : 'Create New Subtopic'}
                            </h5>
                            <form onSubmit={(e) => handleCreateSubtopic(e, topic.id)} className="space-y-3">
                              <input
                                type="text"
                                placeholder="Subtopic name"
                                value={subtopicForm.name}
                                onChange={(e) => setSubtopicForm({...subtopicForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                              />
                              <textarea
                                placeholder="Definition (optional)"
                                value={subtopicForm.definition}
                                onChange={(e) => setSubtopicForm({...subtopicForm, definition: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows={2}
                              />
                              <textarea
                                placeholder="Notes (optional)"
                                value={subtopicForm.notes}
                                onChange={(e) => setSubtopicForm({...subtopicForm, notes: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows={2}
                              />
                              <select
                                value={subtopicForm.difficulty_level}
                                onChange={(e) => setSubtopicForm({
                                  ...subtopicForm,
                                  difficulty_level: e.target.value as 'intro' | 'basic' | 'intermediate' | 'advanced'
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="intro">Introduction</option>
                                <option value="basic">Basic</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                              {studyGroups.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Study Groups
                                  </label>
                                  <div className="space-y-2">
                                    {studyGroups.map((group) => (
                                      <label key={group.code} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={selectedStudyGroups.includes(group.code)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedStudyGroups([...selectedStudyGroups, group.code]);
                                            } else {
                                              setSelectedStudyGroups(selectedStudyGroups.filter(code => code !== group.code));
                                            }
                                          }}
                                          className="rounded focus:ring-purple-500 text-purple-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                          {group.name} ({group.code})
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                  {editingSubtopic ? 'Update Subtopic' : 'Create Subtopic'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowSubtopicForm(null); resetForms(); }}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Subtopics */}
                        {expandedTopics.has(topic.id) && subtopics[topic.id] && (
                          <div className="pl-12">
                            {subtopics[topic.id].map((subtopic) => (
                              <div key={subtopic.id} className="p-3 border-l-2 border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-medium text-gray-900">{subtopic.name}</h5>
                                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(subtopic.difficulty_level)}`}>
                                        {subtopic.difficulty_level}
                                      </span>
                                    </div>
                                    {subtopic.definition && (
                                      <p className="text-sm text-gray-600 mt-1">{subtopic.definition}</p>
                                    )}
                                    {subtopic.notes && (
                                      <p className="text-sm text-gray-500 mt-1 italic">{subtopic.notes}</p>
                                    )}
                                  </div>
                                  {canEdit && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditSubtopic(subtopic)}
                                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubtopic(subtopic)}
                                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        itemName={confirmationModal.itemName}
        onConfirm={confirmationModal.onConfirm}
        onCancel={handleCancelConfirmation}
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
};

export default ContentLibrary;