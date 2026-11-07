import { useState } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RetailerDashboard } from './pages/retailer/RetailerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalesmanDashboard } from './pages/salesman/SalesmanDashboard';
import { useAuth, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthPage } from './pages/auth/AuthPage';

function DashboardContent() {
  const { user, role, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  if (isLoading && !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F4F6F9] dark:bg-[#0B0D11] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3" />
        <p className="text-xs font-semibold">Connecting to SupplySetu Hub...</p>
      </div>
    );
  }

  // If not authenticated, render Login / Register UI
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen w-screen bg-[#F4F6F9] dark:bg-[#0C0E12] text-slate-800 dark:text-[#E2E8F0] font-sans transition-colors duration-200 flex flex-col overflow-hidden">
      {/* Edge-to-Edge Top Desktop Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Edge-to-Edge Workspace Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden w-full">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-slate-50/60 dark:bg-[#0E1015]">
          {role === 'ADMIN' && (
            <AdminDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          )}
          {role === 'SALESMAN' && (
            <SalesmanDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          )}
          {role === 'RETAILER' && (
            <RetailerDashboard
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          )}
        </main>
      </div>

      {/* Global Slide-over Cart Drawer */}
      <CartDrawer />
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
