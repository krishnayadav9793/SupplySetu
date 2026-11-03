import { useState } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RetailerDashboard } from './pages/retailer/RetailerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalesmanDashboard } from './pages/salesman/SalesmanDashboard';
import { useAuth, AuthProvider } from './context/AuthContext';

function DashboardContent() {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0C0E12] text-slate-800 dark:text-[#E2E8F0] font-sans transition-colors duration-200 flex flex-col justify-center items-center p-2 sm:p-4 lg:p-6">
      {/* Outer Application Container */}
      <div className="w-full max-w-[1440px] min-h-[880px] bg-white dark:bg-[#121418] rounded-2xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-[#222631] overflow-hidden flex flex-col">
        {/* Top Header */}
        <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Workspace Body: Sidebar + Active Role View */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

          <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-slate-50/50 dark:bg-[#0E1015]">
            {role === 'ADMIN' && <AdminDashboard />}
            {role === 'SALESMAN' && <SalesmanDashboard />}
            {role === 'RETAILER' && <RetailerDashboard />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
