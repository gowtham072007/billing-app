import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (name: string, secret: string, role?: string) => Promise<User>;
  customerQuickSign: (name: string, phone?: string, address?: string) => Promise<User>;
  register: (data: { name: string; phone?: string; email?: string; password?: string; address?: string }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Clear legacy localStorage token so closed app sessions are never restored
    try {
      localStorage.removeItem('billing_auth_token');
    } catch {}
    return sessionStorage.getItem('billing_auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check current session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        localStorage.removeItem('billing_auth_token');
      } catch {}

      const storedToken = sessionStorage.getItem('billing_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<{ user: User }>('/auth/me');
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid token');
        sessionStorage.removeItem('billing_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (name: string, secret: string, role?: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User; redirectTo?: string }>('/auth/login', {
      name,
      secret,
      role,
    });

    sessionStorage.setItem('billing_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const customerQuickSign = async (name: string, phone?: string, address?: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/customer-quick-sign', {
      name,
      phone,
      address,
    });

    sessionStorage.setItem('billing_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: {
    name: string;
    phone?: string;
    email?: string;
    password?: string;
    address?: string;
  }): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', data);

    sessionStorage.setItem('billing_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    sessionStorage.removeItem('billing_auth_token');
    try {
      localStorage.removeItem('billing_auth_token');
    } catch {}
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        customerQuickSign,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
