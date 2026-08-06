import * as React from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{ message: string; type: 'error' | 'success' } | null>(
    null,
  );

  const show = React.useCallback((message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 3000);
  }, []);

  const value = React.useMemo(
    () => ({
      showToast: (m: string) => show(m, 'success'),
      showSuccess: (m: string) => show(m, 'success'),
      showError: (m: string) => show(m, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[9998] rounded-md px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
