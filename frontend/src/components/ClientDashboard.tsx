import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, OnboardingStatus, chatbotApi, ChatbotConversationRead } from '../services/api';
import ClientOnboarding from './ClientOnboarding';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chatbot' | 'assessments'>('chatbot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatbotConversationRead[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // Fetch conversation history when chatbot tab is active
  useEffect(() => {
    if (activeTab === 'chatbot' && user) {
      fetchConversationHistory();
    }
  }, [activeTab, user]);

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
      // Refresh history to show new chat
      fetchConversationHistory();
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const loadConversation = async (conversation: ChatbotConversationRead) => {
    // Set the conversation as active or inactive based on its state
    setConversationId(conversation.id);
    setIsConversationActive(conversation.is_active);

    // Load the conversation messages
    setMessages(conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'ai',
      content: msg.content
    })));

    // If it's an inactive conversation, reactivate it when user starts typing
    // This will be handled in handleSendMessage
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !conversationId) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      // If conversation is inactive, reactivate it first
      if (!isConversationActive) {
        await chatbotApi.continueConversation(conversationId);
        setIsConversationActive(true);
        fetchConversationHistory(); // Refresh to update active status
      }

      const response = await chatbotApi.sendMessage(userMessage, conversationId);
      setMessages(prev => [...prev, { role: 'ai', content: response.response }]);

      // Refresh history to show updated message count
      fetchConversationHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    <div className="max-w-7xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6 flex justify-between items-center flex-wrap">
        <div>
          <h1 className="text-gray-900 text-3xl font-semibold mb-2.5">Client Dashboard</h1>
          <p className="my-1.5 text-gray-600 text-base">Welcome, {user.full_name}!</p>
        </div>
        <button
          onClick={logout}
          className="w-auto px-5 py-2.5 bg-red-600 text-white border-none rounded-md text-sm font-medium cursor-pointer ml-5 transition-colors duration-200 hover:bg-red-700 sm:w-auto sm:ml-5 max-sm:w-full max-sm:ml-0 max-sm:mt-4"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors duration-200 ${
              activeTab === 'chatbot'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Chatbot
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors duration-200 ${
              activeTab === 'assessments'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Assessments
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'chatbot' && (
            <div className="flex gap-6">
              {/* Side Panel - Conversation History */}
              <div className="w-80 bg-white border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Chats</h3>
                  <button
                    onClick={handleNewChat}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + New Chat
                  </button>
                </div>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No past conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversationHistory.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => loadConversation(conversation)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          conversationId === conversation.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(conversation.started_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {conversation.messages.length} msgs
                            </span>
                            {conversation.is_active && (
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.messages[0]?.content || 'New conversation'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.started_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {conversationId ? 'Chat' : 'AI Chatbot'}
                </h2>

                {!conversationId || messages.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center min-h-[400px] flex items-center justify-center">
                    <div>
                      <p className="text-gray-500 text-lg mb-4">Click "+ New Chat" to start a conversation</p>
                      <p className="text-gray-400 text-sm">Or select a past conversation from the left panel</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Messages */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {messages.map((msg, index) => (
                      msg.role === 'ai' ? (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                            AI
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm max-w-md">
                            <p className="text-gray-800">{msg.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div key={index} className="flex items-start space-x-3 justify-end">
                          <div className="bg-blue-600 text-white p-4 rounded-lg shadow-sm max-w-md">
                            <p>{msg.content}</p>
                          </div>
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                            {user.full_name?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )
                    ))}
                    {isSending && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          AI
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm max-w-md">
                          <p className="text-gray-500">Typing...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input - Always show when conversation is loaded */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isConversationActive ? "Type your message..." : "Type to continue this conversation..."}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending || !inputMessage.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

          {activeTab === 'assessments' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Assessments</h2>

              {/* Assessment List */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Initial Skills Assessment</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">Basic skills evaluation to understand your current level</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Completed on: Jan 15, 2025</span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">View Results</button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Mid-Level Progress Check</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">Assessment to track your learning progress</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Started on: Jan 20, 2025</span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">Continue</button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Certification Test</h3>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                      Not Started
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">Final assessment for certification eligibility</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Available from: Feb 1, 2025</span>
                    <button className="text-gray-400 cursor-not-allowed font-medium">Locked</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;