import React, { useState, useEffect } from 'react';
import {
  Card, Button, Progress, Tag, Spin, Empty, message, Modal, Rate,
  Statistic, Row, Col, Input
} from 'antd';
import {
  TrophyOutlined, CheckCircleOutlined, FireOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, HistoryOutlined, SearchOutlined
} from '@ant-design/icons';
import { quizApi } from '../services/api';
import type { FiberQuizCard, QuizAttemptStart, QuizHistoryItem } from '../services/api';

// Sub-component for Quiz Cards View
const QuizCardsView: React.FC<{
  quizzes: FiberQuizCard[];
  loading: boolean;
  onStartQuiz: (quiz: FiberQuizCard) => void;
  onReviewQuiz: (quiz: FiberQuizCard, attemptId: number) => void;
}> = ({ quizzes, loading, onStartQuiz, onReviewQuiz }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort quizzes: completed ones first, then by search query
  const filteredQuizzes = quizzes
    .filter((quiz) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        quiz.fiber_name.toLowerCase().includes(searchLower) ||
        quiz.study_group_name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort completed quizzes first
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin />
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search quizzes by name or study group..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      {/* Quiz Cards Grid - Scrollable */}
      {filteredQuizzes.length === 0 ? (
        <Empty description={searchQuery ? "No quizzes match your search" : "No quizzes available"} style={{ marginTop: '50px' }} />
      ) : (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-4">
          <Row gutter={[16, 16]}>
            {filteredQuizzes.map((quiz) => (
              <Col key={quiz.fiber_id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  className="shadow-md rounded-xl overflow-hidden h-full"
                  bodyStyle={{ padding: 0 }}
                >
                  {/* Header Banner with Question Count */}
                  <div className={`relative h-24 ${
                    quiz.is_completed
                      ? 'bg-gradient-to-br from-green-100 via-green-50 to-blue-50'
                      : 'bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50'
                  } flex items-center justify-center`}>
                    <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-80 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                      <span>{quiz.question_count} Questions</span>
                      <FireOutlined />
                    </div>
                    {/* Decorative Icon */}
                    <div className={`text-5xl opacity-20 ${
                      quiz.is_completed ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {quiz.is_completed ? <CheckCircleOutlined /> : <FireOutlined />}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col">
                    {/* Quiz Title - Fixed 2 lines height */}
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 h-12 overflow-hidden">{quiz.fiber_name}</h3>

                    {/* Accuracy Metric Only */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative w-10 h-10">
                        <Progress
                          type="circle"
                          percent={quiz.is_completed && quiz.last_score !== null ? quiz.last_score : 100}
                          size={40}
                          strokeWidth={8}
                          strokeColor={quiz.is_completed ? {
                            '0%': '#ff4d4f',
                            '50%': '#faad14',
                            '100%': '#52c41a',
                          } : '#d9d9d9'}
                          format={() => ''}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            {quiz.is_completed && quiz.last_score !== null ? `${quiz.last_score}%` : '—'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {quiz.is_completed ? 'Accuracy' : 'Not Started'}
                        </div>
                        {quiz.is_completed && quiz.last_score !== null && (
                          <div className="text-sm font-semibold text-gray-900">{quiz.last_score}%</div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <Tag color="blue" className="rounded-md text-xs">{quiz.study_group_name}</Tag>
                      {quiz.is_completed && (
                        <Tag color="success" icon={<CheckCircleOutlined />} className="rounded-md text-xs">
                          Completed
                        </Tag>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <HistoryOutlined />
                        <span>
                          {quiz.last_attempt_date
                            ? new Date(quiz.last_attempt_date).toLocaleDateString()
                            : 'Not attempted'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        onClick={() => onStartQuiz(quiz)}
                        block
                        size="small"
                        className="flex-1"
                      >
                        {quiz.is_completed ? 'Retake' : 'Start'}
                      </Button>
                      {quiz.is_completed && quiz.last_attempt_date && (
                        <Button
                          onClick={() => onReviewQuiz(quiz, quiz.fiber_id)}
                          size="small"
                          icon={<ArrowRightOutlined />}
                        >
                          Review
                          </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </>
  );
};

// Sub-component for Taking a Quiz
const QuizTakingView: React.FC<{
  quizData: QuizAttemptStart;
  onSubmit: (answers: Array<{ question_id: number; selected_answer: string | null }>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}> = ({ quizData, onSubmit, onCancel, loading }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string | null }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleSelectAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    const answersArray = quizData.questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] || null,
    }));

    await onSubmit(answersArray);
  };

  const currentQ = quizData.questions[currentQuestion];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Quiz Header */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quizData.fiber_name} Quiz</h2>
            <p className="text-gray-600">{quizData.study_group_name} Level</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{currentQuestion + 1}</div>
            <div className="text-gray-500">of {quizData.total_questions}</div>
          </div>
        </div>
        <Progress
          percent={((currentQuestion + 1) / quizData.total_questions) * 100}
          status="active"
        />
        <div className="mt-4 text-sm text-gray-600">
          {answeredCount} of {quizData.total_questions} questions answered
        </div>
      </Card>

      {/* Question Card */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentQ.question}</h3>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                answers[currentQ.id] === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQ.id}`}
                value={option}
                checked={answers[currentQ.id] === option}
                onChange={() => handleSelectAnswer(currentQ.id, option)}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="ml-3 text-gray-900 font-medium">{option}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          icon={<ArrowLeftOutlined />}
        >
          Previous
        </Button>

        <div className="space-x-2">
          <Button onClick={onCancel}>Cancel</Button>
          {currentQuestion < quizData.total_questions - 1 ? (
            <Button
              type="primary"
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              icon={<ArrowRightOutlined />}
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              danger
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for Quiz Results
const QuizResultsView: React.FC<{
  results: {
    attemptId: number;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  };
  quizName: string;
  onClose: () => void;
  onReview: () => void;
}> = ({ results, quizName, onClose, onReview }) => {
  const percentage = results.score;
  const rating = Math.round(percentage / 20);

  return (
    <Modal
      title="Quiz Completed!"
      open={true}
      footer={null}
      onCancel={onClose}
      centered
      width={600}
    >
      <div className="text-center py-8">
        <TrophyOutlined className="text-6xl text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{quizName}</h2>

        <div className="my-8">
          <div className="text-6xl font-bold text-blue-600">{percentage}%</div>
          <p className="text-gray-600 mt-2">Your Score</p>
        </div>

        <div className="grid grid-cols-3 gap-4 my-8">
          <Statistic
            title="Questions"
            value={results.totalQuestions}
            prefix={<FireOutlined />}
          />
          <Statistic
            title="Correct"
            value={results.correctAnswers}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
          <Statistic
            title="Accuracy"
            value={`${percentage}%`}
            prefix={<HistoryOutlined />}
          />
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Your Performance</p>
          <Rate value={rating} disabled className="text-2xl" />
        </div>

        <div className="space-y-2">
          <Button type="primary" block onClick={onReview}>
            Review Answers
          </Button>
          <Button block onClick={onClose}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Sub-component for Quiz Review Modal
const QuizReviewModal: React.FC<{
  attemptId: number;
  visible: boolean;
  onClose: () => void;
}> = ({ attemptId, visible, onClose }) => {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && attemptId) {
      const fetchReview = async () => {
        try {
          const data = await quizApi.reviewQuiz(attemptId);
          setReviewData(data);
        } catch (error) {
          message.error('Failed to load quiz review');
        } finally {
          setLoading(false);
        }
      };

      setLoading(true);
      fetchReview();
    }
  }, [attemptId, visible]);

  return (
    <Modal
      title="Quiz Review"
      open={visible}
      onCancel={onClose}
      width={800}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin />
        </div>
      ) : !reviewData ? (
        <Empty description="No review data" />
      ) : (
        <div className="space-y-4">
          {/* Quiz Header */}
          <Card className="bg-blue-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{reviewData.fiber_name}</h3>
                <p className="text-sm text-gray-600">{reviewData.study_group_name} Level</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{reviewData.score}%</div>
                <div className="text-sm text-gray-600">
                  {reviewData.correct_answers} / {reviewData.total_questions}
                </div>
              </div>
            </div>
            <Progress
              percent={reviewData.score}
              strokeColor={{
                '0%': '#ff4d4f',
                '50%': '#faad14',
                '100%': '#52c41a',
              }}
            />
          </Card>

          {/* Answer Review */}
          <div className="space-y-3">
            {reviewData.answers.map((answer: any, idx: number) => (
              <Card
                key={idx}
                size="small"
                className={`border-l-4 ${
                  answer.is_correct ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">Question {idx + 1}</h4>
                  <Tag color={answer.is_correct ? 'success' : 'error'}>
                    {answer.is_correct ? 'Correct' : 'Incorrect'}
                  </Tag>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Your Answer:</span>{' '}
                    <span className={answer.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {answer.selected_answer || '(Not answered)'}
                    </span>
                  </p>
                  {!answer.is_correct && answer.correct_answer && (
                    <p>
                      <span className="font-medium">Correct Answer:</span>{' '}
                      <span className="text-green-600 font-medium">{answer.correct_answer}</span>
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

// Sub-component for Quiz History
const QuizHistoryView: React.FC<{
  onReviewAttempt: (attemptId: number) => void;
  historyLoading?: boolean;
}> = ({ onReviewAttempt, historyLoading = false }) => {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await quizApi.getQuizHistory({ limit: 100 });
        setHistory(data.history);
      } catch (error) {
        message.error('Failed to load quiz history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin />
      </div>
    );
  }

  if (history.length === 0) {
    return <Empty description="No quiz results yet" style={{ marginTop: '50px' }} />;
  }

  // Calculate summary statistics
  const totalAttempts = history.length;
  const averageScore = Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalAttempts);
  const highestScore = Math.max(...history.map(item => item.score));
  const totalQuestionsAnswered = history.reduce((sum, item) => sum + item.total_questions, 0);
  const totalCorrectAnswers = history.reduce((sum, item) => sum + item.correct_answers, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Summary Card - Compact */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm mb-4">
        <Row gutter={[16, 8]}>
          <Col xs={12} sm={6}>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Total Attempts</div>
              <div className="text-xl font-bold text-gray-900">{totalAttempts}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Average Score</div>
              <div className="text-xl font-bold text-blue-600">{averageScore}%</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Highest Score</div>
              <div className="text-xl font-bold text-green-600">{highestScore}%</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Overall Accuracy</div>
              <div className="text-xl font-bold text-orange-500">
                {totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0}%
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* History List - Full Height */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {history.map((item) => (
          <Card key={item.id} hoverable className="shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HistoryOutlined className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{item.fiber_name}</span>
                    <Tag color="blue">{item.study_group_code}</Tag>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Attempted on {new Date(item.submitted_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Score: {item.score}% ({item.correct_answers}/{item.total_questions} correct)
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-lg font-bold text-blue-600">{item.score}%</div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => onReviewAttempt(item.id)}
                  loading={historyLoading}
                >
                  Review
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Main Assessment Tab Component
const AssessmentTab: React.FC<{ activeSubTab?: 'available' | 'results' }> = ({ activeSubTab = 'available' }) => {
  const [quizzes, setQuizzes] = useState<FiberQuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'results' | 'taking' | 'results-view'>(activeSubTab);
  const [currentQuiz, setCurrentQuiz] = useState<FiberQuizCard | null>(null);
  const [quizStartData, setQuizStartData] = useState<QuizAttemptStart | null>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReviewAttemptId, setSelectedReviewAttemptId] = useState<number | null>(null);

  // Sync activeTab with activeSubTab prop when it changes
  useEffect(() => {
    setActiveTab(activeSubTab);
  }, [activeSubTab]);

  // Load available quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await quizApi.getAvailableQuizzes();
        setQuizzes(data.quizzes);
      } catch (error) {
        message.error('Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStartQuiz = async (quiz: FiberQuizCard) => {
    try {
      setLoading(true);
      const startData = await quizApi.startQuiz(quiz.fiber_id, quiz.study_group_code);
      setCurrentQuiz(quiz);
      setQuizStartData(startData);
      setActiveTab('taking');
    } catch (error) {
      message.error('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async (answers: Array<{ question_id: number; selected_answer: string | null }>) => {
    try {
      setLoading(true);
      const results = await quizApi.submitQuiz(quizStartData!.attempt_id, answers);
      setQuizResults({
        attemptId: results.attempt_id,
        score: results.score,
        totalQuestions: results.total_questions,
        correctAnswers: results.correct_answers,
      });
      setActiveTab('results');
    } catch (error) {
      message.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewQuiz = async (_quiz: FiberQuizCard, fiberId: number) => {
    try {
      // Fetch quiz history to get the actual attempt ID
      const historyData = await quizApi.getQuizHistory({ fiber_id: fiberId, limit: 1 });
      if (historyData.history && historyData.history.length > 0) {
        const lastAttemptId = historyData.history[0].id;
        setSelectedReviewAttemptId(lastAttemptId);
        setReviewModalVisible(true);
      } else {
        message.error('No quiz attempts found');
      }
    } catch (error) {
      message.error('Failed to load quiz attempt');
    }
  };

  const handleReviewAttemptFromHistory = async (attemptId: number) => {
    setSelectedReviewAttemptId(attemptId);
    setReviewModalVisible(true);
  };

  const resetState = () => {
    setCurrentQuiz(null);
    setQuizStartData(null);
    setQuizResults(null);
    setReviewModalVisible(false);
    setSelectedReviewAttemptId(null);
    setActiveTab('available');
    // Refresh quizzes
    const fetchQuizzes = async () => {
      try {
        const data = await quizApi.getAvailableQuizzes();
        setQuizzes(data.quizzes);
      } catch (error) {
        message.error('Failed to reload quizzes');
      }
    };
    fetchQuizzes();
  };

  const renderContent = () => {
    if (activeTab === 'taking' && quizStartData) {
      return (
        <>
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <QuizTakingView
              quizData={quizStartData}
              onSubmit={handleSubmitQuiz}
              onCancel={resetState}
              loading={loading}
            />
          </div>
          {selectedReviewAttemptId && (
            <QuizReviewModal
              attemptId={selectedReviewAttemptId}
              visible={reviewModalVisible}
              onClose={() => setReviewModalVisible(false)}
            />
          )}
        </>
      );
    }

    if (activeTab === 'results-view' && quizResults && currentQuiz) {
      return (
        <>
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <QuizResultsView
              results={quizResults}
              quizName={currentQuiz.fiber_name}
              onClose={resetState}
              onReview={() => {
                setSelectedReviewAttemptId(quizResults.attemptId);
                setReviewModalVisible(true);
              }}
            />
          </div>
          {selectedReviewAttemptId && (
            <QuizReviewModal
              attemptId={selectedReviewAttemptId}
              visible={reviewModalVisible}
              onClose={() => setReviewModalVisible(false)}
            />
          )}
        </>
      );
    }

    return (
      <>
        <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="max-w-full mx-auto">
            {activeTab === 'available' && (
              <>
                <div className="mb-3">
                  <div className="flex items-center gap-3">
                    <TrophyOutlined className="text-2xl text-yellow-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Quiz Bank</h2>
                  </div>
                </div>



                <QuizCardsView
                  quizzes={quizzes}
                  loading={loading}
                  onStartQuiz={handleStartQuiz}
                  onReviewQuiz={handleReviewQuiz}
                />
              </>
            )}

            {activeTab === 'results' && (
              <div className="flex flex-col pb-4" style={{ height: 'calc(100vh - 100px)' }}>
                <div className="mb-3">
                  <div className="flex items-center gap-3">
                    <TrophyOutlined className="text-2xl text-yellow-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <QuizHistoryView
                    onReviewAttempt={handleReviewAttemptFromHistory}
                    historyLoading={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedReviewAttemptId && (
          <QuizReviewModal
            attemptId={selectedReviewAttemptId}
            visible={reviewModalVisible}
            onClose={() => setReviewModalVisible(false)}
          />
        )}
      </>
    );
  };

  return renderContent();
};

export default AssessmentTab;
