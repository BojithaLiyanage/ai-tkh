import React, { useState, useEffect } from 'react';
import { questionApi, fiberApi, type QuestionWithFiberRead, type QuestionCreate, type QuestionStats, type FiberSummary } from '../services/api';

interface QuestionBankManagementProps {
  onClose: () => void;
}

const QuestionBankManagement: React.FC<QuestionBankManagementProps> = ({ onClose }) => {
  const [questions, setQuestions] = useState<QuestionWithFiberRead[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [fibers, setFibers] = useState<FiberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterFiberId, setFilterFiberId] = useState<number | undefined>();
  const [filterStudyGroup, setFilterStudyGroup] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; questionId: number | null; questionText: string }>({
    show: false,
    questionId: null,
    questionText: '',
  });
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithFiberRead | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<QuestionCreate>({
    fiber_id: 0,
    study_group_code: 'S',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
  });

  const [editFormData, setEditFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    study_group_code: '',
  });

  const studyGroups = [
    { code: 'S', name: 'School' },
    { code: 'U', name: 'Undergraduate' },
    { code: 'I', name: 'Industry' },
    { code: 'R', name: 'Research' },
  ];

  useEffect(() => {
    fetchData();
  }, [filterFiberId, filterStudyGroup]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsData, statsData, fibersData] = await Promise.all([
        questionApi.getQuestions({
          fiber_id: filterFiberId,
          study_group_code: filterStudyGroup,
          limit: 100,
        }),
        questionApi.getQuestionStats(),
        fiberApi.getFibers(),
      ]);
      setQuestions(questionsData);
      setStats(statsData);
      setFibers(fibersData);
    } catch (err) {
      setError('Failed to fetch questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.fiber_id || formData.fiber_id === 0) {
      setError('Please select a fiber');
      return;
    }

    if (formData.options.some(opt => opt.trim() === '')) {
      setError('All options must be filled');
      return;
    }

    if (!formData.options.includes(formData.correct_answer)) {
      setError('Correct answer must be one of the options');
      return;
    }

    try {
      await questionApi.createQuestion(formData);
      setSuccess('Question added successfully!');
      setShowAddForm(false);
      setFormData({
        fiber_id: 0,
        study_group_code: 'S',
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add question');
    }
  };

  const handleDeleteClick = (questionId: number, questionText: string) => {
    setDeleteConfirm({
      show: true,
      questionId,
      questionText,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.questionId) return;

    try {
      await questionApi.deleteQuestion(deleteConfirm.questionId);
      setSuccess('Question deleted successfully!');
      setDeleteConfirm({ show: false, questionId: null, questionText: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete question');
      setDeleteConfirm({ show: false, questionId: null, questionText: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, questionId: null, questionText: '' });
  };

  const handleEditClick = (question: QuestionWithFiberRead) => {
    setEditingQuestion(question);
    setEditFormData({
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
      study_group_code: question.study_group_code,
    });
    setShowEditForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setError(null);
    setSuccess(null);

    // Validation
    if (editFormData.options.some(opt => opt.trim() === '')) {
      setError('All options must be filled');
      return;
    }

    if (!editFormData.options.includes(editFormData.correct_answer)) {
      setError('Correct answer must be one of the options');
      return;
    }

    try {
      await questionApi.updateQuestion(editingQuestion.id, {
        question: editFormData.question,
        options: editFormData.options,
        correct_answer: editFormData.correct_answer,
        study_group_code: editFormData.study_group_code,
      });
      setSuccess('Question updated successfully!');
      setShowEditForm(false);
      setEditingQuestion(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update question');
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingQuestion(null);
    setEditFormData({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      study_group_code: '',
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleEditOptionChange = (index: number, value: string) => {
    const newOptions = [...editFormData.options];
    newOptions[index] = value;
    setEditFormData({ ...editFormData, options: newOptions });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Question Bank Management</h2>
          <p className="text-purple-100 mt-1">Manage assessment questions for fibers</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 text-sm">Total Questions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.total_questions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 text-sm">Fibers Covered</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.total_fibers_with_questions}</p>
            </div>
            {stats.questions_by_study_group.slice(0, 2).map((group) => (
              <div key={group.code} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-600 text-sm">{group.name}</p>
                <p className="text-2xl font-bold text-blue-600">{group.count} questions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="p-4 border-b bg-white">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Fiber</label>
            <select
              value={filterFiberId || ''}
              onChange={(e) => setFilterFiberId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Fibers</option>
              {fibers.map((fiber) => (
                <option key={fiber.id} value={fiber.id}>
                  {fiber.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Study Group</label>
            <select
              value={filterStudyGroup || ''}
              onChange={(e) => setFilterStudyGroup(e.target.value || undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Groups</option>
              {studyGroups.map((group) => (
                <option key={group.code} value={group.code}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Question Form */}
      {showAddForm && (
        <div className="p-4 bg-gray-50 border-b">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiber *</label>
                <select
                  value={formData.fiber_id}
                  onChange={(e) => setFormData({ ...formData, fiber_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value={0}>Select a fiber</option>
                  {fibers.map((fiber) => (
                    <option key={fiber.id} value={fiber.id}>
                      {fiber.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Study Group *</label>
                <select
                  value={formData.study_group_code}
                  onChange={(e) => setFormData({ ...formData, study_group_code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {studyGroups.map((group) => (
                    <option key={group.code} value={group.code}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((option, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option {index + 1} *
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
              <select
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select correct answer</option>
                {formData.options.filter(opt => opt.trim() !== '').map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Question
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions found. Add your first question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        {question.fiber_name}
                      </span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                        {question.study_group_name}
                      </span>
                      <span className="text-gray-400 text-xs">#{question.id}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-3">{question.question}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded text-sm ${
                            option === question.correct_answer
                              ? 'bg-green-50 border border-green-300 text-green-800 font-medium'
                              : 'bg-gray-50 border border-gray-200 text-gray-700'
                          }`}
                        >
                          {option === question.correct_answer && '✓ '}
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEditClick(question)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                      title="Edit question"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(question.id, question.question)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Delete question"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(question.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Delete Question</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this question? This action cannot be undone.
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700 font-medium line-clamp-3">
                      {deleteConfirm.questionText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditForm && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">Edit Question</h2>
                <p className="text-blue-100 mt-1">Question ID: #{editingQuestion.id} • {editingQuestion.fiber_name}</p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiber</label>
                <input
                  type="text"
                  value={editingQuestion.fiber_name}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Fiber cannot be changed after creation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Study Group *</label>
                <select
                  value={editFormData.study_group_code}
                  onChange={(e) => setEditFormData({ ...editFormData, study_group_code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {studyGroups.map((group) => (
                    <option key={group.code} value={group.code}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  value={editFormData.question}
                  onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editFormData.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option {index + 1} *
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleEditOptionChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                <select
                  value={editFormData.correct_answer}
                  onChange={(e) => setEditFormData({ ...editFormData, correct_answer: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select correct answer</option>
                  {editFormData.options.filter(opt => opt.trim() !== '').map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Update Question
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankManagement;
