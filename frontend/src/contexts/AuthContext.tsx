import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, type ClientType, authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, userType: 'super_admin' | 'admin' | 'client', clientType: ClientType, organization?: string, specialization?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const user = await authApi.getCurrentUser();
          setUser(user);
        } catch (error) {
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('access_token', response.access_token);
      const user = await authApi.getCurrentUser();
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    userType: 'super_admin' | 'admin' | 'client' = 'client',
    clientType: ClientType,
    organization?: string,
    specialization?: string
  ) => {
    try {
      await authApi.signup({ 
        email, 
        password, 
        full_name: fullName, 
        user_type: userType,
        client_type: clientType,
        organization,
        specialization
      });
      // Auto-login after signup
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};