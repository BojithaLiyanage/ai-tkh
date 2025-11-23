import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Enable sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onError: (error: any) => void;
}> = [];

const processQueue = (error?: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onError(error);
    } else {
      // With cookie-based auth, we don't need to pass token
      prom.onSuccess('');
    }
  });

  failedQueue = [];
};

api.interceptors.request.use((config) => {
  // Tokens are now managed via httpOnly cookies and sent automatically
  // No need to manually set Authorization header
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((onSuccess, onError) => {
          failedQueue.push({ onSuccess, onError });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // With cookie-based auth, refresh endpoint will return new tokens
        // and set them as httpOnly cookies automatically
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: '' },  // Empty body, tokens come from cookies
          { withCredentials: true }  // Ensure cookies are sent
        );

        // Tokens are now in cookies, no need to store them
        processQueue();
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        // Clear localStorage (only user data stored there)
        localStorage.removeItem('user_details');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export type ClientType = 'researcher' | 'industry_expert' | 'student' | 'undergraduate';

export interface Client {
  id: number;
  user_id: number;
  client_type: ClientType;
  organization?: string;
  specialization?: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: 'super_admin' | 'admin' | 'client';
  is_active: boolean;
  created_at: string;
  client?: Client;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  user_type?: 'super_admin' | 'admin' | 'client';
  client_type: ClientType;
  organization?: string;
  specialization?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface UserUpdate {
  full_name?: string;
  user_type?: 'super_admin' | 'admin' | 'client';
  is_active?: boolean;
}

export interface AdminUserUpdate {
  full_name?: string;
  user_type?: 'super_admin' | 'admin' | 'client';
  is_active?: boolean;
  client_type?: ClientType;
  organization?: string;
  specialization?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  client_users: number;
  super_admin_users: number;
}

export interface Subtopic {
  id: number;
  slug?: string;
  name: string;
  definition?: string;
  notes?: string;
  difficulty_level: 'intro' | 'basic' | 'intermediate' | 'advanced';
  order_index: number;
  topic_id: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  slug?: string;
  name: string;
  description?: string;
  order_index: number;
  module_id: number;
  created_at: string;
  updated_at: string;
  subtopics?: Subtopic[];
}

export interface Module {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  topics?: Topic[];
}

export interface ContentStats {
  total_modules: number;
  total_topics: number;
  total_subtopics: number;
}

export const authApi = {
  login: async (data: LoginData): Promise<TokenResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  signup: async (data: SignupData): Promise<User> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  createUser: async (data: SignupData): Promise<User> => {
    const response = await api.post('/auth/create-user', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/auth/stats');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  updateUser: async (userId: number, userData: UserUpdate): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  deactivateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.patch(`/auth/users/${userId}/deactivate`);
    return response.data;
  },

  activateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.patch(`/auth/users/${userId}/activate`);
    return response.data;
  },

  adminUpdateUser: async (userId: number, userData: AdminUserUpdate): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}/admin-update`, userData);
    return response.data;
  },
};

export const contentApi = {
  // Get content statistics in a single optimized API call
  getContentStats: async (): Promise<ContentStats> => {
    const response = await api.get('/content/stats');
    return response.data;
  },

  // Get all modules with nested topics and subtopics in a single call
  getAllModulesWithContent: async (): Promise<Module[]> => {
    const response = await api.get('/modules/with-topics-subtopics/all');
    return response.data;
  },

  // Delete a module
  deleteModule: async (moduleId: number): Promise<void> => {
    await api.delete(`/modules/${moduleId}`);
  },

  // Delete a topic
  deleteTopic: async (topicId: number): Promise<void> => {
    await api.delete(`/topics/${topicId}`);
  },

  // Delete a subtopic
  deleteSubtopic: async (subtopicId: number): Promise<void> => {
    await api.delete(`/subtopics/${subtopicId}`);
  },
};

export interface OnboardingAnswer {
  question: string;
  answer: string;
  score?: number;
}

export interface OnboardingData {
  answers: OnboardingAnswer[];
  knowledge_level: string;
}

export interface OnboardingStatus {
  is_completed: boolean;
  needs_onboarding: boolean;
  knowledge_level?: string;
}

export const clientApi = {
  getAllClients: async (): Promise<Client[]> => {
    const response = await api.get('/auth/clients');
    return response.data;
  },

  getClient: async (clientId: number): Promise<Client> => {
    const response = await api.get(`/auth/clients/${clientId}`);
    return response.data;
  },

  updateClient: async (clientId: number, clientData: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/auth/clients/${clientId}`, clientData);
    return response.data;
  },

  // Onboarding functions
  submitOnboarding: async (data: OnboardingData): Promise<any> => {
    const response = await api.post('/auth/onboarding', data);
    return response.data;
  },

  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const response = await api.get('/auth/onboarding/status');
    return response.data;
  },

  getOnboarding: async (): Promise<any> => {
    const response = await api.get('/auth/onboarding');
    return response.data;
  },
};

// Fiber Database Types
export interface FiberClass {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FiberSubtype {
  id: number;
  class_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SyntheticType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface PolymerizationType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Fiber {
  id: number;
  fiber_id: string;
  name: string;
  class_id?: number;
  subtype_id?: number;
  synthetic_type_id?: number;
  polymerization_type_id?: number;
  trade_names?: string[];
  sources?: string[];
  applications?: string[];
  manufacturing_process?: string[];
  spinning_method?: string[];
  post_treatments?: string[];
  functional_groups?: string[];
  dye_affinity?: string[];
  density_g_cm3?: number;
  fineness_min_um?: number;
  fineness_max_um?: number;
  staple_length_min_mm?: number;
  staple_length_max_mm?: number;
  tenacity_min_cn_tex?: number;
  tenacity_max_cn_tex?: number;
  elongation_min_percent?: number;
  elongation_max_percent?: number;
  moisture_regain_percent?: number;
  absorption_capacity_percent?: number;
  polymer_composition?: string;
  degree_of_polymerization?: string;
  acid_resistance?: string;
  alkali_resistance?: string;
  microbial_resistance?: string;
  thermal_properties?: string;
  glass_transition_temp_c?: number;
  melting_point_c?: number;
  decomposition_temp_c?: number;
  repeating_unit?: string;
  molecular_structure_smiles?: string;
  structure_image_cms_id?: string;
  structure_image_url?: string;
  biodegradability?: boolean;
  sustainability_notes?: string;
  environmental_impact_score?: number;
  identification_methods?: string;
  property_analysis_methods?: string;
  data_source: string;
  data_quality_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FiberDetail {
  id: number;
  fiber_id: string;
  name: string;

  // Classifications
  fiber_class?: FiberClass;
  subtype?: FiberSubtype;
  synthetic_type?: SyntheticType;
  polymerization_type?: PolymerizationType;

  // Arrays
  trade_names?: string[];
  sources?: string[];
  applications?: string[];
  manufacturing_process?: string[];
  spinning_method?: string[];
  post_treatments?: string[];
  functional_groups?: string[];
  dye_affinity?: string[];

  // Physical Properties
  density_g_cm3?: number;
  fineness_min_um?: number;
  fineness_max_um?: number;
  staple_length_min_mm?: number;
  staple_length_max_mm?: number;
  tenacity_min_cn_tex?: number;
  tenacity_max_cn_tex?: number;
  elongation_min_percent?: number;
  elongation_max_percent?: number;
  moisture_regain_percent?: number;
  absorption_capacity_percent?: number;

  // Chemical Properties
  polymer_composition?: string;
  degree_of_polymerization?: string;
  acid_resistance?: string;
  alkali_resistance?: string;
  microbial_resistance?: string;

  // Thermal Properties
  thermal_properties?: string;
  glass_transition_temp_c?: number;
  melting_point_c?: number;
  decomposition_temp_c?: number;

  // Structure
  repeating_unit?: string;
  molecular_structure_smiles?: string;
  structure_image_cms_id?: string;
  structure_image_url?: string;

  // Sustainability
  biodegradability?: boolean;
  sustainability_notes?: string;
  environmental_impact_score?: number;

  // Identification
  identification_methods?: string;
  property_analysis_methods?: string;

  // Metadata
  data_quality_score?: number;
  created_at: string;
  updated_at: string;
}

export interface FiberSummary {
  id: number;
  fiber_id: string;
  name: string;
  fiber_class?: FiberClass;
  subtype?: FiberSubtype;
  applications?: string[];
  created_at: string;
  is_active: boolean;
}

export interface FiberComparison {
  id: number;
  fiber_id: string;
  name: string;
  fiber_class: {
    id: number;
    name: string;
  } | null;
  // Physical Properties
  density_g_cm3: number | null;
  fineness_min_um: number | null;
  fineness_max_um: number | null;
  staple_length_min_mm: number | null;
  staple_length_max_mm: number | null;
  tenacity_min_cn_tex: number | null;
  tenacity_max_cn_tex: number | null;
  elongation_min_percent: number | null;
  elongation_max_percent: number | null;
  moisture_regain_percent: number | null;
  // Mechanical Properties
  elastic_modulus_min_gpa: number | null;
  elastic_modulus_max_gpa: number | null;
}

export interface FiberClassCreate {
  name: string;
  description?: string;
}

export interface FiberSubtypeCreate {
  class_id: number;
  name: string;
  description?: string;
}

export interface SyntheticTypeCreate {
  name: string;
  description?: string;
}

export interface PolymerizationTypeCreate {
  name: string;
  description?: string;
}

export interface FiberCreate {
  fiber_id: string;
  name: string;
  class_id?: number;
  subtype_id?: number;
  synthetic_type_id?: number;
  polymerization_type_id?: number;
  trade_names?: string[];
  sources?: string[];
  applications?: string[];
  manufacturing_process?: string[];
  spinning_method?: string[];
  post_treatments?: string[];
  functional_groups?: string[];
  dye_affinity?: string[];
  density_g_cm3?: number;
  fineness_min_um?: number;
  fineness_max_um?: number;
  staple_length_min_mm?: number;
  staple_length_max_mm?: number;
  tenacity_min_cn_tex?: number;
  tenacity_max_cn_tex?: number;
  elongation_min_percent?: number;
  elongation_max_percent?: number;
  moisture_regain_percent?: number;
  absorption_capacity_percent?: number;
  polymer_composition?: string;
  degree_of_polymerization?: string;
  acid_resistance?: string;
  alkali_resistance?: string;
  microbial_resistance?: string;
  thermal_properties?: string;
  glass_transition_temp_c?: number;
  melting_point_c?: number;
  decomposition_temp_c?: number;
  repeating_unit?: string;
  molecular_structure_smiles?: string;
  structure_image_cms_id?: string;
  structure_image_url?: string;
  biodegradability?: boolean;
  sustainability_notes?: string;
  environmental_impact_score?: number;
  identification_methods?: string;
  property_analysis_methods?: string;
  data_source?: string;
  data_quality_score?: number;
  is_active?: boolean;
}

// Fiber Database API
export const fiberApi = {
  // Fiber Classes
  getFiberClasses: async (): Promise<FiberClass[]> => {
    const response = await api.get('/fiber/classes');
    return response.data;
  },

  createFiberClass: async (data: FiberClassCreate): Promise<FiberClass> => {
    const response = await api.post('/fiber/classes', data);
    return response.data;
  },

  updateFiberClass: async (classId: number, data: Partial<FiberClassCreate>): Promise<FiberClass> => {
    const response = await api.put(`/fiber/classes/${classId}`, data);
    return response.data;
  },

  deleteFiberClass: async (classId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/fiber/classes/${classId}`);
    return response.data;
  },

  // Fiber Subtypes
  getFiberSubtypes: async (classId?: number): Promise<FiberSubtype[]> => {
    const params = classId ? { class_id: classId } : {};
    const response = await api.get('/fiber/subtypes', { params });
    return response.data;
  },

  createFiberSubtype: async (data: FiberSubtypeCreate): Promise<FiberSubtype> => {
    const response = await api.post('/fiber/subtypes', data);
    return response.data;
  },

  updateFiberSubtype: async (subtypeId: number, data: Partial<FiberSubtypeCreate>): Promise<FiberSubtype> => {
    const response = await api.put(`/fiber/subtypes/${subtypeId}`, data);
    return response.data;
  },

  deleteFiberSubtype: async (subtypeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/fiber/subtypes/${subtypeId}`);
    return response.data;
  },

  // Synthetic Types
  getSyntheticTypes: async (): Promise<SyntheticType[]> => {
    const response = await api.get('/fiber/synthetic-types');
    return response.data;
  },

  createSyntheticType: async (data: SyntheticTypeCreate): Promise<SyntheticType> => {
    const response = await api.post('/fiber/synthetic-types', data);
    return response.data;
  },

  updateSyntheticType: async (typeId: number, data: Partial<SyntheticTypeCreate>): Promise<SyntheticType> => {
    const response = await api.put(`/fiber/synthetic-types/${typeId}`, data);
    return response.data;
  },

  deleteSyntheticType: async (typeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/fiber/synthetic-types/${typeId}`);
    return response.data;
  },

  // Polymerization Types
  getPolymerizationTypes: async (): Promise<PolymerizationType[]> => {
    const response = await api.get('/fiber/polymerization-types');
    return response.data;
  },

  createPolymerizationType: async (data: PolymerizationTypeCreate): Promise<PolymerizationType> => {
    const response = await api.post('/fiber/polymerization-types', data);
    return response.data;
  },

  updatePolymerizationType: async (typeId: number, data: Partial<PolymerizationTypeCreate>): Promise<PolymerizationType> => {
    const response = await api.put(`/fiber/polymerization-types/${typeId}`, data);
    return response.data;
  },

  deletePolymerizationType: async (typeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/fiber/polymerization-types/${typeId}`);
    return response.data;
  },

  // Fibers
  getFibers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    class_id?: number;
    subtype_id?: number;
    is_active?: boolean;
  }): Promise<FiberSummary[]> => {
    const response = await api.get('/fiber/fibers', { params });
    return response.data;
  },

  getFiber: async (fiberId: number): Promise<FiberDetail> => {
    const response = await api.get(`/fiber/fibers/${fiberId}`);
    return response.data;
  },

  // Fibers for comparison (with all physical and mechanical properties)
  getFibersForComparison: async (params?: {
    skip?: number;
    limit?: number;
  }): Promise<FiberComparison[]> => {
    const response = await api.get('/fiber/compare', { params });
    return response.data;
  },

  createFiber: async (data: FiberCreate): Promise<Fiber> => {
    const response = await api.post('/fiber/fibers', data);
    return response.data;
  },

  updateFiber: async (fiberId: number, data: Partial<FiberCreate>): Promise<Fiber> => {
    const response = await api.put(`/fiber/fibers/${fiberId}`, data);
    return response.data;
  },

  deleteFiber: async (fiberId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/fiber/fibers/${fiberId}`);
    return response.data;
  },

  deactivateFiber: async (fiberId: number): Promise<{ message: string }> => {
    const response = await api.patch(`/fiber/fibers/${fiberId}/deactivate`);
    return response.data;
  },

  activateFiber: async (fiberId: number): Promise<{ message: string }> => {
    const response = await api.patch(`/fiber/fibers/${fiberId}/activate`);
    return response.data;
  },
};

// Chatbot API
export interface MessageInConversation {
  role: string;
  content: string;
}

export interface ChatMessage {
  message: string;
  conversation_id: number;
}

export interface FiberCard {
  name: string;
  fiber_class?: string;
  subtype?: string;
  description?: string;
  applications?: string[];
  trade_names?: string[];
  key_properties?: Record<string, string>;
}

export interface StructureImage {
  fiber_name: string;
  image_url: string;
  fiber_id: string;
  image_cms_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: number;
  fiber_cards?: FiberCard[];
  structure_images?: StructureImage[];
  related_videos?: any[];
}

export interface ChatbotConversationRead {
  id: number;
  user_id: number;
  messages: MessageInConversation[];
  model_used?: string;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface StartConversationResponse {
  conversation_id: number;
  message: string;
}

export interface EndConversationResponse {
  conversation_id: number;
  message: string;
  total_messages: number;
}

export const chatbotApi = {
  startConversation: async (): Promise<StartConversationResponse> => {
    const response = await api.post('/chatbot/start');
    return response.data;
  },

  continueConversation: async (conversationId: number): Promise<StartConversationResponse> => {
    const response = await api.post(`/chatbot/continue/${conversationId}`);
    return response.data;
  },

  sendMessage: async (message: string, conversationId: number): Promise<ChatResponse> => {
    const response = await api.post('/chatbot/message', {
      message,
      conversation_id: conversationId
    });
    return response.data;
  },

  endConversation: async (conversationId: number): Promise<EndConversationResponse> => {
    const response = await api.post(`/chatbot/end/${conversationId}`);
    return response.data;
  },

  deleteConversation: async (conversationId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/chatbot/delete/${conversationId}`);
    return response.data;
  },

  getHistory: async (limit: number = 50): Promise<ChatbotConversationRead[]> => {
    const response = await api.get('/chatbot/history', { params: { limit } });
    return response.data;
  },
};

// Question Bank Types
export interface QuestionCreate {
  fiber_id: number;
  study_group_code: string;
  question: string;
  options: string[];
  correct_answer: string;
}

export interface QuestionRead {
  id: number;
  fiber_id: number;
  study_group_code: string;
  question: string;
  options: string[];
  correct_answer: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithFiberRead extends QuestionRead {
  fiber_name: string;
  study_group_name: string;
}

export interface QuestionUpdate {
  question?: string;
  options?: string[];
  correct_answer?: string;
  study_group_code?: string;
}

export interface QuestionStats {
  total_questions: number;
  total_fibers_with_questions: number;
  questions_by_study_group: Array<{
    code: string;
    name: string;
    count: number;
  }>;
}

export const questionApi = {
  // Get all questions with optional filters
  getQuestions: async (params?: {
    fiber_id?: number;
    study_group_code?: string;
    limit?: number;
    offset?: number;
  }): Promise<QuestionWithFiberRead[]> => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  // Get a specific question by ID
  getQuestion: async (questionId: number): Promise<QuestionRead> => {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },

  // Create a new question
  createQuestion: async (questionData: QuestionCreate): Promise<QuestionRead> => {
    const response = await api.post('/questions', questionData);
    return response.data;
  },

  // Update an existing question
  updateQuestion: async (questionId: number, questionData: QuestionUpdate): Promise<QuestionRead> => {
    const response = await api.put(`/questions/${questionId}`, questionData);
    return response.data;
  },

  // Delete a question
  deleteQuestion: async (questionId: number): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/questions/${questionId}`);
    return response.data;
  },

  // Get question statistics
  getQuestionStats: async (): Promise<QuestionStats> => {
    const response = await api.get('/questions/stats/summary');
    return response.data;
  },
};

// ========== QUIZ TYPES AND SERVICES ==========

export interface FiberQuizCard {
  fiber_id: number;
  fiber_name: string;
  study_group_code: string;
  study_group_name: string;
  question_count: number;
  is_completed: boolean;
  last_score?: number | null;
  last_attempt_date?: string | null;
}

export interface QuizListResponse {
  quizzes: FiberQuizCard[];
  total_available: number;
  completed_count: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface QuizAttemptStart {
  attempt_id: number;
  fiber_id: number;
  fiber_name: string;
  study_group_code: string;
  study_group_name: string;
  total_questions: number;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  question_id: number;
  selected_answer?: string | null;
}

export interface QuizResultsResponse {
  attempt_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  message: string;
}

export interface QuizAnswerDetail {
  id: number;
  quiz_attempt_id: number;
  question_id: number;
  selected_answer?: string | null;
  is_correct: boolean;
  created_at: string;
}

export interface QuizAttemptDetailRead {
  id: number;
  fiber_id: number;
  fiber_name: string;
  study_group_code: string;
  study_group_name: string;
  score?: number | null;
  total_questions: number;
  correct_answers: number;
  is_completed: boolean;
  submitted_at?: string | null;
  created_at: string;
  answers: QuizAnswerDetail[];
}

export interface QuizHistoryItem {
  id: number;
  fiber_id: number;
  fiber_name: string;
  study_group_code: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  submitted_at: string;
  created_at: string;
}

export const quizApi = {
  // Get available quizzes for current user
  getAvailableQuizzes: async (): Promise<QuizListResponse> => {
    const response = await api.get('/quizzes/available');
    return response.data;
  },

  // Start a quiz
  startQuiz: async (fiberid: number, studyGroupCode: string): Promise<QuizAttemptStart> => {
    const response = await api.post('/quizzes/start', {
      fiber_id: fiberid,
      study_group_code: studyGroupCode,
    });
    return response.data;
  },

  // Submit quiz answers
  submitQuiz: async (attemptId: number, answers: QuizAnswer[]): Promise<QuizResultsResponse> => {
    const response = await api.post(`/quizzes/${attemptId}/submit`, {
      answers,
    });
    return response.data;
  },

  // Get quiz review
  reviewQuiz: async (attemptId: number): Promise<QuizAttemptDetailRead> => {
    const response = await api.get(`/quizzes/${attemptId}/review`);
    return response.data;
  },

  // Get quiz history
  getQuizHistory: async (params?: {
    fiber_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    history: QuizHistoryItem[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const response = await api.get('/quizzes/history', { params });
    return response.data;
  },
};

export default api;