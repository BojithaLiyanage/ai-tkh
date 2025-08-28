import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface ContentManagementProps {
  onClose?: () => void;
  onContentUpdated?: () => void;
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

// Subtopic interface removed as it's not used in this component

interface StudyGroup {
  code: string;
  name: string;
  description?: string;
}

const ContentManagement: React.FC<ContentManagementProps> = ({ onClose, onContentUpdated }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'topics' | 'subtopics'>('modules');
  const [modules, setModules] = useState<Module[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Module form state
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    order_index: 0
  });

  // Topic form state
  const [topicForm, setTopicForm] = useState({
    name: '',
    description: '',
    order_index: 0
  });

  // Subtopic form state
  const [subtopicForm, setSubtopicForm] = useState({
    name: '',
    definition: '',
    notes: '',
    difficulty_level: 'basic' as 'intro' | 'basic' | 'intermediate' | 'advanced',
    order_index: 0
  });

  const [selectedStudyGroups, setSelectedStudyGroups] = useState<string[]>([]);

  useEffect(() => {
    fetchModules();
    fetchStudyGroups();
  }, []);

  useEffect(() => {
    if (selectedModuleId) {
      fetchTopics(selectedModuleId);
    }
  }, [selectedModuleId]);

  const fetchModules = async () => {
    try {
      const response = await api.get('/modules');
      setModules(response.data);
    } catch {
      setError('Failed to fetch modules');
    }
  };

  const fetchTopics = async (moduleId: number) => {
    try {
      const response = await api.get(`/modules/${moduleId}/topics`);
      setTopics(response.data);
    } catch {
      setError('Failed to fetch topics');
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

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/modules', moduleForm);
      setSuccess('Module created successfully!');
      setModuleForm({ name: '', description: '', order_index: 0 });
      await fetchModules();
      if (onContentUpdated) onContentUpdated();
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create module'
        : 'Failed to create module';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await api.post(`/modules/${selectedModuleId}/topics`, topicForm);
      setSuccess('Topic created successfully!');
      setTopicForm({ name: '', description: '', order_index: 0 });
      await fetchTopics(selectedModuleId);
      if (onContentUpdated) onContentUpdated();
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create topic'
        : 'Failed to create topic';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      setError('Please select a topic first');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/topics/${selectedTopicId}/subtopics`, subtopicForm);
      const subtopicId = response.data.id;
      
      // Attach study groups if any selected
      for (const groupCode of selectedStudyGroups) {
        try {
          await api.post(`/subtopics/${subtopicId}/study-groups/${groupCode}`);
        } catch (groupErr) {
          console.warn(`Failed to attach study group ${groupCode}:`, groupErr);
        }
      }
      
      setSuccess('Subtopic created successfully!');
      setSubtopicForm({ 
        name: '', 
        definition: '', 
        notes: '', 
        difficulty_level: 'basic', 
        order_index: 0 
      });
      setSelectedStudyGroups([]);
      if (onContentUpdated) onContentUpdated();
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create subtopic'
        : 'Failed to create subtopic';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Content Management</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab('modules'); clearMessages(); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'modules' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Modules
          </button>
          <button
            onClick={() => { setActiveTab('topics'); clearMessages(); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'topics' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => { setActiveTab('subtopics'); clearMessages(); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'subtopics' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Subtopics
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Module Tab */}
        {activeTab === 'modules' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Module</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label htmlFor="module-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  id="module-name"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Fiber Classification"
                />
              </div>

              <div>
                <label htmlFor="module-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="module-description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the module content..."
                />
              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            </form>
          </div>
        )}

        {/* Topic Tab */}
        {activeTab === 'topics' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Topic</h3>
            
            {/* Module Selection */}
            <div className="mb-4">
              <label htmlFor="topic-module" className="block text-sm font-medium text-gray-700 mb-1">
                Select Module *
              </label>
              <select
                id="topic-module"
                value={selectedModuleId || ''}
                onChange={(e) => setSelectedModuleId(e.target.value ? parseInt(e.target.value) : null)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a module...</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label htmlFor="topic-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  id="topic-name"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Natural Fibers"
                />
              </div>

              <div>
                <label htmlFor="topic-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="topic-description"
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the topic..."
                />
              </div>


              <button
                type="submit"
                disabled={loading || !selectedModuleId}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Topic'}
              </button>
            </form>
          </div>
        )}

        {/* Subtopic Tab */}
        {activeTab === 'subtopics' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Subtopic</h3>
            
            {/* Module Selection */}
            <div className="mb-4">
              <label htmlFor="subtopic-module" className="block text-sm font-medium text-gray-700 mb-1">
                Select Module *
              </label>
              <select
                id="subtopic-module"
                value={selectedModuleId || ''}
                onChange={(e) => setSelectedModuleId(e.target.value ? parseInt(e.target.value) : null)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a module...</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Selection */}
            <div className="mb-4">
              <label htmlFor="subtopic-topic" className="block text-sm font-medium text-gray-700 mb-1">
                Select Topic *
              </label>
              <select
                id="subtopic-topic"
                value={selectedTopicId || ''}
                onChange={(e) => setSelectedTopicId(e.target.value ? parseInt(e.target.value) : null)}
                required
                disabled={!selectedModuleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Choose a topic...</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateSubtopic} className="space-y-4">
              <div>
                <label htmlFor="subtopic-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Subtopic Name *
                </label>
                <input
                  type="text"
                  id="subtopic-name"
                  value={subtopicForm.name}
                  onChange={(e) => setSubtopicForm({...subtopicForm, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cotton"
                />
              </div>

              <div>
                <label htmlFor="subtopic-definition" className="block text-sm font-medium text-gray-700 mb-1">
                  Definition
                </label>
                <textarea
                  id="subtopic-definition"
                  value={subtopicForm.definition}
                  onChange={(e) => setSubtopicForm({...subtopicForm, definition: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Technical definition of the subtopic..."
                />
              </div>

              <div>
                <label htmlFor="subtopic-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes/Concept
                </label>
                <textarea
                  id="subtopic-notes"
                  value={subtopicForm.notes}
                  onChange={(e) => setSubtopicForm({...subtopicForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes, concepts, or explanations..."
                />
              </div>

              <div>
                <label htmlFor="subtopic-difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="subtopic-difficulty"
                  value={subtopicForm.difficulty_level}
                  onChange={(e) => setSubtopicForm({
                    ...subtopicForm, 
                    difficulty_level: e.target.value as 'intro' | 'basic' | 'intermediate' | 'advanced'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="intro">Introduction</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

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
                        className="rounded focus:ring-blue-500 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {group.name} ({group.code})
                      </span>
                    </label>
                  ))}
                </div>
              </div>


              <button
                type="submit"
                disabled={loading || !selectedTopicId}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Subtopic'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;