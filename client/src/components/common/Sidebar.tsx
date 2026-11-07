import { useState } from 'react';
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
  X,
  Phone,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar = ({ currentTab, setCurrentTab }: SidebarProps) => {
  const { user, role } = useAuth();
  const { totalUniqueItems, setIsCartDrawerOpen } = useCart();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Navigation items based on role
  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { id: 'orders', label: 'Order Desk', icon: ReceiptText },
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
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
      { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: totalUniqueItems },
      { id: 'ai-pad', label: 'AI Order Pad', icon: Sparkles },
      { id: 'schemes', label: 'Trade Schemes', icon: Percent },
      { id: 'my-orders', label: 'My Orders', icon: ReceiptText },
      { id: 'credit', label: 'Khata Ledger', icon: Wallet },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <aside className="w-16 border-r border-slate-200/80 dark:border-[#1E222A] bg-white dark:bg-[#121418] flex flex-col items-center py-4 gap-6 select-none flex-shrink-0 z-20">
        {/* Top Group: Pages */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
            Menu
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (item.id === 'cart') setIsCartDrawerOpen(true);
                }}
                title={item.label}
                className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#121418]">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bottom Group: Settings & Help */}
        <div className="flex flex-col items-center gap-2.5 w-full mt-auto pt-3 border-t border-slate-100 dark:border-[#1E222A]">
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Settings & Session"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            title="Help & Jabalpur Support"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl w-full max-w-md shadow-2xl p-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">SupplySetu Jabalpur Hub Support</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/60 dark:border-[#262B35] space-y-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Distributor Helpline: +91 761 2400123</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  <span>Depot: Sarafa & Lordganj FMCG Sector, Jabalpur</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Dispatch Window: 7:00 AM – 10:00 PM IST</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">WhatsApp Order Desk</p>
                <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  Send handwritten Kirana slip photos to +91 98930 00001 for instant AI extraction and order confirmation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Close Support Guide
            </button>
          </div>
        </div>
      )}

      {/* Settings & Session Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl w-full max-w-md shadow-2xl p-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Workspace Session Info</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Logged-in User</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name} ({user?.phone})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Active Role</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Offline Dexie Storage</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Synchronized</span>
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-medium">Platform Version</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">SupplySetu Jabalpur v2.4</span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-4 w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
