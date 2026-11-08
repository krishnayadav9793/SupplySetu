import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ShoppingBag,
  LogOut,
  Volume2,
  VolumeX,
  CheckCheck,
  Radio,
  Clock,
  Package,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { NotificationService, StoredNotification } from '../../services/notificationService';

interface HeaderProps {
  currentTab?: string;
  setCurrentTab: (tab: string) => void;
}

export const Header = ({ setCurrentTab }: HeaderProps) => {
  const { user, role, logout } = useAuth();
  const { totalUniqueItems, setIsCartDrawerOpen } = useCart();
  const { language, toggleLanguage } = useLanguage();

  // Real-time notification state
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMuted, setIsMuted] = useState(NotificationService.getIsMuted());

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync notifications on mount and whenever role changes
  useEffect(() => {
    // Initial fetch filtered for active role
    setNotifications(NotificationService.getNotifications(role));
    setUnreadCount(NotificationService.getUnreadCount(role));

    // Subscribe to connection status changes
    const unsubStatus = NotificationService.subscribeStatus((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to incoming live events
    const unsubNotifs = NotificationService.subscribe(() => {
      setNotifications(NotificationService.getNotifications(role));
      setUnreadCount(NotificationService.getUnreadCount(role));
    });

    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubStatus();
      unsubNotifs();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [role]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    NotificationService.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.markAllAsRead(role);
    setNotifications(NotificationService.getNotifications(role));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif: StoredNotification) => {
    NotificationService.markAsRead(notif.id);
    setNotifications(NotificationService.getNotifications(role));
    setUnreadCount(NotificationService.getUnreadCount(role));

    if (notif.targetTab) {
      setCurrentTab(notif.targetTab);
    } else {
      if (role === 'ADMIN') {
        setCurrentTab('orders');
      } else if (role === 'SALESMAN') {
        setCurrentTab('beat');
      } else {
        setCurrentTab('my-orders');
      }
    }
    setShowDropdown(false);
  };

  const handleLogoClick = () => {
    if (role === 'ADMIN') setCurrentTab('orders');
    else if (role === 'SALESMAN') setCurrentTab('beat');
    else setCurrentTab('shop');
  };

  const getSearchPlaceholder = () => {
    if (role === 'ADMIN') return 'Search orders, Kirana shops, SKUs, beat salesmen...';
    if (role === 'SALESMAN') return 'Search beat shops, SKU catalog, wholesale rates...';
    return 'Search biscuits, oil, atta, spices, FMCG brands...';
  };

  const getNotificationHeaderTitle = () => {
    if (role === 'ADMIN') return 'Distributor Order Desk Alerts';
    if (role === 'SALESMAN') return 'Beat Field Alerts & Updates';
    return 'Kirana Store Live Alerts';
  };

  const getNotificationEmptyMessage = () => {
    if (role === 'ADMIN')
      return 'Listening for live incoming orders, credit holds & stock alerts...';
    if (role === 'SALESMAN')
      return 'Listening for beat order punch confirmations & dispatch updates...';
    return 'Listening for order approvals, live dispatches & restock notifications...';
  };

  return (
    <header className="h-16 w-full px-4 sm:px-6 border-b border-slate-200/80 dark:border-[#1E222A] flex items-center justify-between gap-4 bg-white dark:bg-[#121418] select-none flex-shrink-0 z-30">
      {/* Left: Brand Logo & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-shrink-0"
          onClick={handleLogoClick}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <div className="h-4 w-4 border-2 border-white rotate-45 rounded-[2px]" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
              Supply<span className="text-emerald-500">Setu</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Jabalpur Hub
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Real-time status, Cart, Alerts, User Profile, Theme Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live Sync Status Indicator */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
            isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
          title={
            isConnected
              ? 'Connected to SupplySetu Real-Time Stream'
              : 'Connecting to Live Event Stream...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
          />
          <span className="hidden lg:inline">{isConnected ? 'Live Sync' : 'Connecting'}</span>
        </div>

        {/* Authenticated Role Badge */}
        <div className="flex items-center">
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-xs ${
              role === 'ADMIN'
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                : role === 'SALESMAN'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            }`}
          >
            {role === 'ADMIN'
              ? 'Distributor Admin'
              : role === 'SALESMAN'
                ? 'Beat Salesman'
                : 'Kirana Retailer'}
          </span>
        </div>

        {/* Cart Button (Retailer Only) */}
        {role === 'RETAILER' && (
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Open Kirana Basket / Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {totalUniqueItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#121418]">
                {totalUniqueItems}
              </span>
            )}
          </button>
        )}

        {/* Real-Time Notification Bell with Role-Filtered Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={`${getNotificationHeaderTitle()} (${unreadCount} unread)`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#121418] animate-bounce">
                {unreadCount}
              </span>
            ) : isConnected ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121418]" />
            ) : null}
          </button>

          {/* Notification Dropdown Popover */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] shadow-2xl z-50 overflow-hidden animate-slideDown">
              <div className="p-3 border-b border-slate-100 dark:border-[#222631] flex items-center justify-between bg-slate-50/50 dark:bg-[#1B1F27]/50">
                <div className="flex items-center gap-2">
                  <Radio
                    className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {getNotificationHeaderTitle()}
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleMute}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title={isMuted ? 'Unmute notification chime' : 'Mute notification chime'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </button>

                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-medium">No alerts yet</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 px-4">
                      {getNotificationEmptyMessage()}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1C2028] ${
                        !notif.read ? 'bg-emerald-50/25 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {notif.type === 'ORDER_CREATED' ? (
                              <ShoppingBag className="w-3.5 h-3.5" />
                            ) : (
                              <Package className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {new Date(notif.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                              {notif.targetTab && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-sm">
                                  Tap to open
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l border-slate-200/80 dark:border-[#262B35]">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 flex-shrink-0">
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
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Authorized User'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[120px]">
              {role === 'ADMIN'
                ? 'Distributor Admin'
                : role === 'SALESMAN'
                  ? 'Beat #4 Salesman'
                  : user?.retailer?.shopName || 'Kirana Merchant'}
            </p>
          </div>

          {/* Dedicated Sign Out Button */}
          <button
            onClick={logout}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Sign Out / Lock Session"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Language Toggle (English / Hindi) */}
        <button
          onClick={toggleLanguage}
          className="px-2 py-1 rounded-xl border border-slate-200 dark:border-[#262B35] bg-slate-50 dark:bg-[#1A1D24] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          title={language === 'en' ? 'हिंदी में बदलें (Switch to Hindi)' : 'Switch to English'}
        >
          <span
            className={
              language === 'en'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-400'
            }
          >
            EN
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span
            className={
              language === 'hi'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-400'
            }
          >
            हिं
          </span>
        </button>

        {/* Theme Toggle */}
        <div className="flex items-center pl-0.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
