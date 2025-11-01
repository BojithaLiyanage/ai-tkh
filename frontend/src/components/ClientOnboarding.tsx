import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, type OnboardingData, type OnboardingAnswer } from '../services/api';

const ClientOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Refresh the page to show the main dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save onboarding data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Our Textile Platform!</h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 mb-4">
              Our comprehensive textile knowledge platform provides cutting-edge information about fibers, their properties, applications, and sustainability aspects. Whether you're conducting research, working in industry, or studying textiles, our platform offers detailed insights into:
            </p>
            <ul className="text-left text-gray-600 space-y-2 mb-6">
              <li>• Extensive fiber database with detailed properties and classifications</li>
              <li>• Advanced search and filtering capabilities for textile materials</li>
              <li>• Sustainability metrics and environmental impact assessments</li>
              <li>• Application-specific recommendations and industry insights</li>
              <li>• Latest research findings and technological developments</li>
            </ul>
            <p className="text-gray-700">
              To provide you with the most relevant content and experience, we'd like to understand your background in textile-related domains.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                  answers[currentStep]?.answer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question_${currentStep}`}
                  value={option}
                  checked={answers[currentStep]?.answer === option}
                  onChange={() => handleAnswer(currentStep, option, currentQuestion.scores[index])}
                  className="sr-only"
                />
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    answers[currentStep]?.answer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentStep]?.answer === option && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="text-gray-700">{option}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-md font-medium ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors duration-200'
            }`}
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!answers[currentStep]?.answer || isSubmitting}
            className={`px-6 py-2 rounded-md font-medium ${
              !answers[currentStep]?.answer || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200'
            }`}
          >
            {isSubmitting ? 'Submitting...' : currentStep === questions.length - 1 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;