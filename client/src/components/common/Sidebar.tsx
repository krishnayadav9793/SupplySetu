import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  Percent,
  Sparkles,
  Users,
  FileSpreadsheet,
  Wallet,
  Settings,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar = ({ currentTab, setCurrentTab }: SidebarProps) => {
  const { role } = useAuth();

  // Navigation items based on role
  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Order Desk', icon: ReceiptText },
        { id: 'wallet', label: 'Financials', icon: Wallet },
        { id: 'retailers', label: 'Kirana Network', icon: Users },
        { id: 'catalogue', label: 'FMCG Catalogue', icon: Package },
        { id: 'schemes', label: 'Trade Schemes', icon: Percent },
        { id: 'export', label: 'Tally Export', icon: FileSpreadsheet },
      ];
    }

    if (role === 'SALESMAN') {
      return [
        { id: 'beat', label: 'My Beat', icon: Users },
        { id: 'punch', label: 'Punch Order', icon: ShoppingCart },
        { id: 'catalogue', label: 'Products', icon: Package },
        { id: 'schemes', label: 'Active Deals', icon: Percent },
        { id: 'performance', label: 'Beat Targets', icon: TrendingUp },
      ];
    }

    // Default: RETAILER
    return [
      { id: 'shop', label: 'Catalogue', icon: Package },
      { id: 'cart', label: 'Cart', icon: ShoppingCart },
      { id: 'ai-pad', label: 'AI Order Pad', icon: Sparkles },
      { id: 'schemes', label: 'Trade Schemes', icon: Percent },
      { id: 'my-orders', label: 'My Orders', icon: ReceiptText },
      { id: 'credit', label: 'Khata / Credit', icon: Wallet },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-16 border-r border-slate-200/80 dark:border-[#1E222A] bg-white dark:bg-[#121418] flex flex-col items-center py-4 gap-6 select-none flex-shrink-0 z-20">
      {/* Top Group: Pages */}
      <div className="flex flex-col items-center gap-3 w-full">
        <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
          Menu
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              title={item.label}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24]'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Bottom Group: Settings & Help */}
      <div className="flex flex-col items-center gap-3 w-full mt-auto pt-3 border-t border-slate-100 dark:border-[#1E222A]">
        <button
          onClick={() => setCurrentTab('settings')}
          title="Settings"
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentTab('help')}
          title="Help & Support"
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
