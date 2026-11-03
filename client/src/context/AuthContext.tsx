import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  login: (phone: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Default to Retailer for intuitive first look
    return DEMO_USERS.RETAILER;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('supplysetu-auth-token') || 'demo-jwt-token-session';
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('supplysetu-auth-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('supplysetu-auth-user');
    }
  }, [user]);

  const login = async (phone: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try backend API first
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('supplysetu-auth-token', data.data.token);
        return true;
      }
    } catch (err) {
      console.warn('Backend not reachable, falling back to local demo auth:', err);
    } finally {
      setIsLoading(false);
    }

    // Fallback: match by demo phone or default
    const matched = Object.values(DEMO_USERS).find((u) => u.phone === phone);
    if (matched) {
      setUser(matched);
      setToken('demo-jwt-token-session');
      return true;
    }

    // Default to retailer
    setUser({ ...DEMO_USERS.RETAILER, phone });
    setToken('demo-jwt-token-session');
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('supplysetu-auth-user');
    localStorage.removeItem('supplysetu-auth-token');
  };

  const switchRole = (newRole: Role) => {
    setUser(DEMO_USERS[newRole]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'RETAILER',
        token,
        login,
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
