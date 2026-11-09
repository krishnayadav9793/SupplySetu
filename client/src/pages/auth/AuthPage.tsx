import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth, RegisterData } from '../../context/AuthContext';
import { Role } from '../../types';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useToast } from '../../context/ToastContext';

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
    name: 'Anil Patel (Kirana Store)',
    phone: '9893000003',
    badge: 'Tier 1 Dealer',
    description: 'Place orders, browse FMCG catalog',
    icon: Store,
  },
  {
    role: 'SALESMAN',
    title: 'Beat Salesman',
    name: 'Vikram Sharma (Beat #4)',
    phone: '9893000002',
    badge: 'Beat Delivery',
    description: 'Book offline orders in Lordganj',
    icon: Bike,
  },
  {
    role: 'ADMIN',
    title: 'Distributor Admin',
    name: 'Ramesh Gupta (Head)',
    phone: '9893000001',
    badge: 'Tally & Dispatch',
    description: 'Approve orders, monitor credit',
    icon: Building2,
  },
];

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { showError, showSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPhoneError, setIsPhoneError] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Form input refs for quick focus on error
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 10
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLoginPhone(digitsOnly);
    if (isPhoneError) setIsPhoneError(false);
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = loginPhone.replace(/\D/g, '').trim();
    if (!cleanPhone) {
      setIsPhoneError(true);
      const msg = 'Please enter your 10-digit registered mobile number';
      setErrorMessage(msg);
      showError('Invalid Mobile Number', msg);
      phoneInputRef.current?.focus();
      return;
    }

    if (cleanPhone.length !== 10) {
      setIsPhoneError(true);
      const msg = `Mobile number must be exactly 10 digits (entered ${cleanPhone.length}).`;
      setErrorMessage(msg);
      showError(
        'Invalid Mobile Number',
        `Entered ${cleanPhone.length} of 10 digits. Please enter a complete 10-digit mobile number.`
      );
      phoneInputRef.current?.focus();
      return;
    }

    if (!loginPassword || loginPassword.trim() === '') {
      setIsPasswordError(true);
      const msg = 'Please enter your account password';
      setErrorMessage(msg);
      showError('Password Required', 'Please enter your account password to sign in.');
      passwordInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanPhone, loginPassword);
      if (!res.success) {
        const err = res.error || 'Incorrect mobile number or password.';
        const isDemoPhone = ['9893000001', '9893000002', '9893000003'].includes(cleanPhone);
        const lowerErr = err.toLowerCase();
        const isUserNotFound =
          lowerErr.includes('not found') || lowerErr.includes('not registered');

        if (isUserNotFound) {
          setIsPhoneError(true);
          setIsPasswordError(false);
          const notFoundMsg = `Mobile number ${cleanPhone} is not registered in Jabalpur Hub.`;
          setErrorMessage(notFoundMsg);
          showError(
            'Invalid Mobile Number',
            `No account found with number ${cleanPhone}. Please check your phone number or register your shop.`
          );
          phoneInputRef.current?.focus();
        } else if (loginPassword === 'password123' && !isDemoPhone) {
          setIsPasswordError(true);
          setIsPhoneError(false);
          const demoMsg =
            "Default password 'password123' only works for demo accounts. For your custom account, please enter the password chosen during registration.";
          setErrorMessage(demoMsg);
          showError('Incorrect Password', demoMsg);
          passwordInputRef.current?.focus();
          passwordInputRef.current?.select();
        } else {
          setIsPasswordError(true);
          setIsPhoneError(false);
          setErrorMessage(err);
          showError(
            'Incorrect Password',
            'The password you entered is incorrect. Please verify your credentials and try again.'
          );
          passwordInputRef.current?.focus();
          passwordInputRef.current?.select();
        }
        setFailedAttempts((prev) => prev + 1);
      } else {
        setIsPhoneError(false);
        setIsPasswordError(false);
        setFailedAttempts(0);
      }
    } catch (err: any) {
      const networkMsg =
        err?.message ||
        'Unable to connect to authentication server. Please check your network connection.';
      setErrorMessage(networkMsg);
      showError('Connection Error', networkMsg);
      setIsPasswordError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (account: DemoAccount) => {
    setActiveTab('login');
    setLoginPhone(account.phone);
    setLoginPassword('password123');
    setErrorMessage(null);
    setIsPhoneError(false);
    setIsPasswordError(false);
    setLoading(true);

    try {
      const res = await login(account.phone, 'password123');
      if (!res.success) {
        const msg = res.error || 'Failed to sign in with demo account';
        setErrorMessage(msg);
        showError('Demo Login Failed', msg);
        setIsPasswordError(true);
      } else {
        setFailedAttempts(0);
      }
    } catch (err: any) {
      const msg = err?.message || 'Demo login error';
      setErrorMessage(msg);
      showError('Demo Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupData.name.trim()) {
      const msg = 'Full name is required';
      setErrorMessage(msg);
      showError('Incomplete Form', msg);
      return;
    }
    const cleanPhone = signupData.phone.replace(/\D/g, '').trim();
    if (!cleanPhone || cleanPhone.length !== 10) {
      const msg = 'Please enter a valid 10-digit mobile number';
      setErrorMessage(msg);
      showError('Invalid Mobile Number', msg);
      return;
    }
    if (!signupData.password || signupData.password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setErrorMessage(msg);
      showError('Password Too Short', msg);
      return;
    }
    if (signupData.role === 'RETAILER' && !signupData.shopName?.trim()) {
      const msg = 'Kirana Shop Name is required for retailers';
      setErrorMessage(msg);
      showError('Shop Name Required', msg);
      return;
    }

    setLoading(true);
    try {
      const res = await register({ ...signupData, phone: cleanPhone });
      if (res.success) {
        setSuccessMessage('Account registered successfully! Redirecting to hub...');
        showSuccess(
          'Registration Successful',
          'Welcome to SupplySetu! Logging into your dashboard...'
        );
      } else {
        const errMsg = res.error || 'Registration failed. Mobile number may already exist.';
        setErrorMessage(errMsg);
        showError('Registration Failed', errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Registration failed';
      setErrorMessage(errMsg);
      showError('Registration Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#F4F6F9] dark:bg-[#0B0D11] text-slate-800 dark:text-[#E2E8F0] flex flex-col justify-between overflow-x-hidden relative">
      {/* Top Simple Header */}
      <header className="h-16 w-full px-4 sm:px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-[#1E222A] bg-white/80 dark:bg-[#121418]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xs flex-shrink-0">
            <div className="h-4 w-4 border-2 border-white rotate-45 rounded-[2px]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Supply<span className="text-emerald-500">Setu</span>
            </span>
            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Jabalpur Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
            B2B Ordering &bull; Real-Time Inventory &bull; Tally ERP
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white dark:bg-[#151820] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-[#222631] shadow-xl overflow-hidden my-auto">
          {/* Header Banner */}
          <div className="p-5 sm:p-7 pb-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FMCG Distribution Network</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome to SupplySetu
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Live wholesale catalogue & beat order management across Jabalpur.
            </p>

            {/* Tab Switcher */}
            <div className="mt-4 p-1 bg-slate-100 dark:bg-[#1C2028] rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIsPhoneError(false);
                  setIsPasswordError(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-white shadow-xs'
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
                  setIsPhoneError(false);
                  setIsPasswordError(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Register Kirana Shop
              </button>
            </div>
          </div>

          {/* Registration Success Banner */}
          {successMessage && (
            <div className="px-5 sm:px-7 pb-1">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="p-5 sm:p-7 pt-1">
            {activeTab === 'login' ? (
              /* LOGIN TAB */
              <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 font-mono text-xs pr-2 border-r transition-colors ${
                        isPhoneError
                          ? 'text-rose-500 border-rose-300 dark:border-rose-700'
                          : 'text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="numeric"
                      value={loginPhone}
                      onChange={handlePhoneChange}
                      placeholder="e.g. 9893000003"
                      maxLength={10}
                      required
                      className={`w-full pl-20 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#1A1D24] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                        isPhoneError
                          ? 'border-2 border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20 animate-shake'
                          : 'border border-slate-200/80 dark:border-[#262B35] focus:ring-2 focus:ring-emerald-500/40'
                      }`}
                    />
                  </div>
                  {isPhoneError && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 animate-shake">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Please enter a valid 10-digit mobile number</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Demo accounts: password123</span>
                  </div>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                        isPasswordError ? 'text-rose-500' : 'text-slate-400'
                      }`}
                    />
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (isPasswordError) setIsPasswordError(false);
                      }}
                      placeholder="Enter account password"
                      required
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#1A1D24] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                        isPasswordError
                          ? 'border-2 border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20 animate-shake'
                          : 'border border-slate-200/80 dark:border-[#262B35] focus:ring-2 focus:ring-emerald-500/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isPasswordError && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 animate-shake">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Incorrect password. Please verify and try again.</span>
                    </p>
                  )}
                </div>

                {/* INLINE ERROR BANNER RIGHT ABOVE SUBMIT BUTTON */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 shadow-sm transition-all animate-shake"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <p className="font-bold text-rose-800 dark:text-rose-200">
                        {isPasswordError
                          ? 'Incorrect Password'
                          : isPhoneError
                            ? 'Invalid Mobile Number'
                            : 'Sign In Error'}
                      </p>
                      <p className="leading-relaxed opacity-95">{errorMessage}</p>
                      {failedAttempts >= 2 && (
                        <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-200 mt-1">
                          ⚠️ {failedAttempts} consecutive failed attempts.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[42px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Enter SupplySetu Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Quick Demo Switcher - Compact Responsive 3-Column Grid */}
                <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-[#222631]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Demo Accounts
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      1-Click Login
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      return (
                        <button
                          key={acc.phone}
                          type="button"
                          onClick={() => handleQuickDemoLogin(acc)}
                          className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-slate-50/70 dark:bg-[#181B22] hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex sm:flex-col items-center sm:items-start justify-between sm:justify-start text-left group"
                        >
                          <div className="flex items-center gap-2 mb-0 sm:mb-1">
                            <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {acc.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {acc.phone}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            ) : (
              /* SIGNUP TAB */
              <form onSubmit={handleSignupSubmit} className="space-y-3" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        placeholder="Ramesh Patel"
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
                        inputMode="numeric"
                        value={signupData.phone}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
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
                    Kirana Shop Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={signupData.shopName}
                      onChange={(e) => setSignupData({ ...signupData, shopName: e.target.value })}
                      placeholder="Shri Krishna Kirana & General Store"
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

                {/* SIGNUP ERROR BANNER */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[42px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering Account...</span>
                    </div>
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
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 sm:px-6 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-[#1E222A]">
        SupplySetu &bull; Jabalpur Wholesale FMCG Distribution Network
      </footer>
    </div>
  );
};
