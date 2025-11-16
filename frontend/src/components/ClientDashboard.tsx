import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, Layout, Menu, Card, Tag, Button, Input, Badge, Divider, Space } from 'antd';
import {
  MessageOutlined,
  SwapOutlined,
  FileTextOutlined,
  RobotOutlined,
  RocketOutlined,
  SendOutlined,
  PlusCircleOutlined,
  DeleteOutlined,
  MenuOutlined,
  HistoryOutlined,
  CommentOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
import { useAuth } from '../contexts/AuthContext';
import { clientApi, chatbotApi } from '../services/api';
import type { OnboardingStatus, ChatbotConversationRead, FiberCard } from '../services/api';
import ClientOnboarding from './ClientOnboarding';
import ChatMessage from './ChatMessage';
import Navbar from './Navbar';
import { ChartComparisonView, PairComparisonView } from './CompareTab';
import AssessmentTab from './AssessmentTab';

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
      <Layout className="h-full" style={{ background: 'transparent' }}>
        {/* Ant Design Sider for Chat History */}
        <Sider
          collapsible
          collapsed={isPanelCollapsed}
          onCollapse={(collapsed) => setIsPanelCollapsed(collapsed)}
          trigger={null}
          collapsedWidth={60}
          width={320}
          theme="light"
          className="shadow-md relative"
          style={{
            background: '#fff',
            overflow: 'hidden',
            transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          {/* Collapsed State - Icon Buttons */}
          <div
            className="absolute inset-0 flex flex-col items-center pt-4 transition-opacity duration-300"
            style={{
              opacity: isPanelCollapsed ? 1 : 0,
              visibility: isPanelCollapsed ? 'visible' : 'hidden',
              pointerEvents: isPanelCollapsed ? 'auto' : 'none',
              zIndex: isPanelCollapsed ? 2 : 1,
            }}
          >
            <Tooltip title="Show Chat History" placement="right">
              <Button
                shape="circle"
                size="large"
                icon={<HistoryOutlined />}
                onClick={() => setIsPanelCollapsed(false)}
                className="shadow-lg hover:shadow-xl transition-all duration-200"
              />
            </Tooltip>
            <Divider className="my-2 w-8" />
            <Tooltip title="New Conversation" placement="right">
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<PlusCircleOutlined />}
                onClick={handleNewChat}
                className="shadow-lg hover:shadow-xl transition-all duration-200"
              />
            </Tooltip>
          </div>

          {/* Expanded State - Full Panel */}
          <div
            className="absolute inset-0 flex flex-col transition-opacity duration-300"
            style={{
              opacity: isPanelCollapsed ? 0 : 1,
              visibility: isPanelCollapsed ? 'hidden' : 'visible',
              pointerEvents: isPanelCollapsed ? 'none' : 'auto',
              zIndex: isPanelCollapsed ? 1 : 2,
            }}
          >
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                <Space>
                  <HistoryOutlined className="text-blue-600 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900 m-0 whitespace-nowrap overflow-hidden">
                    Chat History
                  </h3>
                </Space>
                <Tooltip title="Collapse Panel">
                  <Button
                    type="text"
                    size="small"
                    icon={<MenuOutlined />}
                    onClick={() => setIsPanelCollapsed(true)}
                    className="hover:bg-gray-100 transition-colors duration-200"
                  />
                </Tooltip>
              </div>
              <Button
                type="primary"
                block
                icon={<PlusCircleOutlined />}
                onClick={handleNewChat}
                className="shadow-sm transition-all duration-200"
              >
                New Conversation
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
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
                      className={`cursor-pointer transition-all duration-200 ${
                        conversationId === conversation.id
                          ? 'border-2 border-blue-500 shadow-md'
                          : 'border border-gray-200'
                      }`}
                      styles={{ body: { padding: '12px', minHeight: '100px',height:"100px" } }}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between mb-2 flex-shrink-0">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CommentOutlined className={`flex-shrink-0 ${conversationId === conversation.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {new Date(conversation.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
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
                        <p className="text-xs text-gray-600 mb-2 flex-1 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.4em',
                          maxHeight: '2.8em'
                        }}>
                          {conversation.messages[0]?.content || 'New conversation'}
                        </p>
                        <div className="flex items-center justify-between flex-shrink-0">
                          <span className="text-xs text-gray-400 truncate">
                            {new Date(conversation.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Tag color={conversation.is_active ? 'blue' : 'default'} className="text-xs m-0 flex-shrink-0 overflow-hidden">
                            {conversation.messages.length} msg
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </div>
          </div>
        </Sider>

        {/* Main Chat Area */}
        <AntContent className="flex-1 flex flex-col min-w-0 h-full p-4" style={{ background: 'transparent' }}>
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
        </AntContent>
      </Layout>

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
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(true);

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
    if (location.pathname.includes('/chat')) return ['chat'];
    if (location.pathname.includes('/compare/chart')) return ['chart-comparison'];
    if (location.pathname.includes('/compare/pair')) return ['pair-comparison'];
    if (location.pathname.includes('/compare')) return ['chart-comparison']; // Default to chart
    if (location.pathname.includes('/assessments')) return ['assessments'];
    return ['chat'];
  };

  const getOpenKeys = () => {
    if (location.pathname.includes('/compare')) return ['compare'];
    return [];
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
      children: [
        {
          key: 'chart-comparison',
          icon: <BarChartOutlined />,
          label: 'Chart Comparison',
          onClick: () => navigate('/dashboard/compare/chart'),
        },
        {
          key: 'pair-comparison',
          icon: <LineChartOutlined />,
          label: 'Pair Comparison',
          onClick: () => navigate('/dashboard/compare/pair'),
        },
      ],
    },
    {
      key: 'assessments',
      icon: <FileTextOutlined />,
      label: 'Assessments',
      children: [
        {
          key: 'assessments-available',
          label: 'Available Quizzes',
          onClick: () => navigate('/dashboard/assessments/available'),
        },
        {
          key: 'assessments-results',
          label: 'Results',
          onClick: () => navigate('/dashboard/assessments/results'),
        },
      ],
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
        {/* Sidebar - Hover to Expand */}
        <Sider
          collapsible
          collapsed={isMainSidebarCollapsed}
          onCollapse={(collapsed) => setIsMainSidebarCollapsed(collapsed)}
          trigger={null}
          width={250}
          collapsedWidth={80}
          theme="light"
          className="border-r border-gray-200"
          style={{
            overflow: 'auto',
            transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
          onMouseEnter={() => setIsMainSidebarCollapsed(false)}
          onMouseLeave={() => setIsMainSidebarCollapsed(true)}
        >
          <Menu
            mode="inline"
            selectedKeys={getSelectedKey()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            className="border-r-0"
            style={{ height: '100%' }}
            inlineCollapsed={isMainSidebarCollapsed}
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
              <Route path="compare/chart" element={<div className="h-full overflow-y-auto"><ChartComparisonView /></div>} />
              <Route path="compare/pair" element={<div className="h-full overflow-y-auto"><PairComparisonView /></div>} />
              <Route path="compare" element={<Navigate to="compare/chart" replace />} />
              <Route path="assessments/available" element={<AssessmentTab activeSubTab="available" />} />
              <Route path="assessments/results" element={<AssessmentTab activeSubTab="results" />} />
              <Route path="assessments" element={<Navigate to="assessments/available" replace />} />
              <Route path="*" element={<Navigate to="chat" replace />} />
            </Routes>
          </div>
        </AntContent>
      </Layout>
    </>
  );
};

export default ClientDashboard;