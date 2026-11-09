import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { User, Role } from '../types';
import { NotificationService } from '../services/notificationService';

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
  resetPassword: (phone: string, newPassword: string) => Promise<AuthResponse>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<AuthResponse>;
  logout: () => void;
  switchRole: (role: Role) => void;
  isLoading: boolean;
  isVerifying: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('supplysetu-auth-token');
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('supplysetu-auth-user');
    localStorage.removeItem('supplysetu-auth-token');
    NotificationService.setCurrentUser(null);
  };

  // Keep NotificationService role context in sync with logged-in user
  useEffect(() => {
    if (user) {
      NotificationService.setCurrentUser({
        id: user.id,
        role: user.role,
        name: user.name,
        retailerId: user.retailer?.id,
        salesmanId: user.salesman?.id,
      });
    } else {
      NotificationService.setCurrentUser(null);
    }
  }, [user]);

  // ----------------------------------------------------
  // VERIFY TOKEN & AUTHORIZATION ON INITIAL LOAD
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem('supplysetu-auth-token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsVerifying(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            setToken(storedToken);
            localStorage.setItem('supplysetu-auth-user', JSON.stringify(data.data));
            localStorage.setItem('supplysetu-auth-token', storedToken);
          } else {
            logout();
          }
        } else {
          // Token is invalid, expired or revoked (401 Unauthorized) -> force redirect to login
          console.warn(`[Auth] Session invalid or expired (${res.status}). Redirecting to login.`);
          logout();
        }
      } catch (err) {
        console.warn('[Auth] Server offline, checking cached credentials for offline mode:', err);
        const cachedUser = localStorage.getItem('supplysetu-auth-user');
        if (cachedUser && storedToken) {
          try {
            setUser(JSON.parse(cachedUser));
            setToken(storedToken);
          } catch (e) {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();

    // Listen to global 401 unauthorized events from apiFetch
    const handleUnauthorizedEvent = () => {
      logout();
    };
    window.addEventListener('supplysetu:unauthorized', handleUnauthorizedEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('supplysetu:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

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
        localStorage.setItem('supplysetu-auth-user', JSON.stringify(data.data.user));
        localStorage.setItem('supplysetu-auth-token', data.data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Invalid phone or password' };
      }
    } catch (err: any) {
      console.warn('Backend API unreachable, checking demo fallback:', err);
      // Fallback: match by demo phone if password matches demo default
      const matched = Object.values(DEMO_USERS).find((u) => u.phone === phone);
      if (matched && password === 'password123') {
        setUser(matched);
        setToken('demo-jwt-token-session');
        localStorage.setItem('supplysetu-auth-user', JSON.stringify(matched));
        localStorage.setItem('supplysetu-auth-token', 'demo-jwt-token-session');
        return { success: true };
      }
      if (matched && password !== 'password123') {
        return { success: false, error: 'Incorrect password entered for this demo profile' };
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
        localStorage.setItem('supplysetu-auth-user', JSON.stringify(data.data.user));
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

  const resetPassword = async (phone: string, newPassword: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to update password' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server connection error' };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    newPassword: string,
    currentPassword?: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const storedToken = token || localStorage.getItem('supplysetu-auth-token');
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ newPassword, currentPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          const updatedUser = { ...user, needsPasswordChange: false };
          setUser(updatedUser);
          localStorage.setItem('supplysetu-auth-user', JSON.stringify(updatedUser));
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to update password' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server connection error' };
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: Role) => {
    const demo = DEMO_USERS[newRole];
    if (demo) {
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
        resetPassword,
        changePassword,
        logout,
        switchRole,
        isLoading,
        isVerifying,
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
