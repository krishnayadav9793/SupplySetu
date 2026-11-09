import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { useAuth, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DashboardSkeleton } from './components/common/DashboardSkeleton';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { useTabRouting } from './hooks/useTabRouting';

// Resilient dynamic chunk loader to prevent blank screen if chunks refresh during deployment
function lazyWithRetry<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const hasReloaded = sessionStorage.getItem('supplysetu_chunk_reload');
    try {
      const component = await factory();
      sessionStorage.removeItem('supplysetu_chunk_reload');
      return component;
    } catch (error) {
      if (!hasReloaded) {
        sessionStorage.setItem('supplysetu_chunk_reload', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Dynamically split dashboard bundles for optimal initial page-load performance
const AdminDashboard = lazyWithRetry(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const SalesmanDashboard = lazyWithRetry(() =>
  import('./pages/salesman/SalesmanDashboard').then((m) => ({ default: m.SalesmanDashboard }))
);
const RetailerDashboard = lazyWithRetry(() =>
  import('./pages/retailer/RetailerDashboard').then((m) => ({ default: m.RetailerDashboard }))
);
const AuthPage = lazyWithRetry(() =>
  import('./pages/auth/AuthPage').then((m) => ({ default: m.AuthPage }))
);

function DashboardContent() {
  const { user, role, isVerifying, logout } = useAuth();
  const { currentTab, setCurrentTab } = useTabRouting(role);
  const [showFirstTimePasswordModal, setShowFirstTimePasswordModal] = useState(false);

  useEffect(() => {
    if (user) {
      const hasDismissed = sessionStorage.getItem(`supplysetu_dismissed_pwd_${user.id}`);
      if (user.needsPasswordChange && !hasDismissed) {
        setShowFirstTimePasswordModal(true);
      }
    }
  }, [user]);

  // Initial token verification splash screen on page load
  if (isVerifying) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F4F6F9] dark:bg-[#0B0D11] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3" />
        <p className="text-xs font-semibold">Verifying Secure SupplySetu Credentials...</p>
      </div>
    );
  }

  // If not authenticated or token invalid, strictly render Login / Register screen
  if (!user) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F4F6F9] dark:bg-[#0C0E12] text-slate-800 dark:text-[#E2E8F0] font-sans transition-colors duration-200 flex flex-col overflow-hidden">
      {/* Edge-to-Edge Top Desktop Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Edge-to-Edge Workspace Body: Role-specific Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden w-full">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-7 overflow-y-auto pb-24 sm:pb-8 bg-slate-50/60 dark:bg-[#0E1015]">
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              {/* Strictly separate dashboards based on authorized user role */}
              {role === 'ADMIN' ? (
                <AdminDashboard currentTab={currentTab} setCurrentTab={setCurrentTab} />
              ) : role === 'SALESMAN' ? (
                <SalesmanDashboard currentTab={currentTab} setCurrentTab={setCurrentTab} />
              ) : role === 'RETAILER' ? (
                <RetailerDashboard currentTab={currentTab} setCurrentTab={setCurrentTab} />
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
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* First-time login / Default password change modal */}
      {showFirstTimePasswordModal && (
        <ChangePasswordModal
          isOpen={showFirstTimePasswordModal}
          onClose={() => setShowFirstTimePasswordModal(false)}
          isFirstLogin={true}
        />
      )}

      {/* Global Slide-over Cart Drawer (available only for retailers) */}
      {role === 'RETAILER' && <CartDrawer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <DashboardContent />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
