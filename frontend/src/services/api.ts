import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  token_type: string;
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
  getContentStats: async (): Promise<ContentStats> => {
    const [modulesResponse, topicsResponse, subtopicsResponse] = await Promise.all([
      api.get('/modules'),
      // We'll need to aggregate topics from all modules
      api.get('/modules').then(async (res) => {
        const modules = res.data;
        let totalTopics = 0;
        for (const module of modules) {
          const topicsRes = await api.get(`/modules/${module.id}/topics`);
          totalTopics += topicsRes.data.length;
        }
        return { data: { total: totalTopics } };
      }),
      // We'll need to aggregate subtopics from all topics
      api.get('/modules').then(async (res) => {
        const modules = res.data;
        let totalSubtopics = 0;
        for (const module of modules) {
          const topicsRes = await api.get(`/modules/${module.id}/topics`);
          for (const topic of topicsRes.data) {
            const subtopicsRes = await api.get(`/topics/${topic.id}/subtopics`);
            totalSubtopics += subtopicsRes.data.length;
          }
        }
        return { data: { total: totalSubtopics } };
      }),
    ]);

    return {
      total_modules: modulesResponse.data.length,
      total_topics: topicsResponse.data.total,
      total_subtopics: subtopicsResponse.data.total,
    };
  },
};

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

export default api;