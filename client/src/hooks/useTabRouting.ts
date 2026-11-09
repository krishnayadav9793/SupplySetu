import { useState, useEffect, useCallback, useMemo } from 'react';
import { Role } from '../types';

export const ROLE_ALLOWED_TABS: Record<Role, string[]> = {
  ADMIN: ['orders', 'dashboard', 'wallet', 'retailers', 'catalogue', 'schemes', 'export'],
  SALESMAN: ['beat', 'punch', 'catalogue', 'schemes', 'performance'],
  RETAILER: ['shop', 'cart', 'ai-pad', 'schemes', 'my-orders', 'credit'],
};

export const getDefaultTabForRole = (userRole: Role): string => {
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

const getHashTab = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return hash || null;
};

/**
 * Hook for synchronizing active tab state with the browser URL hash.
 * Enables deep linking, back/forward history navigation, and role-based route guard fallbacks.
 */
export function useTabRouting(role: Role) {
  const allowedTabs = useMemo(() => ROLE_ALLOWED_TABS[role] || [], [role]);
  const defaultTab = useMemo(() => getDefaultTabForRole(role), [role]);

  const resolveInitialTab = useCallback((): string => {
    const hash = getHashTab();
    if (hash && allowedTabs.includes(hash)) {
      return hash;
    }
    return defaultTab;
  }, [allowedTabs, defaultTab]);

  const [currentTab, setCurrentTabState] = useState<string>(resolveInitialTab);

  const setCurrentTab = useCallback(
    (newTab: string, replace = false) => {
      let resolvedTab = newTab;
      if (!allowedTabs.includes(resolvedTab)) {
        resolvedTab = defaultTab;
      }
      setCurrentTabState(resolvedTab);

      if (typeof window !== 'undefined') {
        const targetUrl = `#${resolvedTab}`;
        if (window.location.hash !== targetUrl) {
          if (replace) {
            window.history.replaceState(null, '', targetUrl);
          } else {
            window.history.pushState(null, '', targetUrl);
          }
        }
      }
    },
    [allowedTabs, defaultTab]
  );

  // Sync if role changes or if current tab is not allowed
  useEffect(() => {
    if (!allowedTabs.includes(currentTab)) {
      setCurrentTab(defaultTab, true);
    }
  }, [allowedTabs, currentTab, defaultTab, setCurrentTab]);

  // Listen to browser forward/backward navigation
  useEffect(() => {
    const handlePopState = () => {
      const hash = getHashTab();
      if (hash && allowedTabs.includes(hash)) {
        setCurrentTabState(hash);
      } else {
        setCurrentTabState(defaultTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [allowedTabs, defaultTab]);

  return {
    currentTab,
    setCurrentTab,
  };
}
