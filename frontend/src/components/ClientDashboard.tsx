import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, Layout, Menu, Card, Progress, Tag, Button, Input, Badge, Divider, Space } from 'antd';
import {
  MessageOutlined,
  SwapOutlined,
  FileTextOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  TrophyOutlined,
  RocketOutlined,
  SendOutlined,
  PlusCircleOutlined,
  DeleteOutlined,
  MenuOutlined,
  HistoryOutlined,
  CommentOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
import { useAuth } from '../contexts/AuthContext';
import { clientApi, chatbotApi } from '../services/api';
import type { OnboardingStatus, ChatbotConversationRead, FiberCard } from '../services/api';
import ClientOnboarding from './ClientOnboarding';
import ChatMessage from './ChatMessage';
import Navbar from './Navbar';
import CompareTab from './CompareTab';

const { Sider, Content: AntContent } = Layout;

interface StructureImage {
  fiber_name: string;
  image_url: string;
  fiber_id: string;
  image_cms_id?: string;
}

interface VideoPreview {
  id: number;
  fiber_id: number;
  fiber_name: string;
  video_link: string;
  title?: string;
  description?: string;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  fiberCards?: FiberCard[];
  structureImages?: StructureImage[];
  relatedVideos?: VideoPreview[];
}

// Animated thinking loader component
const ThinkingLoader: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const thinkingTexts = ['Thinking', 'Analyzing', 'Searching', 'Processing'];
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % thinkingTexts.length);
    }, 800); // Change text every 800ms

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to loader when it appears
  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  return (
    <div ref={loaderRef} className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
        AI
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm max-w-md">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 font-medium">{thinkingTexts[textIndex]}</span>
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat View Component
const ChatView: React.FC<{
  user: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  conversationId: number | null;
  setConversationId: React.Dispatch<React.SetStateAction<number | null>>;
  isConversationActive: boolean;
  setIsConversationActive: React.Dispatch<React.SetStateAction<boolean>>;
  conversationHistory: ChatbotConversationRead[];
  setConversationHistory: React.Dispatch<React.SetStateAction<ChatbotConversationRead[]>>;
  loadingHistory: boolean;
  setLoadingHistory: React.Dispatch<React.SetStateAction<boolean>>;
  showDeleteModal: boolean;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  conversationToDelete: number | null;
  setConversationToDelete: React.Dispatch<React.SetStateAction<number | null>>;
  isPanelCollapsed: boolean;
  setIsPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  user,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  isSending,
  setIsSending,
  conversationId,
  setConversationId,
  isConversationActive,
  setIsConversationActive,
  conversationHistory,
  setConversationHistory,
  loadingHistory,
  setLoadingHistory,
  showDeleteModal,
  setShowDeleteModal,
  conversationToDelete,
  setConversationToDelete,
  isPanelCollapsed,
  setIsPanelCollapsed,
}) => {
  const fetchConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await chatbotApi.getHistory(20);
      setConversationHistory(history);
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await chatbotApi.startConversation();
      setConversationId(response.conversation_id);
      setIsConversationActive(true);
      setMessages([{ role: 'ai', content: 'Hello! How can I assist you with textile and fiber questions today?' }]);
      fetchConversationHistory();
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const loadConversation = async (conversation: ChatbotConversationRead) => {
    setConversationId(conversation.id);
    setIsConversationActive(conversation.is_active);
    setMessages(conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'ai',
      content: msg.content
    })));
  };

  const openDeleteModal = (deleteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(deleteId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      await chatbotApi.deleteConversation(conversationToDelete);

      if (conversationToDelete === conversationId) {
        setConversationId(null);
        setMessages([]);
        setIsConversationActive(false);
      }

      fetchConversationHistory();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
      closeDeleteModal();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !conversationId) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      if (!isConversationActive) {
        await chatbotApi.continueConversation(conversationId);
        setIsConversationActive(true);
        fetchConversationHistory();
      }

      const response = await chatbotApi.sendMessage(userMessage, conversationId);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.response,
        fiberCards: response.fiber_cards,
        structureImages: response.structure_images,
        relatedVideos: response.related_videos
      }]);

      fetchConversationHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    fetchConversationHistory();
  }, []);

  return (
    <>
      <div className="flex gap-4 p-4 h-full overflow-hidden">
        {/* Collapsed Panel - Floating Buttons */}
        {isPanelCollapsed && (
          <div className="flex flex-col gap-2">
            <Tooltip title="Show Chat History" placement="right">
              <Button
                shape="circle"
                icon={<HistoryOutlined />}
                onClick={() => setIsPanelCollapsed(false)}
                className="shadow-lg"
              />
            </Tooltip>
            <Divider className="my-2" />
            <Tooltip title="New Conversation" placement="right">
              <Button
                type="primary"
                shape="circle"
                icon={<PlusCircleOutlined />}
                onClick={handleNewChat}
                className="shadow-lg"
              />
            </Tooltip>
          </div>
        )}

        {/* Side Panel - Conversation History */}
        {!isPanelCollapsed && (
          <div className="w-80 flex-shrink-0 h-full flex flex-col">
            <Card className="h-full shadow-md flex flex-col" styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <Space>
                    <HistoryOutlined className="text-blue-600 text-lg" />
                    <h3 className="text-lg font-semibold text-gray-900 m-0">Chat History</h3>
                  </Space>
                  <Tooltip title="Hide Panel">
                    <Button
                      type="text"
                      size="small"
                      icon={<MenuOutlined />}
                      onClick={() => setIsPanelCollapsed(true)}
                    />
                  </Tooltip>
                </div>
                <Button
                  type="primary"
                  block
                  icon={<PlusCircleOutlined />}
                  onClick={handleNewChat}
                  className="shadow-sm"
                >
                  New Conversation
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading conversations...</p>
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <CommentOutlined className="text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm font-medium mb-1">No conversations yet</p>
                    <p className="text-gray-400 text-xs">Start a new chat to begin</p>
                  </div>
                ) : (
                  <Space direction="vertical" size="small" className="w-full">
                    {conversationHistory.map((conversation) => (
                      <Card
                        key={conversation.id}
                        hoverable
                        size="small"
                        onClick={() => loadConversation(conversation)}
                        className={`cursor-pointer transition-all ${
                          conversationId === conversation.id
                            ? 'border-2 border-blue-500 shadow-md'
                            : 'border border-gray-200'
                        }`}
                        styles={{ body: { padding: '12px' } }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <CommentOutlined className={conversationId === conversation.id ? 'text-blue-600' : 'text-gray-400'} />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {new Date(conversation.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {conversation.is_active && (
                              <Badge status="success" />
                            )}
                            <Tooltip title="Delete">
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => openDeleteModal(conversation.id, e)}
                              />
                            </Tooltip>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {conversation.messages[0]?.content || 'New conversation'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {new Date(conversation.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Tag color={conversation.is_active ? 'blue' : 'default'} className="text-xs m-0">
                            {conversation.messages.length} messages
                          </Tag>
                        </div>
                      </Card>
                    ))}
                  </Space>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div className="flex-shrink-0 mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {conversationId ? 'Chat' : 'AI Chatbot'}
            </h2>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!conversationId || messages.length === 0 ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-12 text-center flex-1 flex items-center justify-center overflow-y-auto">
                <div className="max-w-md">
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <RobotOutlined className="text-4xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to AI Chatbot</h3>
                  <p className="text-gray-600 text-base mb-6">
                    I'm here to help you with textile and fiber-related questions. Ask me anything!
                  </p>
                  <div className="flex flex-col gap-2 mb-6">
                    <Button
                      type="primary"
                      size="large"
                      icon={<RocketOutlined />}
                      onClick={handleNewChat}
                      className="shadow-md"
                    >
                      Start New Conversation
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2 font-medium">Try asking about:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Tag color="blue">Fiber properties</Tag>
                      <Tag color="cyan">Material comparisons</Tag>
                      <Tag color="geekblue">Textile structures</Tag>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Messages */}
                <div className="flex-1 bg-gray-50 rounded-lg p-6 space-y-4 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <ChatMessage
                      key={index}
                      role={msg.role}
                      content={msg.content}
                      fiberCards={msg.fiberCards}
                      structureImages={msg.structureImages}
                      relatedVideos={msg.relatedVideos}
                      userName={user.full_name || 'U'}
                    />
                  ))}
                  {isSending && <ThinkingLoader />}
                </div>

                {/* Chat Input - Fixed at bottom */}
                {/* <div className="p-6 flex-shrink-0"> */}
                  <div className="w-full p-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow duration-200">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <TextArea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isConversationActive ? "Type your message..." : "Type to continue this conversation..."}
                            disabled={isSending}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            className="border-0 focus:shadow-none resize-none"
                            style={{
                              fontSize: '15px',
                              padding: '8px 0'
                            }}
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleSendMessage}
                          disabled={isSending || !inputMessage.trim()}
                          loading={isSending}
                          className="shadow-md hover:shadow-lg transition-all duration-200"
                          style={{
                            height: '48px',
                            borderRadius: '12px',
                            background: isSending || !inputMessage.trim() ? undefined : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                            border: 'none'
                          }}
                        >
                          {!isSending && 'Send'}
                        </Button>
                      </div>
                    </div>

                    {/* Helper text for first time users */}
                    {!conversationId && (
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                          <span>💡</span>
                          <span>Tip: Ask questions about textile fibers, properties, or comparisons</span>
                        </p>
                      </div>
                    )}
                  </div>
                {/* </div> */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-700 text-base">
                Are you sure you want to delete this conversation? All messages and chat history will be permanently removed.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
              >
                Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Assessments View Component
const AssessmentsView: React.FC = () => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrophyOutlined className="text-3xl text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">Your Assessments</h2>
          </div>
          <p className="text-gray-600">Track your progress and complete assessments to improve your skills</p>
        </div>

        {/* Overall Progress Card */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Progress</h3>
              <p className="text-sm text-gray-600">You've completed 1 out of 3 assessments</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">33%</div>
              <div className="text-xs text-gray-500">Completion Rate</div>
            </div>
          </div>
          <Progress
            percent={33}
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
            status="active"
          />
        </Card>

        {/* Assessments List */}
        <div className="space-y-4">
          {/* Assessment 1 - Completed */}
          <Card
            hoverable
            className="shadow-sm border-l-4 border-l-green-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircleOutlined className="text-2xl text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">Initial Skills Assessment</h3>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Completed
                    </Tag>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Basic skills evaluation to understand your current level of textile and fiber knowledge
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>📅 Completed on: Jan 15, 2025</span>
                    <span>⏱️ Duration: 30 minutes</span>
                    <span>📊 Score: 85/100</span>
                  </div>
                  <Progress percent={85} strokeColor="#52c41a" showInfo={false} />
                </div>
              </div>
              <Button type="primary" ghost>
                View Results
              </Button>
            </div>
          </Card>

          {/* Assessment 2 - In Progress */}
          <Card
            hoverable
            className="shadow-sm border-l-4 border-l-yellow-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClockCircleOutlined className="text-2xl text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">Mid-Level Progress Check</h3>
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                      In Progress
                    </Tag>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Assessment to track your learning progress and identify areas for improvement
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>📅 Started on: Jan 20, 2025</span>
                    <span>⏱️ Duration: 45 minutes</span>
                    <span>📝 Progress: 12/20 questions</span>
                  </div>
                  <Progress percent={60} status="active" strokeColor="#faad14" showInfo={false} />
                </div>
              </div>
              <Button type="primary">
                Continue Assessment
              </Button>
            </div>
          </Card>

          {/* Assessment 3 - Locked */}
          <Card
            className="shadow-sm border-l-4 border-l-gray-300 opacity-75"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LockOutlined className="text-2xl text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-700">Advanced Certification Test</h3>
                    <Tag color="default" icon={<LockOutlined />}>
                      Locked
                    </Tag>
                  </div>
                  <p className="text-gray-500 mb-3">
                    Final comprehensive assessment for certification eligibility
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span>📅 Available from: Feb 1, 2025</span>
                    <span>⏱️ Duration: 60 minutes</span>
                    <span>🎯 Passing Score: 80%</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <p className="text-sm text-yellow-800">
                      Complete the Mid-Level Progress Check to unlock this assessment
                    </p>
                  </div>
                </div>
              </div>
              <Button disabled>
                Locked
              </Button>
            </div>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-2">
                Assessments help you track your progress and identify areas where you can improve. Take your time and review the learning materials before starting.
              </p>
              <Button type="link" className="p-0 h-auto text-blue-600">
                View Study Materials →
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatbotConversationRead[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && user.user_type === 'client') {
        try {
          const status = await clientApi.getOnboardingStatus();
          setOnboardingStatus(status);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, [user]);

  const getSelectedKey = () => {
    if (location.pathname.includes('/chat')) return 'chat';
    if (location.pathname.includes('/compare')) return 'compare';
    if (location.pathname.includes('/assessments')) return 'assessments';
    return 'chat';
  };

  const menuItems = [
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Chat',
      onClick: () => navigate('/dashboard/chat'),
    },
    {
      key: 'compare',
      icon: <SwapOutlined />,
      label: 'Compare',
      onClick: () => navigate('/dashboard/compare'),
    },
    {
      key: 'assessments',
      icon: <FileTextOutlined />,
      label: 'Assessments',
      onClick: () => navigate('/dashboard/assessments'),
    },
  ];

  if (!user || user.user_type !== 'client') {
    return <div className="loading">Access denied...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (onboardingStatus?.needs_onboarding) {
    return <ClientOnboarding />;
  }

  return (
    <>
      <Navbar tabs={[]} />
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <Sider width={250} theme="light" className="border-r border-gray-200">
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            className="border-r-0"
            style={{ height: '100%' }}
          />
        </Sider>

        {/* Main Content */}
        <AntContent className="overflow-hidden bg-gray-50">
          <div className="h-full">
            <Routes>
              <Route
                path="chat"
                element={
                  <div className="h-full">
                    <ChatView
                      user={user}
                      messages={messages}
                      setMessages={setMessages}
                      inputMessage={inputMessage}
                      setInputMessage={setInputMessage}
                      isSending={isSending}
                      setIsSending={setIsSending}
                      conversationId={conversationId}
                      setConversationId={setConversationId}
                      isConversationActive={isConversationActive}
                      setIsConversationActive={setIsConversationActive}
                      conversationHistory={conversationHistory}
                      setConversationHistory={setConversationHistory}
                      loadingHistory={loadingHistory}
                      setLoadingHistory={setLoadingHistory}
                      showDeleteModal={showDeleteModal}
                      setShowDeleteModal={setShowDeleteModal}
                      conversationToDelete={conversationToDelete}
                      setConversationToDelete={setConversationToDelete}
                      isPanelCollapsed={isPanelCollapsed}
                      setIsPanelCollapsed={setIsPanelCollapsed}
                    />
                  </div>
                }
              />
              <Route path="compare" element={<div className="h-full overflow-y-auto"><CompareTab /></div>} />
              <Route path="assessments" element={<AssessmentsView />} />
              <Route path="*" element={<Navigate to="chat" replace />} />
            </Routes>
          </div>
        </AntContent>
      </Layout>
    </>
  );
};

export default ClientDashboard;