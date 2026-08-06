import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppLayout from './layouts/app-layout'
import { LoadingProvider } from './components/loading-provider'
import { ToastProvider } from './components/toast-provider'
import { PageErrorBoundary } from './components/page-error-boundary'
import { TooltipProvider } from './components/ui/tooltip'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<string, any>
    const page = pages[`./Pages/${name}.tsx`]
    if (!page) throw new Error(`Page not found: ${name}`)
    // 套用 AppLayout（除 Auth 页面）
    const Component = page.default
    const wrapped = name.startsWith('Auth/')
      ? Component
      : (props: any) => (
          <PageErrorBoundary>
            <AppLayout active={props.layoutActive ?? '/'}>
              <Component {...props} />
            </AppLayout>
          </PageErrorBoundary>
        )
    return wrapped
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <TooltipProvider>
        <LoadingProvider>
          <ToastProvider>
            <App {...props} />
          </ToastProvider>
        </LoadingProvider>
      </TooltipProvider>
    )
  },
})
