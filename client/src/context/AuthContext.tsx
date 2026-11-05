import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { User, Role } from '../types';

export interface RegisterData {
  phone: string;
  name: string;
  password?: string;
  role?: Role;
  shopName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  login: (phone: string, password?: string) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  switchRole: (role: Role) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEMO_USERS: Record<Role, User> = {
  ADMIN: {
    id: 'usr-admin-1',
    phone: '9893000001',
    name: 'Ramesh Gupta',
    role: 'ADMIN',
  },
  SALESMAN: {
    id: 'usr-salesman-1',
    phone: '9893000002',
    name: 'Vikram Sharma',
    role: 'SALESMAN',
  },
  RETAILER: {
    id: 'usr-retailer-1',
    phone: '9893000003',
    name: 'Anil Patel',
    role: 'RETAILER',
    retailer: {
      id: 'ret-1',
      shopName: 'Shri Ganesh Kirana Store',
      ownerName: 'Anil Patel',
      address: 'Shop 14, Sarafa Chowk, Lordganj',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      creditLimit: 75000,
      outstandingBalance: 14200,
      priceTier: 'TIER_1',
    },
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('supplysetu-auth-user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Starts as null if not logged in, prompting the Login/Signup screen
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('supplysetu-auth-token');
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('supplysetu-auth-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('supplysetu-auth-user');
    }
  }, [user]);

  const login = async (phone: string, password?: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('supplysetu-auth-token', data.data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (err: any) {
      console.warn('Backend API unreachable, checking offline demo credentials:', err);
      // Fallback: match by demo phone
      const matched = Object.values(DEMO_USERS).find((u) => u.phone === phone);
      if (matched) {
        setUser(matched);
        setToken('demo-jwt-token-session');
        localStorage.setItem('supplysetu-auth-token', 'demo-jwt-token-session');
        return { success: true };
      }
      return { success: false, error: 'Could not connect to authentication server' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('supplysetu-auth-token', data.data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (err: any) {
      console.error('Registration server error:', err);
      return { success: false, error: err?.message || 'Could not connect to registration server' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('supplysetu-auth-user');
    localStorage.removeItem('supplysetu-auth-token');
  };

  const switchRole = async (newRole: Role) => {
    const demo = DEMO_USERS[newRole];
    if (demo) {
      // Try to log in as the real seeded account for this role
      await login(demo.phone, 'password123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'RETAILER',
        token,
        login,
        register,
        logout,
        switchRole,
        isLoading,
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
