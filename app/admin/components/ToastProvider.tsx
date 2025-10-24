'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const t: Toast = { id, durationMs: 3000, variant: 'info', ...toast };
    setToasts((prev) => [...prev, t]);
    const duration = t.durationMs ?? 3000;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed top-4 right-4 z-[1000] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[260px] max-w-sm rounded-md border shadow-lg px-4 py-3 text-sm backdrop-blur transition-all bg-white/90 border-gray-200 ${
              t.variant === 'success' ? 'ring-1 ring-green-200' : t.variant === 'error' ? 'ring-1 ring-red-200' : 'ring-1 ring-gray-200'
            }`}
          >
            {t.title && <div className="font-medium text-gray-900 mb-0.5">{t.title}</div>}
            <div className="text-gray-800">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
