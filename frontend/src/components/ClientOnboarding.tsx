import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, type OnboardingData, type OnboardingAnswer } from '../services/api';
import {
  Card,
  Radio,
  Button,
  Progress,
  Space,
  Typography,
  Spin,
  message,
  Row,
  Col,
  Tag
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import FiberBackground from './FiberBackground';

const { Title, Text, Paragraph } = Typography;

// Animation styles
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .onboarding-welcome {
    animation: fadeInUp 0.6s ease-out;
  }

  .onboarding-question {
    animation: slideInRight 0.4s ease-out;
  }

  .onboarding-option {
    animation: fadeInUp 0.3s ease-out;
  }

  .onboarding-button {
    transition: all 0.3s ease;
  }

  .onboarding-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
  }

  .onboarding-progress {
    animation: slideInLeft 0.4s ease-out;
  }

  .onboarding-option-selected {
    animation: pulse 0.3s ease-out;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeInMessage {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOutMessage {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-10px);
    }
  }

  .loading-spinner {
    animation: spin 3s linear infinite;
  }

  .loading-message {
    animation: fadeInMessage 0.5s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const loadingMessages = [
  'Setting up your profile...',
  'Personalizing your experience...',
  'Preparing your dashboard...',
  'Loading your textile knowledge...',
  'Almost there...'
];

const ClientOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  // Questions for different client types
  const getQuestionsForClientType = (clientType: string) => {
    const questions = {
      researcher: [
        {
          question: "How would you rate your understanding of textile fiber classification systems?",
          options: ["Beginner", "Intermediate", "Advanced", "Expert"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your experience with textile testing standards and methodologies?",
          options: ["No experience", "Basic knowledge", "Moderate experience", "Extensive experience"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How familiar are you with polymer chemistry related to textile fibers?",
          options: ["Not familiar", "Basic understanding", "Good understanding", "Expert level"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your experience with fiber property analysis techniques?",
          options: ["None", "Limited", "Good", "Extensive"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How well do you understand sustainable textile practices and biodegradability?",
          options: ["Basic awareness", "Some knowledge", "Good understanding", "Expert knowledge"],
          scores: [1, 2, 3, 4]
        }
      ],
      industry_expert: [
        {
          question: "How extensive is your experience in textile manufacturing processes?",
          options: ["Limited", "Moderate", "Extensive", "Expert level"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your knowledge level regarding fiber applications in different industries?",
          options: ["Basic", "Good", "Advanced", "Expert"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How familiar are you with textile quality control and testing procedures?",
          options: ["Basic knowledge", "Working knowledge", "Advanced knowledge", "Expert level"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your understanding of textile market trends and consumer demands?",
          options: ["Limited", "Good", "Strong", "Expert level"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How well do you understand sustainability issues in the textile industry?",
          options: ["Basic awareness", "Good understanding", "Deep knowledge", "Leading expert"],
          scores: [1, 2, 3, 4]
        }
      ],
      student: [
        {
          question: "What is your current level of study in textiles or related fields?",
          options: ["Just starting", "Intermediate courses", "Advanced courses", "Final year/thesis"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How familiar are you with basic textile terminology?",
          options: ["Not familiar", "Some knowledge", "Fairly familiar", "Very familiar"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your understanding of different types of textile fibers?",
          options: ["Basic knowledge", "Good understanding", "Comprehensive knowledge", "Expert level"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How comfortable are you with textile testing and analysis concepts?",
          options: ["Not comfortable", "Somewhat comfortable", "Comfortable", "Very comfortable"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your experience with textile research methods?",
          options: ["No experience", "Basic exposure", "Some experience", "Good experience"],
          scores: [1, 2, 3, 4]
        }
      ],
      undergraduate: [
        {
          question: "How would you describe your current knowledge of textiles?",
          options: ["Complete beginner", "Some basic knowledge", "Moderate knowledge", "Good foundation"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "Are you familiar with different types of textile materials?",
          options: ["Not at all", "A little", "Somewhat", "Yes, quite familiar"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your understanding of how textiles are made?",
          options: ["No understanding", "Basic idea", "Good understanding", "Detailed knowledge"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "How interested are you in learning about textile science?",
          options: ["Slightly interested", "Moderately interested", "Very interested", "Extremely interested"],
          scores: [1, 2, 3, 4]
        },
        {
          question: "What is your experience with scientific research or analysis?",
          options: ["No experience", "Some exposure", "Good experience", "Extensive experience"],
          scores: [1, 2, 3, 4]
        }
      ]
    };

    return questions[clientType as keyof typeof questions] || questions.student;
  };

  const clientType = user?.client?.client_type || 'student';
  const questions = getQuestionsForClientType(clientType);

  // Handle loading message rotation
  useEffect(() => {
    if (!showLoadingScreen) return;

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1200); // Change message every 1.2 seconds

    return () => clearInterval(messageInterval);
  }, [showLoadingScreen]);

  // Handle 5-second timer for loading screen
  useEffect(() => {
    if (!showLoadingScreen) return;

    const timer = setTimeout(() => {
      window.location.reload();
    }, 5000); // Force reload after 5 seconds

    return () => clearTimeout(timer);
  }, [showLoadingScreen]);

  const handleAnswer = (questionIndex: number, answer: string, score: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = {
      question: questions[questionIndex].question,
      answer,
      score
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateKnowledgeLevel = () => {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxScore = questions.length * 4;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage >= 80) return 'Expert';
    if (percentage >= 60) return 'Advanced';
    if (percentage >= 40) return 'Intermediate';
    return 'Beginner';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const onboardingData: OnboardingData = {
        answers,
        knowledge_level: calculateKnowledgeLevel()
      };

      await clientApi.submitOnboarding(onboardingData);
      message.success('Onboarding completed!');

      // Show loading screen for 5 seconds before reloading
      setShowLoadingScreen(true);
      setLoadingMessageIndex(0);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      message.error('Failed to save onboarding data. Please try again.');
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="w-full flex justify-center items-center min-h-screen p-5 bg-gray-50 relative overflow-hidden">
      <FiberBackground />
      {/* Loading Screen */}
      {showLoadingScreen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            textAlign: 'center'
          }}>
            {/* Spinner */}
            <div
              className="loading-spinner"
              style={{
                width: '80px',
                height: '80px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid rgba(24, 144, 255, 1)',
                borderRadius: '50%'
              }}
            />

            {/* Loading Message */}
            <div
              key={loadingMessageIndex}
              className="loading-message"
              style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                minHeight: '28px'
              }}
            >
              {loadingMessages[loadingMessageIndex]}
            </div>

            {/* Progress Indicator */}
            <div style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center'
            }}>
              {loadingMessages.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: index === loadingMessageIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Spin spinning={isSubmitting && !showLoadingScreen} tip="Saving your profile...">
        <Card
          className="w-full max-w-md shadow-lg relative z-10"
          style={{
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 32px',
            overflow: 'hidden'
          }}
          bordered={false}
        >
          {/* Background decoration */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(102, 126, 234, 0.1)',
              pointerEvents: 'none'
            }}
          />

          {!onboardingStarted ? (
            // Welcome Screen
            <div className="onboarding-welcome" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <Title
                    level={2}
                    style={{
                      marginBottom: '16px',
                      color: '#1f2937',
                      fontSize: '32px',
                      fontWeight: 700
                    }}
                  >
                  Hi {user?.full_name},  Welcome Onborad!
                  </Title>
                  <Tag
                    color="blue"
                    style={{
                      padding: '6px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {user?.client?.client_type?.replace('_', ' ')}
                  </Tag>
                </div>

                <Paragraph
                  style={{
                    color: '#4b5563',
                    fontSize: '15px',
                    lineHeight: 1.8,
                    marginBottom: '28px'
                  }}
                >
                  We're excited to have you! Let's personalize your experience with a quick setup.
                </Paragraph>

                <div
                  style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '10px',
                    marginBottom: '28px'
                  }}
                >
                  <Paragraph
                    style={{
                      color: '#667eea',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    What's next?
                  </Paragraph>
                  <ul
                    style={{
                      textAlign: 'left',
                      color: '#4b5563',
                      fontSize: '13px',
                      lineHeight: '1.8',
                      paddingLeft: '20px',
                      margin: 0
                    }}
                  >
                    <li style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#667eea', fontWeight: 600 }}>✓</span> {questions.length} quick questions
                    </li>
                    <li style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#667eea', fontWeight: 600 }}>✓</span> Takes ~2 minutes
                    </li>
                    <li>
                      <span style={{ color: '#667eea', fontWeight: 600 }}>✓</span> No wrong answers
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                block
                size="large"
                type="primary"
                onClick={() => setOnboardingStarted(true)}
                className="onboarding-button"
                style={{
                  height: '44px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '8px'
                }}
              >
                Start Setup
              </Button>
            </div>
          ) : (
            // Questionnaire Screen
            <div className="onboarding-question" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative', zIndex: 1 }}>
              {/* Progress Section */}
              <div className="onboarding-progress">
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    strong
                    style={{
                      fontSize: '12px',
                      color: '#667eea',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Question {currentStep + 1} of {questions.length}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {Math.round(progress)}%
                  </Text>
                </div>
                <Progress
                  percent={Math.round(progress)}
                  strokeColor={{
                    '0%': '#667eea',
                    '100%': '#764ba2'
                  }}
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* Question Section */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '20px' }}>
                <Title
                  level={5}
                  style={{
                    color: '#1f2937',
                    marginBottom: '20px',
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: 1.6
                  }}
                >
                  {currentQuestion.question}
                </Title>

                <Radio.Group
                  onChange={(e) => {
                    const selectedIndex = currentQuestion.options.indexOf(e.target.value);
                    handleAnswer(currentStep, e.target.value, currentQuestion.scores[selectedIndex]);
                  }}
                  value={answers[currentStep]?.answer}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="onboarding-option"
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${index * 0.1}s backwards`
                      }}
                    >
                      <div
                        style={{
                          padding: '14px 16px',
                          border: answers[currentStep]?.answer === option ? '2px solid #667eea' : '1px solid #e5e7eb',
                          background: answers[currentStep]?.answer === option ? 'rgba(102, 126, 234, 0.08)' : '#fff',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          ...(answers[currentStep]?.answer === option && {
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                          })
                        }}
                        onClick={() => handleAnswer(currentStep, option, currentQuestion.scores[index])}
                      >
                        <Radio value={option} style={{ width: '100%' }}>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                            {option}
                          </span>
                        </Radio>
                      </div>
                    </div>
                  ))}
                </Radio.Group>
              </div>

              {/* Navigation Buttons */}
              <Row gutter={10} style={{ marginTop: '24px' }}>
                <Col span={12}>
                  <Button
                    block
                    onClick={handleBack}
                    disabled={currentStep === 0 || isSubmitting}
                    className="onboarding-button"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  >
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    onClick={handleNext}
                    disabled={!answers[currentStep]?.answer || isSubmitting}
                    loading={isSubmitting}
                    className="onboarding-button"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  >
                    {currentStep === questions.length - 1 ? (
                      <>
                        <CheckCircleOutlined style={{ marginRight: '6px' }} />
                        Complete
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default ClientOnboarding;