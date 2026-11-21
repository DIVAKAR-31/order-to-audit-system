import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  canAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default mock fallbacks for testing if backend auth isn't available
const ROLE_PRESETS: Record<UserRole, { username: string; name: string }> = {
  admin: { username: 'admin', name: 'Rajesh Kumar (Managing Director)' },
  salesman: { username: 'salesman', name: 'Senthil Nathan (Sales Executive)' },
  production_supervisor: { username: 'supervisor', name: 'Muthuraman (Plant Supervisor)' },
  accountant: { username: 'accountant', name: 'Lakshmi Narayanan (Chief Accountant)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch (err) {
        // Fallback to admin if token is invalid or initial load
        setUser({
          id: 1,
          username: 'admin',
          email: 'admin@ordertoaudit.com',
          full_name: 'Rajesh Kumar (Managing Director)',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      setLoading(false);
      throw err;
    }
    setLoading(false);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    const preset = ROLE_PRESETS[targetRole];
    const passwordMap: Record<UserRole, string> = {
      admin: 'admin123',
      salesman: 'sales123',
      production_supervisor: 'prod123',
      accountant: 'acc123',
    };
    try {
      await login(preset.username, passwordMap[targetRole]);
    } catch (err) {
      // Direct local switch if network fails
      setUser({
        id: targetRole === 'admin' ? 1 : targetRole === 'salesman' ? 2 : targetRole === 'production_supervisor' ? 3 : 4,
        username: preset.username,
        email: `${preset.username}@ordertoaudit.com`,
        full_name: preset.name,
        role: targetRole,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  };

  const canAccess = (page: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    switch (user.role) {
      case 'salesman':
        return ['dashboard', 'products', 'customers', 'orders'].includes(page);
      case 'production_supervisor':
        return ['dashboard', 'products', 'inventory', 'production'].includes(page);
      case 'accountant':
        return ['dashboard', 'customers', 'invoices', 'payments', 'reports'].includes(page);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
