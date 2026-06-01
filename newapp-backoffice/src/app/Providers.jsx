import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/queryClient'

// Wrapper di tutti i provider globali dell'app:
// - QueryClientProvider (TanStack Query)
// - BrowserRouter (React Router)
// - Toaster (Sonner — notifiche toast)
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
