import * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingContextValue {
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = React.createContext<LoadingContextValue | null>(null);

let counter = 0;

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(false);

  const showLoading = React.useCallback(() => {
    counter += 1;
    if (counter === 1) setLoading(true);
  }, []);

  const hideLoading = React.useCallback(() => {
    counter = Math.max(0, counter - 1);
    if (counter === 0) setLoading(false);
  }, []);

  const value = React.useMemo(() => ({ showLoading, hideLoading }), [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {loading && (
        <div
          className={cn('fixed inset-0 z-[9999] flex items-center justify-center bg-black/20')}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-2xl">
            <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium text-gray-600">加载中...</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = React.useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
