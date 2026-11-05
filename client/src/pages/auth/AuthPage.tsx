import React, { useState } from 'react';
import {
  Store,
  Building2,
  Bike,
  Lock,
  Phone,
  User as UserIcon,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth, RegisterData } from '../../context/AuthContext';
import { Role } from '../../types';

interface DemoAccount {
  role: Role;
  title: string;
  name: string;
  phone: string;
  badge: string;
  description: string;
  icon: typeof Store;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'RETAILER',
    title: 'Kirana Retailer',
    name: 'Anil Patel (Shri Ganesh Kirana)',
    phone: '9893000003',
    badge: 'Tier 1 Dealer Rate',
    description: 'Place orders, browse FMCG catalog, use AI order pad',
    icon: Store,
  },
  {
    role: 'SALESMAN',
    title: 'Beat Salesman',
    name: 'Vikram Sharma (Beat #4)',
    phone: '9893000002',
    badge: 'Offline IndexedDB',
    description: 'Book offline orders in Lordganj & Sarafa beat',
    icon: Bike,
  },
  {
    role: 'ADMIN',
    title: 'Distributor Desk',
    name: 'Ramesh Gupta (Distribution Head)',
    phone: '9893000001',
    badge: 'Tally ERP & Approvals',
    description: 'Approve orders, monitor credit holds, export CSV',
    icon: Building2,
  },
];

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('9893000003');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Signup form state
  const [signupData, setSignupData] = useState<RegisterData>({
    phone: '',
    password: '',
    name: '',
    role: 'RETAILER',
    shopName: '',
    address: '',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    pincode: '482002',
    gstNumber: '',
  });

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = loginPhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanPhone, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your phone and password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (account: DemoAccount) => {
    setLoginPhone(account.phone);
    setLoginPassword('password123');
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await login(account.phone, 'password123');
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to sign in with demo account');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupData.name.trim()) {
      setErrorMessage('Full name is required');
      return;
    }
    if (!signupData.phone.trim() || signupData.phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!signupData.password || signupData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (signupData.role === 'RETAILER' && !signupData.shopName?.trim()) {
      setErrorMessage('Kirana Shop Name is required for retailers');
      return;
    }

    setLoading(true);
    try {
      const res = await register(signupData);
      if (res.success) {
        setSuccessMessage('Account registered successfully! Redirecting to hub...');
      } else {
        setErrorMessage(res.error || 'Registration failed. Mobile number may already exist.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F4F6F9] dark:bg-[#0B0D11] text-slate-800 dark:text-[#E2E8F0] flex flex-col justify-between overflow-y-auto">
      {/* Top Simple Header */}
      <header className="h-16 w-full px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-[#1E222A] bg-white/80 dark:bg-[#121418]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <div className="h-4 w-4 border-2 border-white rotate-45 rounded-[2px]" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Supply<span className="text-emerald-500">Setu</span>
            </span>
            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Jabalpur FMCG Hub
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          B2B Ordering &bull; Real-Time Inventory &bull; Tally ERP
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white dark:bg-[#16181E] rounded-3xl border border-slate-200/80 dark:border-[#222631] shadow-xl overflow-hidden">
          
          {/* Header Banner */}
          <div className="p-6 sm:p-8 pb-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FMCG Distribution Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome to SupplySetu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
              Access live wholesale catalogue, promotional schemes, and beat orders across Jabalpur.
            </p>

            {/* Tab Switcher */}
            <div className="mt-6 p-1 bg-slate-100 dark:bg-[#1C2028] rounded-2xl flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Register Kirana Shop
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          <div className="px-6 sm:px-8">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 pt-2">
            {activeTab === 'login' ? (
              /* LOGIN TAB */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 font-mono text-xs pr-2 border-r border-slate-200 dark:border-slate-700">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="9893000003"
                      maxLength={10}
                      required
                      className="w-full pl-20 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Default: password123</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Enter SupplySetu Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Quick Demo Switcher */}
                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-[#222631]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                    Or Select A Demo Account (1-Click Login)
                  </p>

                  <div className="space-y-2">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      return (
                        <div
                          key={acc.phone}
                          onClick={() => handleQuickDemoLogin(acc)}
                          className="p-3 rounded-xl border border-slate-200/70 dark:border-[#222631] bg-slate-50/50 dark:bg-[#181B22] hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {acc.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {acc.phone}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                                {acc.name}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                            Select &rarr;
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            ) : (
              /* SIGNUP TAB */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant / Owner Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        placeholder="e.g. Ramesh Patel"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        placeholder="9893XXXXXX"
                        maxLength={10}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kirana Shop / Business Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={signupData.shopName}
                      onChange={(e) => setSignupData({ ...signupData, shopName: e.target.value })}
                      placeholder="e.g. Shri Krishna Kirana & General Store"
                      required={signupData.role === 'RETAILER'}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shop Address & Beat Sector
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={signupData.address}
                      onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                      placeholder="Shop 12, Sarafa Chowk, Lordganj"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City / Territory
                    </label>
                    <input
                      type="text"
                      value={signupData.city}
                      onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                      placeholder="Jabalpur"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={signupData.pincode}
                      onChange={(e) => setSignupData({ ...signupData, pincode: e.target.value })}
                      placeholder="482002"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={signupData.gstNumber}
                      onChange={(e) => setSignupData({ ...signupData, gstNumber: e.target.value })}
                      placeholder="23AABCP1234D1Z5"
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Create Password *
                    </label>
                    <input
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/80 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration & Open Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-[#1E222A]">
        SupplySetu &bull; Jabalpur Wholesale FMCG Distribution &bull; Powered by React, Node.js & PostgreSQL
      </footer>
    </div>
  );
};
