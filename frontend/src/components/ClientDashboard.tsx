import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, OnboardingStatus, chatbotApi } from '../services/api';
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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! How can I assist you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const response = await chatbotApi.sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: response.response }]);
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
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Chatbot</h2>

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

              {/* Chat Input */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
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