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

export interface UserStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  client_users: number;
  super_admin_users: number;
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

export default api;