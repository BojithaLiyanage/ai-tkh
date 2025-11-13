import React, { useState, useEffect } from 'react';
import { questionApi, fiberApi, type QuestionWithFiberRead, type QuestionCreate, type QuestionStats, type FiberSummary } from '../services/api';
import { Card, Button, Select, Alert, Spin, Modal, Form, Input, Tag, Space, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface QuestionBankManagementProps {
  onClose?: () => void;
}

const QuestionBankManagement: React.FC<QuestionBankManagementProps> = () => {
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
    <div className="bg-white w-full h-full flex flex-col">

      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Stats Dashboard */}
        {stats && (
          <div className="bg-gray-50 px-6 py-4 border-b">
            <Space size="large" wrap>
              <Statistic
                title="Total Questions"
                value={stats.total_questions}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
              />
              <Statistic
                title="Fibers Covered"
                value={stats.total_fibers_with_questions}
                valueStyle={{ color: '#531dab', fontSize: '24px', fontWeight: 'bold' }}
              />
              {stats.questions_by_study_group.map((group) => (
                <Statistic
                  key={group.code}
                  title={group.name}
                  value={group.count}
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="p-4 border-b bg-white">
          <Space size="middle" wrap style={{ width: '100%' }}>
            <div style={{ minWidth: '200px' }}>
              <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Filter by Fiber</div>
              <Select
                placeholder="All Fibers"
                value={filterFiberId}
                onChange={(value) => setFilterFiberId(value)}
                allowClear
                style={{ width: '200px' }}
              >
                {fibers.map((fiber) => (
                  <Select.Option key={fiber.id} value={fiber.id}>
                    {fiber.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ minWidth: '200px' }}>
              <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Filter by Study Group</div>
              <Select
                placeholder="All Groups"
                value={filterStudyGroup}
                onChange={(value) => setFilterStudyGroup(value)}
                allowClear
                style={{ width: '200px' }}
              >
                {studyGroups.map((group) => (
                  <Select.Option key={group.code} value={group.code}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', marginTop: '24px' }}
              size="large"
            >
              Add Question
            </Button>
          </Space>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '16px 16px 0' }}>
            <Alert message={error} type="error" closable onClose={() => setError(null)} showIcon />
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 16px 0' }}>
            <Alert message={success} type="success" closable onClose={() => setSuccess(null)} showIcon />
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" tip="Loading questions..." />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions found. Add your first question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card
                key={question.id}
                hoverable
                styles={{ body: { padding: '16px' } }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <Space size="small" wrap style={{ marginBottom: '8px' }}>
                      <Tag color="purple">{question.fiber_name}</Tag>
                      <Tag color="blue">{question.study_group_name}</Tag>
                      <span className="text-gray-400 text-xs">#{question.id}</span>
                    </Space>
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
                  <Space size="small" style={{ marginLeft: '16px' }}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditClick(question)}
                      title="Edit question"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteClick(question.id, question.question)}
                      title="Delete question"
                    />
                  </Space>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(question.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Delete Question</span>
          </Space>
        }
        open={deleteConfirm.show}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Delete Question"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <p className="text-sm text-gray-500 mb-3">
          Are you sure you want to delete this question? This action cannot be undone.
        </p>
        <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
          <p className="text-sm text-gray-700 font-medium line-clamp-3">
            {deleteConfirm.questionText}
          </p>
        </Card>
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        title={
          <div>
            <div className="text-xl font-bold">Edit Question</div>
            {editingQuestion && (
              <div className="text-sm text-gray-500 mt-1">
                Question ID: #{editingQuestion.id} • {editingQuestion.fiber_name}
              </div>
            )}
          </div>
        }
        open={showEditForm && editingQuestion !== null}
        onCancel={handleCancelEdit}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {editingQuestion && (
          <form onSubmit={handleUpdateQuestion} className="space-y-4 mt-4">
            <Form.Item label="Fiber" help="Fiber cannot be changed after creation">
              <Input
                value={editingQuestion.fiber_name}
                disabled
              />
            </Form.Item>

            <Form.Item label="Study Group" required>
              <Select
                value={editFormData.study_group_code}
                onChange={(value) => setEditFormData({ ...editFormData, study_group_code: value })}
              >
                {studyGroups.map((group) => (
                  <Select.Option key={group.code} value={group.code}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Question" required>
              <TextArea
                value={editFormData.question}
                onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })}
                rows={3}
                required
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editFormData.options.map((option, index) => (
                <Form.Item key={index} label={`Option ${index + 1}`} required>
                  <Input
                    value={option}
                    onChange={(e) => handleEditOptionChange(index, e.target.value)}
                    required
                  />
                </Form.Item>
              ))}
            </div>

            <Form.Item label="Correct Answer" required>
              <Select
                value={editFormData.correct_answer}
                onChange={(value) => setEditFormData({ ...editFormData, correct_answer: value })}
                placeholder="Select correct answer"
              >
                {editFormData.options.filter(opt => opt.trim() !== '').map((option, index) => (
                  <Select.Option key={index} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
              >
                Update Question
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="large"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Question Modal */}
      <Modal
        title={
          <div>
            <div className="text-xl font-bold">Add New Question</div>
            <div className="text-sm text-gray-500 mt-1">Create a new question for the question bank</div>
          </div>
        }
        open={showAddForm}
        onCancel={() => setShowAddForm(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Fiber" required>
              <Select
                value={formData.fiber_id || undefined}
                onChange={(value) => setFormData({ ...formData, fiber_id: value })}
                placeholder="Select a fiber"
              >
                {fibers.map((fiber) => (
                  <Select.Option key={fiber.id} value={fiber.id}>
                    {fiber.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Study Group" required>
              <Select
                value={formData.study_group_code}
                onChange={(value) => setFormData({ ...formData, study_group_code: value })}
              >
                {studyGroups.map((group) => (
                  <Select.Option key={group.code} value={group.code}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Question" required>
            <TextArea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              required
              placeholder="Enter your question here..."
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.options.map((option, index) => (
              <Form.Item key={index} label={`Option ${index + 1}`} required>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  placeholder={`Enter option ${index + 1}`}
                />
              </Form.Item>
            ))}
          </div>

          <Form.Item label="Correct Answer" required>
            <Select
              value={formData.correct_answer}
              onChange={(value) => setFormData({ ...formData, correct_answer: value })}
              placeholder="Select correct answer"
            >
              {formData.options.filter(opt => opt.trim() !== '').map((option, index) => (
                <Select.Option key={index} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
            >
              Add Question
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              size="large"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBankManagement;
