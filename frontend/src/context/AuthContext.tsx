import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  switchPersona: (role: Role, email: string) => Promise<void>;
  logout: () => void;
  demoUsers: User[];
  fetchDemoUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-user-ministry-001',
    email: 'analyst@mospi.gov.in',
    name: 'Rajesh Sharma (Central Ministry)',
    role: 'MINISTRY_ANALYST',
    scope_description: 'National Scope (All States)'
  });
  const [role, setRole] = useState<Role>('MINISTRY_ANALYST');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  const fetchDemoUsers = async () => {
    try {
      const res = await apiClient.get('/auth/demo-users');
      setDemoUsers(res.data);
    } catch (err) {
      console.warn('Could not fetch demo users from backend:', err);
    }
  };

  useEffect(() => {
    fetchDemoUsers();
    // Check local token
    const token = localStorage.getItem('mplads_access_token');
    const storedUser = localStorage.getItem('mplads_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setRole(u.role);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const login = async (email: string, password: string = 'demo123'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('mplads_access_token', access_token);
      localStorage.setItem('mplads_user', JSON.stringify(userData));
      setUser(userData);
      setRole(userData.role);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const switchPersona = async (newRole: Role, email: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/switch-demo-persona', { role: newRole, email });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('mplads_access_token', access_token);
      localStorage.setItem('mplads_user', JSON.stringify(userData));
      setUser(userData);
      setRole(newRole);
    } catch (err) {
      console.error('Persona switch failed, fallback to local state:', err);
      const fallbackUser: User = {
        id: `demo-${newRole.toLowerCase()}`,
        email,
        name: email.split('@')[0],
        role: newRole,
      };
      setUser(fallbackUser);
      setRole(newRole);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mplads_access_token');
    localStorage.removeItem('mplads_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        switchPersona,
        logout,
        demoUsers,
        fetchDemoUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
