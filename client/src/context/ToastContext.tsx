import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ToastCard, ToastItem, ToastType } from '../components/common/Toast';

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 5000): string => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => {
        // Keep at most 4 toasts visible at a time
        const filtered = prev.slice(-3);
        return [...filtered, { id, type, title, message, duration }];
      });
      return id;
    },
    []
  );

  const showError = useCallback(
    (title: string, message?: string, duration = 5000) => {
      return showToast('error', title, message, duration);
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, duration = 4000) => {
      return showToast('success', title, message, duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, duration = 5000) => {
      return showToast('warning', title, message, duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration = 4000) => {
      return showToast('info', title, message, duration);
    },
    [showToast]
  );

  const portalContent =
    toasts.length > 0 && typeof document !== 'undefined'
      ? createPortal(
          <div
            aria-live="assertive"
            className="fixed top-4 right-4 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto pointer-events-auto"
          >
            {toasts.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}
      {portalContent}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [] as ToastItem[],
      showToast: () => '',
      showError: () => '',
      showSuccess: () => '',
      showWarning: () => '',
      showInfo: () => '',
      dismissToast: () => {},
      clearAllToasts: () => {},
    };
  }
  return context;
};
