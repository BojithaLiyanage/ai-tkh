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

// Storage keys - only for non-sensitive user data
const STORAGE_KEYS = {
  USER_DETAILS: 'user_details',
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user details from local storage
  const loadAuthData = (): User | null => {
    try {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER_DETAILS);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  };

  // Save user details to local storage (tokens are in httpOnly cookies)
  const saveAuthData = (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER_DETAILS, JSON.stringify(user));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to load user from local storage first
        let userData = loadAuthData();

        if (!userData) {
          // If not in storage, try to fetch from API
          // This will use the httpOnly cookie automatically if it exists
          try {
            userData = await authApi.getCurrentUser();
            saveAuthData(userData);
          } catch (apiError: any) {
            // If 401, user is simply not logged in (expected on first load)
            if (apiError.response?.status === 401) {
              userData = null;
            } else {
              // Re-throw other errors
              throw apiError;
            }
          }
        }

        setUser(userData);
      } catch (error) {
        // No valid session, user is not logged in
        console.log('User not authenticated');
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER_DETAILS);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Login call will set httpOnly cookies automatically
      await authApi.login({ email, password });

      // Fetch user data (this will use the httpOnly cookie automatically)
      const userData = await authApi.getCurrentUser();

      // Save user data to localStorage
      saveAuthData(userData);

      setUser(userData);
    } catch (error) {
      // Clear user data on login failure
      localStorage.removeItem(STORAGE_KEYS.USER_DETAILS);
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
    localStorage.removeItem(STORAGE_KEYS.USER_DETAILS);
    setUser(null);
    // Cookies will be cleared by the server on logout
    // In a production app, you might want to call a /logout endpoint
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};