import { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RetailerDashboard } from './pages/retailer/RetailerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalesmanDashboard } from './pages/salesman/SalesmanDashboard';
import { useAuth, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthPage } from './pages/auth/AuthPage';
import { Role } from './types';

const ROLE_ALLOWED_TABS: Record<Role, string[]> = {
  ADMIN: ['orders', 'dashboard', 'wallet', 'retailers', 'catalogue', 'schemes', 'export'],
  SALESMAN: ['beat', 'punch', 'catalogue', 'schemes', 'performance'],
  RETAILER: ['shop', 'cart', 'ai-pad', 'schemes', 'my-orders', 'credit'],
};

const getDefaultTabForRole = (userRole: Role): string => {
  switch (userRole) {
    case 'ADMIN':
      return 'orders';
    case 'SALESMAN':
      return 'beat';
    case 'RETAILER':
    default:
      return 'shop';
  }
};

function DashboardContent() {
  const { user, role, isLoading, isVerifying, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => getDefaultTabForRole(role));

  // Align currentTab with authorized role tabs on login or role switch
  useEffect(() => {
    if (user) {
      const allowed = ROLE_ALLOWED_TABS[user.role] || [];
      if (!allowed.includes(currentTab)) {
        setCurrentTab(getDefaultTabForRole(user.role));
      }
    }
  }, [user?.id, user?.role, currentTab]);

  // Initial token verification splash screen
  if (isVerifying || (isLoading && !user)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F4F6F9] dark:bg-[#0B0D11] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3" />
        <p className="text-xs font-semibold">Verifying Secure SupplySetu Credentials...</p>
      </div>
    );
  }

  // If not authenticated or token invalid, strictly render Login / Register screen
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen w-screen bg-[#F4F6F9] dark:bg-[#0C0E12] text-slate-800 dark:text-[#E2E8F0] font-sans transition-colors duration-200 flex flex-col overflow-hidden">
      {/* Edge-to-Edge Top Desktop Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Edge-to-Edge Workspace Body: Role-specific Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden w-full">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-slate-50/60 dark:bg-[#0E1015]">
          {/* Strictly separate dashboards based on authorized user role */}
          {role === 'ADMIN' ? (
            <AdminDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          ) : role === 'SALESMAN' ? (
            <SalesmanDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          ) : role === 'RETAILER' ? (
            <RetailerDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600">
              <p className="font-bold text-base">Unauthorized Role Access</p>
              <p className="text-xs mt-1 text-slate-500">
                Your role &apos;{role}&apos; is not recognized for this dashboard.
              </p>
              <button
                onClick={logout}
                className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Sign In With Valid Account
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Global Slide-over Cart Drawer (available only for retailers) */}
      {role === 'RETAILER' && <CartDrawer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <DashboardContent />
      </CartProvider>
    </AuthProvider>
  );
}
