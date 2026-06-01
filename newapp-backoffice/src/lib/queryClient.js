import { QueryClient } from '@tanstack/react-query'

// Istanza singleton di QueryClient — configurazione conservativa per il BackOffice
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30s di freshness — molte risorse sono già aggiornate via Realtime
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
