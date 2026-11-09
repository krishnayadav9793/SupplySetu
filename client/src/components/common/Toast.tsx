import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 5000;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (duration <= 0) return;

    const interval = 50; // Update progress every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            onDismissRef.current(toast.id);
            return 0;
          }
          return Math.max(0, prev - step);
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, duration, isPaused]);

  const config = {
    error: {
      container:
        'bg-white dark:bg-[#1C1315] border-rose-300 dark:border-rose-900 shadow-2xl shadow-rose-950/20 ring-1 ring-rose-500/20',
      iconBg:
        'bg-rose-100 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
      title: 'text-rose-950 dark:text-rose-100',
      message: 'text-rose-800/90 dark:text-rose-300/90',
      progressBar: 'bg-rose-500',
      Icon: AlertCircle,
    },
    warning: {
      container:
        'bg-white dark:bg-[#1E1A14] border-amber-300 dark:border-amber-900 shadow-2xl shadow-amber-950/20 ring-1 ring-amber-500/20',
      iconBg:
        'bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
      title: 'text-amber-950 dark:text-amber-100',
      message: 'text-amber-800/90 dark:text-amber-300/90',
      progressBar: 'bg-amber-500',
      Icon: AlertTriangle,
    },
    success: {
      container:
        'bg-white dark:bg-[#121A16] border-emerald-300 dark:border-emerald-900 shadow-2xl shadow-emerald-950/20 ring-1 ring-emerald-500/20',
      iconBg:
        'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-950 dark:text-emerald-100',
      message: 'text-emerald-800/90 dark:text-emerald-300/90',
      progressBar: 'bg-emerald-500',
      Icon: CheckCircle2,
    },
    info: {
      container:
        'bg-white dark:bg-[#141822] border-blue-300 dark:border-blue-900 shadow-2xl shadow-blue-950/20 ring-1 ring-blue-500/20',
      iconBg:
        'bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
      title: 'text-blue-950 dark:text-blue-100',
      message: 'text-blue-800/90 dark:text-blue-300/90',
      progressBar: 'bg-blue-500',
      Icon: Info,
    },
  }[toast.type];

  const Icon = config.Icon;

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm sm:max-w-md rounded-2xl border p-4 backdrop-blur-md transition-all animate-slideDown overflow-hidden flex items-start gap-3 select-none ${config.container}`}
    >
      {/* Icon Badge */}
      <div
        className={`h-9 w-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${config.iconBg}`}
      >
        <Icon className="w-5 h-5 animate-pulse" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className={`text-xs sm:text-sm font-extrabold tracking-tight ${config.title}`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className={`text-xs mt-1 leading-relaxed break-words font-medium ${config.message}`}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismissRef.current(toast.id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress countdown bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5">
          <div
            className={`h-full transition-all duration-75 ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto pointer-events-auto"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
