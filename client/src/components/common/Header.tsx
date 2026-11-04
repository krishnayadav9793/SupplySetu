import { Search, Bell, ShoppingBag } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Role } from '../../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header = ({ setCurrentTab }: HeaderProps) => {
  const { user, role, switchRole } = useAuth();
  const { totalUniqueItems, setIsCartDrawerOpen } = useCart();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-100 dark:border-[#1E222A] flex items-center justify-between gap-4 bg-white dark:bg-[#121418] select-none">
      {/* Brand Logo & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <div className="h-4 w-4 border-2 border-white rotate-45 rounded-[2px]" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Supply<span className="text-emerald-500">Setu</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Jabalpur Hub
            </span>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative flex-1 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search FMCG products, orders, Kirana shops, SKUs..."
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Role Pills + Notifications + User Profile + Theme Toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Role Quick Switcher (For Development & Demonstration) */}
        <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#262B35]">
          {(['RETAILER', 'SALESMAN', 'ADMIN'] as Role[]).map((r) => {
            const isActive = role === r;
            const labels: Record<Role, string> = {
              RETAILER: 'Retailer',
              SALESMAN: 'Salesman',
              ADMIN: 'Distributor Desk',
            };
            return (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* Cart Toggle Button */}
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Open Cart"
        >
          <ShoppingBag className="h-4 w-4" />
          {totalUniqueItems > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#121418]">
              {totalUniqueItems}
            </span>
          )}
        </button>

        {/* Notification Bell */}
        <button
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121418]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-200/80 dark:border-[#262B35]">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 flex-shrink-0">
            <img
              src={
                role === 'ADMIN'
                  ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
                  : role === 'SALESMAN'
                  ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'User'}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Authorized User'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              {role === 'ADMIN'
                ? 'Distributor Admin'
                : role === 'SALESMAN'
                ? 'Beat #4 Salesman'
                : 'Kirana Store Merchant'}
            </p>
          </div>
        </div>

        {/* Dark/Light Theme Toggle */}
        <div className="flex items-center pl-1 sm:pl-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
